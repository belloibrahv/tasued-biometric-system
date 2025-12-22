// pages/api/admin/dashboard.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '../../../middleware/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verify admin authentication
  const authResult = await authenticateUser(req, true); // require admin privileges
  if (!authResult.authenticated || !authResult.user) {
    return res.status(401).json({ message: authResult.error || 'Unauthorized: Admin access required' });
  }

  try {
    // Get system statistics
    const totalUsers = await prisma.user.count({
      where: { status: 'ACTIVE' }
    });

    const totalVerifications = await prisma.verificationLog.count();

    const recentVerifications = await prisma.verificationLog.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            fullName: true,
            studentNumber: true
          }
        }
      }
    });

    const verificationSuccessRate = await prisma.verificationLog.aggregate({
      _count: true,
      where: { result: 'SUCCESS' }
    });

    const totalVerificationsCount = await prisma.verificationLog.count();
    const successRate = totalVerificationsCount > 0 
      ? (verificationSuccessRate._count / totalVerificationsCount) * 100 
      : 0;

    const usersByDepartment = await prisma.user.groupBy({
      by: ['department'],
      where: { status: 'ACTIVE' },
      _count: true,
      orderBy: { _count: 'desc' }
    });

    const verificationsByType = await prisma.verificationLog.groupBy({
      by: ['verificationType'],
      _count: true,
      orderBy: { _count: 'desc' }
    });

    const activeQRs = await prisma.qRCode.count({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          gte: new Date()
        }
      }
    });

    const recentlyActiveUsers = await prisma.user.findMany({
      where: {
        lastVerification: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      take: 10,
      orderBy: { lastVerification: 'desc' },
      select: {
        id: true,
        fullName: true,
        studentNumber: true,
        department: true,
        lastVerification: true,
        verificationCount: true
      }
    });

    res.status(200).json({
      dashboard: {
        totalUsers,
        totalVerifications,
        successRate: parseFloat(successRate.toFixed(2)),
        activeQRs,
        recentVerifications,
        usersByDepartment,
        verificationsByType
      },
      recentlyActiveUsers,
      message: 'Admin dashboard data retrieved successfully'
    });

  } catch (error: any) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ 
      message: 'Internal server error during admin dashboard operation',
      error: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}