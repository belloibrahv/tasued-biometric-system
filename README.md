# BioVault - Biometric Identity Management System

## Overview

BioVault is a biometric-based identity management system for educational institutions, specifically designed for Tai Solarin University of Education (TASUED). The system integrates QR codes, facial recognition, and biometric verification to provide a secure, scalable, and user-friendly solution for student identity management.

## Project Structure

```
tasued-biometric-system/
├── pages/
│   └── api/
│       ├── users/
│       │   ├── enroll.ts
│       │   └── profile.ts
│       ├── qr/
│       │   ├── generate.ts
│       │   └── verify.ts
│       ├── verification/
│       │   └── biometric.ts
│       ├── admin/
│       │   └── dashboard.ts
│       ├── services/
│       │   └── verify-access.ts
│       └── config/
│           └── index.ts
├── lib/
│   ├── biometricProcessing.ts
│   └── encryption.ts
├── middleware/
│   └── auth.ts
├── prisma/
│   └── schema.prisma
├── package.json
├── tsconfig.json
└── README.md
```

## Features

### Core Features
1. **User Enrollment**: Secure biometric enrollment with facial recognition
2. **Dynamic QR Codes**: Automatically refreshing QR codes with expiration
3. **Biometric Verification**: Real-time facial recognition verification
4. **Service Access Control**: Verification for different campus services (library, exams, hostels, etc.)
5. **Admin Dashboard**: Comprehensive system monitoring and management
6. **Audit Logging**: Complete tracking of all system activities
7. **Privacy Protection**: Encrypted biometric templates with no raw images stored

### Technical Features
- Next.js 14 with App Router
- PostgreSQL database with Prisma ORM
- Facial recognition using face-api.js and TensorFlow.js
- AES-256 encryption for biometric data
- Role-based access control
- Comprehensive audit trails
- GDPR/NDPR compliant data handling

## Database Schema

The system uses a PostgreSQL database with the following main tables:

- **User**: Stores student information and encrypted biometric templates
- **VerificationLog**: Tracks all verification attempts
- **QRCode**: Manages dynamic QR code generation and validation
- **Session**: Tracks active user sessions for different services
- **CampusService**: Defines different campus services
- **SystemConfig**: Stores system configuration values
- **AuditLog**: Comprehensive audit trail

## API Endpoints

### User Management
- `POST /api/users/enroll` - Enroll new user with biometric data
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Biometric Verification
- `POST /api/verification/biometric` - Perform biometric verification

### QR Code Management
- `GET /api/qr/generate` - Generate new QR code for user
- `POST/GET /api/qr/verify` - Verify QR code

### Service Access
- `POST /api/services/verify-access` - Verify access to campus services

### Admin Functions
- `GET /api/admin/dashboard` - Get system statistics
- `GET/PUT /api/config` - System configuration management

## Security Implementation

### Data Protection
- Biometric templates encrypted using AES-256
- No raw facial images stored in the database
- Encrypted QR codes with expiration
- Secure API communication with authentication

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Session management
- Rate limiting

### Privacy Compliance
- GDPR/NDPR compliant data handling
- Minimal data collection
- User consent for biometric enrollment
- Right to deletion of personal data

## Implementation Plan

### Phase 1: Database and Backend Foundation
- Set up PostgreSQL database
- Configure Prisma ORM
- Implement database schema
- Create basic API route structure
- Implement authentication

### Phase 2: Core Biometric Functionality
- Integrate face-api.js and TensorFlow.js
- Implement biometric enrollment
- Create biometric verification algorithm
- Add template encryption/decryption
- Implement liveness detection

### Phase 3: QR Code System
- Implement QR code generation
- Create expiration mechanisms
- Build secure verification endpoints
- Add session management
- Implement audit trails

### Phase 4: Frontend Development
- Create user dashboard
- Implement operator interface
- Build administrative dashboard
- Design mobile-responsive UI
- Integrate with backend APIs

### Phase 5: Integration and Testing
- Integrate all components
- Performance testing
- Security testing
- User acceptance testing
- Bug fixing and optimization

## Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```env
DATABASE_URL="your-postgres-connection-string"
BIOMETRIC_ENCRYPTION_KEY="your-secure-encryption-key-for-biometric-data"
QR_ENCRYPTION_KEY="your-secure-encryption-key-for-QR-codes"
ADMIN_USER_IDS="comma-separated-list-of-admin-user-ids"
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npx prisma db push
```

3. Generate Prisma client:
```bash
npx prisma generate
```

4. Run the development server:
```bash
npm run dev
```

## Frontend Integration

This backend is designed to work with a Next.js frontend that includes:

- User dashboard with QR code display
- Operator verification interface
- Administrative dashboard
- Biometric capture components
- Service access interfaces

## Testing

Unit tests and integration tests should be implemented for:
- Biometric processing functions
- API route handlers
- Database operations
- Encryption/decryption utilities
- Authentication middleware

## Deployment

The system is designed for deployment on platforms that support Next.js, such as Vercel, with a PostgreSQL database (such as Supabase or other managed PostgreSQL services).

## Compliance and Standards

- Nigerian Data Protection Regulation (NDPR) compliant
- Academic integrity preservation
- University security standards
- Privacy by design principles

## Future Enhancements

- Mobile application development
- Additional biometric modalities (fingerprint, iris)
- Advanced liveness detection
- Integration with existing institutional systems
- Machine learning model improvements
- Multi-modal authentication options
