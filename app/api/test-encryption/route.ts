import { NextRequest, NextResponse } from 'next/server';
import { encryptData, decryptData } from '@/lib/encryption';

export async function GET() {
  try {
    // Test encryption with sample data
    const testData = JSON.stringify([1, 2, 3, 4, 5]);
    console.log('Test data:', testData);
    
    const encrypted = encryptData(testData);
    console.log('Encrypted:', encrypted);
    
    const decrypted = decryptData(encrypted);
    console.log('Decrypted:', decrypted);
    
    return NextResponse.json({
      success: true,
      testData,
      encrypted,
      decrypted,
      match: testData === decrypted
    });
  } catch (error: any) {
    console.error('Encryption test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}