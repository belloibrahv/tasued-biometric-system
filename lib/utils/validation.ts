/**
 * Enterprise-grade Validation Utilities for TASUED BioVault
 * Provides comprehensive validation functions with detailed error messages
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email || !email.trim()) {
    errors.push('Email is required');
    return { valid: false, errors };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }

  // Check for common typos
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'tasued.edu.ng'];
  const domain = email.split('@')[1]?.toLowerCase();

  if (domain && !commonDomains.includes(domain)) {
    const suggestions = commonDomains.filter(d => {
      const similarity = calculateStringSimilarity(domain, d);
      return similarity > 0.7;
    });

    if (suggestions.length > 0) {
      errors.push(`Did you mean @${suggestions[0]}?`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate TASUED matric number format
 */
export function validateMatricNumber(matricNumber: string): ValidationResult {
  const errors: string[] = [];

  if (!matricNumber || !matricNumber.trim()) {
    errors.push('Matric number is required');
    return { valid: false, errors };
  }

  // Format: DEP/YEAR/NUMBER (e.g., CSC/2020/001, CSC/2020/0001)
  const matricRegex = /^[A-Z]{2,4}\/\d{4}\/\d{3,4}$/i;

  if (!matricRegex.test(matricNumber)) {
    errors.push('Invalid matric number format. Use: DEP/YEAR/NUMBER (e.g., CSC/2020/001)');
  } else {
    // Validate year is reasonable
    const year = parseInt(matricNumber.split('/')[1]);
    const currentYear = new Date().getFullYear();

    if (year < 1980 || year > currentYear + 1) {
      errors.push(`Invalid year in matric number. Must be between 1980 and ${currentYear + 1}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult & { strength: 'weak' | 'medium' | 'strong' } {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  if (!password) {
    errors.push('Password is required');
    return { valid: false, errors, strength };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  let strengthScore = 0;
  if (password.length >= 8) strengthScore++;
  if (password.length >= 12) strengthScore++;
  if (hasUpperCase && hasLowerCase) strengthScore++;
  if (hasNumbers) strengthScore++;
  if (hasSpecialChar) strengthScore++;

  if (strengthScore >= 4) {
    strength = 'strong';
  } else if (strengthScore >= 2) {
    strength = 'medium';
  }

  if (strength === 'weak') {
    errors.push('Password is too weak. Include uppercase, lowercase, numbers, and special characters');
  }

  // Check for common passwords
  const commonPasswords = ['password', '12345678', 'qwerty', 'password123', 'admin123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a stronger password');
  }

  return { valid: errors.length === 0, errors, strength };
}

/**
 * Validate phone number (Nigerian format)
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  const errors: string[] = [];

  if (!phone || !phone.trim()) {
    errors.push('Phone number is required');
    return { valid: false, errors };
  }

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Nigerian phone numbers: 11 digits starting with 0, or 13 digits starting with 234
  if (digits.length === 11 && digits.startsWith('0')) {
    // Valid: 080XXXXXXXX, 070XXXXXXXX, etc.
    const validPrefixes = ['0701', '0702', '0703', '0704', '0705', '0706', '0707', '0708', '0709',
                           '0802', '0803', '0804', '0805', '0806', '0807', '0808', '0809',
                           '0810', '0811', '0812', '0813', '0814', '0815', '0816', '0817', '0818',
                           '0901', '0902', '0903', '0904', '0905', '0906', '0907', '0908', '0909'];

    const prefix = digits.substring(0, 4);
    if (!validPrefixes.some(p => prefix.startsWith(p.substring(0, 3)))) {
      errors.push('Invalid Nigerian phone number prefix');
    }
  } else if (digits.length === 13 && digits.startsWith('234')) {
    // Valid international format
  } else {
    errors.push('Invalid phone number format. Use: 080XXXXXXXX or +234XXXXXXXXXX');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate date of birth (must be reasonable for university student)
 */
export function validateDateOfBirth(dob: string): ValidationResult {
  const errors: string[] = [];

  if (!dob) {
    errors.push('Date of birth is required');
    return { valid: false, errors };
  }

  const date = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - date.getFullYear();

  if (isNaN(date.getTime())) {
    errors.push('Invalid date format');
  } else if (age < 15) {
    errors.push('You must be at least 15 years old to register');
  } else if (age > 100) {
    errors.push('Invalid date of birth');
  } else if (date > today) {
    errors.push('Date of birth cannot be in the future');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  } = {}
): ValidationResult {
  const errors: string[] = [];
  const { maxSize = 5000000, allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'] } = options;

  if (!file) {
    errors.push('No file selected');
    return { valid: false, errors };
  }

  if (file.size > maxSize) {
    errors.push(`File size must not exceed ${Math.round(maxSize / 1000000)}MB`);
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Calculate string similarity (Levenshtein distance)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Validate all registration form data
 */
export function validateRegistrationForm(data: {
  firstName: string;
  lastName: string;
  matricNumber: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  department: string;
  level: string;
  password: string;
  confirmPassword: string;
}): ValidationResult & { fieldErrors: Record<string, string[]> } {
  const fieldErrors: Record<string, string[]> = {};
  const allErrors: string[] = [];

  // Validate each field
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    fieldErrors.email = emailValidation.errors;
    allErrors.push(...emailValidation.errors);
  }

  const matricValidation = validateMatricNumber(data.matricNumber);
  if (!matricValidation.valid) {
    fieldErrors.matricNumber = matricValidation.errors;
    allErrors.push(...matricValidation.errors);
  }

  const phoneValidation = validatePhoneNumber(data.phoneNumber);
  if (!phoneValidation.valid) {
    fieldErrors.phoneNumber = phoneValidation.errors;
    allErrors.push(...phoneValidation.errors);
  }

  const dobValidation = validateDateOfBirth(data.dateOfBirth);
  if (!dobValidation.valid) {
    fieldErrors.dateOfBirth = dobValidation.errors;
    allErrors.push(...dobValidation.errors);
  }

  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.valid) {
    fieldErrors.password = passwordValidation.errors;
    allErrors.push(...passwordValidation.errors);
  }

  if (data.password !== data.confirmPassword) {
    fieldErrors.confirmPassword = ['Passwords do not match'];
    allErrors.push('Passwords do not match');
  }

  // Required fields
  if (!data.firstName?.trim()) {
    fieldErrors.firstName = ['First name is required'];
    allErrors.push('First name is required');
  }

  if (!data.lastName?.trim()) {
    fieldErrors.lastName = ['Last name is required'];
    allErrors.push('Last name is required');
  }

  if (!data.department) {
    fieldErrors.department = ['Department is required'];
    allErrors.push('Department is required');
  }

  if (!data.level) {
    fieldErrors.level = ['Level is required'];
    allErrors.push('Level is required');
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    fieldErrors,
  };
}
