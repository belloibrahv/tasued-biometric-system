import { BiometricRecord, User } from '@prisma/client';
import db from '@/lib/db';
import { encryptData, decryptData, hashBiometricData } from '@/lib/encryption';

interface CreateBiometricRecordInput {
  userId: string;
  biometricType: string;
  biometricData: string;
  templateFormat?: string;
  confidenceScore?: number;
  metadata?: any;
}

interface UpdateBiometricRecordInput {
  recordId: string;
  biometricData?: string;
  confidenceScore?: number;
  metadata?: any;
}

class BiometricService {
  /**
   * Create a new biometric record
   */
  static async createBiometricRecord(input: CreateBiometricRecordInput): Promise<BiometricRecord> {
    // Encrypt the biometric data before storing
    const encryptedData = encryptData(input.biometricData);
    
    const record = await db.biometricRecord.create({
      data: {
        userId: input.userId,
        biometricType: input.biometricType as any, // Type assertion since enum values are strings
        biometricData: encryptedData,
        templateFormat: input.templateFormat || 'proprietary',
        confidenceScore: input.confidenceScore,
        metadata: input.metadata || {},
      },
    });
    
    return record;
  }

  /**
   * Retrieve a biometric record by ID
   */
  static async getBiometricRecord(recordId: string): Promise<BiometricRecord | null> {
    const record = await db.biometricRecord.findUnique({
      where: { id: recordId },
    });

    // Note: We return the encrypted data for security purposes
    // Decryption should happen only when needed and with proper authorization
    return record;
  }

  /**
   * Find biometric records for a user
   */
  static async getUserBiometricRecords(userId: string): Promise<BiometricRecord[]> {
    const records = await db.biometricRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    
    return records;
  }

  /**
   * Update a biometric record
   */
  static async updateBiometricRecord(input: UpdateBiometricRecordInput): Promise<BiometricRecord> {
    // Prepare update data
    const updateData: any = {};
    if (input.biometricData) {
      updateData.biometricData = encryptData(input.biometricData);
    }
    if (input.confidenceScore !== undefined) {
      updateData.confidenceScore = input.confidenceScore;
    }
    if (input.metadata) {
      updateData.metadata = input.metadata;
    }

    const record = await db.biometricRecord.update({
      where: { id: input.recordId },
      data: updateData,
    });

    return record;
  }

  /**
   * Delete a biometric record
   */
  static async deleteBiometricRecord(recordId: string): Promise<boolean> {
    try {
      await db.biometricRecord.delete({
        where: { id: recordId },
      });
      return true;
    } catch (error) {
      console.error('Error deleting biometric record:', error);
      return false;
    }
  }

  /**
   * Search biometric records by type
   */
  static async searchByBiometricType(type: string, userId?: string): Promise<BiometricRecord[]> {
    const whereClause: any = { 
      biometricType: type as any 
    };
    
    if (userId) {
      whereClause.userId = userId;
    }
    
    return await db.biometricRecord.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Compare two biometric templates
   */
  static async compareBiometricTemplates(
    template1: string, 
    template2: string, 
    threshold: number = 0.8
  ): Promise<{ match: boolean; similarity: number }> {
    // In a real implementation, this would use proper biometric comparison algorithms
    // For now, we'll implement a basic similarity check
    
    const hash1 = hashBiometricData(template1);
    const hash2 = hashBiometricData(template2);
    
    // Calculate similarity based on hash difference (simplified)
    let matches = 0;
    const minLength = Math.min(hash1.length, hash2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (hash1[i] === hash2[i]) {
        matches++;
      }
    }
    
    const similarity = matches / minLength;
    
    return {
      match: similarity >= threshold,
      similarity: parseFloat(similarity.toFixed(4))
    };
  }
  
  /**
   * Verify biometric data against stored template
   */
  static async verifyBiometric(
    userId: string,
    biometricType: string,
    biometricData: string,
    threshold: number = 0.8
  ): Promise<{ verified: boolean; confidence: number; recordId?: string }> {
    // Retrieve all stored biometric records for this user and type
    const storedRecords = await db.biometricRecord.findMany({
      where: {
        userId,
        biometricType: biometricType as any,
      },
    });

    // Compare incoming biometric data with each stored template
    for (const record of storedRecords) {
      // In a real implementation, we'd decrypt and compare
      // For this demo, we'll just return the first match
      const decryptedData = decryptData(record.biometricData);
      
      const comparisonResult = await this.compareBiometricTemplates(
        biometricData,
        decryptedData,
        threshold
      );
      
      if (comparisonResult.match) {
        return {
          verified: true,
          confidence: comparisonResult.similarity,
          recordId: record.id,
        };
      }
    }
    
    return {
      verified: false,
      confidence: 0,
    };
  }
}

export default BiometricService;