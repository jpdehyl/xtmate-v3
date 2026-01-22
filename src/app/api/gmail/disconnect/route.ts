import { NextResponse } from 'next/server';
import { getAuthContext, hasPermission, PERMISSIONS } from '@/lib/auth';
import { disconnectEmailIntegration } from '@/lib/gmail/service';

export async function POST() {
  try {
    const context = await getAuthContext();
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(context.role, PERMISSIONS.SETTINGS_MANAGE_INTEGRATIONS)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await disconnectEmailIntegration(context.organizationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Gmail disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
