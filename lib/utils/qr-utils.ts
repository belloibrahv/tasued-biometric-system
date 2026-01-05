import QRCode from 'qrcode';

export class QRUtils {
  /**
   * Generate QR code as data URL
   */
  static async generateQRDataURL(
    data: string,
    options?: {
      width?: number;
      margin?: number;
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    }
  ): Promise<string> {
    try {
      const qrCode = await QRCode.toDataURL(data, {
        errorCorrectionLevel: options?.errorCorrectionLevel || 'H',
        type: 'image/png',
        width: options?.width || 300,
        margin: options?.margin || 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrCode;
    } catch (error: any) {
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  /**
   * Generate QR code as SVG string
   */
  static async generateQRSVG(
    data: string,
    options?: {
      width?: number;
      margin?: number;
    }
  ): Promise<string> {
    try {
      const qrCode = await QRCode.toString(data, {
        type: 'svg',
        width: options?.width || 300,
        margin: options?.margin || 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrCode;
    } catch (error: any) {
      throw new Error(`Failed to generate QR code SVG: ${error.message}`);
    }
  }

  /**
   * Generate QR code as Buffer (PNG)
   */
  static async generateQRBuffer(
    data: string,
    options?: {
      width?: number;
      margin?: number;
    }
  ): Promise<Buffer> {
    try {
      const qrCode = await QRCode.toBuffer(data, {
        errorCorrectionLevel: 'H',
        type: 'png',
        width: options?.width || 300,
        margin: options?.margin || 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrCode;
    } catch (error: any) {
      throw new Error(`Failed to generate QR code buffer: ${error.message}`);
    }
  }

  /**
   * Validate QR code format
   */
  static validateQRFormat(code: string): boolean {
    // Check if it's a valid UUID format (session ID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(code);
  }

  /**
   * Extract session ID from QR code
   */
  static extractSessionId(qrCode: string): string | null {
    try {
      // If it's a URL, extract the last part
      if (qrCode.includes('/')) {
        const url = new URL(qrCode);
        const pathParts = url.pathname.split('/');
        const sessionId = pathParts[pathParts.length - 1];
        return this.validateQRFormat(sessionId) ? sessionId : null;
      }

      // If it's a direct UUID
      return this.validateQRFormat(qrCode) ? qrCode : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate QR code with metadata
   */
  static async generateQRWithMetadata(
    sessionId: string,
    metadata?: {
      courseCode?: string;
      courseName?: string;
      venue?: string;
      time?: string;
    }
  ): Promise<{
    qrCode: string;
    sessionId: string;
    metadata?: typeof metadata;
  }> {
    try {
      const qrCode = await this.generateQRDataURL(sessionId);
      return {
        qrCode,
        sessionId,
        metadata,
      };
    } catch (error: any) {
      throw new Error(`Failed to generate QR with metadata: ${error.message}`);
    }
  }

  /**
   * Generate batch QR codes
   */
  static async generateBatchQRCodes(
    sessionIds: string[]
  ): Promise<Array<{ sessionId: string; qrCode: string }>> {
    try {
      const qrCodes = await Promise.all(
        sessionIds.map(async (sessionId) => ({
          sessionId,
          qrCode: await this.generateQRDataURL(sessionId),
        }))
      );
      return qrCodes;
    } catch (error: any) {
      throw new Error(`Failed to generate batch QR codes: ${error.message}`);
    }
  }

  /**
   * Create QR code download link
   */
  static createDownloadLink(qrCodeDataURL: string, filename: string): string {
    // This would be used in the browser to trigger download
    return `data:text/html,<a href="${qrCodeDataURL}" download="${filename}">Download</a>`;
  }

  /**
   * Validate QR code data
   */
  static validateQRData(data: string): {
    valid: boolean;
    type: 'uuid' | 'url' | 'invalid';
    extractedId?: string;
  } {
    if (this.validateQRFormat(data)) {
      return {
        valid: true,
        type: 'uuid',
        extractedId: data,
      };
    }

    const extractedId = this.extractSessionId(data);
    if (extractedId) {
      return {
        valid: true,
        type: 'url',
        extractedId,
      };
    }

    return {
      valid: false,
      type: 'invalid',
    };
  }

  /**
   * Generate QR code with custom styling
   */
  static async generateStyledQRCode(
    data: string,
    options?: {
      width?: number;
      margin?: number;
      darkColor?: string;
      lightColor?: string;
    }
  ): Promise<string> {
    try {
      const qrCode = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: options?.width || 300,
        margin: options?.margin || 2,
        color: {
          dark: options?.darkColor || '#000000',
          light: options?.lightColor || '#FFFFFF',
        },
      });
      return qrCode;
    } catch (error: any) {
      throw new Error(`Failed to generate styled QR code: ${error.message}`);
    }
  }

  /**
   * Get QR code size estimate
   */
  static getQRCodeSizeEstimate(dataLength: number): {
    version: number;
    capacity: number;
    estimatedSize: string;
  } {
    // QR code version estimation based on data length
    let version = 1;
    let capacity = 41;

    if (dataLength > 41) version = 2;
    if (dataLength > 77) version = 3;
    if (dataLength > 127) version = 4;
    if (dataLength > 187) version = 5;

    const sizePixels = 21 + (version - 1) * 4;
    const estimatedSize = `${sizePixels}x${sizePixels}px`;

    return {
      version,
      capacity,
      estimatedSize,
    };
  }
}
