import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { encryptData, decryptData } from '@/lib/encryption';
import db from '@/lib/db';
import { validateExportRequest } from '@/lib/security/validation';
import { biometricRateLimiter, withRateLimit } from '@/lib/security/rate-limit';

// GET /api/export
// Get available exports for a user
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = withRateLimit(request, biometricRateLimiter);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
    }

    // Get user info from middleware headers
    const userIdFromToken = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userIdFromToken) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    let requestedUserId = searchParams.get('userId');

    // Non-admin users can only access their own exports
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      requestedUserId = userIdFromToken;
    }

    if (!requestedUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const exports = await db.biometricExport.findMany({
      where: { exportedById: requestedUserId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(exports);
  } catch (error) {
    console.error('Error fetching exports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exports' },
      { status: 500 }
    );
  }
}

// POST /api/export
// Create a new biometric data export
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = withRateLimit(request, biometricRateLimiter);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
    }

    // Get user info from middleware headers
    const userIdFromToken = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userIdFromToken) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    let { userId, recordIds, format, includeEncryptedData, includeMetadata, includeUserInfo } = body;

    // Non-admin users can only export their own records
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      userId = userIdFromToken;
    }

    if (!userId || !recordIds || !format) {
      return NextResponse.json(
        { error: 'userId, recordIds, and format are required' },
        { status: 400 }
      );
    }

    // Validate the export request
    const validation = validateExportRequest({
      userId,
      recordIds,
      format
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Fetch the biometric records to export (ensure user can only export their own records)
    const records = await db.biometricRecord.findMany({
      where: {
        id: { in: recordIds },
        userId,
      },
    });

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'No records found for export' },
        { status: 404 }
      );
    }

    // Prepare export data based on the requested format
    let exportData = '';
    let fileName = '';
    let fileSize = 0;

    switch (format) {
      case 'JSON':
        exportData = JSON.stringify({
          records: records.map(record => ({
            ...record,
            biometricData: includeEncryptedData ? record.biometricData : '[ENCRYPTED_DATA_HIDDEN]',
            metadata: includeMetadata ? record.metadata : {},
            user: includeUserInfo ? { id: record.userId } : {},
          })),
          exportTimestamp: new Date().toISOString(),
          exportFormat: format,
        }, null, 2);
        fileName = `biometric_export_${userId}_${Date.now()}.json`;
        break;

      case 'XML':
        // Convert records to XML format
        const xmlRecords = records.map(record => `
          <biometric_record>
            <id>${record.id}</id>
            <user_id>${record.userId}</user_id>
            <biometric_type>${record.biometricType}</biometric_type>
            <created_at>${record.createdAt.toISOString()}</created_at>
            <updated_at>${record.updatedAt.toISOString()}</updated_at>
            <confidence_score>${record.confidenceScore || ''}</confidence_score>
            <template_format>${record.templateFormat}</template_format>
            <biometric_data>${includeEncryptedData ? record.biometricData : '[ENCRYPTED_DATA_HIDDEN]'}</biometric_data>
            ${includeMetadata ? `<metadata>${JSON.stringify(record.metadata)}</metadata>` : ''}
          </biometric_record>`.trim()).join('\n');

        exportData = `<?xml version="1.0" encoding="UTF-8"?>
        <biometric_export>
          <export_timestamp>${new Date().toISOString()}</export_timestamp>
          <export_format>${format}</export_format>
          ${xmlRecords}
        </biometric_export>`;
        fileName = `biometric_export_${userId}_${Date.now()}.xml`;
        break;

      case 'CSV':
        // Create CSV format
        const csvHeaders = [
          'id', 'user_id', 'biometric_type', 'created_at', 'confidence_score',
          'template_format', 'metadata'
        ].join(',');

        const csvRows = records.map(record => [
          `"${record.id}"`,
          `"${record.userId}"`,
          `"${record.biometricType}"`,
          `"${record.createdAt.toISOString()}"`,
          `"${record.confidenceScore || ''}"`,
          `"${record.templateFormat}"`,
          `"${includeMetadata ? JSON.stringify(record.metadata) : ''}"`
        ].join(','));

        exportData = [csvHeaders, ...csvRows].join('\n');
        fileName = `biometric_export_${userId}_${Date.now()}.csv`;
        break;

      case 'ISO_19794':
        // For ISO 19794 format, we'd need a specialized library
        // For this demo, we'll create a basic JSON structure that follows ISO principles
        exportData = JSON.stringify({
          format: 'ISO_19794',
          version: '1.0',
          records: records.map(record => ({
            biometric_id: record.id,
            format_id: record.templateFormat,
            capture_device: record.metadata?.device || 'unknown',
            quality: record.metadata?.quality || 'unknown',
            biometric_data: includeEncryptedData ? record.biometricData : '[ENCRYPTED_DATA_HIDDEN]',
            // Additional ISO 19794 specific fields would go here
          })),
          export_timestamp: new Date().toISOString(),
        }, null, 2);
        fileName = `biometric_export_${userId}_${Date.now()}_ISO19794.json`;
        break;

      default:
        return NextResponse.json(
          { error: 'Unsupported export format' },
          { status: 400 }
        );
    }

    // Encrypt the export data
    const encryptedExportData = encryptData(exportData);
    fileSize = new Blob([encryptedExportData]).size;

    // Create the export record in the database
    const biometricExport = await db.biometricExport.create({
      data: {
        exportedById: userId,
        exportFormat: format,
        exportData: encryptedExportData,
        fileName,
        fileSize,
      },
    });

    return NextResponse.json({
      ...biometricExport,
      downloadUrl: `/api/export/${biometricExport.id}/download`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating export:', error);
    return NextResponse.json(
      { error: 'Failed to create export' },
      { status: 500 }
    );
  }
}