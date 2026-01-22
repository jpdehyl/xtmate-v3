import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/gmail/client';
import { createSignedState } from '@/lib/gmail/state';
import { getAuthContext, hasPermission, PERMISSIONS } from '@/lib/auth';

export async function GET() {
  try {
    const context = await getAuthContext();
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(context.role, PERMISSIONS.SETTINGS_MANAGE_INTEGRATIONS)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    console.log('[Gmail Connect] Generating auth URL for org:', context.organizationId);
    console.log('[Gmail Connect] Environment detection:', {
      hasGoogleRedirectUri: !!process.env.GOOGLE_REDIRECT_URI,
      hasVercelUrl: !!process.env.VERCEL_URL,
      vercelUrl: process.env.VERCEL_URL,
      vercelProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
      hasReplitDomains: !!process.env.REPLIT_DOMAINS,
      hasReplitDevDomain: !!process.env.REPLIT_DEV_DOMAIN,
    });

    const signedState = createSignedState(context.organizationId, context.userId);
    const authUrl = getAuthUrl(signedState);

    console.log('[Gmail Connect] Generated auth URL');

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('[Gmail Connect] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}
