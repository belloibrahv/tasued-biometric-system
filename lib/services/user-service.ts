import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import db from '@/lib/db';

interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

interface UpdateUserInput {
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
}

class UserService {
  /**
   * Create a new user
   */
  static async createUser(input: CreateUserInput): Promise<User> {
    // Hash the password
    const hashedPassword = await bcrypt.hash(input.password, parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'));
    
    const user = await db.user.create({
      data: {
        email: input.email.toLowerCase(),
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role as any || 'USER',
      },
    });
    
    // Don't return the password hash
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
    
    // Don't return the password hash
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
   * Check if a user exists by email
   */
  static async userExists(email: string): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
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
    if (input.role) updateData.role = input.role as any;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    
    const user = await db.user.update({
      where: { id: input.userId },
      data: updateData,
    });
    
    // Don't return the password hash
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<User, 'password'>;
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'));
      
      await db.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
      
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      return false;
    }
  }

  /**
   * Delete a user and all associated biometric records
   */
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      // Delete all biometric records associated with the user first
      await db.biometricRecord.deleteMany({
        where: { userId },
      });
      
      // Then delete the user
      await db.user.delete({
        where: { id: userId },
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  /**
   * Authenticate a user
   */
  static async authenticateUser(email: string, password: string): Promise<Omit<User, 'password'> | null> {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    
    if (!user || !user.isActive) {
      return null;
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return null;
    }
    
    // Don't return the password hash
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<User, 'password'>;
  }
}

export default UserService;