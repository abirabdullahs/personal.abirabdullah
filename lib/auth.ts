import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;
const COOKIE_NAME = 'admin_session';
const TOKEN_TTL = '7d';

export type AdminTokenPayload = {
  id: number | string;
  email: string;
  name: string;
};

export function signAdminToken(payload: AdminTokenPayload): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in environment variables.');
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in environment variables.');
  }
  try {
    return jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
  } catch {
    return null;
  }
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;

// Helper used inside API routes (not middleware) to check auth from the
// incoming request's cookies.
export function getAdminFromRequest(request: Request): AdminTokenPayload | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));

  if (!match) return null;

  const token = decodeURIComponent(match.split('=').slice(1).join('='));
  return verifyAdminToken(token);
}