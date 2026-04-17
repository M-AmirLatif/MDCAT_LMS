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
- Authentication: email/password login (staff) + student registration via OTP

## Demo Accounts (Staff)
Use these to show the full dashboard features immediately.

- Super Admin
  - Email: `superadmin@mdcat.com`
  - Password: `SuperAdmin@123`
- Admin
  - Email: `admin@mdcat.com`
  - Password: `Admin@123`
- Teacher
  - Email: `teacher@mdcat.com`
  - Password: `Teacher@123`
- Teacher 2
  - Email: `teacher2@mdcat.com`
  - Password: `Teacher2@123`

Important:
- Students **do not** have pre-made credentials; they register themselves and verify OTP.
- These demo passwords are for client preview only. Before public launch, we will rotate credentials and enforce stronger policies.

## Student Registration (OTP)
Flow:
1) Student goes to `/register`
2) Enters name + Gmail + password
3) Receives OTP by email
4) Enters OTP on the same page to verify
5) Logs in and starts learning

Email provider:
- OTP email sending is configured via Resend (HTTPS email API) to avoid SMTP restrictions on hosting.

## Suggested Demo Script (5–8 minutes)
1) Open Home → show “highlights” + sample preview
2) Login as Admin → show user management + publishing controls
3) Open a course → show lectures, MCQ test, and performance tracking
4) Show student flow (register/OTP) as the real onboarding experience
5) Close with roadmap (below) and confirm next phase scope

## Roadmap (Next Improvements)
UI/UX
- Further polish (micro-animations, tighter spacing, mobile refinements, icons)
- Dedicated “Client-ready” landing + feature tour sections

Auth
- “Continue with Google” for login + signup (OAuth) once client ID is finalized

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
