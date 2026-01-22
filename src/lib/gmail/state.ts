import crypto from 'crypto';

const STATE_SECRET = process.env.GMAIL_STATE_SECRET || process.env.CLERK_SECRET_KEY || 'fallback-secret-key';
const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export interface OAuthState {
  organizationId: string;
  userId: string;
  timestamp: number;
}

export function createSignedState(organizationId: string, userId: string): string {
  const state: OAuthState = {
    organizationId,
    userId,
    timestamp: Date.now(),
  };
  
  const stateJson = JSON.stringify(state);
  const stateBase64 = Buffer.from(stateJson).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', STATE_SECRET)
    .update(stateBase64)
    .digest('base64url');
  
  return `${stateBase64}.${signature}`;
}

export function verifySignedState(signedState: string): OAuthState | null {
  const parts = signedState.split('.');
  if (parts.length !== 2) {
    return null;
  }
  
  const [stateBase64, signature] = parts;
  
  const expectedSignature = crypto
    .createHmac('sha256', STATE_SECRET)
    .update(stateBase64)
    .digest('base64url');
  
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }
  
  try {
    const stateJson = Buffer.from(stateBase64, 'base64url').toString('utf-8');
    const state: OAuthState = JSON.parse(stateJson);
    
    if (Date.now() - state.timestamp > STATE_EXPIRY_MS) {
      return null;
    }
    
    if (!state.organizationId || !state.userId) {
      return null;
    }
    
    return state;
  } catch {
    return null;
  }
}
