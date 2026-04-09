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
