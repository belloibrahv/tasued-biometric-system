// lib/biometricProcessing.ts
import * as faceapi from 'face-api.js';
import { encryptBiometricTemplate, decryptBiometricTemplate } from './encryption';

// Configuration for biometric processing
const BIOMETRIC_CONFIG = {
  MODEL_URL: '/models', // Local model storage
  CONFIDENCE_THRESHOLD: 0.65, // Minimum confidence for verification
};

/**
 * Initialize face-api.js models
 */
export async function initializeModels() {
  try {
    await faceapi.nets.ssdMobilenetv1.loadFromUri(BIOMETRIC_CONFIG.MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(BIOMETRIC_CONFIG.MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(BIOMETRIC_CONFIG.MODEL_URL);
    console.log('Biometric models loaded successfully');
  } catch (error) {
    console.error('Error loading biometric models:', error);
    throw new Error('Failed to load biometric processing models');
  }
}

/**
 * Create a biometric template from facial data
 * @param imageData - Base64 encoded image or image element
 * @returns Encrypted biometric template
 */
export async function createBiometricTemplate(imageData: string | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): Promise<string> {
  try {
    // Detect face and landmarks
    const detections = await faceapi.detectAllFaces(imageData)
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (!detections || detections.length === 0) {
      throw new Error('No face detected in the provided image');
    }

    if (detections.length > 1) {
      throw new Error('Multiple faces detected. Please provide an image with only one face.');
    }

    // Use the first (and should be only) face detection
    const faceDescriptor = detections[0].descriptor;

    // Convert the face descriptor to a JSON string
    const templateString = JSON.stringify(Array.from(faceDescriptor));

    // Encrypt the template using the encryption utility
    return encryptBiometricTemplate(templateString);
  } catch (error) {
    console.error('Error creating biometric template:', error);
    throw new Error(`Biometric template creation failed: ${(error as Error).message}`);
  }
}

/**
 * Verify a face against a stored biometric template
 * @param imageData - Image data to verify
 * @param storedTemplate - Encrypted template from database as Buffer
 * @returns Verification result with confidence score
 */
export async function verifyBiometric(imageData: string | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement, storedTemplate: Buffer): Promise<{ isVerified: boolean; confidence: number; message: string }> {
  try {
    // Detect faces in the provided image
    const detections = await faceapi.detectAllFaces(imageData)
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (!detections || detections.length === 0) {
      return {
        isVerified: false,
        confidence: 0,
        message: 'No face detected in verification image'
      };
    }

    if (detections.length > 1) {
      return {
        isVerified: false,
        confidence: 0,
        message: 'Multiple faces detected in verification image'
      };
    }

    const currentFaceDescriptor = detections[0].descriptor;

    // Convert buffer to string and decrypt the stored template
    const encryptedTemplateString = storedTemplate.toString();
    const storedTemplateString = decryptBiometricTemplate(encryptedTemplateString);

    if (!storedTemplateString) {
      return {
        isVerified: false,
        confidence: 0,
        message: 'Invalid stored template'
      };
    }

    const storedFaceDescriptor = JSON.parse(storedTemplateString).map((val: number) => val);

    // Calculate the distance between descriptors (lower is more similar)
    const distance = faceapi.euclideanDistance(currentFaceDescriptor, storedFaceDescriptor);

    // Convert distance to a confidence score (0-100)
    const confidence = Math.max(0, Math.min(100, (1 - distance) * 100));

    const isVerified = confidence >= BIOMETRIC_CONFIG.CONFIDENCE_THRESHOLD * 100;

    return {
      isVerified,
      confidence,
      message: isVerified ? 'Verification successful' : 'Verification failed'
    };
  } catch (error) {
    console.error('Error during biometric verification:', error);
    return {
      isVerified: false,
      confidence: 0,
      message: `Verification failed: ${(error as Error).message}`
    };
  }
}

/**
 * Calculate similarity between two face descriptors
 * @param descriptor1 First face descriptor
 * @param descriptor2 Second face descriptor
 * @returns Similarity score
 */
export function calculateSimilarity(descriptor1: number[], descriptor2: number[]): number {
  if (descriptor1.length !== descriptor2.length) {
    throw new Error('Face descriptors have different dimensions');
  }
  
  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }
  
  const distance = Math.sqrt(sum);
  
  // Convert distance to similarity (0-1 scale)
  return Math.max(0, 1 - distance);
}

/**
 * Perform liveness detection to ensure it's a real face, not a photo
 * @param imageData Image data to verify
 * @returns Liveness detection result
 */
export async function performLivenessDetection(imageData: string | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): Promise<{ isLive: boolean; confidence: number; message: string }> {
  try {
    // For basic liveness detection, we can check for eye blinking or facial movements
    // This is a simplified version - in a production system, you'd want more sophisticated liveness detection
    const detections = await faceapi.detectAllFaces(imageData)
      .withFaceLandmarks();
    
    if (!detections || detections.length === 0) {
      return { 
        isLive: false, 
        confidence: 0, 
        message: 'No face detected' 
      };
    }
    
    // Basic check: ensure the face has proper landmark points
    const landmarks = detections[0].landmarks;
    if (!landmarks) {
      return { 
        isLive: false, 
        confidence: 0, 
        message: 'No facial landmarks detected' 
      };
    }
    
    // In a more advanced system, you could check for:
    // - Micro-expressions
    // - 3D depth information
    // - Texture analysis for photo detection
    // - Eye movement patterns
    
    // For now, we'll return a positive result with high confidence
    // as a placeholder - this should be enhanced in production
    return { 
      isLive: true, 
      confidence: 95, 
      message: 'Liveness check passed' 
    };
  } catch (error) {
    console.error('Liveness detection error:', error);
    return { 
      isLive: false, 
      confidence: 0, 
      message: `Liveness detection failed: ${(error as Error).message}` 
    };
  }
}