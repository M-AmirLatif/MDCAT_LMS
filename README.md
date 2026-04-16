# MDCAT LMS

MERN-based LMS for MDCAT students with courses, lectures, and MCQ testing.

## Structure
- `backend/` Express + MongoDB API
- `frontend/` React (Vite) client

## Quick Start
1. Backend
   - `cd backend`
   - `npm install`
   - create `.env` using `backend/.env.example`
   - `npm run dev`
   - optional: `npm run seed` (adds demo teacher/student/course data)
2. Frontend
   - `cd frontend`
   - `npm install`
   - `npm run dev`

## Environment
- Frontend expects `VITE_API_BASE_URL` in `frontend/.env`
- Backend email verification requires SMTP settings in `backend/.env`
- If SMTP is not configured and `NODE_ENV` is not `production`, the API returns a `debugOtp` field for local testing.
- Google login requires both:
  - `frontend/.env`: `VITE_GOOGLE_CLIENT_ID=...`
  - `backend/.env`: `GOOGLE_CLIENT_ID=...` (comma-separated allowed)

### Gmail SMTP (OTP emails)
- Set `SMTP_USER` to your Gmail and `SMTP_PASS` to a Gmail App Password (requires 2‑step verification).
- Keep `SMTP_HOST=smtp.gmail.com` and `SMTP_PORT=587` (STARTTLS) unless your provider differs.
