import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

function b64url(input: Buffer | Uint8Array) {
  return Buffer.from(input).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const allowCredentials = (await db.passkey.findMany({ where: { userId } })).map(pk => ({
      type: 'public-key',
      id: pk.credentialId,
      transports: pk.transports || [],
    }));

    const options = {
      challenge: b64url(challenge),
      timeout: 60000,
      userVerification: 'preferred',
      allowCredentials,
    } as any;

    const res = NextResponse.json(options);
    res.cookies.set('webauthn-challenge', b64url(challenge), { httpOnly: true, sameSite: 'lax', maxAge: 300 });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to generate options' }, { status: 500 });
  }
}
