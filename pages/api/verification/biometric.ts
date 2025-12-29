// pages/api/verification/biometric.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { BiometricVerificationService } from '@/lib/services/biometric-service';

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
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get biometric data for the user
    const biometricData = await prisma.biometricData.findUnique({
      where: { userId: user.id }
    });
    
    if (!biometricData || !biometricData.facialTemplate) {
      return res.status(400).json({ message: 'No biometric template found for user' });
    }

    // Use the biometric verification service
    const biometricService = BiometricVerificationService.getInstance();
    
    // Parse the stored template
    let storedEmbedding: number[] = [];
    try {
      storedEmbedding = JSON.parse(biometricData.facialTemplate);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid biometric template format' });
    }
    
    // Perform enhanced verification
    const verificationResult = await biometricService.enhancedVerifyFacialImage(
      imageData,
      storedEmbedding
    );
    
    if (!verificationResult.verified) {
      // Log failed verification
      await prisma.accessLog.create({
        data: {
          userId: user.id,
          action: 'BIOMETRIC_VERIFICATION_FAILED',
          status: 'FAILED',
          method: 'FACIAL',
          confidenceScore: verificationResult.confidence,
          location: location || 'Unknown',
          deviceInfo: req.headers['user-agent'] || '',
          ipAddress: req.socket.remoteAddress || '',
          metadata: {
            verificationType: verificationType || 'OTHER',
            qualityScore: verificationResult.qualityScore,
            livenessCheck: verificationResult.livenessCheck,
            details: verificationResult.details
          }
        }
      });
      
      return res.status(400).json({
        message: 'Biometric verification failed',
        details: verificationResult.details
      });
    }



    // Log the successful verification
    const accessLog = await prisma.accessLog.create({
      data: {
        userId: user.id,
        action: 'BIOMETRIC_VERIFICATION_SUCCESS',
        status: 'SUCCESS',
        method: 'FACIAL',
        confidenceScore: verificationResult.confidence,
        location: location || 'Unknown',
        deviceInfo: req.headers['user-agent'] || '',
        ipAddress: req.socket.remoteAddress || '',
        metadata: {
          verificationType: verificationType || 'OTHER',
          qualityScore: verificationResult.qualityScore,
          livenessCheck: verificationResult.livenessCheck,
          details: verificationResult.details
        }
      }
    });



    // If verification is successful, create/update session
    if (serviceId) {
      // Check if there's an existing active session for this user and service
      const existingSession = await prisma.session.findFirst({
        where: {
          userId: user.id,
          serviceId: serviceId,
          status: 'ACTIVE'
        }
      });
      
      if (existingSession) {
        // Update the existing session instead of creating a new one
        await prisma.session.update({
          where: { id: existingSession.id },
          data: {
            endTime: null, // Reset end time if reactivating
            status: 'ACTIVE'
          }
        });
      } else {
        // Create a new session
        await prisma.session.create({
          data: {
            userId: user.id,
            serviceId: serviceId,
            startTime: new Date(),
            status: 'ACTIVE',
            ipAddress: req.socket.remoteAddress || '',
            userAgent: req.headers['user-agent'] || ''
          }
        });
      }
    }

    // Log the verification result
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        actionType: 'BIOMETRIC_VERIFICATION_SUCCESS',
        resourceType: 'ACCESS',
        resourceId: accessLog.id,
        newValues: {
          verificationType: verificationType,
          location: location,
          confidenceScore: verificationResult.confidence,
          qualityScore: verificationResult.qualityScore
        },
        ipAddress: req.socket.remoteAddress || '',
        userAgent: req.headers['user-agent'] || ''
      }
    });

    res.status(200).json({
      verified: true,
      confidence: verificationResult.confidence,
      message: verificationResult.details,
      accessLogId: accessLog.id,
      userId: user.id,
      matricNumber: user.matricNumber,
      fullName: `${user.firstName} ${user.lastName}`
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