# MDCAT LMS

MERN-based MDCAT LMS for student MCQ practice, teacher MCQ management, and admin analytics.

## Structure

- `backend/` Express + MongoDB API
- `frontend/` React (Vite) client

## Quick Start

1. Backend
   - `cd backend`
   - `npm install`
   - create `.env` using `backend/.env.example`
   - `npm run dev`
   - optional: `npm run seed`

2. Frontend
   - `cd frontend`
   - `npm install`
   - create `.env` using `frontend/.env.example`
   - `npm run dev`

## Environment

- Frontend expects `VITE_API_BASE_URL` in `frontend/.env`.
- Backend expects `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGINS`, and optional email provider settings in `backend/.env`.
- Google login requires both:
  - `frontend/.env`: `VITE_GOOGLE_CLIENT_ID=...`
  - `backend/.env`: `GOOGLE_CLIENT_ID=...`

## Deployment

Use `DEPLOYMENT.md` for the full MongoDB Atlas, Hostinger backend, and Vercel frontend setup.
