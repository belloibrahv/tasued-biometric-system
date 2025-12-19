# 🔐 TASUED BioVault

**Universal Student Biometric Identity Platform**

A comprehensive biometric identity management system for Tai Solarin University of Education (TASUED), built as a CSC 415 Net-Centric Computing project.

![TASUED BioVault](https://img.shields.io/badge/TASUED-BioVault-0066CC?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square)

---

## 🎯 Features

### For Students
- ✅ **Digital Identity** - Secure biometric enrollment and verification
- ✅ **QR Code System** - Auto-refreshing QR codes for quick verification
- ✅ **Service Access** - Connect to library, exams, hostel, cafeteria, and more
- ✅ **Activity History** - Track all verification activities
- ✅ **Data Export** - Export your data in multiple formats
- ✅ **Privacy Control** - Manage your data and connected services

### For Operators
- ✅ **Student Verification** - Verify students via QR code or search
- ✅ **Bulk Verification** - Process multiple students at once
- ✅ **Real-time Stats** - Monitor verification activities

### For Administrators
- ✅ **User Management** - View, suspend, and manage student accounts
- ✅ **Service Configuration** - Manage campus services
- ✅ **Audit Logs** - Complete system activity tracking
- ✅ **Analytics Dashboard** - System-wide statistics and charts

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/tasued-biovault.git
cd tasued-biovault

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Setup database
npx prisma generate
npx prisma db push
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Student | john.doe@student.tasued.edu.ng | studentPassword123! |
| Admin | admin@tasued.edu.ng | adminPassword123! |
| Operator | operator@tasued.edu.ng | operatorPassword123! |

---

## 📱 Mobile Support

BioVault is fully responsive and works on:
- 📱 Mobile phones (iOS & Android)
- 📱 Tablets
- 💻 Laptops
- 🖥️ Desktop computers

**PWA Support**: Install as an app on your device for offline access!

---

## 🏗️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT with HTTP-only cookies
- **UI Components**: Radix UI, Framer Motion, Lucide Icons
- **Charts**: Recharts

---

## 📁 Project Structure

```
tasued-biovault/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── admin/             # Admin portal
│   ├── dashboard/         # Student dashboard
│   ├── operator/          # Operator portal
│   ├── login/             # Authentication
│   └── register/          # Student enrollment
├── components/            # Reusable components
├── lib/                   # Utilities and services
├── prisma/               # Database schema and migrations
└── public/               # Static assets
```

---

## 🎓 Course Information

**Course**: CSC 415 - Net-Centric Computing  
**Lecturer**: Dr. Ogunsanwo  
**Institution**: Tai Solarin University of Education (TASUED)

---

## 🎨 Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | #0066CC | Main brand color |
| Secondary Green | #059669 | Success states |
| Accent Gold | #F59E0B | Highlights |

---

## 📄 License

This project is developed for educational purposes as part of CSC 415 coursework.

---

## 👥 Team

Built with ❤️ by CSC 415 Net-Centric Computing Students

---

**© 2024 TASUED BioVault - All Rights Reserved**
