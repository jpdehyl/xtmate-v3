import { db } from '@/lib/db';
import { emailIntegrations, incomingEmails, estimates, type EmailIntegration, type IncomingEmail } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getGmailClient, fetchRecentMessages, refreshAccessToken, type GmailMessage } from './client';
import { parseClaimEmail, type ParsedClaimData } from './parser';
import { logger } from '@/lib/logger';

export async function getEmailIntegration(organizationId: string): Promise<EmailIntegration | null> {
  const results = await db
    .select()
    .from(emailIntegrations)
    .where(eq(emailIntegrations.organizationId, organizationId))
    .limit(1);
  
  return results[0] || null;
}

export async function saveEmailIntegration(data: {
  organizationId: string;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  emailAddress: string;
  createdBy: string;
}): Promise<EmailIntegration> {
  const existing = await getEmailIntegration(data.organizationId);

  if (existing) {
    const [updated] = await db
      .update(emailIntegrations)
      .set({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || existing.refreshToken,
        tokenExpiresAt: data.tokenExpiresAt,
        emailAddress: data.emailAddress,
        status: 'active',
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(emailIntegrations.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(emailIntegrations)
    .values({
      organizationId: data.organizationId,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      tokenExpiresAt: data.tokenExpiresAt,
      emailAddress: data.emailAddress,
      createdBy: data.createdBy,
    })
    .returning();

  return created;
}

export async function disconnectEmailIntegration(organizationId: string): Promise<void> {
  await db
    .update(emailIntegrations)
    .set({
      status: 'disconnected',
      updatedAt: new Date(),
    })
    .where(eq(emailIntegrations.organizationId, organizationId));
}

async function ensureValidToken(integration: EmailIntegration): Promise<string> {
  const now = new Date();
  const expiresAt = integration.tokenExpiresAt;

  if (!expiresAt || expiresAt > new Date(now.getTime() + 5 * 60 * 1000)) {
    return integration.accessToken;
  }

  if (!integration.refreshToken) {
    await db
      .update(emailIntegrations)
      .set({ status: 'expired', errorMessage: 'Refresh token not available' })
      .where(eq(emailIntegrations.id, integration.id));
    throw new Error('Token expired and no refresh token available');
  }

  try {
    const { accessToken, expiresAt: newExpiresAt } = await refreshAccessToken(integration.refreshToken);
    
    await db
      .update(emailIntegrations)
      .set({
        accessToken,
        tokenExpiresAt: newExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(emailIntegrations.id, integration.id));

    return accessToken;
  } catch (error) {
    await db
      .update(emailIntegrations)
      .set({ status: 'error', errorMessage: 'Failed to refresh token' })
      .where(eq(emailIntegrations.id, integration.id));
    throw error;
  }
}

export async function syncEmails(organizationId: string): Promise<{ processed: number; created: number }> {
  const integration = await getEmailIntegration(organizationId);
  
  if (!integration || integration.status !== 'active') {
    throw new Error('Email integration not active');
  }

  const accessToken = await ensureValidToken(integration);
  const gmail = getGmailClient(accessToken);
  
  const labels = (integration.watchedLabels as string[]) || ['INBOX'];
  const messages = await fetchRecentMessages(gmail, { 
    labelIds: labels, 
    maxResults: 20 
  });

  let processed = 0;
  let created = 0;

  for (const message of messages) {
    const exists = await db
      .select({ id: incomingEmails.id })
      .from(incomingEmails)
      .where(
        and(
          eq(incomingEmails.emailIntegrationId, integration.id),
          eq(incomingEmails.gmailMessageId, message.id)
        )
      )
      .limit(1);

    if (exists.length > 0) continue;

    processed++;

    const parseResult = await parseClaimEmail(message);

    const [incomingEmail] = await db
      .insert(incomingEmails)
      .values({
        organizationId,
        emailIntegrationId: integration.id,
        gmailMessageId: message.id,
        gmailThreadId: message.threadId,
        fromAddress: message.from,
        fromName: message.fromName,
        toAddress: message.to,
        subject: message.subject,
        bodyText: message.bodyText,
        bodyHtml: message.bodyHtml,
        receivedAt: message.receivedAt,
        parsedData: parseResult.data,
        parseConfidence: parseResult.confidence,
        status: parseResult.isClaimEmail ? 'parsed' : 'ignored',
      })
      .returning();

    if (parseResult.isClaimEmail && integration.autoCreateEstimates) {
      const estimateId = await createEstimateFromEmail(
        organizationId,
        incomingEmail.id,
        parseResult.data
      );

      if (estimateId) {
        await db
          .update(incomingEmails)
          .set({
            status: 'estimate_created',
            estimateId,
            processedAt: new Date(),
          })
          .where(eq(incomingEmails.id, incomingEmail.id));
        created++;
      }
    }
  }

  await db
    .update(emailIntegrations)
    .set({ lastSyncAt: new Date() })
    .where(eq(emailIntegrations.id, integration.id));

  logger.info('Email sync completed', { organizationId, processed, created });

  return { processed, created };
}

async function createEstimateFromEmail(
  organizationId: string,
  emailId: string,
  data: ParsedClaimData
): Promise<string | null> {
  try {
    const name = data.insuredName 
      ? `${data.insuredName} - ${data.propertyAddress || 'New Claim'}`
      : `New Claim - ${data.propertyAddress || new Date().toLocaleDateString()}`;

    const [estimate] = await db
      .insert(estimates)
      .values({
        organizationId,
        userId: 'system',
        name,
        status: 'draft',
        jobType: 'insurance',
        workflowStatus: 'draft',
        propertyAddress: data.propertyAddress,
        propertyCity: data.propertyCity,
        propertyState: data.propertyState,
        propertyZip: data.propertyZip,
        claimNumber: data.claimNumber,
        policyNumber: data.policyNumber,
        insuredName: data.insuredName,
        insuredPhone: data.insuredPhone,
        insuredEmail: data.insuredEmail,
        adjusterName: data.adjusterName,
        adjusterPhone: data.adjusterPhone,
        adjusterEmail: data.adjusterEmail,
        dateOfLoss: data.dateOfLoss ? new Date(data.dateOfLoss) : null,
      })
      .returning();

    return estimate.id;
  } catch (error) {
    logger.error('Failed to create estimate from email', { emailId, error });
    return null;
  }
}

export async function getIncomingEmails(
  organizationId: string,
  options: { limit?: number; status?: string } = {}
): Promise<IncomingEmail[]> {
  const { limit = 50, status } = options;

  const conditions = [eq(incomingEmails.organizationId, organizationId)];
  if (status) {
    conditions.push(eq(incomingEmails.status, status as any));
  }

  return db
    .select()
    .from(incomingEmails)
    .where(and(...conditions))
    .orderBy(desc(incomingEmails.receivedAt))
    .limit(limit);
}

export async function createEstimateFromIncomingEmail(
  emailId: string,
  organizationId: string
): Promise<string | null> {
  const [email] = await db
    .select()
    .from(incomingEmails)
    .where(
      and(
        eq(incomingEmails.id, emailId),
        eq(incomingEmails.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!email) {
    throw new Error('Email not found');
  }

  if (email.estimateId) {
    return email.estimateId;
  }

  const data = (email.parsedData || {}) as ParsedClaimData;
  const estimateId = await createEstimateFromEmail(organizationId, emailId, data);

  if (estimateId) {
    await db
      .update(incomingEmails)
      .set({
        status: 'estimate_created',
        estimateId,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(incomingEmails.id, emailId));
  }

  return estimateId;
}

export async function ignoreIncomingEmail(
  emailId: string,
  organizationId: string
): Promise<void> {
  await db
    .update(incomingEmails)
    .set({
      status: 'ignored',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(incomingEmails.id, emailId),
        eq(incomingEmails.organizationId, organizationId)
      )
    );
}
