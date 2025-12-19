import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';

export const dynamic = 'force-dynamic';

function getCookie(req: NextRequest, name: string) {
  return req.cookies.get(name)?.value || '';
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const challenge = getCookie(req, 'webauthn-challenge');
    if (!challenge) return NextResponse.json({ error: 'Missing challenge' }, { status: 400 });

    const { id: credentialId } = body || {};
    if (!credentialId) return NextResponse.json({ error: 'Missing credentialId' }, { status: 400 });

    const pk = await db.passkey.findFirst({ where: { userId, credentialId } });
    if (!pk) return NextResponse.json({ error: 'Unknown credential' }, { status: 404 });

    const expectedOrigin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';
    const expectedRPID = process.env.WEBAUTHN_RP_ID || 'localhost';

    const authenticator = {
      credentialID: Buffer.from(credentialId, 'base64url'),
      credentialPublicKey: Buffer.from(pk.publicKey, 'base64url'),
      counter: pk.counter || 0,
      transports: pk.transports || [],
    } as any;

    const verification = await verifyAuthenticationResponse({
      response: body as any,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID,
      authenticator,
    } as any);

    if (!verification.verified || !verification.authenticationInfo) {
      return NextResponse.json({ error: 'Authentication verification failed' }, { status: 400 });
    }

    const newCounter = verification.authenticationInfo.newCounter || pk.counter;
    await db.passkey.update({ where: { id: pk.id }, data: { counter: newCounter } });

    const res = NextResponse.json({ success: true });
    res.cookies.delete('webauthn-challenge');
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to verify assertion' }, { status: 500 });
  }
}
