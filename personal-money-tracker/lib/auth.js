import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';
import { verifyPassword } from '@/lib/password';

export const SESSION_COOKIE = 'money_tracker_session';
const SESSION_DAYS = 30;

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export async function authenticate(username, password) {
  const normalized = String(username || '').trim();
  if (!normalized || !password) return null;
  const user = await getDb().prepare(
    'SELECT id, username, password_hash FROM users WHERE username = ? COLLATE NOCASE'
  ).bind(normalized).first();
  if (!user || !(await verifyPassword(password, user.password_hash))) return null;
  return { id: Number(user.id), username: user.username };
}

export async function createSession(userId) {
  const token = randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  const dbExpires = expires.toISOString().slice(0, 19).replace('T', ' ');
  await getDb().prepare(
    'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
  ).bind(userId, hashToken(token), dbExpires).run();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    path: '/', expires,
  });
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const user = await getDb().prepare(`
    SELECT users.id, users.username FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > datetime('now')
  `).bind(hashToken(token)).first();
  return user ? { id: Number(user.id), username: user.username } : null;
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').bind(hashToken(token)).run();
  cookieStore.delete(SESSION_COOKIE);
}
