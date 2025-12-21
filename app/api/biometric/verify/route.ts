import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { BiometricVerificationService } from '@/lib/services/biometric-service';
import { decryptData } from '@/lib/encryption';

// POST /api/biometric/verify - Verify a student's identity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrCode, matricNumber, method, userId, facialImage, bypassBiometric = false } = body;

    if (!qrCode && !matricNumber && !userId && method !== 'DASHBOARD_FETCH') {
      return NextResponse.json(
        { error: 'QR code, matric number, or user ID is required' },
        { status: 400 }
      );
    }

    let user = null;
    let verificationMethod = method || 'QR_CODE';

    // Handle dashboard fetch method - just get user info without verification
    if (method === 'DASHBOARD_FETCH' && userId) {
      user = await db.user.findUnique({
        where: { id: userId },
      });
      verificationMethod = 'DASHBOARD_FETCH';
    } else {
      // If qrCode is a URL, extract the code part
      let extractedCode = qrCode;
      if (qrCode && qrCode.includes('/')) {
        try {
          const url = new URL(qrCode);
          // Extract the code from the last part of the path
          const pathParts = url.pathname.split('/');
          extractedCode = pathParts[pathParts.length - 1] || qrCode;
          // Decode it in case it was encoded
          extractedCode = decodeURIComponent(extractedCode);
        } catch (e) {
          // If not a valid URL, use the original value
          extractedCode = qrCode;
        }
      }

      // Find user by QR code
      if (extractedCode) {
        const qrRecord = await db.qRCode.findFirst({
          where: {
            code: extractedCode,
            isActive: true,
            expiresAt: { gt: new Date() },
          },
          include: { user: true },
        });

        if (qrRecord) {
          user = qrRecord.user;
          verificationMethod = 'QR_CODE';

          // Update QR usage
          await db.qRCode.update({
            where: { id: qrRecord.id },
            data: {
              usageCount: { increment: 1 },
              lastUsedAt: new Date(),
            },
          });
        }
      }

      // Find user by matric number
      if (!user && matricNumber) {
        user = await db.user.findUnique({
          where: { matricNumber: matricNumber.toUpperCase() },
        });
        if (user) verificationMethod = 'MATRIC_NUMBER';
      }

      // Find user by user ID
      if (!user && userId) {
        user = await db.user.findUnique({
          where: { id: userId },
        });
        if (user) verificationMethod = 'USER_ID';
      }
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Student not found or QR code expired',
      }, { status: 404 });
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json({
        success: false,
        error: 'Account inactive',
      }, { status: 403 });
    }

    // For dashboard fetch, just return user and biometric status without creating audit logs
    if (method === 'DASHBOARD_FETCH') {
      // Get biometric status for the user
      const biometricData = await db.biometricData.findUnique({
        where: { userId: user.id },
      });

      return NextResponse.json({
        success: true,
        student: {
          id: user.id,
          matricNumber: user.matricNumber,
          firstName: user.firstName,
          lastName: user.lastName,
          department: user.department,
          level: user.level,
          profilePhoto: user.profilePhoto,
          isVerified: true,
          biometricEnrolled: !!user.biometricEnrolled,
        },
        biometric: {
          facialEnrolled: !!biometricData?.facialTemplate,
          fingerprintEnrolled: !!biometricData?.fingerprintTemplate,
          quality: biometricData?.facialQuality,
        },
        verifiedAt: new Date().toISOString(),
        method: verificationMethod,
      });
    }

    // Perform biometric verification if facial image is provided and not bypassed
    let biometricResult: any = null;
    if (facialImage && !bypassBiometric) {
      // Get stored biometric data
      const biometricData = await db.biometricData.findUnique({
        where: { userId: user.id },
      });

      if (biometricData && biometricData.facialTemplate) {
        // Initialize biometric service
        const biometricService = BiometricVerificationService.getInstance();

        try {
          // Get the stored template and verify it's a valid JSON string
          const decryptedTemplate = decryptData(biometricData.facialTemplate);
          const storedEmbedding = JSON.parse(decryptedTemplate);

          // Perform enhanced verification
          biometricResult = await biometricService.enhancedVerifyFacialImage(
            facialImage,
            storedEmbedding
          );

          verificationMethod = `${verificationMethod}+BIOMETRIC`;
        } catch (parseError) {
          console.error('Error parsing stored embedding:', parseError);
          biometricResult = {
            verified: false,
            matchScore: 0,
            confidence: 0,
            qualityScore: 0,
            livenessCheck: false,
            details: 'Failed to parse stored biometric template'
          };
        }
      } else {
        biometricResult = {
          verified: false,
          matchScore: 0,
          confidence: 0,
          qualityScore: 0,
          livenessCheck: false,
          details: 'No biometric template found for user'
        };
      }
    }

    // Create audit log for the verification (skip for dashboard fetch)
    if (method !== 'DASHBOARD_FETCH') {
      await db.auditLog.create({
        data: {
          userId: user.id,
          actorType: 'SYSTEM',
          actorId: 'SYSTEM', // This could be the operator ID if coming from operator verification
          actionType: 'IDENTITY_VERIFICATION',
          resourceType: 'USER',
          resourceId: user.id,
          status: biometricResult && !biometricResult.verified ? 'FAILED' : 'SUCCESS',
          details: {
            method: verificationMethod,
            biometricVerified: biometricResult?.verified,
            biometricMatchScore: biometricResult?.matchScore,
            biometricQualityScore: biometricResult?.qualityScore,
            biometricLivenessCheck: biometricResult?.livenessCheck,
            originalMethod: method || 'UNSPECIFIED'
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });
    }

    // Return verification result
    return NextResponse.json({
      success: biometricResult ? biometricResult.verified : true,
      student: {
        id: user.id,
        matricNumber: user.matricNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        department: user.department,
        level: user.level,
        profilePhoto: user.profilePhoto,
        isVerified: biometricResult ? biometricResult.verified : true,
        biometricEnrolled: !!user.biometricEnrolled,
      },
      biometric: biometricResult,
      verifiedAt: new Date().toISOString(),
      method: verificationMethod,
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
