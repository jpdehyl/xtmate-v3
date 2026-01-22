import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, hasPermission, PERMISSIONS } from '@/lib/auth';
import { getIncomingEmails, createEstimateFromIncomingEmail, ignoreIncomingEmail } from '@/lib/gmail/service';

export async function GET(request: NextRequest) {
  try {
    const context = await getAuthContext();
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(context.role, PERMISSIONS.ESTIMATES_CREATE)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const emails = await getIncomingEmails(context.organizationId, { status, limit });

    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Get emails error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getAuthContext();
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(context.role, PERMISSIONS.ESTIMATES_CREATE)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { emailId, action } = body;

    if (!emailId || !action) {
      return NextResponse.json(
        { error: 'emailId and action are required' },
        { status: 400 }
      );
    }

    if (action === 'create_estimate') {
      const estimateId = await createEstimateFromIncomingEmail(emailId, context.organizationId);
      return NextResponse.json({ success: true, estimateId });
    } else if (action === 'ignore') {
      await ignoreIncomingEmail(emailId, context.organizationId);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Email action error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to perform action' },
      { status: 500 }
    );
  }
}
