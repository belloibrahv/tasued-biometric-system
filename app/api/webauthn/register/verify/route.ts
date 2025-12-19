import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyRegistrationResponse } from '@simplewebauthn/server';

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

    const expectedOrigin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';
    const expectedRPID = process.env.WEBAUTHN_RP_ID || 'localhost';

    const verification = await verifyRegistrationResponse({
      response: body as any,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Registration verification failed' }, { status: 400 });
    }

    const { credentialPublicKey, credentialID, counter, transports } = verification.registrationInfo as any;
    const publicKeyB64 = Buffer.from(credentialPublicKey).toString('base64url');
    const credentialId = Buffer.from(credentialID).toString('base64url');

    await db.passkey.upsert({
      where: { credentialId },
      create: {
        userId,
        credentialId,
        publicKey: publicKeyB64,
        counter: counter || 0,
        transports: transports || [],
      },
      update: {
        userId,
        publicKey: publicKeyB64,
        counter: counter || 0,
        transports: transports || [],
      }
    });

    const res = NextResponse.json({ success: true });
    res.cookies.delete('webauthn-challenge');
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to verify attestation' }, { status: 500 });
  }
}
