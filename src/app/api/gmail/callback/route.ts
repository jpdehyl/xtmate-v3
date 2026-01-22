import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, getUserEmail } from '@/lib/gmail/client';
import { verifySignedState } from '@/lib/gmail/state';
import { saveEmailIntegration } from '@/lib/gmail/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const signedState = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard/settings/integrations?error=${error}`, request.url)
      );
    }

    if (!code || !signedState) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/integrations?error=missing_params', request.url)
      );
    }

    const state = verifySignedState(signedState);
    if (!state) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/integrations?error=invalid_state', request.url)
      );
    }

    const tokens = await exchangeCodeForTokens(code);
    const emailAddress = await getUserEmail(tokens.accessToken);

    await saveEmailIntegration({
      organizationId: state.organizationId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: tokens.expiresAt,
      emailAddress,
      createdBy: state.userId,
    });

    return NextResponse.redirect(
      new URL('/dashboard/settings/integrations?success=gmail_connected', request.url)
    );
  } catch (error) {
    console.error('Gmail callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/settings/integrations?error=oauth_failed', request.url)
    );
  }
}
