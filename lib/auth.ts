import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET as string;
const COOKIE_NAME = 'admin_session';
const TOKEN_TTL = '365d';

export type AdminTokenPayload = {
  id: number | string;
  email: string;
  name: string;
};

function getSecretKey(): Uint8Array {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in environment variables.');
  }
  return new TextEncoder().encode(JWT_SECRET);
}

export async function signAdminToken(payload: AdminTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getSecretKey());
}

export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as AdminTokenPayload;
  } catch {
    return null;
  }
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;

// Helper used inside API routes (not middleware) to check auth from the
// incoming request's cookies.
export async function getAdminFromRequest(request: Request): Promise<AdminTokenPayload | null> {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));

  if (!match) return null;

  const token = decodeURIComponent(match.split('=').slice(1).join('='));
  return verifyAdminToken(token);
}
