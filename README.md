# TASUED BioVault - Biometric Identity Management System

A comprehensive biometric identity management system for TASUED (Tai Solarin University of Education) that integrates facial recognition, fingerprint verification, QR code scanning, and lecture attendance tracking.

## Features

### Core Features
- **Biometric Enrollment**: Facial recognition and fingerprint enrollment
- **Multi-factor Verification**: QR codes, facial recognition, fingerprint scanning
- **Service Access Control**: Manage access to campus services (library, hostel, cafeteria, etc.)
- **Audit Logging**: Complete audit trail of all access attempts
- **Real-time Monitoring**: Live dashboard for operators and admins

### Lecture Attendance System
- **QR Code Generation**: Lecturers generate unique QR codes for each lecture session
- **Student Check-in**: Students scan QR codes to mark attendance
- **Real-time Tracking**: Live attendance monitoring during lectures
- **Attendance Analytics**: Comprehensive attendance reports and statistics
- **Attendance History**: Track attendance patterns over time

### User Roles
- **Students**: Enroll biometrics, access services, check attendance
- **Lecturers**: Manage lecture sessions, generate QR codes, monitor attendance
- **Operators**: Verify identities, manage access, generate reports
- **Admins**: System administration, user management, service configuration

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Biometrics**: TensorFlow.js, Face-api.js
- **QR Codes**: qrcode, html5-qrcode
- **ORM**: Prisma

## Project Structure

```
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── biometric/         # Biometric verification
│   │   ├── dashboard/         # Dashboard data
│   │   ├── lectures/          # Lecture management & attendance
│   │   ├── admin/             # Admin operations
│   │   └── operator/          # Operator functions
│   ├── admin/                 # Admin dashboard
│   ├── dashboard/             # Student dashboard
│   │   └── attendance/        # Student attendance page
│   ├── lecturer/              # Lecturer portal
│   │   └── attendance/        # Lecturer attendance management
│   ├── operator/              # Operator dashboard
│   ├── login/                 # Login page
│   ├── register/              # Registration page
│   └── layout.tsx             # Root layout
├── components/                # Reusable React components
├── lib/
│   ├── services/              # Business logic services
│   │   ├── attendance-service.ts
│   │   ├── biometric-service.ts
│   │   ├── user-service.ts
│   │   └── qr-service.ts
│   ├── hooks/                 # Custom React hooks
│   │   └── useAttendance.ts
│   ├── utils/                 # Utility functions
│   │   └── qr-utils.ts
│   └── design-system.ts       # Design tokens
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding
├── middleware.ts              # Next.js middleware
└── public/                    # Static assets
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Supabase)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/belloibrahv/tasued-biometric-system.git
cd tasued-biometric-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your database connection in `.env.local`:
```
DATABASE_URL="postgresql://user:password@host:port/database"
DIRECT_URL="postgresql://user:password@host:port/database"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

5. Run database migrations:
```bash
npm run db:push
```

6. Seed the database with sample data:
```bash
npm run db:seed
```

7. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## Lecture Attendance System

### For Lecturers

1. **Login**: Use lecturer credentials to access the lecturer portal
2. **Navigate to Attendance**: Go to `/lecturer/attendance`
3. **Select Lecture Session**: Choose from available lecture sessions
4. **Display QR Code**: The system generates a unique QR code for the session
5. **Download QR Code**: Save the QR code to display during class
6. **Monitor Attendance**: View real-time student check-ins

### For Students

1. **Login**: Use student credentials to access the student dashboard
2. **Navigate to Attendance**: Go to `/dashboard/attendance`
3. **Scan QR Code**: Use the "Scan QR Code" button to open the camera
4. **Check In**: Point camera at the lecturer's QR code to check in
5. **View History**: See attendance history and analytics

### API Endpoints

#### Lecture Management
- `GET /api/lectures` - List lecture sessions
- `POST /api/lectures` - Create lecture session (admin only)
- `GET /api/lectures/[id]/qr-code` - Generate QR code for lecture
- `POST /api/lectures/[id]/check-in` - Record student check-in
- `GET /api/lectures/[id]/attendance` - Get attendance records
- `GET /api/lectures/[id]/attendance-report` - Generate attendance report
- `GET /api/lectures/stats` - Get attendance statistics

## Database Schema

### Key Models

**LectureSession**
- `id`: Unique identifier
- `courseCode`: Course code (e.g., CSC 415)
- `courseName`: Course name
- `lecturer`: Lecturer name
- `venue`: Class venue
- `startTime`: Session start time
- `endTime`: Session end time
- `department`: Department
- `level`: Student level

**LectureAttendance**
- `id`: Unique identifier
- `lectureSessionId`: Reference to lecture session
- `userId`: Reference to student
- `checkInTime`: Time of check-in
- `checkOutTime`: Time of check-out (optional)
- `method`: Verification method (QR_CODE, FACIAL, etc.)
- `status`: Verification status

**User**
- `id`: Unique identifier
- `email`: Email address
- `firstName`: First name
- `lastName`: Last name
- `matricNumber`: Student/staff ID
- `department`: Department
- `level`: Student level
- `biometricEnrolled`: Biometric enrollment status

## Authentication Flow

1. User enters credentials on login page
2. Supabase authenticates the user
3. JWT token stored in HTTP-only cookie
4. Middleware verifies token on each request
5. User redirected based on role:
   - Students → `/dashboard`
   - Lecturers → `/lecturer`
   - Admins → `/admin`
   - Operators → `/operator`

## Security Features

- **Encryption**: AES-256 encryption for sensitive data
- **Biometric Templates**: Encrypted storage of biometric data
- **Audit Logging**: Complete audit trail of all operations
- **Role-based Access Control**: Fine-grained permission management
- **Session Management**: Secure session handling with HTTP-only cookies
- **Input Validation**: Server-side validation of all inputs

## Testing Credentials

### Lecturers
- **Email**: `adeyemi.lecturer@tasued.edu.ng`
- **Password**: `Lecturer@2024!`

- **Email**: `johnson.lecturer@tasued.edu.ng`
- **Password**: `Lecturer@2024!`

### Students
- **Email**: `test.student@tasued.edu.ng`
- **Matric Number**: `CSC/2024/001`

- **Email**: `demo.user@tasued.edu.ng`
- **Matric Number**: `CSC/2024/002`

### Admin
- **Email**: `admin@tasued.edu.ng`
- **Password**: `adminPassword123!`

## Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
npm run start:prod
```

### Database Commands
```bash
# Push schema changes
npm run db:push

# Run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Reset database
npm run db:reset

# Seed database
npm run db:seed
```

## Deployment

### Vercel Deployment
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Deploy

### Docker Deployment
```bash
docker build -t tasued-biovault .
docker run -p 3000:3000 tasued-biovault
```

## API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Biometric
- `POST /api/biometric/enroll` - Enroll biometric data
- `POST /api/biometric/verify` - Verify biometric
- `POST /api/biometric/verify-facial` - Facial verification

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/activity` - Get recent activity
- `GET /api/dashboard/attendance` - Get attendance records

### Admin
- `GET /api/admin/users` - List users
- `GET /api/admin/stats` - Get admin statistics
- `GET /api/admin/reports` - Generate reports

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL and DIRECT_URL in .env
- Check database server is running
- Ensure firewall allows connections

### Biometric Enrollment Fails
- Check camera permissions
- Ensure good lighting
- Try multiple enrollment attempts
- Check browser console for errors

### QR Code Not Scanning
- Ensure QR code is clearly visible
- Check camera focus
- Try different angles
- Verify QR code generation

## Contributing

1. Create a feature branch
2. Make your changes
3. Commit with clear messages
4. Push to GitHub
5. Create a Pull Request

## License

This project is part of the CSC 415 course at TASUED.

## Support

For issues and questions, please contact the development team or create an issue on GitHub.

## Changelog

### v1.0.0 (Current)
- Initial release
- QR attendance system
- Lecturer portal
- Student attendance tracking
- Real-time monitoring
- Comprehensive reporting

---

**Last Updated**: January 2026
**Version**: 1.0.0
