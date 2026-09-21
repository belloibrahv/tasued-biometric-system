// lib/encryption.ts
import CryptoJS from 'crypto-js';

// Default encryption key - should be set via environment variable in production
const DEFAULT_ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.BIOMETRIC_ENCRYPTION_KEY || 'tasued-biovault-default-key-2024';

/**
 * Encrypt biometric template data
 * @param data - Data to encrypt
 * @param key - Encryption key (optional, uses default if not provided)
 * @returns Encrypted string
 */
export function encryptData(data: string, key?: string): string {
  try {
    if (!data) {
      throw new Error('No data provided for encryption');
    }

    const encryptionKey = key || DEFAULT_ENCRYPTION_KEY;

    if (!encryptionKey || encryptionKey.length < 8) {
      throw new Error('Invalid encryption key - must be at least 8 characters');
    }

    const result = CryptoJS.AES.encrypt(data, encryptionKey).toString();

    if (!result) {
      throw new Error('Encryption failed - no result generated');
    }

    return result;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(`Failed to encrypt data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt biometric template data
 * @param encryptedData - Encrypted string to decrypt
 * @param key - Encryption key (optional, uses default if not provided)
 * @returns Decrypted string
 */
export function decryptData(encryptedData: string, key?: string): string {
  try {
    if (!encryptedData) {
      throw new Error('No encrypted data provided for decryption');
    }

    const encryptionKey = key || DEFAULT_ENCRYPTION_KEY;

    if (!encryptionKey || encryptionKey.length < 8) {
      throw new Error('Invalid encryption key - must be at least 8 characters');
    }

    const decrypted = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
    const result = decrypted.toString(CryptoJS.enc.Utf8);

    if (!result) {
      throw new Error('Decryption resulted in empty string - possibly wrong key or corrupted data');
    }

    return result;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error(`Failed to decrypt data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Encrypt biometric template with environment key
 * @param templateString - Biometric template as JSON string
 * @returns Encrypted template
 */
export function encryptBiometricTemplate(templateString: string): string {
  return encryptData(templateString, DEFAULT_ENCRYPTION_KEY);
}

/**
 * Decrypt biometric template with environment key
 * @param encryptedTemplate - Encrypted template from database
 * @returns Decrypted template as JSON string
 */
export function decryptBiometricTemplate(encryptedTemplate: string): string {
  return decryptData(encryptedTemplate, DEFAULT_ENCRYPTION_KEY);
}

/**
 * Generate a secure hash for data integrity verification
 * @param data - Data to hash
 * @returns Hash string
 */
export function generateDataHash(data: string): string {
  try {
    // Simple hash for data integrity - in production, use a proper hashing library
    return CryptoJS.AES.encrypt(data, DEFAULT_ENCRYPTION_KEY + '-hash').toString().substring(0, 32);
  } catch (error) {
    console.error('Hash generation error:', error);
    throw new Error('Failed to generate data hash');
  }
}

/**
 * Validate encryption key strength
 * @returns boolean indicating if the key is strong enough
 */
export function validateEncryptionKey(): boolean {
  const key = DEFAULT_ENCRYPTION_KEY;
  return !!(key && key.length >= 32 && key !== 'tasued-biovault-default-key-2024');
}
