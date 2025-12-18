import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { BiometricType } from '@prisma/client';
import db from '@/lib/db';
import { encryptData } from '@/lib/encryption';
import BiometricService from '@/lib/services/biometric-service';

// POST /api/import
// Import biometric data from external sources
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;
    const sourceSystem = formData.get('sourceSystem') as string | null;

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'File and userId are required' },
        { status: 400 }
      );
    }

    // Read the file contents
    const fileBuffer = await file.arrayBuffer();
    const fileText = new TextDecoder().decode(fileBuffer);
    
    // Parse the import data based on file extension
    let importData: any = null;
    let format: string = '';

    if (file.name.endsWith('.json')) {
      format = 'JSON';
      importData = JSON.parse(fileText);
    } else if (file.name.endsWith('.xml')) {
      format = 'XML';
      // For XML, we'd normally use an XML parser, but for demo we'll try to extract data
      // In a real implementation, you'd use a proper XML parser
      importData = {
        records: extractBiometricRecordsFromXml(fileText)
      };
    } else if (file.name.endsWith('.csv')) {
      format = 'CSV';
      importData = {
        records: parseCsvToBiometricRecords(fileText)
      };
    } else {
      return NextResponse.json(
        { error: 'Unsupported file format. Supported formats: JSON, XML, CSV' },
        { status: 400 }
      );
    }

    // Validate the import data
    if (!importData || !Array.isArray(importData.records)) {
      return NextResponse.json(
        { error: 'Invalid import data format' },
        { status: 400 }
      );
    }

    // Import each record
    const importedRecords = [];
    const errors = [];

    for (const recordData of importData.records) {
      try {
        // Validate required fields
        if (!recordData.biometricType || !recordData.biometricData) {
          errors.push(`Record missing required fields: ${JSON.stringify(recordData)}`);
          continue;
        }

        // Map the imported biometric type to our system
        const mappedBiometricType = mapBiometricType(recordData.biometricType);

        // Create a new biometric record
        const newRecord = await BiometricService.createBiometricRecord({
          userId,
          biometricType: mappedBiometricType,
          biometricData: recordData.biometricData, // This will be encrypted by the service
          templateFormat: recordData.templateFormat || format,
          confidenceScore: recordData.confidenceScore,
          metadata: {
            ...recordData.metadata,
            importSource: sourceSystem || 'unknown',
            importDate: new Date().toISOString(),
            originalFormat: format,
          }
        });

        importedRecords.push(newRecord);
      } catch (recordError) {
        errors.push(`Error importing record: ${recordError.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      importedCount: importedRecords.length,
      errorCount: errors.length,
      errors,
      importedRecords
    });
  } catch (error) {
    console.error('Error importing biometric data:', error);
    return NextResponse.json(
      { error: 'Failed to import biometric data', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to extract biometric records from XML string
function extractBiometricRecordsFromXml(xmlString: string): any[] {
  // This is a simplified approach
  // In a real implementation, you'd use a proper XML parsing library
  const records: any[] = [];
  
  // Simple regex to extract <biometric_record>...</biometric_record> blocks
  const recordRegex = /<biometric_record>(.*?)<\/biometric_record>/gs;
  let match;
  
  while ((match = recordRegex.exec(xmlString)) !== null) {
    const recordXml = match[1];
    
    // Extract fields using simple regex (not robust for production)
    const id = extractXmlValue(recordXml, 'id');
    const userId = extractXmlValue(recordXml, 'user_id');
    const biometricType = extractXmlValue(recordXml, 'biometric_type');
    const biometricData = extractXmlValue(recordXml, 'biometric_data');
    const confidenceScore = parseFloat(extractXmlValue(recordXml, 'confidence_score'));
    const templateFormat = extractXmlValue(recordXml, 'template_format');
    
    records.push({
      id,
      userId,
      biometricType: biometricType as BiometricType,
      biometricData,
      confidenceScore: isNaN(confidenceScore) ? undefined : confidenceScore,
      templateFormat,
    });
  }
  
  return records;
}

// Helper function to extract a value from XML
function extractXmlValue(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}>(.*?)</${tagName}>`);
  const match = xml.match(regex);
  return match ? match[1] : '';
}

// Helper function to parse CSV to biometric records
function parseCsvToBiometricRecords(csvString: string): any[] {
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) return [];
  
  // Extract headers
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  // Process data rows
  const records: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
    
    const record: any = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = values[j];
    }
    
    // Convert confidence score to number if it exists
    if (record.confidence_score) {
      record.confidence_score = parseFloat(record.confidence_score);
      if (isNaN(record.confidence_score)) delete record.confidence_score;
    }
    
    records.push(record);
  }
  
  return records;
}

// Helper function to map external biometric types to our system types
function mapBiometricType(externalType: string): BiometricType {
  const typeMap: { [key: string]: BiometricType } = {
    'fingerprint': BiometricType.FINGERPRINT,
    'face': BiometricType.FACE_RECOGNITION,
    'face_recognition': BiometricType.FACE_RECOGNITION,
    'iris': BiometricType.IRIS_SCAN,
    'iris_scan': BiometricType.IRIS_SCAN,
    'retina': BiometricType.RETINA_SCAN,
    'retina_scan': BiometricType.RETINA_SCAN,
    'voice': BiometricType.VOICE_RECOGNITION,
    'voice_recognition': BiometricType.VOICE_RECOGNITION,
    'hand': BiometricType.HAND_GEOMETRY,
    'hand_geometry': BiometricType.HAND_GEOMETRY,
    'signature': BiometricType.SIGNATURE,
  };
  
  // Normalize the input string
  const normalizedType = externalType.toLowerCase().replace(' ', '_');
  
  return typeMap[normalizedType] || BiometricType.FINGERPRINT; // Default to fingerprint
}