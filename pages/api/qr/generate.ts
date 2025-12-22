// pages/api/qr/generate.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { encryptData } from '@/lib/encryption';

const prisma = new PrismaClient();

// Encryption key for QR codes
const QR_ENCRYPTION_KEY = process.env.QR_ENCRYPTION_KEY || 'default-qr-key-change-in-production';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verify user authentication
  const userId = req.headers.authorization?.split(' ')[1];
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: Missing user ID' });
  }

  try {
    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      }
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(404).json({ message: 'User not found or inactive' });
    }

    // Create a new QR code session
    const sessionId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes expiry

    // Prepare QR code payload
    const qrPayload = {
      userId: user.id,
      sessionId,
      studentNumber: user.studentNumber,
      fullName: user.fullName,
      department: user.department,
      timestamp: new Date().toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    // Encrypt the payload
    const encryptedPayload = encryptData(JSON.stringify(qrPayload), QR_ENCRYPTION_KEY);

    // Create QR code record in database
    const qrCodeRecord = await prisma.qRCode.create({
      data: {
        userId: user.id,
        encryptedCode: encryptedPayload,
        expiresAt,
        maxUses: 1, // Limit to 1 use to prevent replay attacks
        status: 'ACTIVE',
        sessionId
      }
    });

    // Log the QR code generation
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'QR_CODE_GENERATION',
        tableName: 'QRCode',
        recordId: qrCodeRecord.id,
        newValues: {
          sessionId: qrCodeRecord.sessionId,
          expiresAt: qrCodeRecord.expiresAt
        },
        ipAddress: req.socket.remoteAddress || '',
        userAgent: req.headers['user-agent'] || ''
      }
    });

    res.status(200).json({
      qrId: qrCodeRecord.id,
      encryptedCode: encryptedPayload,
      expiresAt: qrCodeRecord.expiresAt,
      sessionId: sessionId,
      validUntil: expiresAt,
      message: 'QR code generated successfully'
    });

  } catch (error: any) {
    console.error('QR code generation error:', error);
    res.status(500).json({
      message: 'Internal server error during QR code generation',
      error: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}