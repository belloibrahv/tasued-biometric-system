# TASUED Biometric Data Collection System

A full-stack biometric data collection and management system built for Tai Solarin University of Education (TASUED) as a CSC 415 Net-Centric Computing project.

## 🚀 Project Overview

This system provides secure collection, storage, and management of biometric data with a focus on data portability and privacy compliance.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Deployment**: Docker, Render

## 📋 Features

- **Secure Biometric Collection**: Support for multiple biometric types with encryption
- **User Authentication**: Secure login/register system with JWT tokens
- **Data Management**: CRUD operations for biometric records
- **Export Functionality**: Export data in multiple formats (JSON, XML, ISO 19794, CSV)
- **Data Portability**: Import/export functionality for system interoperability
- **Dashboard**: Administrative dashboard with statistics and management tools
- **Responsive UI**: Mobile-first design with Tailwind CSS

## 📦 Installation & Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/tasued-biometric-system.git
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

4. Configure your environment variables in `.env.local`:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/tasued_biometric_system"

# JWT Configuration
JWT_SECRET="your_jwt_secret_key_here"
JWT_EXPIRES_IN="24h"

# Encryption Configuration
ENCRYPTION_KEY="your_32_character_encryption_key_here"
BCRYPT_SALT_ROUNDS=12

# Application Configuration
NEXT_PUBLIC_API_URL="http://localhost:3000"
NODE_ENV="development"
```

5. Set up the database:
```bash
npx prisma db push
```

6. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 🏗️ Project Structure

```
tasued-biometric-system/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes (auth, biometric, users, etc.)
│   ├── dashboard/         # Dashboard pages
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── collect/           # Biometric collection page
│   ├── records/           # Records management page
│   └── export/            # Export functionality
├── components/            # Reusable React components
├── lib/                   # Utilities, services, and database connection
│   ├── auth.ts           # JWT authentication
│   ├── db.ts             # Database connection
│   ├── encryption.ts     # Data encryption utilities
│   └── services/         # Business logic services
├── prisma/                # Database schema and migrations
├── public/                # Static assets
└── ...
```

## 🔐 Authentication Flow

1. **Registration**: User registers with email, password, and personal details
2. **Login**: User authenticates with email/password to receive JWT token
3. **Authorization**: All protected routes require valid JWT token in headers
4. **Session**: Token is stored in localStorage and sent with authenticated requests

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Biometric Records
- `GET /api/biometric/records` - Get user's biometric records
- `POST /api/biometric/records` - Create new biometric record
- `GET /api/biometric/records/:id` - Get specific record
- `PUT /api/biometric/records/:id` - Update specific record
- `DELETE /api/biometric/records/:id` - Delete specific record

### Data Export
- `GET /api/export` - Get user's export history
- `POST /api/export` - Create new export
- `GET /api/export/:id/download` - Download exported data

## 🔐 Security Measures

- **Password Encryption**: bcrypt with configurable salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Data Encryption**: AES-256 encryption for stored biometric templates
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **Input Validation**: Comprehensive input validation on both frontend and backend
- **SQL Injection Prevention**: Prisma ORM prevents SQL injection
- **XSS Prevention**: React's built-in XSS protection

## 🚀 Deployment

### Deploy to Render

1. Create a new Web Service on Render
2. Connect to your GitHub repository
3. Set the following environment variables in Render dashboard:
   - `DATABASE_URL` (use the Render-provided PostgreSQL database)
   - `JWT_SECRET` (create a strong secret)
   - `ENCRYPTION_KEY` (create a 32-character encryption key)
   - `NEXT_PUBLIC_API_URL` (your Render service URL)
   - `NODE_ENV` (set to "production")

4. Use the following `render.yaml` configuration:
```yaml
services:
  - type: web
    name: tasued-biometric-system
    env: docker
    region: oregon  # or frankfurt depending on your preference
    plan: free      # Free tier for students
    branch: main
    healthCheckPath: /api/health
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: tasued-biometric-db
          property: connectionString
      - key: JWT_SECRET
        sync: false  # Enable secret entry
      - key: ENCRYPTION_KEY
        sync: false  # Enable secret entry
      - key: NODE_ENV
        value: production
      - key: NEXT_PUBLIC_API_URL
        value: https://tasued-biometric-system.onrender.com
      - key: CORS_ORIGIN
        value: https://tasued-biometric-system.onrender.com
      - key: BCRYPT_SALT_ROUNDS
        value: "12"

databases:
  - type: postgres
    name: tasued-biometric-db
    plan: free    # Free Postgres database
    region: oregon
    databaseName: tasued_biometric_system
    user: tasued_user
```

### Docker Deployment

To build and run with Docker:

```bash
# Build the image
docker build -t tasued-biometric-system .

# Run the container
docker run -p 3000:3000 -e DATABASE_URL="..." -e JWT_SECRET="..." tasued-biometric-system
```

## 💻 Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Lint code
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:migrate` - Run database migrations

## 📈 Performance Optimizations

- **Code Splitting**: Next.js automatic code splitting
- **Image Optimization**: Next.js Image component
- **Static Site Generation**: App Router enables SSG opportunities
- **Server-Side Rendering**: Improved SEO and initial load time
- **Bundle Analysis**: Included for performance monitoring

## 🧪 Testing

Testing configuration coming soon...

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is created for academic purposes as part of the CSC 415 Net-Centric Computing course at TASUED.

## 👥 Project Group Members

### CSC 415 Net-Centric Computing - Group Project
- **Course**: CSC 415 Net-Centric Computing
- **Lecturer**: Dr. Ogunsanwo
- **Institution**: Tai Solarin University of Education (TASUED)

#### Group Members:
1. Wisdom Penuel Akpan (20220294080)
2. Hamzat Raqazaq Opeyemi (20220294139)
3. Salami Rahmon Olamide (20220294077)
4. Sabbath Imaobong Jacob (20220294252)
5. Daramola Oluwaboleroke Jeremiah (20220294083)
6. Mubarak Olamilekan Bello (20220294333)
7. Imaadudeen Abiodun Aina (20220204001)
8. Taiwo Oluwapelumi Roland (20220294191)
9. Adenaya Daniel Oluwasemilore (20230294021) - D.E
10. Olusegun Abosede Victoria (20220294146)
11. Opeyeni Bunmi Adeyeniyi (20220294066)
12. Doo Agnes Desmond (20220294004)
13. Olatunji Samuel Feranmi (20220294167)
14. Abdulmalik Ibrahim Opeyemi (20220294002)
15. Daramola Olawunmi Rasheedat (20220294091)
16. Usman Adetola Saka (20220294342)
17. Abiodun Taiwo Caleb (20220294017)
18. Onilede Femi Samuel (20220294256)
19. Adenuga Joshua Oluwasegun (20220294006)
20. Oluwatosin Adesore Awogefa (20220294227)

## 🐛 Bug Reports

If you encounter any bugs, please create an issue on GitHub with detailed reproduction steps.

## ✨ Features Coming Soon

- Biometric verification algorithms
- Advanced analytics dashboard
- Mobile application
- Real-time monitoring
- Integration with existing university systems

---
Built with ❤️ for Tai Solarin University of Education