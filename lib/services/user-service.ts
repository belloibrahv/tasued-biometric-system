import { User } from '@prisma/client';
import db from '@/lib/db';

interface CreateUserInput {
  email: string;
  password: string;
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
   * (Note: Auth is now handled by Supabase, this is mainly for profile data)
   */
  static async createUser(input: CreateUserInput): Promise<User> {
    const user = await db.user.create({
      data: {
        email: input.email.toLowerCase(),
        password: input.password, // Plain text here as auth is handled by Supabase
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

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  /**
   * Get a user by ID
   */
  static async getUserById(userId: string): Promise<Omit<User, 'password'> | null> {
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) return null;

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<User, 'password'>;
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

    const user = await db.user.update({
      where: { id: input.userId },
      data: updateData,
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<User, 'password'>;
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
}

export default UserService;
