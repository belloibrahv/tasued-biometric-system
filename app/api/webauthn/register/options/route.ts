import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function b64url(input: Buffer | Uint8Array) {
  return Buffer.from(input).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    const userEmail = req.headers.get('x-user-email') || 'user@example.com';
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const rpId = process.env.WEBAUTHN_RP_ID || 'localhost';
    const rpName = 'TASUED BioVault';

    const pubKeyOptions: any = {
      challenge: b64url(challenge),
      rp: { id: rpId, name: rpName },
      user: {
        id: b64url(new TextEncoder().encode(userId)),
        name: userEmail,
        displayName: userEmail,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      timeout: 60000,
      attestation: 'none',
      authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
    };

    const res = NextResponse.json(pubKeyOptions);
    res.cookies.set('webauthn-challenge', b64url(challenge), { httpOnly: true, sameSite: 'lax', maxAge: 300 });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to generate options' }, { status: 500 });
  }
}
