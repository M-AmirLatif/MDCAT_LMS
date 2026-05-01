# MDCAT LMS Deployment Guide

This project is deployed as two services:

- Frontend: Vercel, using the `frontend/` Vite app.
- Backend API: Railway, using the `backend/` Express app.
- Database: MongoDB Atlas.

Do not put real secrets into the codebase. Put production secrets only in MongoDB Atlas, Railway variables, Vercel variables, and your local untracked `.env` files.

## 1. MongoDB Atlas

1. Open MongoDB Atlas and select the `MDCAT_LMS` project.
2. Open `Database > Clusters` and confirm `Cluster0` is active.
3. Open `Database Access`.
4. Use the existing database user or create one:
   - Username: `amirlatif2288_db_user`
   - Password: create a strong password and save it securely.
   - Built-in role: `Read and write to any database` is enough for this app.
5. Open `Network Access`.
6. Add an IP access rule:
   - For easiest Railway deployment: `0.0.0.0/0`
   - Description: `Railway backend`
   - This allows Railway dynamic outbound IPs. If you later use a fixed egress provider, replace this with the fixed IP.
7. Open `Database > Clusters > Connect > Drivers`.
8. Copy the SRV connection string and set the database name to `mdcat_lms`.
9. Final production `MONGO_URI` format:
   ```env
   MONGO_URI=mongodb+srv://amirlatif2288_db_user:<password>@cluster0.ljm4hc2.mongodb.net/mdcat_lms?retryWrites=true&w=majority&appName=Cluster0
   ```
10. Replace `<password>` with the database user password.
11. If the password contains special characters like `@`, `#`, `/`, `?`, `:`, or `%`, URL-encode the password before pasting it into the URI.

## 2. Railway Backend

1. Open Railway.
2. Create a new project from GitHub and select this repo.
3. Select the backend service, or create a new service from the repo.
4. Set the service root directory to:
   ```text
   /backend
   ```
5. Railway will use `backend/railway.json`.
6. Build command can stay empty because Nixpacks detects Node.
7. Start command is already configured as:
   ```bash
   npm start
   ```
8. Open `Variables` and add:
   ```env
   NODE_ENV=production
   MONGO_URI=mongodb+srv://amirlatif2288_db_user:<password>@cluster0.ljm4hc2.mongodb.net/mdcat_lms?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=<generate-a-long-random-secret>
   JWT_EXPIRE=7d
   CORS_ORIGINS=http://localhost:5173,https://your-vercel-app.vercel.app
   GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
   ALLOW_DEBUG_OTP=false
   ```
9. Do not manually set `PORT` on Railway unless Railway asks for it. Railway injects `PORT` automatically.
10. For email delivery, choose one option.

### Email Option A: Resend

Recommended if SMTP is blocked by hosting.

```env
RESEND_API_KEY=your-resend-api-key
RESEND_TIMEOUT_MS=10000
SMTP_FROM="MDCAT LMS <verified-sender@yourdomain.com>"
```

### Email Option B: Brevo

```env
BREVO_API_KEY=your-brevo-api-key
BREVO_TIMEOUT_MS=10000
SMTP_FROM="MDCAT LMS <verified-sender@yourdomain.com>"
```

### Email Option C: Gmail SMTP

Use a Gmail App Password, not your normal Gmail password.

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM="MDCAT LMS <your-email@gmail.com>"
SMTP_CONNECTION_TIMEOUT_MS=10000
SMTP_GREETING_TIMEOUT_MS=10000
SMTP_SOCKET_TIMEOUT_MS=15000
```

### Railway Domain

1. Open backend service `Settings > Networking`.
2. Click `Generate Domain`.
3. Copy the public domain, for example:
   ```text
   https://mdcat-lms-backend-production.up.railway.app
   ```
4. Your frontend API base URL must include `/api`:
   ```text
   https://mdcat-lms-backend-production.up.railway.app/api
   ```
5. Test the health endpoint:
   ```text
   https://mdcat-lms-backend-production.up.railway.app/api/health
   ```

### Seed Data

After Railway deploys successfully, seed the MongoDB Atlas database once.

Option 1, from Railway shell:

```bash
npm run seed
```

Option 2, from your local machine using the Atlas `MONGO_URI` in `backend/.env`:

```bash
cd backend
npm run seed
```

Do not run seed repeatedly on production unless you intentionally want to refresh demo data.

## 3. Vercel Frontend

This repo includes a root `vercel.json` that deploys the Vite frontend only.

1. Open Vercel.
2. Import the GitHub repo.
3. Project name can be:
   ```text
   mdcat-lms
   ```
4. Keep root directory as:
   ```text
   ./
   ```
5. Vercel will use:
   - Install command: `cd frontend && npm ci`
   - Build command: `cd frontend && npm run build`
   - Output directory: `frontend/dist`
6. Open `Environment Variables` and add:
   ```env
   VITE_API_BASE_URL=https://your-railway-backend.up.railway.app/api
   VITE_API_TIMEOUT_MS=20000
   VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
   ```
7. Deploy.
8. Copy the final Vercel production URL, for example:
   ```text
   https://mdcat-lms.vercel.app
   ```
9. Go back to Railway and update `CORS_ORIGINS`:
   ```env
   CORS_ORIGINS=http://localhost:5173,https://mdcat-lms.vercel.app
   ```
10. Redeploy Railway after changing `CORS_ORIGINS`.

## 4. Google OAuth

1. Open Google Cloud Console.
2. Select or create a project for `MDCAT LMS`.
3. Open `APIs & Services > OAuth consent screen`.
4. Configure app name, support email, and developer contact email.
5. Open `Credentials`.
6. Create `OAuth client ID`.
7. Application type:
   ```text
   Web application
   ```
8. Add Authorized JavaScript origins:
   ```text
   http://localhost:5173
   https://your-vercel-app.vercel.app
   ```
9. If you add a custom domain later, add it here too.
10. Copy the Client ID.
11. Put the same Client ID in:
   - Vercel: `VITE_GOOGLE_CLIENT_ID`
   - Railway: `GOOGLE_CLIENT_ID`
   - Local frontend `.env`: `VITE_GOOGLE_CLIENT_ID`
   - Local backend `.env`: `GOOGLE_CLIENT_ID`

## 5. Local Development Env Files

Frontend local file: `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_TIMEOUT_MS=20000
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

Backend local file: `backend/.env`

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/mdcat_lms
JWT_SECRET=local-development-secret-change-me
JWT_EXPIRE=7d
CORS_ORIGINS=http://localhost:5173
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
ALLOW_DEBUG_OTP=true
```

## 6. Important Production Notes

- Photo uploads currently use backend local disk storage under `backend/uploads`. This works during a Railway container lifetime but is not permanent across redeploys. For production-grade profile photos, move uploads to Cloudinary, S3, or another object storage provider.
- Always update Railway `CORS_ORIGINS` after Vercel gives you the final production URL.
- Always include `/api` at the end of `VITE_API_BASE_URL`.
- Never paste the MongoDB password, JWT secret, SMTP password, Resend key, or Brevo key into frontend code.
- Vercel environment variables with `VITE_` are public in the built frontend. Do not put secrets in `VITE_` variables.
