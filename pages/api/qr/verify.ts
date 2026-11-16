// pages/api/qr/verify.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { decryptData } from '@/lib/encryption';

const prisma = new PrismaClient();

// Encryption key for QR codes
const QR_ENCRYPTION_KEY = process.env.QR_ENCRYPTION_KEY || 'default-qr-key-change-in-production';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    let encryptedCode: string;

    if (req.method === 'POST') {
      // POST method expects encrypted code in request body
      encryptedCode = req.body.encryptedCode;
    } else {
      // GET method expects encrypted code as a query parameter
      encryptedCode = req.query.code as string;
    }

    // Validate encrypted code
    if (!encryptedCode) {
      return res.status(400).json({ message: 'Missing encrypted QR code' });
    }

    // Find the QR code in the database
    const qrCodeRecord = await prisma.qRCode.findFirst({
      where: {
        encryptedCode: encryptedCode,
        status: 'ACTIVE',
        expiresAt: {
          gte: new Date() // Not expired
        }
      },
      include: {
        user: true
      }
    });

    if (!qrCodeRecord) {
      // Check if code has expired
      const expiredCode = await prisma.qRCode.findFirst({
        where: {
          encryptedCode: encryptedCode,
          expiresAt: {
            lt: new Date() // Expired
          }
        }
      });

      if (expiredCode) {
        // Update status to expired if not already updated
        await prisma.qRCode.update({
          where: { id: expiredCode.id },
          data: { status: 'EXPIRED' }
        });

        return res.status(400).json({
          message: 'QR code has expired',
          error: 'EXPIRED'
        });
      }

      // Check if already used
      const usedCode = await prisma.qRCode.findFirst({
        where: {
          encryptedCode: encryptedCode,
          status: 'USED'
        }
      });

      if (usedCode) {
        return res.status(400).json({
          message: 'QR code has already been used',
          error: 'USED'
        });
      }

      return res.status(404).json({
        message: 'Invalid or non-existent QR code',
        error: 'NOT_FOUND'
      });
    }

    // Check if maximum usage count has been reached
    if (qrCodeRecord.usageCount >= qrCodeRecord.maxUses) {
      await prisma.qRCode.update({
        where: { id: qrCodeRecord.id },
        data: { status: 'USED' }
      });

      return res.status(400).json({
        message: 'QR code usage limit exceeded',
        error: 'USAGE_LIMIT_EXCEEDED'
      });
    }

    // Decrypt the QR code payload
    try {
      const decryptedString = decryptData(qrCodeRecord.encryptedCode, QR_ENCRYPTION_KEY);
      const qrPayload = JSON.parse(decryptedString);

      // Update usage count
      await prisma.qRCode.update({
        where: { id: qrCodeRecord.id },
        data: {
          usageCount: qrCodeRecord.usageCount + 1,
          usedAt: new Date()
        }
      });

      // Create verification log
      await prisma.verificationLog.create({
        data: {
          userId: qrCodeRecord.userId,
          verificationType: 'OTHER', // Defaulting to OTHER as QR_CODE is not in the VerificationType enum (Context)
          location: 'QR_Scan',
          result: 'SUCCESS',
          operatorId: req.body.operatorId || null,
          deviceInfo: req.headers['user-agent'] || '',
          ipAddress: req.socket.remoteAddress || ''
        }
      });

      // Update user's last verification time
      await prisma.user.update({
        where: { id: qrCodeRecord.userId },
        data: { lastVerification: new Date() }
      });

      // Log the QR code verification
      await prisma.auditLog.create({
        data: {
          userId: qrCodeRecord.userId,
          action: 'QR_CODE_VERIFICATION',
          tableName: 'QRCode',
          recordId: qrCodeRecord.id,
          newValues: {
            usageCount: qrCodeRecord.usageCount + 1,
            usedAt: new Date().toISOString()
          },
          ipAddress: req.socket.remoteAddress || '',
          userAgent: req.headers['user-agent'] || ''
        }
      });

      // Return user information (publicly accessible info only)
      const { id, studentNumber, fullName, department, level } = qrCodeRecord.user;

      res.status(200).json({
        verified: true,
        userId: id,
        studentNumber,
        fullName,
        department,
        level,
        timestamp: qrPayload.timestamp,
        validUntil: qrPayload.expiresAt,
        message: 'QR code verified successfully',
        qrId: qrCodeRecord.id
      });

    } catch (decryptError) {
      console.error('QR code decryption error:', decryptError);
      return res.status(500).json({
        message: 'Error decrypting QR code',
        error: 'DECRYPTION_ERROR'
      });
    }
  } catch (error: any) {
    console.error('QR verification error:', error);
    res.status(500).json({
      message: 'Internal server error during QR verification',
      error: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}
