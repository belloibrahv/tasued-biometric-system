# Production Deployment Checklist

This checklist ensures that the TASUED Biometric System is correctly configured and secure before every production deployment.

## 1. Environment Variables
Ensure the following variables are set in your production environment (e.g., Render Dashboard):
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL`: Production PostgreSQL connection string.
- [ ] `JWT_SECRET`: A long, random string for token signing.
- [ ] `ENCRYPTION_KEY`: A 32-character key for biometric data encryption.
- [ ] `NEXT_PUBLIC_API_URL`: The full URL of your production site (e.g., `https://tasued-biometric-system.onrender.com`).
- [ ] `CORS_ORIGIN`: Comma-separated list of allowed origins (usually same as `NEXT_PUBLIC_API_URL`).

## 2. Security Checks
- [ ] All sensitive API routes are protected by `middleware.ts`.
- [ ] Rate limiting is enabled for `/api/auth` and `/api/biometric`.
- [ ] CSP headers are configured and verified.
- [ ] HSTS is enabled (automatic in our `middleware.ts` for `NODE_ENV=production`).

## 3. Database
- [ ] Run `npx prisma db push` or `npx prisma migrate deploy` to sync the production schema.
- [ ] Ensure the production database is backed up.

## 4. Build & Tests
- [ ] CI pipeline (GitHub Actions) passes on `main`.
- [ ] Run `npm run lint` and verify no errors.
- [ ] Run `npm run build` locally to ensure the project builds correctly.

## 5. Post-Deployment Verification
- [ ] Verify SSL/TLS is active (HTTPS).
- [ ] Test the login flow.
- [ ] Test a sample biometric record creation and verification.
- [ ] Check logs for any startup errors.
