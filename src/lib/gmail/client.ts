import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/userinfo.email',
];

export function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  let redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!redirectUri) {
    const domains = process.env.REPLIT_DOMAINS;
    if (domains) {
      const productionDomain = domains.split(',')[0];
      redirectUri = `https://${productionDomain}/api/gmail/callback`;
    } else if (process.env.REPLIT_DEV_DOMAIN) {
      redirectUri = `https://${process.env.REPLIT_DEV_DOMAIN}/api/gmail/callback`;
    } else {
      redirectUri = 'http://localhost:5000/api/gmail/callback';
    }
  }

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl(state?: string): string {
  const oauth2Client = getOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: state,
  });
}

export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
}> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  
  return {
    accessToken: tokens.access_token || '',
    refreshToken: tokens.refresh_token || null,
    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt: Date | null;
}> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  
  return {
    accessToken: credentials.access_token || '',
    expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
  };
}

export function getGmailClient(accessToken: string): gmail_v1.Gmail {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

export async function getUserEmail(accessToken: string): Promise<string> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  
  return data.email || '';
}

export interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  fromName: string;
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  receivedAt: Date;
  labelIds: string[];
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

function extractBody(payload: gmail_v1.Schema$MessagePart): { text: string; html: string } {
  let text = '';
  let html = '';

  if (payload.body?.data) {
    const decoded = decodeBase64Url(payload.body.data);
    if (payload.mimeType === 'text/plain') {
      text = decoded;
    } else if (payload.mimeType === 'text/html') {
      html = decoded;
    }
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const { text: partText, html: partHtml } = extractBody(part);
      if (partText) text = partText;
      if (partHtml) html = partHtml;
    }
  }

  return { text, html };
}

function getHeader(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string): string {
  if (!headers) return '';
  const header = headers.find(h => h.name?.toLowerCase() === name.toLowerCase());
  return header?.value || '';
}

function parseFromHeader(from: string): { email: string; name: string } {
  const match = from.match(/^(?:(.+?)\s*<)?([^<>]+)>?$/);
  if (match) {
    return {
      name: match[1]?.trim().replace(/^["']|["']$/g, '') || '',
      email: match[2]?.trim() || from,
    };
  }
  return { email: from, name: '' };
}

export async function fetchMessage(
  gmail: gmail_v1.Gmail,
  messageId: string
): Promise<GmailMessage | null> {
  try {
    const { data } = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    if (!data.payload) return null;

    const headers = data.payload.headers;
    const fromRaw = getHeader(headers, 'From');
    const { email: from, name: fromName } = parseFromHeader(fromRaw);
    const to = getHeader(headers, 'To');
    const subject = getHeader(headers, 'Subject');
    const date = getHeader(headers, 'Date');
    
    const { text: bodyText, html: bodyHtml } = extractBody(data.payload);

    return {
      id: data.id || messageId,
      threadId: data.threadId || '',
      from,
      fromName,
      to,
      subject,
      bodyText,
      bodyHtml,
      receivedAt: date ? new Date(date) : new Date(),
      labelIds: data.labelIds || [],
    };
  } catch (error) {
    console.error('Failed to fetch message:', messageId, error);
    return null;
  }
}

export async function fetchRecentMessages(
  gmail: gmail_v1.Gmail,
  options: {
    labelIds?: string[];
    maxResults?: number;
    query?: string;
    afterHistoryId?: string;
  } = {}
): Promise<GmailMessage[]> {
  const { labelIds = ['INBOX'], maxResults = 20, query = '' } = options;

  try {
    const { data } = await gmail.users.messages.list({
      userId: 'me',
      labelIds,
      maxResults,
      q: query,
    });

    if (!data.messages) return [];

    const messages: GmailMessage[] = [];
    
    for (const msg of data.messages) {
      if (msg.id) {
        const fullMessage = await fetchMessage(gmail, msg.id);
        if (fullMessage) {
          messages.push(fullMessage);
        }
      }
    }

    return messages;
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return [];
  }
}

export async function getLabels(gmail: gmail_v1.Gmail): Promise<{ id: string; name: string }[]> {
  try {
    const { data } = await gmail.users.labels.list({ userId: 'me' });
    return (data.labels || [])
      .filter(label => label.id && label.name)
      .map(label => ({ id: label.id!, name: label.name! }));
  } catch (error) {
    console.error('Failed to fetch labels:', error);
    return [];
  }
}
