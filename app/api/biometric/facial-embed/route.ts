import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Enhanced facial embedding generation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body || {};
    if (!image) return NextResponse.json({ error: 'image is required' }, { status: 400 });

    // Extract base64 data
    const base64Data = image.split(',')[1] || image;
    const buf = Buffer.from(base64Data, 'base64');
    
    // More sophisticated pseudo-embedding with better distribution
    let hash1 = 0, hash2 = 0;
    for (let i = 0; i < Math.min(buf.length, 1000); i++) {
      hash1 = (hash1 * 31 + buf[i]) & 0x7FFFFFFF;
      hash2 = (hash2 * 37 + buf[Math.floor(buf.length/2) + i % Math.floor(buf.length/2)]) & 0x7FFFFFFF;
    }
    
    // Generate 128-dimensional embedding with better randomness
    const embedding = Array.from({ length: 128 }, (_, i) => {
      const val = (Math.sin(hash1 * (i + 1) * 0.1) + Math.cos(hash2 * (i + 1) * 0.07)) / 2 + 0.5;
      return Math.max(0, Math.min(1, val + (Math.random() - 0.5) * 0.1)); // Add slight noise
    });

    return NextResponse.json({ embedding });
  } catch (e: any) {
    console.error('Facial embedding error:', e);
    return NextResponse.json({ error: e.message || 'Failed to compute facial embedding' }, { status: 500 });
  }
}
