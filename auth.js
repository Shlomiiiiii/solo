/** Admin-only auth — single hardcoded account. */
import crypto from 'crypto';

export const ADMIN_EMAIL = 'solophotography@icloud.com';
export const ADMIN_PASSWORD = 'Shlomi123!';

const SECRET = process.env.SOLO_AUTH_SECRET || 'solo-dev-secret-change-in-prod';

function sign(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
}

/** Create a signed session token for the admin. */
export function createSession() {
  const session = {
    uid: 'admin-1',
    email: ADMIN_EMAIL,
    displayName: 'Solo Admin',
    role: 'admin',
    issuedAt: Date.now(),
  };
  const payload = Buffer.from(JSON.stringify(session)).toString('base64');
  return { token: `${payload}.${sign(payload)}`, session };
}

/** Verify a token, return the session or null. */
export function verifySession(token) {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  if (sign(payload) !== signature) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64').toString());
    if (Date.now() - session.issuedAt > 7 * 24 * 60 * 60 * 1000) return null;
    return session;
  } catch {
    return null;
  }
}

export function validateCredentials(email, password) {
  return email?.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}
