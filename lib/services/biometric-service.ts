import db from '@/lib/db';
import { encryptData } from '@/lib/encryption';
import { createClient as createSupabaseClientJS } from '@supabase/supabase-js';

export interface EnrollmentInput {
  userId: string;
  facialTemplate?: number[] | string;
  facialPhoto?: string;
  fingerprintTemplate?: string;
}

class BiometricService {
  /**
   * Enrolls biometric data for a user
   * Handles encryption, DB transaction, and Supabase metadata sync
   */
  static async enroll(input: EnrollmentInput, clientIp: string = 'unknown', userAgent: string = 'unknown') {
    const { userId, facialTemplate, facialPhoto, fingerprintTemplate } = input;

    // 1. Encrypt Biometric Data
    let encryptedFacialTemplate = null;
    let encryptedFingerprintTemplate = null;

    if (facialTemplate) {
      const facialData = typeof facialTemplate === 'string' ? facialTemplate : JSON.stringify(facialTemplate);
      encryptedFacialTemplate = encryptData(facialData);
    }

    if (fingerprintTemplate) {
      const fingerprintData = typeof fingerprintTemplate === 'string' ? fingerprintTemplate : JSON.stringify(fingerprintTemplate);
      encryptedFingerprintTemplate = encryptData(fingerprintData);
    }

    // 2. Database Transaction
    const result = await db.$transaction(async (tx) => {
      const updatedBiometricData = await tx.biometricData.upsert({
        where: { userId },
        update: {
          facialTemplate: encryptedFacialTemplate,
          facialQuality: facialTemplate ? 95 : undefined,
          facialPhotos: facialPhoto ? [facialPhoto] : undefined,
          fingerprintTemplate: encryptedFingerprintTemplate,
          fingerprintQuality: fingerprintTemplate ? 95 : undefined,
          lastUpdated: new Date(),
        },
        create: {
          userId,
          facialTemplate: encryptedFacialTemplate,
          facialQuality: facialTemplate ? 95 : null,
          facialPhotos: facialPhoto ? [facialPhoto] : [],
          fingerprintTemplate: encryptedFingerprintTemplate,
          fingerprintQuality: fingerprintTemplate ? 95 : null,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          biometricEnrolled: true,
          updatedAt: new Date()
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          actorType: 'STUDENT',
          actorId: userId,
          actionType: 'BIOMETRIC_ENROLLMENT',
          resourceType: 'BIOMETRIC',
          resourceId: updatedBiometricData.id,
          status: 'SUCCESS',
          details: {
            facialEnrolled: !!facialTemplate,
            fingerprintEnrolled: !!fingerprintTemplate
          },
          ipAddress: clientIp,
          userAgent: userAgent,
        },
      });

      return updatedBiometricData;
    });

    // 3. Update Supabase Auth Metadata (Admin)
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
      id: result.id,
      facialEnrolled: !!result.facialTemplate,
      fingerprintEnrolled: !!result.fingerprintTemplate,
      enrolledAt: result.lastUpdated,
    };
  }
}

export default BiometricService;