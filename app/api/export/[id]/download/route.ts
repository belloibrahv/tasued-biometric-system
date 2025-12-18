import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import db from '@/lib/db';
import { decryptData } from '@/lib/encryption';

// GET /api/export/[id]/download
// Download a specific export file
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const exportId = params.id;

    if (!exportId) {
      return NextResponse.json(
        { error: 'Export ID is required' },
        { status: 400 }
      );
    }

    // Fetch the export record
    const exportRecord = await db.biometricExport.findUnique({
      where: { id: exportId },
    });

    if (!exportRecord) {
      return NextResponse.json(
        { error: 'Export not found' },
        { status: 404 }
      );
    }

    // Update download count and mark as downloaded if needed
    await db.biometricExport.update({
      where: { id: exportId },
      data: {
        downloadCount: exportRecord.downloadCount + 1,
        isDownloaded: true,
      },
    });

    // Decrypt the export data
    const decryptedData = decryptData(exportRecord.exportData);

    // Create a readable stream from the decrypted data
    const stream = Readable.from(decryptedData);

    // Determine content type based on file extension
    let contentType = 'application/octet-stream';
    if (exportRecord.fileName.endsWith('.json')) {
      contentType = 'application/json';
    } else if (exportRecord.fileName.endsWith('.xml')) {
      contentType = 'application/xml';
    } else if (exportRecord.fileName.endsWith('.csv')) {
      contentType = 'text/csv';
    }

    // Create the response with appropriate headers for file download
    const response = new NextResponse(stream as any);
    response.headers.set('Content-Type', contentType);
    response.headers.set('Content-Disposition', `attachment; filename="${exportRecord.fileName}"`);
    response.headers.set('Content-Length', exportRecord.fileSize?.toString() || '');

    return response;
  } catch (error) {
    console.error('Error downloading export:', error);
    return NextResponse.json(
      { error: 'Failed to download export' },
      { status: 500 }
    );
  }
}