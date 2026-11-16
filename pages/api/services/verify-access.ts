// pages/api/services/verify-access.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId, serviceId, verificationType, operatorId } = req.body;

    // Validate required fields
    if (!userId || !serviceId) {
      return res.status(400).json({ message: 'Missing required fields: userId and serviceId' });
    }

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        status: 'ACTIVE'
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found or inactive' });
    }

    // Verify service exists
    const service = await prisma.campusService.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check if user has permission for this service
    // For now, we assume all active users can access any service
    // In a more complex system, you might have specific permissions

    // Check if there's already an active session for this user and service
    const existingSession = await prisma.session.findFirst({
      where: {
        userId: user.id,
        serviceId: service.id,
        status: 'ACTIVE'
      }
    });

    if (existingSession) {
      // Update the existing session instead of creating a new one
      await prisma.session.update({
        where: { id: existingSession.id },
        data: {
          endTime: new Date()
        }
      });

      // Create a new active session
      const newSession = await prisma.session.create({
        data: {
          userId: user.id,
          serviceId: service.id,
          startTime: new Date(),
          status: 'ACTIVE',
          ipAddress: req.socket.remoteAddress || '',
          userAgent: req.headers['user-agent'] || ''
        }
      });

      // Log the session update
      await prisma.verificationLog.create({
        data: {
          userId: user.id,
          verificationType: verificationType || 'OTHER',
          location: service.location,
          result: 'SUCCESS',
          confidenceScore: 100, // For service access verification
          operatorId: operatorId || null,
          deviceInfo: req.headers['user-agent'] || '',
          ipAddress: req.socket.remoteAddress || ''
        }
      });

      res.status(200).json({
        verified: true,
        userId: user.id,
        serviceId: service.id,
        sessionId: newSession.id,
        message: 'Access verified successfully - previous session ended, new session started',
        user: {
          id: user.id,
          studentNumber: user.studentNumber,
          fullName: user.fullName,
          department: user.department
        },
        service: {
          id: service.id,
          serviceName: service.serviceName,
          serviceType: service.serviceType,
          location: service.location
        }
      });
    } else {
      // Create a new session
      const newSession = await prisma.session.create({
        data: {
          userId: user.id,
          serviceId: service.id,
          startTime: new Date(),
          status: 'ACTIVE',
          ipAddress: req.socket.remoteAddress || '',
          userAgent: req.headers['user-agent'] || ''
        }
      });

      // Log the access verification
      await prisma.verificationLog.create({
        data: {
          userId: user.id,
          verificationType: verificationType || 'OTHER',
          location: service.location,
          result: 'SUCCESS',
          confidenceScore: 100, // For service access verification
          operatorId: operatorId || null,
          deviceInfo: req.headers['user-agent'] || '',
          ipAddress: req.socket.remoteAddress || ''
        }
      });

      res.status(200).json({
        verified: true,
        userId: user.id,
        serviceId: service.id,
        sessionId: newSession.id,
        message: 'Access verified successfully',
        user: {
          id: user.id,
          studentNumber: user.studentNumber,
          fullName: user.fullName,
          department: user.department
        },
        service: {
          id: service.id,
          serviceName: service.serviceName,
          serviceType: service.serviceType,
          location: service.location
        }
      });
    }

    // Log the service access verification
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'SERVICE_ACCESS_VERIFICATION',
        tableName: 'Session',
        recordId: newSession.id,
        newValues: {
          serviceId: service.id,
          startTime: new Date().toISOString()
        },
        ipAddress: req.socket.remoteAddress || '',
        userAgent: req.headers['user-agent'] || ''
      }
    });

  } catch (error: any) {
    console.error('Service access verification error:', error);
    res.status(500).json({
      message: 'Internal server error during service access verification',
      error: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}
