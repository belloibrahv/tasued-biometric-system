import { User } from '@prisma/client';
import db from '@/lib/db';

interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  matricNumber: string;
  phoneNumber?: string;
  department?: string;
  level?: string;
}

interface UpdateUserInput {
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  otherNames?: string;
  phoneNumber?: string;
  department?: string;
  level?: string;
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
        phoneNumber: input.phoneNumber || null,
        department: input.department || null,
        level: input.level || '100',
        isActive: true,
        biometricEnrolled: false,
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
  static async updateUser(input: UpdateUserInput): Promise<User | null> {
    const updateData: any = {};

    if (input.email) updateData.email = input.email.toLowerCase();
    if (input.firstName) updateData.firstName = input.firstName;
    if (input.lastName) updateData.lastName = input.lastName;
    if (input.otherNames !== undefined) updateData.otherNames = input.otherNames;
    if (input.phoneNumber) updateData.phoneNumber = input.phoneNumber;
    if (input.department) updateData.department = input.department;
    if (input.level) updateData.level = input.level;
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
      await db.accessLog.deleteMany({ where: { userId } });
      await db.session.deleteMany({ where: { userId } });
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
   * This is the critical function that ensures data consistency between auth and DB
   */
  static async syncUserFromAuth(authUser: any): Promise<User> {
    // DEBUG: Log the full authUser object to see what we're receiving
    console.log('=== syncUserFromAuth DEBUG ===');
    console.log('authUser.id:', authUser.id);
    console.log('authUser.email:', authUser.email);
    console.log('authUser.user_metadata:', JSON.stringify(authUser.user_metadata, null, 2));
    console.log('authUser.raw_user_meta_data:', JSON.stringify(authUser.raw_user_meta_data, null, 2));
    
    // Try multiple sources for metadata (Supabase can store it in different places)
    const metadata = authUser.user_metadata || authUser.raw_user_meta_data || {};
    const id = authUser.id;
    const email = (authUser.email || metadata.email || '').toLowerCase();

    // Extract user data from metadata - support multiple field name formats
    const matricNumber = (
      metadata.studentNumber || 
      metadata.matricNumber || 
      metadata.matric_number || 
      ''
    ).toUpperCase();
    
    // Support both combined fullName/full_name and separate firstName/lastName
    let firstName = metadata.firstName || metadata.first_name || '';
    let lastName = metadata.lastName || metadata.last_name || '';
    
    console.log('Extracted firstName:', firstName);
    console.log('Extracted lastName:', lastName);
    
    // Handle full_name (underscore) or fullName (camelCase) - split into first/last
    const fullNameValue = metadata.full_name || metadata.fullName || '';
    if (!firstName && !lastName && fullNameValue) {
      console.log('Parsing full_name:', fullNameValue);
      const nameParts = fullNameValue.trim().split(' ');
      firstName = nameParts[0] || 'Unknown';
      lastName = nameParts.slice(1).join(' ') || 'User';
    }
    
    // Only use defaults if truly empty
    if (!firstName) firstName = 'Unknown';
    if (!lastName) lastName = 'User';
    
    console.log('Final firstName:', firstName);
    console.log('Final lastName:', lastName);
    console.log('=== END DEBUG ===');

    const otherNames = metadata.otherNames || metadata.other_names || null;
    const phoneNumber = metadata.phone || metadata.phoneNumber || metadata.phone_number || null;
    const department = metadata.department || null;
    
    // CRITICAL: Preserve the level exactly as provided - this fixes the consistency issue
    const level = metadata.level ? String(metadata.level) : '100';

    // Determine user type from metadata
    const metadataType = (metadata.type || '').toLowerCase();
    const metadataRole = (metadata.role || '').toUpperCase();
    const isAdmin = metadataType === 'admin' || 
                    metadataRole === 'ADMIN' || 
                    metadataRole === 'SUPER_ADMIN' || 
                    metadataRole === 'OPERATOR';

    if (!email) throw new Error('Email is required for synchronization');
    
    // For students, matric number is required. For admins, generate a temporary one if missing
    let finalMatricNumber = matricNumber;
    if (!isAdmin && !matricNumber) {
      throw new Error('Matric number is required for students');
    } else if (isAdmin && !matricNumber) {
      // Generate a temporary matric number for admin users
      finalMatricNumber = `ADMIN-${Date.now()}`;
    }

    // 1. Check if user exists by ID
    let user = await db.user.findUnique({
      where: { id },
    });

    if (user) {
      // User exists - update with latest metadata to ensure consistency
      return await db.user.update({
        where: { id },
        data: {
          firstName,
          lastName,
          otherNames,
          phoneNumber,
          department,
          level,
          updatedAt: new Date(),
        },
      });
    }

    // 2. Check by email (handle deleted/recreated users)
    const existingByEmail = await db.user.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      // Update ID to match new Auth ID and sync all fields
      return await db.user.update({
        where: { email },
        data: { 
          id,
          firstName,
          lastName,
          otherNames,
          phoneNumber,
          department,
          level,
          updatedAt: new Date(),
        }
      });
    }

    // 3. Check by matric number (prevent duplicates) - only for students
    if (!isAdmin && finalMatricNumber) {
      const existingByMatric = await db.user.findUnique({
        where: { matricNumber: finalMatricNumber },
      });

      if (existingByMatric) {
        // If email matches, we already handled it. 
        // If email differs, it's a conflict.
        throw new Error(`Matric Number ${finalMatricNumber} is already in use.`);
      }
    }

    // 4. Create new user with all metadata
    return await db.user.create({
      data: {
        id,
        email,
        firstName,
        lastName,
        otherNames,
        matricNumber: finalMatricNumber,
        phoneNumber,
        department,
        level,
        isActive: true,
        biometricEnrolled: metadata.biometricEnrolled === true,
      },
    });
  }

  /**
   * Get user with biometric data
   */
  static async getUserWithBiometric(userId: string) {
    return await db.user.findUnique({
      where: { id: userId },
      include: {
        biometricData: true,
      },
    });
  }

  /**
   * Update user's biometric enrollment status
   */
  static async updateBiometricStatus(userId: string, enrolled: boolean): Promise<User | null> {
    return await db.user.update({
      where: { id: userId },
      data: { biometricEnrolled: enrolled },
    });
  }
}

export default UserService;
