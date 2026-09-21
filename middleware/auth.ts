// middleware/auth.ts
import { NextApiRequest } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware to authenticate user requests
 * @param req - Next.js API request
 * @param requireAdmin - Whether admin privileges are required
 * @returns User object if authenticated, null otherwise
 */
export async function authenticateUser(req: NextApiRequest, requireAdmin: boolean = false) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return { authenticated: false, error: 'Missing authorization header' };
    }

    // Extract token from "Bearer <token>" format
    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0].toLowerCase() !== 'bearer') {
      return { authenticated: false, error: 'Invalid authorization header format' };
    }

    const token = tokenParts[1];

    // In a real implementation, you would verify the JWT token here
    // For now, we'll assume the token is the user ID for simplicity
    // This would be replaced with proper JWT verification in production

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: {
        id: token,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        studentNumber: true,
        fullName: true,
        email: true,
        department: true,
        level: true,
        status: true
      }
    });

    if (!user) {
      return { authenticated: false, error: 'User not found or inactive' };
    }

    // Check admin privileges if required
    if (requireAdmin) {
      // In a real system, you would check user roles here
      // For now, we'll assume any valid user can be an admin if they have the right token
      // This would be replaced with proper role checking in production
      const isAdmin = await checkAdminStatus(user.id);
      if (!isAdmin) {
        return { authenticated: false, error: 'Admin privileges required' };
      }
    }

    return { authenticated: true, user, error: null };
  } catch (error) {
    console.error('Authentication error:', error);
    return { authenticated: false, error: 'Authentication failed' };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Check if user has admin privileges
 * @param userId - User ID to check
 * @returns True if user is admin, false otherwise
 */
async function checkAdminStatus(userId: string): Promise<boolean> {
  // In a real implementation, you would check user roles in the database
  // For now, we'll assume certain users are admins based on configuration
  // This would be replaced with proper role checking in production

  // Example implementation:
  const adminUsers = process.env.ADMIN_USER_IDS?.split(',') || [];
  return adminUsers.includes(userId);
}
