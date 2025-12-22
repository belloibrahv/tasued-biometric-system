// pages/api/config/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '../../../middleware/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    if (req.method === 'GET') {
      // Retrieve all system configuration values
      const configs = await prisma.systemConfig.findMany();
      
      // Convert to an object for easier use
      const configObject: Record<string, any> = {};
      configs.forEach(config => {
        try {
          // Try to parse as JSON first, otherwise use as string
          configObject[config.configKey] = JSON.parse(config.configValue || 'null');
        } catch {
          // If JSON parsing fails, use as string
          configObject[config.configKey] = config.configValue;
        }
      });

      res.status(200).json({
        config: configObject,
        message: 'System configuration retrieved successfully'
      });
    } 
    else if (req.method === 'PUT') {
      // Verify admin authentication
      const authResult = await authenticateUser(req, true); // require admin privileges
      if (!authResult.authenticated || !authResult.user) {
        return res.status(401).json({ message: authResult.error || 'Unauthorized: Admin access required' });
      }
      const adminId = authResult.user.id;

      const updates = req.body;
      const updatedConfigs = [];

      // Process each configuration update
      for (const [key, value] of Object.entries(updates)) {
        // Ensure the key is valid
        if (typeof key !== 'string' || key.length === 0) {
          continue;
        }

        // Convert value to string if needed
        const valueString = typeof value === 'object' ? JSON.stringify(value) : String(value);

        // Update or create the configuration entry
        const updatedConfig = await prisma.systemConfig.upsert({
          where: { configKey: key },
          update: {
            configValue: valueString,
            updatedAt: new Date(),
            updatedBy: adminId
          },
          create: {
            configKey: key,
            configValue: valueString,
            updatedBy: adminId
          }
        });

        updatedConfigs.push(updatedConfig);
      }

      // Log the configuration update
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'SYSTEM_CONFIG_UPDATE',
          tableName: 'SystemConfig',
          newValues: updates,
          ipAddress: req.socket.remoteAddress || '',
          userAgent: req.headers['user-agent'] || ''
        }
      });

      res.status(200).json({
        updatedConfigs,
        message: 'System configuration updated successfully'
      });
    }
  } catch (error: any) {
    console.error('System configuration error:', error);
    res.status(500).json({ 
      message: 'Internal server error during configuration operation',
      error: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}