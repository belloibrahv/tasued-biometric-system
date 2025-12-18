# TASUED Biometric System - API Documentation

## Overview

The TASUED Biometric System API provides secure endpoints for collecting, storing, managing, and transferring biometric data. All endpoints require authentication via JWT token in the Authorization header, except for the login endpoint.

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Rate Limiting

All API endpoints are protected by rate limiting:
- Biometric endpoints: 100 requests per 15 minutes per IP
- Authentication endpoints: 5 requests per 15 minutes per IP

Response with `429 Too Many Requests` will be returned when rate limit is exceeded.

## Endpoints

### Authentication

#### POST /api/auth/login
Authenticate a user and get a JWT token

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "Authentication successful",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER"
  }
}
```

### Users

#### GET /api/users
Get users (with query params)

**Query Parameters:**
- `email` (optional): Search for user by email

**Response:**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER",
  "isActive": true,
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-01T00:00:00Z"
}
```

#### POST /api/users
Create a new user

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "USER"
}
```

**Response:**
```json
{
  "id": "new-user-id",
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "USER",
  "isActive": true,
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-01T00:00:00Z"
}
```

### Biometric Records

#### GET /api/biometric/records
Get biometric records

**Query Parameters:**
- `userId` (optional): Filter by user ID
- `type` (optional): Filter by biometric type
- `limit` (optional): Number of records to return (default: 10)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**
```json
{
  "records": [
    {
      "id": "record-id",
      "userId": "user-id",
      "biometricType": "FINGERPRINT",
      "biometricData": "[ENCRYPTED]",
      "templateFormat": "ISO_19794",
      "confidenceScore": 92.5,
      "metadata": {},
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

#### POST /api/biometric/records
Create a new biometric record

**Request Body:**
```json
{
  "userId": "user-id",
  "biometricType": "FINGERPRINT",
  "biometricData": "hex-encoded-biometric-data",
  "templateFormat": "ISO_19794",
  "confidenceScore": 92.5,
  "metadata": {
    "device": "fingerprint-scanner-model",
    "location": "admin-building"
  }
}
```

**Response:**
```json
{
  "id": "new-record-id",
  "userId": "user-id",
  "biometricType": "FINGERPRINT",
  "biometricData": "[ENCRYPTED]",
  "templateFormat": "ISO_19794",
  "confidenceScore": 92.5,
  "metadata": {
    "device": "fingerprint-scanner-model",
    "location": "admin-building"
  },
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-01T00:00:00Z"
}
```

#### GET /api/biometric/records/[id]
Get a specific biometric record

**Response:**
```json
{
  "id": "record-id",
  "userId": "user-id",
  "biometricType": "FINGERPRINT",
  "biometricData": "[ENCRYPTED]",
  "templateFormat": "ISO_19794",
  "confidenceScore": 92.5,
  "metadata": {},
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-01T00:00:00Z"
}
```

#### PUT /api/biometric/records/[id]
Update a specific biometric record

**Request Body:**
```json
{
  "biometricData": "new-hex-encoded-biometric-data",
  "confidenceScore": 85.0,
  "metadata": {
    "updatedReason": "quality-improvement"
  }
}
```

**Response:**
```json
{
  "id": "record-id",
  "userId": "user-id",
  "biometricType": "FINGERPRINT",
  "biometricData": "[ENCRYPTED]",
  "templateFormat": "ISO_19794",
  "confidenceScore": 85.0,
  "metadata": {
    "updatedReason": "quality-improvement"
  },
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-02T00:00:00Z"
}
```

#### DELETE /api/biometric/records/[id]
Delete a specific biometric record

**Response:**
```json
{
  "message": "Biometric record deleted successfully"
}
```

### Biometric Verification

#### POST /api/biometric/verify
Verify biometric data against stored templates

**Request Body:**
```json
{
  "userId": "user-id",
  "biometricType": "FINGERPRINT",
  "biometricData": "verification-hex-data",
  "threshold": 0.8
}
```

**Response:**
```json
{
  "verified": true,
  "confidence": 0.92,
  "recordId": "matching-record-id"
}
```

### Data Export

#### GET /api/export
Get available exports for a user

**Query Parameters:**
- `userId`: User ID to get exports for

**Response:**
```json
[
  {
    "id": "export-id",
    "createdAt": "2023-01-01T00:00:00Z",
    "exportedById": "user-id",
    "exportFormat": "JSON",
    "fileName": "biometric_export_user_123_123456789.json",
    "fileSize": 10240,
    "isDownloaded": false,
    "downloadCount": 0
  }
]
```

#### POST /api/export
Create a new biometric data export

**Request Body:**
```json
{
  "userId": "user-id",
  "recordIds": ["record1", "record2"],
  "format": "JSON",
  "includeEncryptedData": false,
  "includeMetadata": true,
  "includeUserInfo": false
}
```

**Response:**
```json
{
  "id": "new-export-id",
  "createdAt": "2023-01-01T00:00:00Z",
  "exportedById": "user-id",
  "exportFormat": "JSON",
  "fileName": "biometric_export_user_123_123456789.json",
  "fileSize": 10240,
  "isDownloaded": false,
  "downloadCount": 0,
  "downloadUrl": "/api/export/new-export-id/download"
}
```

#### GET /api/export/[id]/download
Download a specific export file

This endpoint returns the exported file directly with appropriate headers for download.

### Data Import

#### POST /api/import
Import biometric data from external sources

**Form Data:**
- `file`: The file to import (JSON, XML, or CSV)
- `userId`: User ID to associate imported data with
- `sourceSystem`: Name of the source system (optional)

**Response:**
```json
{
  "success": true,
  "importedCount": 5,
  "errorCount": 0,
  "errors": [],
  "importedRecords": [
    {
      "id": "new-record-id",
      "userId": "user-id",
      "biometricType": "FINGERPRINT",
      // ... other record fields
    }
  ]
}
```

### Health Check

#### GET /api/health
Check the health status of the application

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2023-01-01T00:00:00Z",
  "database": "connected",
  "uptime": 3600.5
}
```

## Error Responses

All error responses follow this format:
```json
{
  "error": "Error message description",
  "details": "Additional error details (optional)"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized
- `404`: Not Found
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

## Security Considerations

1. All biometric data is encrypted before storage using AES-256
2. JWT tokens have configurable expiration times
3. Rate limiting is enforced on all endpoints
4. Input validation is performed on all requests
5. Only authorized users can access their own biometric records
6. Export functionality includes options to exclude sensitive encrypted data