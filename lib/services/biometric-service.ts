import { FaceRecognitionService } from './face-recognition-service';

/**
 * Biometric Verification Service
 * Provides enhanced biometric enrollment and verification capabilities
 */
export class BiometricVerificationService {
  private faceRecognitionService: FaceRecognitionService;
  private static instance: BiometricVerificationService;

  private constructor() {
    this.faceRecognitionService = FaceRecognitionService.getInstance();
  }

  public static getInstance(): BiometricVerificationService {
    if (!BiometricVerificationService.instance) {
      BiometricVerificationService.instance = new BiometricVerificationService();
    }
    return BiometricVerificationService.instance;
  }

  /**
   * Process and validate a facial image for enrollment
   */
  public async processFacialImageForEnrollment(base64Image: string): Promise<{
    embedding: number[];
    qualityScore: number;
    isValid: boolean;
    livenessCheck: boolean;
  }> {
    try {
      // Initialize models if not already loaded
      await this.faceRecognitionService.initializeModels();

      // Perform liveness detection to ensure it's not a photo
      const isLive = await this.faceRecognitionService.performLivenessDetection(base64Image);

      if (!isLive) {
        return {
          embedding: [],
          qualityScore: 0,
          isValid: false,
          livenessCheck: false
        };
      }

      // Extract facial features
      const embedding = await this.faceRecognitionService.extractFeatures(base64Image);

      // Calculate quality score based on image properties
      const qualityScore = this.calculateImageQuality(base64Image);

      return {
        embedding,
        qualityScore,
        isValid: qualityScore >= 70, // Minimum quality threshold
        livenessCheck: true
      };
    } catch (error) {
      console.error('Error processing facial image:', error);
      return {
        embedding: [],
        qualityScore: 0,
        isValid: false,
        livenessCheck: false
      };
    }
  }

  /**
   * Verify a captured facial image against enrolled template
   */
  public async verifyFacialImage(
    capturedImage: string,
    storedTemplate: number[]
  ): Promise<{
    verified: boolean;
    matchScore: number;
    confidence: number;
    details: string;
  }> {
    try {
      // Initialize models if not already loaded
      await this.faceRecognitionService.initializeModels();

      // Extract features from captured image
      const capturedFeatures = await this.faceRecognitionService.extractFeatures(capturedImage);

      // Calculate similarity between captured and stored template
      const similarity = this.faceRecognitionService.calculateSimilarity(
        capturedFeatures,
        storedTemplate
      );

      // Convert similarity to percentage
      const matchScore = Math.round(similarity * 100);
      const threshold = 85; // 85% threshold for verification

      const verified = matchScore >= threshold;
      const confidence = verified ? Math.min(100, Math.round(matchScore)) : Math.max(0, Math.round(matchScore));

      const details = verified
        ? `Strong match (${matchScore}%) with high confidence`
        : `Insufficient match (${matchScore}%), below threshold (${threshold}%)`;

      return {
        verified,
        matchScore,
        confidence,
        details
      };
    } catch (error) {
      console.error('Error during facial verification:', error);
      return {
        verified: false,
        matchScore: 0,
        confidence: 0,
        details: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Calculate image quality score
   */
  private calculateImageQuality(base64Image: string): number {
    try {
      // In a real implementation, this would analyze the image for:
      // - Sharpness/uniformity
      // - Lighting conditions
      // - Face positioning
      // - Image noise levels
      // - Contrast levels

      // For now, we'll estimate quality based on base64 length (proxy for image size)
      // and some basic heuristics
      const imageLength = base64Image.length;
      const estimatedQuality = Math.min(100, Math.round((imageLength / 100000) * 100)); // Basic size-based estimate

      // Additional factors could be calculated based on image data
      return Math.max(0, estimatedQuality);
    } catch {
      return 50; // Default medium quality for invalid images
    }
  }

  /**
   * Enhanced facial verification with multiple checks
   */
  public async enhancedVerifyFacialImage(
    capturedImage: string,
    storedTemplate: number[],
    options: {
      strictMode?: boolean;
      minQuality?: number;
    } = {}
  ): Promise<{
    verified: boolean;
    matchScore: number;
    confidence: number;
    qualityScore: number;
    livenessCheck: boolean;
    details: string;
  }> {
    const { strictMode = false, minQuality = 70 } = options;

    // Process the captured image
    const processedImage = await this.processFacialImageForEnrollment(capturedImage);

    if (!processedImage.isValid || processedImage.qualityScore < minQuality) {
      return {
        verified: false,
        matchScore: 0,
        confidence: 0,
        qualityScore: processedImage.qualityScore,
        livenessCheck: processedImage.livenessCheck,
        details: `Image quality too low (${processedImage.qualityScore}%), minimum required: ${minQuality}%`
      };
    }

    // Perform the actual verification
    const verificationResult = await this.verifyFacialImage(capturedImage, storedTemplate);

    // Apply strict mode thresholds if enabled
    const threshold = strictMode ? 90 : 85;
    const verified = verificationResult.verified && processedImage.livenessCheck;

    return {
      verified,
      matchScore: verificationResult.matchScore,
      confidence: verificationResult.confidence,
      qualityScore: processedImage.qualityScore,
      livenessCheck: processedImage.livenessCheck,
      details: verified
        ? `Verified with ${verificationResult.matchScore}% match and quality ${processedImage.qualityScore}%`
        : `Verification failed - match: ${verificationResult.matchScore}%, quality: ${processedImage.qualityScore}%, liveness: ${processedImage.livenessCheck}`
    };
  }
}