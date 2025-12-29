// pages/api/users/enroll.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
// import { hash } from 'bcrypt'; // Not currently used
import { BiometricVerificationService } from '../../../lib/services/biometric-service';
import { authenticateUser } from '../../../middleware/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      matricNumber, 
      firstName,
      lastName,
      email, 
      phoneNumber, 
      department, 
      level, 
      biometricData 
    } = req.body;

    // Validate required fields
    if (!matricNumber || !firstName || !lastName || !email || !biometricData) {
      return res.status(400).json({ 
        message: 'Missing required fields: matricNumber, firstName, lastName, email, or biometricData' 
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { matricNumber },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ 
        message: 'User with this matric number or email already exists' 
      });
    }

    // Create user in database first
    const user = await prisma.user.create({
      data: {
        matricNumber,
        firstName,
        lastName,
        email,
        phoneNumber,
        department,
        level,
        biometricEnrolled: false // Will be updated after biometric data is created
      }
    });

    // Process biometric data to create embedding for enrollment
    const biometricService = BiometricVerificationService.getInstance();
    const { embedding, isValid } = await biometricService.processFacialImageForEnrollment(biometricData);
    
    if (!isValid) {
      // If biometric data is invalid, delete the user we just created
      await prisma.user.delete({ where: { id: user.id } });
      return res.status(400).json({ 
        message: 'Invalid biometric data provided' 
      });
    }
    
    // Convert embedding to string and encrypt
    const templateString = JSON.stringify(embedding);
    const encryptedTemplate = templateString; // Using simple string for now, should use encryption in production
    
    // Create biometric data record
    await prisma.biometricData.create({
      data: {
        userId: user.id,
        facialTemplate: encryptedTemplate,
        facialQuality: 95, // Default quality score
        facialPhotos: [] // No photos stored yet
      }
    });
    
    // Update user to mark as biometric enrolled
    await prisma.user.update({
      where: { id: user.id },
      data: { biometricEnrolled: true }
    });

    // Log the enrollment
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        actionType: 'USER_ENROLLMENT',
        resourceType: 'USER',
        resourceId: user.id,
        newValues: {
          matricNumber: user.matricNumber,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        },
        ipAddress: req.socket.remoteAddress || '',
        userAgent: req.headers['user-agent'] || ''
      }
    });

    res.status(201).json({ 
      message: 'User enrolled successfully', 
      userId: user.id,
      matricNumber: user.matricNumber 
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