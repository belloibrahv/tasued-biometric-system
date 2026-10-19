// Validation utilities for biometric data

// Regular expressions for validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BIOMETRIC_DATA_REGEX = /^[a-fA-F0-9]+$/; // Assuming hex-encoded biometric templates

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate user registration data
 */
export function validateUserRegistration(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): ValidationResult {
  const errors: string[] = [];

  // Validate email
  if (!data.email) {
    errors.push('Email is required');
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.push('Email format is invalid');
  }

  // Validate password
  if (!data.password) {
    errors.push('Password is required');
  } else if (data.password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Validate names
  if (!data.firstName) {
    errors.push('First name is required');
  } else if (data.firstName.length > 50) {
    errors.push('First name must be less than 50 characters');
  }

  if (!data.lastName) {
    errors.push('Last name is required');
  } else if (data.lastName.length > 50) {
    errors.push('Last name must be less than 50 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate biometric record creation data
 */
export function validateBiometricRecord(data: {
  userId: string;
  biometricType: string;
  biometricData: string;
  confidenceScore?: number;
}): ValidationResult {
  const errors: string[] = [];

  // Validate userId
  if (!data.userId) {
    errors.push('User ID is required');
  } else if (data.userId.length < 5) {
    errors.push('User ID is invalid');
  }

  // Validate biometric type
  if (!data.biometricType) {
    errors.push('Biometric type is required');
  } else {
    const validTypes = [
      'FINGERPRINT',
      'FACE_RECOGNITION',
      'IRIS_SCAN',
      'RETINA_SCAN',
      'VOICE_RECOGNITION',
      'HAND_GEOMETRY',
      'SIGNATURE'
    ];

    if (!validTypes.includes(data.biometricType)) {
      errors.push(`Invalid biometric type. Must be one of: ${validTypes.join(', ')}`);
    }
  }

  // Validate biometric data
  if (!data.biometricData) {
    errors.push('Biometric data is required');
  } else if (!BIOMETRIC_DATA_REGEX.test(data.biometricData)) {
    // In a real implementation, you might have different validation based on the biometric type
    // For now, we'll check if it's hex encoded
    errors.push('Biometric data format is invalid');
  }

  // Validate confidence score if provided
  if (data.confidenceScore !== undefined) {
    if (typeof data.confidenceScore !== 'number' ||
        data.confidenceScore < 0 ||
        data.confidenceScore > 100) {
      errors.push('Confidence score must be a number between 0 and 100');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate export request parameters
 */
export function validateExportRequest(data: {
  userId: string;
  recordIds: string[];
  format: string;
}): ValidationResult {
  const errors: string[] = [];

  // Validate user ID
  if (!data.userId) {
    errors.push('User ID is required');
  }

  // Validate record IDs
  if (!data.recordIds || !Array.isArray(data.recordIds) || data.recordIds.length === 0) {
    errors.push('At least one record ID must be specified');
  } else {
    for (const id of data.recordIds) {
      if (typeof id !== 'string' || id.length < 5) {
        errors.push(`Invalid record ID: ${id}`);
      }
    }
  }

  // Validate format
  if (!data.format) {
    errors.push('Export format is required');
  } else {
    const validFormats = ['JSON', 'XML', 'ISO_19794', 'CSV', 'CUSTOM'];
    if (!validFormats.includes(data.format)) {
      errors.push(`Invalid export format. Must be one of: ${validFormats.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate import request parameters
 */
export function validateImportRequest(data: {
  userId: string;
  sourceSystem?: string;
}): ValidationResult {
  const errors: string[] = [];

  // Validate user ID
  if (!data.userId) {
    errors.push('User ID is required');
  } else if (data.userId.length < 5) {
    errors.push('User ID is invalid');
  }

  // Validate source system if provided
  if (data.sourceSystem && data.sourceSystem.length > 100) {
    errors.push('Source system name is too long (max 100 characters)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate verification request parameters
 */
export function validateVerificationRequest(data: {
  userId: string;
  biometricType: string;
  biometricData: string;
  threshold?: number;
}): ValidationResult {
  const errors: string[] = [];

  // Validate user ID
  if (!data.userId) {
    errors.push('User ID is required');
  } else if (data.userId.length < 5) {
    errors.push('User ID is invalid');
  }

  // Validate biometric type
  if (!data.biometricType) {
    errors.push('Biometric type is required');
  } else {
    const validTypes = [
      'FINGERPRINT',
      'FACE_RECOGNITION',
      'IRIS_SCAN',
      'RETINA_SCAN',
      'VOICE_RECOGNITION',
      'HAND_GEOMETRY',
      'SIGNATURE'
    ];

    if (!validTypes.includes(data.biometricType)) {
      errors.push(`Invalid biometric type. Must be one of: ${validTypes.join(', ')}`);
    }
  }

  // Validate biometric data
  if (!data.biometricData) {
    errors.push('Biometric data is required');
  }

  // Validate threshold if provided
  if (data.threshold !== undefined) {
    if (typeof data.threshold !== 'number' ||
        data.threshold < 0 ||
        data.threshold > 1) {
      errors.push('Threshold must be a number between 0 and 1');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
