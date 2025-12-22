import db from '@/lib/db';
import { encryptData } from '@/lib/encryption';
import { createClient as createSupabaseClientJS } from '@supabase/supabase-js';

export interface EnrollmentInput {
  userId: string;
  facialTemplate?: number[] | string;
  facialPhoto?: string;
  fingerprintTemplate?: string;
  facialQuality?: number;
  fingerprintQuality?: number;
}

class BiometricService {
  /**
   * Enrolls biometric data for a user
   * Handles encryption, DB transaction, and Supabase metadata sync
   */
  static async enroll(input: EnrollmentInput, clientIp: string = 'unknown', userAgent: string = 'unknown') {
    const { userId, facialTemplate, facialPhoto, fingerprintTemplate, facialQuality, fingerprintQuality } = input;

    // Prepare encrypted data
    let encryptedFacialTemplate: string | null = null;
    let encryptedFingerprintTemplate: string | null = null;
    const facialPhotos: string[] = [];

    if (facialTemplate) {
      const templateData = typeof facialTemplate === 'string' 
        ? facialTemplate 
        : JSON.stringify(facialTemplate);
      
      try {
        encryptedFacialTemplate = encryptData(templateData);
      } catch (encryptError) {
        console.error('BiometricService.enroll: Facial template encryption failed:', encryptError);
        throw new Error(`Failed to encrypt facial template: ${encryptError.message}`);
      }
    }

    if (fingerprintTemplate) {
      try {
        encryptedFingerprintTemplate = encryptData(fingerprintTemplate);
      } catch (encryptError) {
        console.error('BiometricService.enroll: Fingerprint template encryption failed:', encryptError);
        throw new Error(`Failed to encrypt fingerprint template: ${encryptError.message}`);
      }
    }

    if (facialPhoto) {
      facialPhotos.push(facialPhoto);
    }

    // Upsert biometric data
    const biometricData = await db.biometricData.upsert({
      where: { userId },
      update: {
        facialTemplate: encryptedFacialTemplate || undefined,
        facialQuality: facialQuality || (facialTemplate ? 95 : undefined),
        fingerprintTemplate: encryptedFingerprintTemplate || undefined,
        fingerprintQuality: fingerprintQuality || (fingerprintTemplate ? 95 : undefined),
        facialPhotos: facialPhotos.length > 0 ? facialPhotos : undefined,
        updatedAt: new Date(),
      },
      create: {
        userId,
        facialTemplate: encryptedFacialTemplate,
        facialQuality: facialQuality || (facialTemplate ? 95 : null),
        fingerprintTemplate: encryptedFingerprintTemplate,
        fingerprintQuality: fingerprintQuality || (fingerprintTemplate ? 95 : null),
        facialPhotos,
      },
    });

    // Update user's biometric enrollment status
    await db.user.update({
      where: { id: userId },
      data: {
        biometricEnrolled: true,
        updatedAt: new Date(),
      },
    });

    // Log Audit Trail
    await db.auditLog.create({
      data: {
        userId,
        actionType: 'BIOMETRIC_ENROLLMENT',
        resourceType: 'BIOMETRIC',
        resourceId: biometricData.id,
        status: 'SUCCESS',
        details: {
          hasFacial: !!facialTemplate,
          hasFingerprint: !!fingerprintTemplate,
        } as any,
        ipAddress: clientIp,
        userAgent: userAgent,
      },
    });

    // Update Supabase Auth Metadata
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabaseAdmin = createSupabaseClientJS(supabaseUrl, supabaseServiceKey);
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { biometricEnrolled: true }
        });
      } catch (err) {
        console.warn('BiometricService: Auth metadata update failed', err);
      }
    }

    return {
      success: true,
      enrolledAt: biometricData.enrolledAt,
      biometricId: biometricData.id,
    };
  }

  /**
   * Get biometric data for a user
   */
  static async getBiometricData(userId: string) {
    return await db.biometricData.findUnique({
      where: { userId },
    });
  }

  /**
   * Check if user has biometric data enrolled
   */
  static async isEnrolled(userId: string): Promise<boolean> {
    const data = await db.biometricData.findUnique({
      where: { userId },
      select: {
        facialTemplate: true,
        fingerprintTemplate: true,
      },
    });
    return !!(data?.facialTemplate || data?.fingerprintTemplate);
  }

  /**
   * Delete biometric data for a user
   */
  static async deleteBiometricData(userId: string, adminId?: string, clientIp?: string, userAgent?: string) {
    const existing = await db.biometricData.findUnique({
      where: { userId },
    });

    if (!existing) {
      return { success: false, message: 'No biometric data found' };
    }

    await db.biometricData.delete({
      where: { userId },
    });

    // Update user status
    await db.user.update({
      where: { id: userId },
      data: { biometricEnrolled: false },
    });

    // Log audit
    await db.auditLog.create({
      data: {
        userId,
        adminId,
        actionType: 'BIOMETRIC_DELETION',
        resourceType: 'BIOMETRIC',
        resourceId: existing.id,
        status: 'SUCCESS',
        ipAddress: clientIp,
        userAgent,
      },
    });

    return { success: true };
  }
}

export default BiometricService;


/**
 * BiometricVerificationService - Handles facial recognition verification
 * Uses a singleton pattern for efficient resource management
 */
export class BiometricVerificationService {
  private static instance: BiometricVerificationService;

  private constructor() {}

  static getInstance(): BiometricVerificationService {
    if (!BiometricVerificationService.instance) {
      BiometricVerificationService.instance = new BiometricVerificationService();
    }
    return BiometricVerificationService.instance;
  }

  /**
   * Calculate cosine similarity between two embedding vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embedding vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Extract facial embedding from an image
   * In production, this would use a real ML model (e.g., FaceNet, ArcFace)
   * For now, we simulate the embedding extraction
   */
  async extractFacialEmbedding(imageData: string): Promise<number[]> {
    // In a real implementation, this would:
    // 1. Decode the base64 image
    // 2. Detect faces in the image
    // 3. Extract facial landmarks
    // 4. Generate a 128/512-dimensional embedding vector

    // For simulation, generate a pseudo-random embedding based on image hash
    const hash = this.simpleHash(imageData);
    const embedding: number[] = [];
    
    for (let i = 0; i < 128; i++) {
      // Generate deterministic but varied values
      const value = Math.sin(hash * (i + 1)) * 0.5 + 0.5;
      embedding.push(value);
    }

    // Normalize the embedding
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
  }

  /**
   * Simple hash function for simulation purposes
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < Math.min(str.length, 1000); i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Verify a facial image against a stored embedding
   */
  async verifyFacialImage(
    imageData: string,
    storedEmbedding: number[],
    threshold: number = 0.7
  ): Promise<{ verified: boolean; matchScore: number }> {
    const capturedEmbedding = await this.extractFacialEmbedding(imageData);
    const similarity = this.cosineSimilarity(capturedEmbedding, storedEmbedding);
    const matchScore = Math.round(similarity * 100);

    return {
      verified: similarity >= threshold,
      matchScore,
    };
  }

  /**
   * Enhanced verification with additional checks
   */
  async enhancedVerifyFacialImage(
    imageData: string,
    storedEmbedding: number[],
    options: { strictMode?: boolean; threshold?: number } = {}
  ): Promise<{
    verified: boolean;
    matchScore: number;
    confidence: number;
    qualityScore: number;
    livenessCheck: boolean;
    details?: string;
  }> {
    const { strictMode = false, threshold = strictMode ? 0.85 : 0.7 } = options;

    try {
      // Extract embedding from captured image
      const capturedEmbedding = await this.extractFacialEmbedding(imageData);
      
      // Calculate similarity
      const similarity = this.cosineSimilarity(capturedEmbedding, storedEmbedding);
      const matchScore = Math.round(similarity * 100);

      // Simulate quality assessment (in production, analyze image quality)
      const qualityScore = 85 + Math.random() * 15; // 85-100%

      // Simulate liveness detection (in production, use anti-spoofing models)
      const livenessCheck = Math.random() > 0.1; // 90% pass rate for simulation

      // Calculate confidence based on multiple factors
      const confidence = Math.round(
        (matchScore * 0.6 + qualityScore * 0.2 + (livenessCheck ? 100 : 0) * 0.2)
      );

      const verified = similarity >= threshold && livenessCheck && qualityScore >= 70;

      return {
        verified,
        matchScore,
        confidence,
        qualityScore: Math.round(qualityScore),
        livenessCheck,
        details: verified 
          ? 'Verification successful' 
          : `Verification failed: ${!livenessCheck ? 'Liveness check failed' : similarity < threshold ? 'Match score too low' : 'Quality too low'}`,
      };
    } catch (error: any) {
      return {
        verified: false,
        matchScore: 0,
        confidence: 0,
        qualityScore: 0,
        livenessCheck: false,
        details: `Verification error: ${error.message}`,
      };
    }
  }

  /**
   * Process facial image for enrollment
   * Returns embedding and quality metrics
   */
  async processFacialImageForEnrollment(imageData: string): Promise<{
    embedding: number[];
    qualityScore: number;
    isValid: boolean;
    livenessCheck: boolean;
  }> {
    try {
      // Extract embedding
      const embedding = await this.extractFacialEmbedding(imageData);
      
      // Simulate quality assessment
      const qualityScore = 85 + Math.random() * 15; // 85-100%
      
      // Simulate liveness detection
      const livenessCheck = Math.random() > 0.05; // 95% pass rate
      
      // Validate embedding
      const isValid = embedding.length === 128 && qualityScore >= 70;

      return {
        embedding,
        qualityScore: Math.round(qualityScore),
        isValid,
        livenessCheck,
      };
    } catch (error: any) {
      return {
        embedding: [],
        qualityScore: 0,
        isValid: false,
        livenessCheck: false,
      };
    }
  }
}
