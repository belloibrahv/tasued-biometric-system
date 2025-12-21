import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';
import { decryptData } from '@/lib/encryption';
import { BiometricVerificationService } from '@/lib/services/biometric-service';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, serviceSlug = 'library', facialImage } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'QR code is required' }, { status: 400 });
    }

    // If code is a URL, extract the actual code part
    let extractedCode = code;
    if (code && code.includes('/')) {
      try {
        const url = new URL(code);
        // Extract the code from the last part of the path
        const pathParts = url.pathname.split('/');
        extractedCode = pathParts[pathParts.length - 1] || code;
        // Decode it in case it was encoded
        extractedCode = decodeURIComponent(extractedCode);
      } catch (e) {
        // If not a valid URL, use the original value
        extractedCode = code;
      }
    }

    // Find the QR code by the extracted code
    let qrCode = await db.qRCode.findUnique({
      where: { code: extractedCode },
      include: {
        user: {
          select: {
            id: true,
            matricNumber: true,
            firstName: true,
            lastName: true,
            otherNames: true,
            phoneNumber: true,
            department: true,
            level: true,
            profilePhoto: true,
            isActive: true,
            biometricEnrolled: true,
            createdAt: true,
          },
        },
      },
    });

    if (!qrCode) {
      return NextResponse.json({
        success: false,
        error: 'Invalid QR code',
        message: 'The QR code you scanned is not valid or does not exist in our system.'
      }, { status: 404 });
    }

    if (!qrCode.isActive) {
      return NextResponse.json({
        success: false,
        error: 'QR code is no longer active',
        message: 'This QR code has been deactivated.'
      }, { status: 400 });
    }

    if (new Date() > qrCode.expiresAt) {
      return NextResponse.json({
        success: false,
        error: 'QR code has expired',
        message: 'This QR code has expired. Please ask the student to refresh their QR code.'
      }, { status: 400 });
    }

    const student = qrCode.user;

    if (!student.isActive) {
      return NextResponse.json({
        success: false,
        error: 'Student account is inactive',
        message: 'This student account has been deactivated.'
      }, { status: 403 });
    }

    // Get service
    const service = await db.service.findUnique({
      where: { slug: serviceSlug },
    });

    if (!service) {
      return NextResponse.json({
        success: false,
        error: 'Service not found',
        message: `The service "${serviceSlug}" is not available in our system.`
      }, { status: 404 });
    }

    // Perform biometric verification if facial image is provided
    let biometricResult: any = null;
    if (facialImage) {
      // Get stored biometric data
      const biometricData = await db.biometricData.findUnique({
        where: { userId: student.id },
      });

      if (biometricData && biometricData.facialTemplate) {
        try {
          // Initialize biometric service
          const biometricService = BiometricVerificationService.getInstance();

          // Get the stored template and verify it's a valid JSON string
          const decryptedTemplate = decryptData(biometricData.facialTemplate);
          const storedEmbedding = JSON.parse(decryptedTemplate);

          // Perform enhanced verification
          biometricResult = await biometricService.enhancedVerifyFacialImage(
            facialImage,
            storedEmbedding
          );
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

    // Update QR code usage
    await db.qRCode.update({
      where: { id: qrCode.id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    // Determine verification method based on biometric check
    const verificationMethod = biometricResult
      ? (biometricResult.verified ? 'QR_CODE+BIOMETRIC' : 'QR_CODE+BIOMETRIC_FAILED')
      : 'QR_CODE';

    // Create access log
    const accessLog = await db.accessLog.create({
      data: {
        userId: student.id,
        serviceId: service.id,
        verificationMethod: verificationMethod as any,
        status: biometricResult ? (biometricResult.verified ? 'SUCCESS' : 'FAILED') : 'SUCCESS',
        operatorId: payload.id,
        location: service.name,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date(),
        biometricMatchScore: biometricResult?.matchScore,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: student.id,
        actorType: 'OPERATOR',
        actorId: payload.id,
        actionType: 'QR_VERIFICATION',
        resourceType: 'ACCESS_LOG',
        resourceId: accessLog.id,
        status: biometricResult ? (biometricResult.verified ? 'SUCCESS' : 'FAILED') : 'SUCCESS',
        details: {
          qrCodeId: qrCode.id,
          service: service.name,
          verificationMethod: verificationMethod,
          biometricVerified: biometricResult?.verified,
          biometricMatchScore: biometricResult?.matchScore,
          biometricQualityScore: biometricResult?.qualityScore,
          biometricLivenessCheck: biometricResult?.livenessCheck,
          biometricEnrolled: student.biometricEnrolled,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        },
        timestamp: new Date(),
      },
    });

    // Create notification
    await db.notification.create({
      data: {
        userId: student.id,
        type: 'VERIFICATION',
        title: `Access Granted: ${service.name}`,
        message: `Your ${verificationMethod.includes('BIOMETRIC') ? 'biometric' : 'QR'} verification was ${biometricResult?.verified ? 'successful' : 'with biometric failure'} at ${service.name} on ${new Date().toLocaleString()}.`,
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      success: biometricResult ? biometricResult.verified : true,
      message: biometricResult
        ? (biometricResult.verified ? 'Biometric verification successful' : 'Biometric verification failed, but QR verification passed')
        : 'Verification successful',
      student: {
        id: student.id,
        matricNumber: student.matricNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        otherNames: student.otherNames,
        phoneNumber: student.phoneNumber,
        department: student.department,
        level: student.level,
        profilePhoto: student.profilePhoto,
        biometricEnrolled: student.biometricEnrolled,
        enrollmentDate: student.createdAt,
      },
      biometricStatus: {
        facialEnrolled: !!biometricData?.facialTemplate,
        fingerprintEnrolled: !!biometricData?.fingerprintTemplate,
        facialQuality: biometricData?.facialQuality,
        fingerprintQuality: biometricData?.fingerprintQuality,
      },
      biometricResult,
      service: {
        id: service.id,
        name: service.name,
        slug: service.slug,
      },
      verification: {
        method: verificationMethod,
        timestamp: accessLog.timestamp,
        location: service.name,
        verifiedBy: payload.id,
        status: biometricResult ? (biometricResult.verified ? 'SUCCESS' : 'PARTIAL') : 'SUCCESS',
      },
    });

  } catch (error: any) {
    console.error('QR verification error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      message: 'An error occurred during verification. Please try again.'
    }, { status: 500 });
  }
}
