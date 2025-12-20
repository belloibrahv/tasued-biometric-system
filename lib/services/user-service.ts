import { User } from '@prisma/client';
import db from '@/lib/db';

interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  matricNumber: string;
  phoneNumber: string;
  dateOfBirth: Date;
  department: string;
  level: string;
  otherNames?: string;
}

interface UpdateUserInput {
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePhoto?: string;
  isActive?: boolean;
}

class UserService {
  /**
   * Create a new user
   */
  static async createUser(input: CreateUserInput): Promise<User> {
    return await db.user.create({
      data: {
        email: input.email.toLowerCase(),
        firstName: input.firstName,
        lastName: input.lastName,
        otherNames: input.otherNames || null,
        matricNumber: input.matricNumber.toUpperCase(),
        phoneNumber: input.phoneNumber,
        dateOfBirth: input.dateOfBirth,
        department: input.department,
        level: input.level,
        isActive: true,
      },
    });
  }

  /**
   * Get a user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    return await db.user.findUnique({
      where: { id: userId },
    });
  }

  /**
   * Get a user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    return await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * Get a user by matric number
   */
  static async getUserByMatricNumber(matricNumber: string): Promise<User | null> {
    return await db.user.findUnique({
      where: { matricNumber: matricNumber.toUpperCase() },
    });
  }

  /**
   * Check if a user exists by email
   */
  static async userExists(email: string): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    return !!user;
  }

  /**
   * Check if matric number exists
   */
  static async matricNumberExists(matricNumber: string): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { matricNumber: matricNumber.toUpperCase() },
    });
    return !!user;
  }

  /**
   * Update user information
   */
  static async updateUser(input: UpdateUserInput): Promise<Omit<User, 'password'> | null> {
    const updateData: any = {};

    if (input.email) updateData.email = input.email.toLowerCase();
    if (input.firstName) updateData.firstName = input.firstName;
    if (input.lastName) updateData.lastName = input.lastName;
    if (input.phoneNumber) updateData.phoneNumber = input.phoneNumber;
    if (input.profilePhoto) updateData.profilePhoto = input.profilePhoto;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    return await db.user.update({
      where: { id: input.userId },
      data: updateData,
    });
  }

  /**
   * Delete a user and all associated data
   */
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      // Delete in order due to foreign key constraints
      await db.notification.deleteMany({ where: { userId } });
      await db.dataExport.deleteMany({ where: { userId } });
      await db.accessLog.deleteMany({ where: { userId } });
      await db.serviceConnection.deleteMany({ where: { userId } });
      await db.qRCode.deleteMany({ where: { userId } });
      await db.biometricData.deleteMany({ where: { userId } });
      await db.auditLog.deleteMany({ where: { userId } });
      await db.user.delete({ where: { id: userId } });

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  /**
   * Idempotently syncs a user from Supabase Auth metadata to the database
   */
  static async syncUserFromAuth(authUser: any): Promise<User> {
    const metadata = authUser.user_metadata || {};
    const id = authUser.id;
    const email = authUser.email?.toLowerCase();

    // Check if user exists
    let user = await db.user.findUnique({
      where: { id },
      include: { biometricData: true }
    });

    if (user) return user as User;

    // Parse names
    const fullName = metadata.full_name || metadata.firstName + ' ' + metadata.lastName || 'Student';
    const nameParts = fullName.split(' ');
    const firstName = metadata.firstName || nameParts[0] || 'First';
    const lastName = metadata.lastName || nameParts[nameParts.length - 1] || 'Last';
    const otherNames = nameParts.slice(1, -1).join(' ') || null;

    // Create user in transaction
    return await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          id,
          email,
          firstName,
          lastName,
          otherNames,
          matricNumber: (metadata.matric_number || metadata.matricNumber || `TEMP-${Date.now()}`).toUpperCase(),
          phoneNumber: metadata.phone_number || metadata.phoneNumber || '',
          dateOfBirth: metadata.date_of_birth ? new Date(metadata.date_of_birth) : new Date('2000-01-01'),
          department: metadata.department || 'General',
          level: metadata.level || '100',
          isActive: true,
        },
      });

      // Initialize biometric data
      await tx.biometricData.create({
        data: { userId: newUser.id }
      });

      // Create initial QR code
      await tx.qRCode.create({
        data: {
          userId: newUser.id,
          code: `BV-${newUser.matricNumber}-${Math.random().toString(36).substring(7).toUpperCase()}`,
          isActive: true,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        }
      });

      return newUser;
    });
  }
}

export default UserService;
