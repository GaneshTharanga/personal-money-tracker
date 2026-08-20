import { NextResponse } from 'next/server';
import { authenticate, createSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    const user = await authenticate(username, password);
    if (!user) return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    await createSession(user.id);
    return NextResponse.json({ user });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Could not sign in.' }, { status: 500 });
  }
}
