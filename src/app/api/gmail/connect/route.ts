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

    const signedState = createSignedState(context.organizationId, context.userId);
    const authUrl = getAuthUrl(signedState);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Gmail connect error:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}
