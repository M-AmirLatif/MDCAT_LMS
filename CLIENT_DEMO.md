# MDCAT LMS — Client Demo Guide

I’ve built the MDCAT LMS for you to review — it’s live and functional with the core student learning flow and full staff/admin features. Please review the current build; once you confirm the direction, we’ll continue together to polish the UI, add the remaining premium features, and prepare it for full launch.

This guide helps you demo the current build clearly, and explains what’s already working vs what we’ll improve next.

## Live URLs
- Frontend (Vercel): `https://mdcat-lms.vercel.app`
- Backend (Railway): `https://mdcatlms-production.up.railway.app`

## What’s Working (Today)
- Role-based platform: Student / Teacher / Admin / Super Admin
- Courses: browse, view details, enroll (student), publish/unpublish (staff)
- Lectures: course lectures + player
- MCQs: topic-wise tests, scoring, negative marking option, review
- Performance: history + analytics views
- Notifications (and scheduling)
- Assignments: create + submissions flow (staff/student)
- Authentication: staff email/password login after account setup + student Google sign-in with one-time password setup

## Account Setup Status
Current repo state:

- `backend/seed.js` creates roles and permissions only.
- No admin, teacher, or student users are created by the seed script.
- Students do not use email OTP in the current build.

Staff access:

- Admin and teacher accounts must already exist in the connected database, or be created/reset manually.
- If you want fixed staff logins for a demo, create them first and then document those exact emails here.

Student access:

- Students sign in with Google from `/register`.
- After Google sign-in, they complete one-time password setup and then use Gmail + password for later logins.

## Suggested Demo Script (5–8 minutes)
1) Open Home → show “highlights” + sample preview
2) Login as Admin → show user management + publishing controls
3) Open a course → show lectures, MCQ test, and performance tracking
4) Show student flow (Google sign-in + one-time password setup) as the real onboarding experience
5) Close with roadmap (below) and confirm next phase scope

## Roadmap (Next Improvements)
UI/UX
- Further polish (micro-animations, tighter spacing, mobile refinements, icons)
- Dedicated “Client-ready” landing + feature tour sections

Auth
- Continue polishing Google sign-in + password setup flow

MCQ Bank & Results
- Replace remaining placeholder/demo content with full verified MDCAT bank
- Better explanations, tagging (chapter/topic), and progress-based recommendations

Operations
- Admin panels for content moderation + analytics
- Better logging/monitoring + backups
- Production hardening (rate limits, security headers, roles/permissions audit)

## Environment & Data
- Database is hosted on MongoDB Atlas and used by both backend and frontend in production.
- This ensures “real-time” shared data across all clients and devices.
