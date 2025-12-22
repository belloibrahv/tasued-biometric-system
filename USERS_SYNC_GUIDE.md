# User Data Sync Guide

## Overview
This guide explains how user data flows from Supabase Auth to the PostgreSQL database and how to troubleshoot sync issues.

## Data Flow

### Registration Process
1. **User Registration** → User fills form with personal data (firstName, lastName, matricNumber, etc.)
2. **Supabase Auth Sign Up** → User credentials stored in Supabase Auth with metadata
3. **Metadata Storage** → All user fields stored in `user_metadata` in Supabase Auth
4. **Database Sync** → `UserService.syncUserFromAuth()` creates/updates user in PostgreSQL
5. **Biometric Enrollment** → Facial data stored in BiometricData table

### Data Consistency
- **Source of Truth**: Supabase Auth (user_metadata)
- **Replica**: PostgreSQL User table
- **Sync Method**: `UserService.syncUserFromAuth()` function

## Troubleshooting

### Issue: "Unknown User" displayed in Admin Users page

#### Root Causes
1. **Database is empty** - Users registered but not synced to database
2. **Sync failed** - User metadata missing or incomplete
3. **Connection issue** - Database connection failed during sync

#### Solution Steps

**Step 1: Check Database Connection**
```bash
# Verify DATABASE_URL and DIRECT_URL are set correctly
echo $DATABASE_URL
echo $DIRECT_URL
```

**Step 2: Manual Sync Users**
```bash
# Call the sync endpoint to sync all users from Supabase Auth to database
curl -X POST http://localhost:3000/api/admin/sync-users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Step 3: Check Sync Status**
```bash
# Get sync status
curl http://localhost:3000/api/admin/sync-users
```

**Step 4: Verify User Data in Supabase**
1. Go to Supabase Dashboard
2. Navigate to Authentication → Users
3. Click on a user and check `user_metadata` contains:
   - `firstName`
   - `lastName`
   - `matricNumber`
   - `department`
   - `level`
   - `type` (should be "student")
   - `role` (should be "STUDENT")

**Step 5: Check Database**
```sql
-- Connect to PostgreSQL and run:
SELECT id, email, "firstName", "lastName", "matricNumber" FROM "User" LIMIT 10;
```

## API Endpoints

### GET /api/admin/users
Fetches users from database with automatic sync if empty.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `search` - Search by name, email, or matric number
- `filter` - 'all', 'enrolled', or 'pending'

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "student@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "matricNumber": "CSC/2024/001",
      "department": "Computer Science",
      "level": "100",
      "biometricEnrolled": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "totalPages": 3
}
```

### POST /api/admin/sync-users
Manually sync all users from Supabase Auth to database.

**Requirements:**
- Admin authentication required
- User must have `type: 'admin'` or `role: 'ADMIN'`

**Response:**
```json
{
  "success": true,
  "message": "Synced 15 users, 0 failed",
  "synced": 15,
  "failed": 0
}
```

### GET /api/admin/sync-users
Check sync status between Supabase Auth and database.

**Response:**
```json
{
  "authUserCount": 20,
  "dbUserCount": 20,
  "synced": true
}
```

## User Metadata Structure

When registering, ensure the following metadata is stored in Supabase Auth:

```json
{
  "matricNumber": "CSC/2024/001",
  "firstName": "John",
  "lastName": "Doe",
  "otherNames": "Michael",
  "phoneNumber": "+234801234567",
  "department": "Computer Science",
  "level": "100",
  "dateOfBirth": "2003-05-15",
  "type": "student",
  "role": "STUDENT",
  "biometricEnrolled": true
}
```

## Common Issues and Solutions

### Issue: "Matric number already exists"
**Cause**: User tried to register with duplicate matric number
**Solution**: Check if user already exists in database or Supabase Auth

### Issue: "Failed to create user profile"
**Cause**: Database sync failed during registration
**Solution**: 
1. Check database connection
2. Verify all required fields are provided
3. Check for duplicate email or matric number

### Issue: Users show as "Unknown User"
**Cause**: firstName/lastName not stored in metadata
**Solution**:
1. Check Supabase user metadata
2. Run manual sync
3. Verify registration form captures all fields

## Testing Checklist

- [ ] Register a new student account
- [ ] Verify user appears in Supabase Auth with correct metadata
- [ ] Check user appears in Admin Users page within 5 seconds
- [ ] Verify all user fields display correctly (name, matric, department, level)
- [ ] Test search functionality
- [ ] Test filter by enrollment status
- [ ] Test pagination
- [ ] Verify biometric enrollment status shows correctly

## Performance Considerations

- **Sync Operation**: ~100ms per user
- **Database Query**: ~50ms for 10 users
- **Automatic Sync**: Only runs if database is empty
- **Manual Sync**: Can sync up to 1000 users at once

## Security Notes

- Sync endpoint requires admin authentication
- User metadata is encrypted in Supabase
- Database passwords should never be exposed
- Use environment variables for all credentials

## Support

If issues persist:
1. Check server logs for error messages
2. Verify database connectivity
3. Ensure Supabase credentials are correct
4. Contact system administrator
