// pages/api/users/enroll.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { createBiometricTemplate } from '../../../lib/biometricProcessing';
import { authenticateUser } from '../../../middleware/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      studentNumber, 
      fullName, 
      email, 
      phone, 
      department, 
      level, 
      biometricData 
    } = req.body;

    // Validate required fields
    if (!studentNumber || !fullName || !email || !biometricData) {
      return res.status(400).json({ 
        message: 'Missing required fields: studentNumber, fullName, email, or biometricData' 
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { studentNumber },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ 
        message: 'User with this student number or email already exists' 
      });
    }

    // Process biometric data to create encrypted template
    const encryptedTemplate = await createBiometricTemplate(biometricData);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        studentNumber,
        fullName,
        email,
        phone,
        department,
        level,
        encryptedBiometricTemplate: Buffer.from(encryptedTemplate),
        status: 'ACTIVE'
      }
    });

    // Log the enrollment
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_ENROLLMENT',
        tableName: 'User',
        recordId: user.id,
        newValues: {
          studentNumber: user.studentNumber,
          fullName: user.fullName,
          email: user.email
        },
        ipAddress: req.socket.remoteAddress || '',
        userAgent: req.headers['user-agent'] || ''
      }
    });

    res.status(201).json({ 
      message: 'User enrolled successfully', 
      userId: user.id,
      studentNumber: user.studentNumber 
    });

  } catch (error: any) {
    console.error('User enrollment error:', error);
    res.status(500).json({ 
      message: 'Internal server error during enrollment',
      error: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}