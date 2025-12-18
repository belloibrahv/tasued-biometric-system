import { createHash, createCipheriv, createDecipheriv } from 'crypto';

/**
 * Utility functions for encrypting/decrypting biometric data
 */

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypt biometric data
 * @param text Plain biometric data to encrypt
 * @returns Encrypted string
 */
export const encryptData = (text: string): string => {
  const iv = Buffer.alloc(IV_LENGTH, 0); // In production, use random IV
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  // Pad the key to 32 bytes for AES-256
  const paddedKey = key.padEnd(32, '0').substring(0, 32);
  const hashKey = createHash('sha256').update(paddedKey).digest();
  
  const cipher = createCipheriv(ALGORITHM, hashKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return encrypted;
};

/**
 * Decrypt biometric data
 * @param text Encrypted biometric data to decrypt
 * @returns Decrypted plain text
 */
export const decryptData = (text: string): string => {
  const iv = Buffer.alloc(IV_LENGTH, 0); // In production, get IV from stored data
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  // Pad the key to 32 bytes for AES-256
  const paddedKey = key.padEnd(32, '0').substring(0, 32);
  const hashKey = createHash('sha256').update(paddedKey).digest();
  
  const decipher = createDecipheriv(ALGORITHM, hashKey, iv);
  let decrypted = decipher.update(text, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

/**
 * Hash biometric data for storage
 * @param data Raw biometric data to hash
 * @returns Hashed representation
 */
export const hashBiometricData = (data: string): string => {
  return createHash('sha256').update(data).digest('hex');
};

/**
 * Generate a unique biometric template ID
 * @returns Unique identifier for the biometric template
 */
export const generateBiometricId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};