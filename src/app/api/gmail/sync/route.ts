import { NextResponse } from 'next/server';
import { getAuthContext, hasPermission, PERMISSIONS } from '@/lib/auth';
import { syncEmails } from '@/lib/gmail/service';

export async function POST() {
  try {
    const context = await getAuthContext();
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(context.role, PERMISSIONS.SETTINGS_MANAGE_INTEGRATIONS)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const result = await syncEmails(context.organizationId);

    return NextResponse.json({
      success: true,
      processed: result.processed,
      estimatesCreated: result.created,
    });
  } catch (error) {
    console.error('Gmail sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync emails' },
      { status: 500 }
    );
  }
}
