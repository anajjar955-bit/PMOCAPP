# PM House Academy - PMI-PMO CP Exam Preparation App

## Overview
Mobile app (Expo React Native) for intensive 3-hour PMI-PMO CP exam preparation course by PM House.

## Features
- **25 Interactive Lessons** across 6 domains (Arabic content with slides)
- **Interactive Quizzes** (MCQ + True/False scenario-based questions after each lesson)
- **2 Practice Exams** (20 questions each, 40-minute time limit, domain-based scoring)
- **User Auth** (email/password registration/login with JWT)
- **Progress Tracking** (completed lessons, quiz scores, exam attempts)
- **Demo Access** (first lesson of each module free before payment)
- **PayPal Payment** (external link redirect + manual confirmation)
- **Certificate of Achievement** (upon course completion with PM House branding)
- **RTL Arabic UI** with PM House branding (blue/orange theme)

## Tech Stack
- **Frontend**: Expo SDK 54, React Native, Expo Router (file-based routing)
- **Backend**: FastAPI, Python 3.11
- **Database**: MongoDB (motor async driver)
- **Auth**: JWT (PyJWT + bcrypt)

## Course Structure (6 Domains)
1. التطوير التنظيمي والمواءمة (16%) - 4 lessons
2. العناصر الاستراتيجية لمكتب إدارة المشاريع (18%) - 4 lessons
3. تصميم وهيكلة مكتب إدارة المشاريع (18%) - 4 lessons
4. عمليات وأداء مكتب إدارة المشاريع (15%) - 4 lessons
5. تعزيز وفعالية مكتب إدارة المشاريع (18%) - 4 lessons
6. الأشخاص والمهارات القيادية (15%) - 4 lessons

## API Endpoints
- Auth: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
- Course: GET /api/course/modules, GET /api/course/modules/:id/lessons, GET /api/course/lessons/:id
- Quizzes: GET /api/course/lessons/:id/quiz, POST /api/course/lessons/:id/quiz/submit
- Exams: GET /api/exams, GET /api/exams/:id, POST /api/exams/:id/submit
- Progress: GET /api/progress, POST /api/course/lessons/:id/complete
- Payment: GET /api/payment/link, POST /api/payment/confirm
- Certificate: GET /api/certificate
- Admin: POST /api/admin/activate-user

## PayPal Link
https://www.paypal.com/ncp/payment/QEL5ME5XAAD96
