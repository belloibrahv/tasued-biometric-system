// pages/api/users/profile.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '../../../middleware/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verify user authentication
  const authResult = await authenticateUser(req);
  if (!authResult.authenticated || !authResult.user) {
    return res.status(401).json({ message: authResult.error || 'Unauthorized' });
  }
  const userId = authResult.user.id;

  try {
    if (req.method === 'GET') {
      // Fetch user profile
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
          status: 'ACTIVE'
        },
        select: {
          id: true,
          studentNumber: true,
          fullName: true,
          email: true,
          phone: true,
          department: true,
          level: true,
          enrollmentDate: true,
          lastVerification: true,
          verificationCount: true,
          status: true,
          createdAt: true
        }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get recent verification history (last 10 verifications)
      const recentVerifications = await prisma.verificationLog.findMany({
        where: { userId: user.id },
        orderBy: { timestamp: 'desc' },
        take: 10,
        select: {
          id: true,
          verificationType: true,
          location: true,
          timestamp: true,
          result: true,
          confidenceScore: true
        }
      });

      res.status(200).json({
        user: user,
        recentVerifications: recentVerifications,
        message: 'Profile retrieved successfully'
      });
    }
    else if (req.method === 'PUT') {
      // Update user profile
      const { fullName, email, phone, department } = req.body;

      // Validate update fields
      if (!fullName && !email && !phone && !department) {
        return res.status(400).json({ message: 'No fields to update provided' });
      }

      // Check if email is already taken by another user
      if (email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email,
            NOT: { id: userId }
          }
        });
        if (existingUser) {
          return res.status(409).json({ message: 'Email already in use by another user' });
        }
      }

      // Update user profile
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          fullName: fullName || undefined,
          email: email || undefined,
          phone: phone || undefined,
          department: department || undefined
        },
        select: {
          id: true,
          studentNumber: true,
          fullName: true,
          email: true,
          phone: true,
          department: true,
          level: true,
          enrollmentDate: true,
          lastVerification: true,
          verificationCount: true,
          status: true,
          createdAt: true
        }
      });

      // Log the profile update
      await prisma.auditLog.create({
        data: {
          userId: updatedUser.id,
          action: 'PROFILE_UPDATE',
          tableName: 'User',
          recordId: updatedUser.id,
          oldValues: {
            fullName: req.body.fullName ? req.body.fullName : undefined,
            email: req.body.email ? req.body.email : undefined,
            phone: req.body.phone ? req.body.phone : undefined,
            department: req.body.department ? req.body.department : undefined
          },
          newValues: {
            fullName: updatedUser.fullName,
            email: updatedUser.email,
            phone: updatedUser.phone,
            department: updatedUser.department
          },
          ipAddress: req.socket.remoteAddress || '',
          userAgent: req.headers['user-agent'] || ''
        }
      });

      res.status(200).json({
        user: updatedUser,
        message: 'Profile updated successfully'
      });
    }
  } catch (error: any) {
    console.error('User profile error:', error);
    res.status(500).json({
      message: 'Internal server error during profile operation',
      error: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}
