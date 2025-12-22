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
    console.log('Encryption: Starting encryption process');
    console.log('Encryption: Data type:', typeof data);
    console.log('Encryption: Data length:', data?.length || 0);
    
    if (!data) {
      throw new Error('No data provided for encryption');
    }
    
    const encryptionKey = key || DEFAULT_ENCRYPTION_KEY;
    console.log('Encryption: Using key length:', encryptionKey.length);
    
    const result = CryptoJS.AES.encrypt(data, encryptionKey).toString();
    console.log('Encryption: Success, result length:', result.length);
    
    return result;
  } catch (error) {
    console.error('Encryption error:', error);
    console.error('Encryption error stack:', error instanceof Error ? error.stack : 'No stack trace');
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
    const encryptionKey = key || DEFAULT_ENCRYPTION_KEY;
    const decrypted = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
    const result = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!result) {
      throw new Error('Decryption resulted in empty string - possibly wrong key');
    }
    
    return result;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
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