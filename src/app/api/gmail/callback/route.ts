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
    const errorDescription = searchParams.get('error_description');

    console.log('[Gmail Callback] Received callback with params:', {
      hasCode: !!code,
      hasState: !!signedState,
      error,
      errorDescription,
    });

    if (error) {
      console.error('[Gmail Callback] OAuth error from Google:', error, errorDescription);
      const errorMsg = encodeURIComponent(`${error}${errorDescription ? `: ${errorDescription}` : ''}`);
      return NextResponse.redirect(
        new URL(`/dashboard/settings/integrations?error=${errorMsg}`, request.url)
      );
    }

    if (!code || !signedState) {
      console.error('[Gmail Callback] Missing required params');
      return NextResponse.redirect(
        new URL('/dashboard/settings/integrations?error=missing_params', request.url)
      );
    }

    const state = verifySignedState(signedState);
    if (!state) {
      console.error('[Gmail Callback] Invalid or expired state token');
      return NextResponse.redirect(
        new URL('/dashboard/settings/integrations?error=invalid_state', request.url)
      );
    }

    console.log('[Gmail Callback] Exchanging code for tokens...');
    const tokens = await exchangeCodeForTokens(code);

    console.log('[Gmail Callback] Fetching user email...');
    const emailAddress = await getUserEmail(tokens.accessToken);

    console.log('[Gmail Callback] Saving integration for:', emailAddress);
    await saveEmailIntegration({
      organizationId: state.organizationId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: tokens.expiresAt,
      emailAddress,
      createdBy: state.userId,
    });

    console.log('[Gmail Callback] Successfully connected Gmail');
    return NextResponse.redirect(
      new URL('/dashboard/settings/integrations?success=gmail_connected', request.url)
    );
  } catch (error) {
    console.error('[Gmail Callback] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'oauth_failed';
    // Check for redirect_uri_mismatch specifically
    if (errorMessage.includes('redirect_uri_mismatch')) {
      console.error('[Gmail Callback] Redirect URI mismatch! Check that your Google OAuth credentials have the correct redirect URI configured.');
    }
    return NextResponse.redirect(
      new URL(`/dashboard/settings/integrations?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}
