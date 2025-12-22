// lib/encryption.ts
import { AES, enc } from 'crypto-js';

/**
 * Encrypt biometric template data
 * @param data - Data to encrypt
 * @param key - Encryption key
 * @returns Encrypted string
 */
export function encryptData(data: string, key: string): string {
  try {
    return AES.encrypt(data, key).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt biometric template data
 * @param encryptedData - Encrypted string to decrypt
 * @param key - Encryption key
 * @returns Decrypted string
 */
export function decryptData(encryptedData: string, key: string): string {
  try {
    const decrypted = AES.decrypt(encryptedData, key);
    return decrypted.toString(enc.Utf8);
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
  const encryptionKey = process.env.BIOMETRIC_ENCRYPTION_KEY || 'default-key-change-in-production';
  return encryptData(templateString, encryptionKey);
}

/**
 * Decrypt biometric template with environment key
 * @param encryptedTemplate - Encrypted template from database
 * @returns Decrypted template as JSON string
 */
export function decryptBiometricTemplate(encryptedTemplate: string): string {
  const encryptionKey = process.env.BIOMETRIC_ENCRYPTION_KEY || 'default-key-change-in-production';
  return decryptData(encryptedTemplate, encryptionKey);
}