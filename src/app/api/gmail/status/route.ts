import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { getEmailIntegration } from '@/lib/gmail/service';

export async function GET() {
  try {
    const context = await getAuthContext();
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integration = await getEmailIntegration(context.organizationId);

    if (!integration) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: integration.status === 'active',
      status: integration.status,
      emailAddress: integration.emailAddress,
      lastSyncAt: integration.lastSyncAt,
      autoCreateEstimates: integration.autoCreateEstimates,
      watchedLabels: integration.watchedLabels,
    });
  } catch (error) {
    console.error('Gmail status error:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
