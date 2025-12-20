// Security configuration for TASUED Biometric System

export const securityConfig = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_for_dev',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Encryption Configuration
  encryption: {
    algorithm: 'aes-256-cbc',
    key: process.env.ENCRYPTION_KEY || 'fallback_encryption_key_for_dev',
    ivLength: 16,
  },

  // Rate Limiting Configuration
  rateLimit: {
    biometric: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_BIOMETRIC || '100'),
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_AUTH || '5'),
    },
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_API || '1000'),
    },
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000']),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },

  // Content Security Policy
  csp: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://*.supabase.co', 'https://*.vercel.app'],
      frameAncestors: ["'none'"], // Prevent clickjacking
    },
  },

  // Input Validation Rules
  inputValidation: {
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: false,
    },
    biometricData: {
      maxFileSize: parseInt(process.env.MAX_BIOMETRIC_FILE_SIZE || '5000000'), // 5MB
      allowedTypes: ['application/octet-stream', 'text/plain'], // For encrypted templates
    },
    email: {
      maxLength: 254,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  },

  // Session Configuration
  session: {
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict' as const,
    },
    maxAge: 24 * 60 * 60, // 24 hours in seconds
  },

  // Security Headers
  securityHeaders: {
    strictTransportSecurity: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    xContentTypeOptions: 'nosniff',
    xFrameOptions: 'DENY', // Prevent clickjacking
    xXssProtection: '1; mode=block',
  },

  // Audit Logging Configuration
  audit: {
    enabled: process.env.AUDIT_LOGGING === 'true' || false,
    logSensitiveOperations: true, // Log biometric access/changes
    retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '90'),
  },
};

// Validate that required environment variables are set
export function validateSecurityConfig() {
  const requiredEnvVars = [
    'JWT_SECRET',
    'ENCRYPTION_KEY',
  ];

  const missingVars = requiredEnvVars.filter(
    envVar => !process.env[envVar]
  );

  if (missingVars.length > 0) {
    console.warn(
      `Warning: Missing security environment variables: ${missingVars.join(', ')}. ` +
      'Defaulting to fallback values. Do not use fallbacks in production.'
    );
  }
}

// Initialize security config validation
validateSecurityConfig();