# Render Deployment Guide (TASUED Biometric System)

Follow these steps to deploy your "super configured" application to Render.

## 1. Automated Deployment (Blueprints)
Since we have a `render.yaml` file, you can use **Render Blueprints**:
1. Go to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** and select **Blueprint**.
3. Connect your GitHub repository (`belloibrahv/tasued-biometric-system`).
4. Render will automatically detect `render.yaml` and prompt you to create the web service and database.

## 2. Manual Environment Variables
The blueprint handles most variables, but ensure the following are confirmed in the Render dashboard:
- `JWT_SECRET`: A long, random string.
- `ENCRYPTION_KEY`: A 32-character encryption key.
- `DATABASE_URL`: Automatically linked by the blueprint.
- `NEXT_PUBLIC_API_URL`: Your Render URL (e.g., `https://tasued-biometric-system.onrender.com`).

## 3. Deployment Flow
- **Build**: Render will use the multi-stage `Dockerfile`.
- **Pre-deployment**: The `predeploy.sh` script runs automatically inside the container to sync your Prisma database schema.
- **Run**: The standalone Next.js server starts on port 3000.

## 4. Health Checks
The system is configured to report health status at `/api/health`. Render uses this to ensure your app is live before switching traffic.

## 5. Troubleshooting
- If migrations fail, check the **Logs** in the Render dashboard.
- Ensure the `ENCRYPTION_KEY` is exactly 32 characters for AES-256-CBC.
