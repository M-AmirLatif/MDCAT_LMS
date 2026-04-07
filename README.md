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
- Backend upload storage:
  - `STORAGE_DRIVER=local` (default) saves files to `backend/uploads`
  - `STORAGE_DRIVER=s3` uses AWS S3. Set `AWS_REGION`, `AWS_S3_BUCKET` and optional `AWS_S3_BASE_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
