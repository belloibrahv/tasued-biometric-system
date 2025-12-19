import { BiometricData, User } from '@prisma/client';
import db from '@/lib/db';
import { encryptData, decryptData, hashBiometricData } from '@/lib/encryption';

interface UpdateBiometricInput {
  userId: string;
  type: 'fingerprint' | 'facial' | 'iris';
  template: string;
  quality?: number;
}

class BiometricService {
  /**
   * Get biometric data for a user
   */
  static async getBiometricData(userId: string): Promise<BiometricData | null> {
    return await db.biometricData.findUnique({
      where: { userId },
    });
  }

  /**
   * Update or create biometric data
   */
  static async updateBiometricData(input: UpdateBiometricInput): Promise<BiometricData> {
    const encryptedTemplate = encryptData(input.template);
    
    const updateData: any = {
      lastUpdated: new Date(),
    };

    if (input.type === 'fingerprint') {
      updateData.fingerprintTemplate = encryptedTemplate;
      updateData.fingerprintQuality = input.quality || 100;
    } else if (input.type === 'facial') {
      updateData.facialTemplate = encryptedTemplate;
      updateData.facialQuality = input.quality || 100;
    } else if (input.type === 'iris') {
      updateData.irisTemplate = encryptedTemplate;
      updateData.irisQuality = input.quality || 100;
    }

    return await db.biometricData.upsert({
      where: { userId: input.userId },
      update: updateData,
      create: {
        userId: input.userId,
        ...updateData,
      },
    });
  }

  /**
   * Delete all biometric data for a user
   */
  static async deleteBiometricData(userId: string): Promise<boolean> {
    try {
      await db.biometricData.delete({
        where: { userId },
      });
      return true;
    } catch (error) {
      console.error('Error deleting biometric data:', error);
      return false;
    }
  }

  /**
   * Verify biometric data
   */
  static async verifyBiometric(
    userId: string,
    type: 'fingerprint' | 'facial' | 'iris',
    template: string,
    threshold: number = 0.8
  ): Promise<{ verified: boolean; confidence: number }> {
    const biometricData = await db.biometricData.findUnique({
      where: { userId },
    });

    if (!biometricData) {
      return { verified: false, confidence: 0 };
    }

    let storedTemplate: string | null = null;

    if (type === 'fingerprint') {
      storedTemplate = biometricData.fingerprintTemplate;
    } else if (type === 'facial') {
      storedTemplate = biometricData.facialTemplate;
    } else if (type === 'iris') {
      storedTemplate = biometricData.irisTemplate;
    }

    if (!storedTemplate) {
      return { verified: false, confidence: 0 };
    }

    // Decrypt stored template
    const decryptedTemplate = decryptData(storedTemplate);

    // Compare templates
    const result = await this.compareBiometricTemplates(template, decryptedTemplate, threshold);

    return {
      verified: result.match,
      confidence: result.similarity,
    };
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
    const hash1 = hashBiometricData(template1);
    const hash2 = hashBiometricData(template2);

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
      similarity: parseFloat(similarity.toFixed(4)),
    };
  }

  /**
   * Check if user has biometric data enrolled
   */
  static async hasEnrolledBiometrics(userId: string): Promise<{
    fingerprint: boolean;
    facial: boolean;
    iris: boolean;
  }> {
    const biometricData = await db.biometricData.findUnique({
      where: { userId },
    });

    return {
      fingerprint: !!biometricData?.fingerprintTemplate,
      facial: !!biometricData?.facialTemplate,
      iris: !!biometricData?.irisTemplate,
    };
  }
}

export default BiometricService;
