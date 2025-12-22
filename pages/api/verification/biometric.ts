// pages/api/verification/biometric.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { verifyBiometric, performLivenessDetection } from '@/lib/biometricProcessing';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId, verificationType, location, imageData, serviceId, operatorId } = req.body;

    // Validate required fields
    if (!userId || !imageData) {
      return res.status(400).json({ message: 'Missing required fields: userId and imageData' });
    }

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: userId, status: 'ACTIVE' }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found or inactive' });
    }

    // Verify biometric template exists
    if (!user.encryptedBiometricTemplate) {
      return res.status(400).json({ message: 'No biometric template found for user' });
    }

    // Perform liveness detection to ensure it's a real person
    const livenessResult = await performLivenessDetection(imageData);
    if (!livenessResult.isLive) {
      // Log failed verification due to liveness check
      await prisma.verificationLog.create({
        data: {
          userId: user.id,
          verificationType: verificationType || 'OTHER',
          location: location || 'Unknown',
          result: 'FAILED',
          confidenceScore: livenessResult.confidence,
          operatorId: operatorId || null,
          deviceInfo: req.headers['user-agent'] || '',
          ipAddress: req.socket.remoteAddress || ''
        }
      });

      return res.status(400).json({
        message: 'Liveness check failed',
        details: livenessResult.message
      });
    }

    // Perform biometric verification
    const verificationResult = await verifyBiometric(
      imageData,
      user.encryptedBiometricTemplate
    );

    // Log the verification attempt
    const verificationLog = await prisma.verificationLog.create({
      data: {
        userId: user.id,
        verificationType: verificationType || 'OTHER',
        location: location || 'Unknown',
        result: verificationResult.isVerified ? 'SUCCESS' : 'FAILED',
        confidenceScore: verificationResult.confidence,
        operatorId: operatorId || null,
        deviceInfo: req.headers['user-agent'] || '',
        ipAddress: req.socket.remoteAddress || ''
      }
    });

    // Update user verification count
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastVerification: new Date(),
        verificationCount: { increment: 1 }
      }
    });

    // If verification is successful, create/update session
    if (verificationResult.isVerified && serviceId) {
      await prisma.session.upsert({
        where: {
          userId_status: { // Note: Removed serviceId from unique constraint in schema, check index
            userId: user.id,
            status: 'ACTIVE'
          }
        },
        update: {
          endTime: null, // Reset end time if reactivating
          status: 'ACTIVE'
        },
        create: {
          userId: user.id,
          serviceId: serviceId,
          startTime: new Date(),
          status: 'ACTIVE',
          ipAddress: req.socket.remoteAddress || '',
          userAgent: req.headers['user-agent'] || ''
        }
      });
    }

    // Log the verification result
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: `BIOMETRIC_${verificationResult.isVerified ? 'VERIFICATION_SUCCESS' : 'VERIFICATION_FAILED'}`,
        tableName: 'VerificationLog',
        recordId: verificationLog.id,
        newValues: {
          verificationType: verificationType,
          location: location,
          result: verificationResult.isVerified ? 'SUCCESS' : 'FAILED',
          confidenceScore: verificationResult.confidence
        },
        ipAddress: req.socket.remoteAddress || '',
        userAgent: req.headers['user-agent'] || ''
      }
    });

    res.status(200).json({
      verified: verificationResult.isVerified,
      confidence: verificationResult.confidence,
      message: verificationResult.message,
      verificationId: verificationLog.id,
      userId: user.id,
      studentNumber: user.studentNumber,
      fullName: user.fullName
    });

  } catch (error: any) {
    console.error('Biometric verification error:', error);
    res.status(500).json({
      message: 'Internal server error during verification',
      error: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}
