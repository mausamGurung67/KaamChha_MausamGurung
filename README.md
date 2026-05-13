# KaamChha

KaamChha is a full-stack home services platform with:
- Backend API: Node.js, Express, TypeScript, Prisma, PostgreSQL, Socket.IO
- Frontend App: React, TypeScript, Vite, Tailwind CSS

This guide covers complete project setup and usage.

## 1. Project Structure

- backend: REST API, authentication, bookings/orders, reviews, notifications, payments, KYC, Socket.IO
- frontend: Web app for customers, technicians, and admin

## 2. Prerequisites

Install these first:
- Node.js 20+ (recommended)
- npm 10+ (recommended)
- PostgreSQL 14+ (or any PostgreSQL supported by your Prisma version)
- Git

Optional but recommended:
- Prisma Studio (already available through script)
- Postman or Insomnia for API testing

## 3. Clone and Install

From project root:

1. Install backend dependencies:
cd backend
npm install

2. Install frontend dependencies:
cd ../frontend
npm install

## 4. Environment Setup

You need environment files for backend (required) and frontend (optional but recommended).

### 4.1 Backend environment

Create file: backend/.env

Use this template and replace values:

NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kaamchha

JWT_ACCESS_SECRET=replace_with_a_long_random_string_min_32_chars
JWT_REFRESH_SECRET=replace_with_a_long_random_string_min_32_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

RESEND_API_KEY=replace_with_resend_key
RESEND_FROM_EMAIL=noreply@example.com

CLOUDINARY_CLOUD_NAME=replace_with_cloudinary_cloud_name
CLOUDINARY_API_KEY=replace_with_cloudinary_api_key
CLOUDINARY_API_SECRET=replace_with_cloudinary_api_secret

MAX_OTP_ATTEMPTS=5
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION=1800000

COMMISSION_RATE_TECHNICIAN=0.8
COMMISSION_RATE_PLATFORM=0.2

FRONTEND_URL=http://localhost:5173

KHALTI_SECRET_KEY=replace_with_khalti_secret
KHALTI_GATEWAY_URL=https://a.khalti.com/api/v2
KHALTI_WEBSITE_URL=https://khalti.com

ESEWA_MERCHANT_ID=EPAYTEST
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q
ESEWA_GATEWAY_URL=https://rc-epay.esewa.com.np

Important:
- All required variables must be present, or backend startup fails (validated via Zod).
- FRONTEND_URL must match your frontend origin for CORS.

### 4.2 Frontend environment

Create file: frontend/.env

VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

If omitted, frontend already falls back to these localhost defaults.

## 5. Database Setup (Prisma)

From backend folder:

1. Generate Prisma client:
npm run prisma:generate

2. Apply migrations:
npm run prisma:migrate

3. Seed initial data (admin + categories):
npx prisma db seed

What seeding creates:
- Admin user email in database: admin@mausam.com
- Admin password: Admin@123
- Default service categories

Security note:
- Change the seeded admin password immediately in non-local environments.

## 6. Run the Project (Development)

Use two terminals.

Terminal A (backend):
cd backend
npm run dev

Expected backend URLs:
- Health: http://localhost:5000/health
- API base: http://localhost:5000/api
- WebSocket: ws://localhost:5000

Terminal B (frontend):
cd frontend
npm run dev

Expected frontend URL:
- http://localhost:5173

## 7. Build and Run in Production Mode

### 7.1 Backend

cd backend
npm run build
npm run start

### 7.2 Frontend

cd frontend
npm run build
npm run preview

For deployment, serve frontend static build and point it to production API via VITE_API_BASE_URL.

## 8. Available Scripts

### 8.1 Backend scripts

- npm run dev: start backend with nodemon + ts-node
- npm run build: compile TypeScript to dist
- npm run start: run compiled server from dist/server.js
- npm run test: run Jest tests once
- npm run test:watch: run Jest in watch mode
- npm run prisma:generate: generate Prisma client
- npm run prisma:migrate: create/apply migration in dev
- npm run prisma:studio: open Prisma Studio

### 8.2 Frontend scripts

- npm run dev: start Vite dev server
- npm run build: type-check and production build
- npm run lint: run ESLint
- npm run preview: preview production build locally

## 9. Testing

Backend tests:
cd backend
npm run test

Frontend quality checks:
cd frontend
npm run lint
npm run build

## 10. Core API Route Groups

Base API path: /api

Main route groups:
- /api/auth
- /api/categories
- /api/services
- /api/upload
- /api/kyc
- /api/admin
- /api/location
- /api/orders
- /api/customer
- /api/technician
- /api/profile
- /api/payments
- /api/reviews
- /api/notifications
- /api/service-requests

Health route:
- /health

## 11. Troubleshooting

1. Backend exits with environment variable errors:
- Check backend/.env keys and values.
- Ensure DATABASE_URL and secrets are present.

2. CORS errors in browser:
- Set FRONTEND_URL in backend/.env to your frontend origin.
- Restart backend after changes.

3. Database connection issues:
- Verify PostgreSQL is running.
- Verify DATABASE_URL credentials, host, port, and database name.
- Run npm run prisma:generate again after schema changes.

4. Frontend cannot call API:
- Confirm VITE_API_BASE_URL points to running backend.
- Confirm backend is reachable at http://localhost:5000.

5. Real-time/socket features not connecting:
- Confirm VITE_SOCKET_URL matches backend host and port.
- Ensure backend started from backend folder and running without errors.

## 12. Recommended First Run Checklist

1. Install dependencies in backend and frontend.
2. Create backend/.env and frontend/.env.
3. Start PostgreSQL.
4. Run backend Prisma generate + migrate + seed.
5. Start backend dev server.
6. Start frontend dev server.
7. Open frontend and test login/registration flow.

## 13. Tech Stack Summary

Backend:
- Express 4
- TypeScript
- Prisma ORM + PostgreSQL
- Socket.IO
- Zod validation
- Jest

Frontend:
- React 19
- TypeScript
- Vite
- Axios
- React Router
- Tailwind CSS
- Leaflet + React-Leaflet

---
