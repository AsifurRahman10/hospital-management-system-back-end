# HMS Backend

> **HMS Backend** — A production-ready, role-based Hospital Management System API built with Node.js, TypeScript, Express, Prisma, and Better Auth. Handles patient registration, doctor onboarding, appointment scheduling with Stripe payments, prescription generation, reviews, and admin/super-admin governance.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express.js-5.x-black?logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
[![Better Auth](https://img.shields.io/badge/Better%20Auth-v1-purple)](https://better-auth.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql)](https://www.postgresql.org/)
[![Stripe](https://img.shields.io/badge/Payments-Stripe-008CDD?logo=stripe)](https://stripe.com/)
[![Cloudinary](https://img.shields.io/badge/Storage-Cloudinary-36448F?logo=cloudinary)](https://cloudinary.com/)
[![pnpm](https://img.shields.io/badge/Package%20Manager-pnpm-F69220?logo=pnpm)](https://pnpm.io/)

---

## Table of Contents

1. [Introduction](#introduction)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)
7. [API Documentation](#api-documentation)
8. [Database Design](#database-design)
9. [Authentication & Security](#authentication--security)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Future Improvements](#future-improvements)
13. [Author](#author)

---

## Introduction

**HMS Backend** is the server-side powering a Hospital Management System (HMS). It provides a secure, scalable REST API that supports multi-role access (Super Admin, Admin, Doctor, Patient) with session-based authentication via [Better Auth](https://better-auth.com/). Core capabilities include appointment booking with Stripe checkout, digital prescription generation (PDF), doctor scheduling, patient health records, reviews & ratings, and administrative governance with soft-delete patterns.

The codebase is written in **TypeScript** using **Express.js v5**, **Prisma ORM** against **PostgreSQL**, and follows a clean **Controller → Service → Repository** separation with shared middleware for error handling, request validation (Zod), and role-based access control.

### Live Links

| Resource | Link |
|---|---|
| Postman Collection | `HMS.postman_collection.json` (in repo root) |
| API Testing Guide | `API_TESTING_GUIDE.md` (in repo root) |


## Features

### 🔐 Authentication & Authorization
- **Email/password registration & login** via Better Auth
- **Email OTP verification** (sign-up & sign-in) with 6-digit codes expiring in 2 minutes
- **Password reset** via email OTP (forget-password / reset-password flow)
- **Google OAuth** social login (patient-only registration)
- **Session-based auth** (HTTP-only cookies, not Bearer tokens)
- **Role-Based Access Control (RBAC)** — SUPER_ADMIN, ADMIN, DOCTOR, PATIENT
- Account status management (ACTIVE, BLOCK, DELETED) and soft-delete (`isDeleted` / `deletedAt`)

### 👥 User Management
- Patient self-registration
- Doctor registration (with specialties, qualifications, fees, etc.) — Super Admin only
- Admin & Super Admin creation — Super Admin only
- Profile updates for all roles (with optional photo upload to Cloudinary)
- Admin can change user status (block/activate) and user role (Admin↔SuperAdmin only)
- Super Admin bootstrapped automatically on server start via seed script

### 🏥 Doctor & Specialty Management
- Medical specialties CRUD (with icon upload)
- Doctor profiles linked to specialties (many-to-many via `DoctorSpecialty`)
- Public doctor listing with search, filter, pagination, and sorting
- Doctor profile details including appointments, schedules, prescriptions, and reviews

### 📅 Appointment Scheduling
- Admin/SuperAdmin creates time-slot schedules (30-minute intervals)
- Doctors claim schedules for themselves (doctor-wise schedules)
- Patients book appointments against available doctor schedules
- Automatic Stripe Checkout session creation on booking
- **Pay-later** option — book appointment without immediate payment
- Cron job cancels unpaid appointments after 30 minutes and releases the slot
- Appointment status transitions (SCHEDULED → INPROGRESS → COMPLETED / CANCELED)
- Video calling ID generated per appointment

### 💳 Payments (Stripe)
- Stripe Checkout integration (BDT currency)
- Stripe webhook (`/webhook`) handles `checkout.session.completed`
- Automatic payment status update + invoice PDF generation
- Invoice emailed to patient with PDF attachment
- Idempotent webhook processing (skips already-processed events)

### 📄 Prescriptions
- Doctors create prescriptions for their own appointments
- Auto-generated PDF via **pdfkit**, uploaded to Cloudinary
- Prescription emailed to patient with PDF attachment
- Doctors can update/delete their own prescriptions (PDF regenerated on update)
- Admins/SuperAdmins can list all prescriptions

### ⭐ Reviews & Ratings
- Patients review doctors after a **paid** appointment (one review per appointment)
- Doctors can view reviews received for their appointments
- Automatic doctor average-rating recalculation on create/update/delete
- Patients can update/delete their own reviews

### 👤 Patient Profiles
- Patient health data (blood group, allergies, diabetes, height, weight, smoking, pregnancy, mental health, immunization, surgeries, marital status, etc.)
- Medical reports (name + link, uploadable to Cloudinary)
- Profile photo uploads

### 📊 Dashboard Statistics
- Role-aware stats: Super Admin, Admin, Doctor, Patient each see different metrics
- Counts (appointments, doctors, patients, admins, users, payments), total revenue, pie/bar chart data

### 📧 Email (Nodemailer + EJS)
- OTP verification emails
- Password reset emails
- Prescription delivery emails (with PDF attachment)
- Invoice/payment confirmation emails (with PDF attachment)
- EJS templates in `src/app/templates/`

### ☁️ File Storage (Cloudinary)
- Profile photos (doctors, admins, patients)
- Medical report documents
- Prescription & invoice PDFs
- Specialty icons
- Automatic cleanup of orphaned uploads on error via global error handler

### ⏱️ Background Jobs
- `node-cron` runs every 25 minutes: cancels appointments unpaid for >30 minutes and frees doctor schedules


## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 26.x |
| Language | TypeScript | 6.x (via `@typescript/typescript6`) |
| Web Framework | Express.js | 5.x |
| Package Manager | pnpm | 12.6.0 |
| ORM | Prisma | 7.10.0 |
| Database | PostgreSQL | — |
| Authentication | Better Auth | 1.7.6 |
| Validation | Zod | 4.6.5 |
| Payments | Stripe | 23.x |
| File Storage | Cloudinary | 2.11.0 |
| Email Transport | Nodemailer | 10.1.0 |
| Email Templates | EJS | 7.0.1 |
| PDF Generation | pdfkit | 0.20.2 |
| Date Utilities | date-fns | 4.4.0 |
| UUID | uuid | 14.x |
| Cron Scheduling | node-cron | 4.6.0 |
| Query Parsing | qs | 6.16.0 |
| HTTP Status Codes | http-status | 2.1.0 |
| Linter | ESLint | 10.x |
| Dev Server | tsx | 4.23.x |

**Dev Engines:** `pnpm@12.6.0` (enforced via `devEngines` with `onFail: download`)

## Architecture

```
hms-backend/
├── prisma/
│   ├── schema.prisma          # Prisma data model & migrations source
│   └── migrations/            # Versioned SQL migrations
├── src/
│   ├── server.ts              # Entry point (seeds super admin, starts Express)
│   ├── app.ts                 # Express app, CORS, Stripe webhook, cron job
│   ├── app/
│   │   ├── config/            # envConfig, Cloudinary, Stripe, Multer configs
│   │   ├── lib/               # Prisma client, Better Auth instance
│   │   ├── interface/         # Express Request augmentation, IUser, query interfaces
│   │   ├── middleware/        # checkAuth (RBAC), validateRequest (Zod), globalErrorHandler, notFound
│   │   ├── modules/           # Feature-based modules (see below)
│   │   ├── shared/            # AppError, catchAsync, sendResponse, Prisma error mappers
│   │   ├── templates/         # EJS email templates (otp, prescription, invoice)
│   │   └── utils/             # Email sender, seed script, generic QueryBuilder, Cloudinary cleanup
│   └── ...
├── dist/                      # Compiled output (tsc)
├── generated/prisma/          # Prisma Client generated artifacts
├── .env                       # Environment variables (gitignored)
├── package.json
├── tsconfig.json
├── eslint.config.mjs
└── prisma7.config.ts          # Prisma config pointing at envConfig.DATABASE_URL
```

### Module Structure (`src/app/modules/`)

Each module follows a consistent pattern: `route.ts` → `controller.ts` → `service.ts` → `validation.ts` (+ optional `middlewares.ts`).

| Module | Responsibility |
|---|---|
| `auth` | Patient register/login, me, change-password, logout, email verify, forget/reset password, Google OAuth |
| `specialty` | Medical specialty CRUD (icon upload via Cloudinary) |
| `user` | Doctor registration, Admin/SuperAdmin creation (Super Admin gated) |
| `doctor` | Doctor listing (search/filter/paginate), detail, update, delete, self-profile update |
| `admin` | Admin CRUD, self-profile, change user status, change user role |
| `superAdmin` | Super Admin CRUD |
| `schedule` | Time-slot schedule generation (30-min intervals) |
| `doctorSchedule` | Doctors claim/release schedules for themselves |
| `appointment` | Book appointment, pay-later, initiate Stripe payment, status change, list appointments |
| `patient` | Patient profile + health data + medical reports update |
| `review` | Doctor reviews (create/read/update/delete) with rating aggregation |
| `prescription` | Prescription CRUD with PDF generation & email |
| `payment` | Stripe webhook handler |
| `stats` | Role-aware dashboard statistics |

### Request Flow

```
Client Request
      │
      ▼
┌─────────────────────────────────────┐
│  app.ts: CORS → json → /api/v1 router│
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│  Module Route (Express Router)      │
│  ├─ checkAuth(Role.*)  [RBAC]       │
│  ├─ multerUpload      [file upload] │
│  ├─ validateRequest   [Zod schema]  │
│  └─ Controller method               │
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│  Controller (catchAsync wrapper)    │
│  → calls Service                    │
│  → sendResponse(res, {status, msg}) │
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│  Service (business logic)           │
│  → Prisma transactions              │
│  → Stripe / Cloudinary / Email      │
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│  PostgreSQL (via Prisma ORM)        │
└─────────────────────────────────────┘
```

### Error Handling
- **Global error handler** (`globalErrorHandler.ts`) catches all errors, maps Prisma error codes (P2002 → 409, P2025 → 404, etc.), strips verbose Prisma messages, includes stack traces in development only.
- **`catchAsync`** wrapper ensures async route handler errors propagate to the global handler instead of crashing the process.
- **`AppError`** class for custom HTTP errors with status codes.
- Uploaded files are automatically deleted from Cloudinary if a request fails mid-processing (`deleteUploadedFilesFromGlobalErrorHandler`).

### Response Format

All successful responses follow this shape:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": { "page": 1, "limit": 10, "total": 100, "totalPages": 10 } // paginated endpoints only
}
```

Error responses:

```json
{
  "success": false,
  "message": "Human readable error message",
  "errorSources": [{ "path": "field", "message": "detail" }],
  "stack": "..." // development only
}
---

## Getting Started

### Prerequisites

- **Node.js** 20+ (tested on 26.x)
- **pnpm** 12.6.0 (or let `packageManager` field auto-download it)
- **PostgreSQL** database (local or hosted, e.g. Prisma Data Platform)
- **Stripe** account (test keys) for payments
- **Cloudinary** account for file storage
- **Gmail/SMTP** account for email sending
- **Google Cloud** project with OAuth credentials (optional, for Google login)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/AsifurRahman10/hospital-management-system-back-end.git
cd hms-backend

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env   # if .env.example exists; otherwise create .env manually
# See "Environment Variables" below for the full list

# 4. Set up the database
pnpm prisma migrate dev   # runs all pending migrations
pnpm prisma generate      # generate Prisma Client

# 5. Start the development server
pnpm dev                  # uses tsx watch on src/server.ts

# 6. Build for production
pnpm build                # tsc → dist/
pnpm start                # node dist/server.js
```

### Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start dev server with `tsx watch` (hot reload) |
| `pnpm start` | Start production server from `dist/` |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm typecheck` | Run `tsc --noEmit` for type checking |
| `pnpm lint` | Run ESLint on `./src` |
| `pnpm prisma:migrate` | Run `prisma migrate dev` |
| `pnpm stripe` | Forward Stripe webhooks locally to `localhost:5000/webhook` |

### First-Time Setup (Super Admin)

The server seeds a Super Admin automatically on startup using `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` from `.env`. After the first start:

1. Register a user via `POST /api/v1/auth/register`
2. Set that user's `role` to `SUPER_ADMIN` in the database (or Prisma Studio)
3. Log in again — the session cookie now grants Super Admin access

Alternatively, rely on the auto-seeded Super Admin from `.env` credentials.

## Environment Variables

Create a `.env` file in the project root. All variables are validated at startup by `src/app/config/index.ts` — missing required variables throw an `AppError` (500).

```bash
# === Core ===
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/hms?sslmode=require

# === Better Auth ===
BETTER_AUTH_SECRET=<long-random-string>   # generate with: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:5000

# === Email (SMTP) ===
EMAIL_SENDER_SMTP_USER=your-email@gmail.com
EMAIL_SENDER_SMTP_PASS=your-app-password     # Gmail app password, not regular password
EMAIL_SENDER_SMTP_HOST=smtp.gmail.com
EMAIL_SENDER_SMTP_PORT=465
EMAIL_SENDER_SMTP_FROM=your-email@gmail.com

# === Google OAuth ===
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/callback/google

# === Frontend ===
FRONTEND_URL=http://localhost:3000

# === Cloudinary ===
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# === Stripe ===
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# === Super Admin Seed ===
SUPER_ADMIN_EMAIL=superadmin@email.com
SUPER_ADMIN_PASSWORD=12345678
```

> ⚠️ **Security:** Never commit `.env`. It is already in `.gitignore`. Rotate any credentials that have been accidentally committed.

---

## API Documentation

All API routes are mounted under `/api/v1`. Authentication uses **session cookies** (set by Better Auth / login endpoints) — clients must include cookies on every authenticated request. A Postman collection (`HMS.postman_collection.json`) is included in the repo root.

### Base URL
```
http://localhost:5000/api/v1
```

### 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | Public | Register a new patient (email/password) |
| GET | `/login` | Public | Login (returns Set-Cookie session) |
| GET | `/me` | Any role | Get current user profile |
| POST | `/change-password` | Any role | Change password (blocked for Google accounts) |
| POST | `/logout` | Any role | Log out (clear session cookie) |
| POST | `/verify-email` | Public | Verify email with OTP |
| POST | `/forget-password` | Public | Request password-reset OTP |
| POST | `/reset-password` | Public | Reset password with OTP |
| GET | `/login/google` | Public | Initiate Google OAuth |
| GET | `/google/success` | Public | Google OAuth success callback |
| GET | `/google/error` | Public | Google OAuth error callback |

> **Note:** Login is `GET` with a JSON body in this implementation. Keep cookies between requests (Postman: use the same tab/collection with cookies enabled).

### 2. Specialties (`/api/v1/specialty`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | ADMIN, SUPER_ADMIN | Create specialty (icon image upload) |
| GET | `/` | Public | List all specialties |
| GET | `/:id` | Public | Get single specialty |
| PATCH | `/:id` | (controller) | Update specialty |
| DELETE | `/:id` | (controller) | Soft-delete specialty |

### 3. User Management (`/api/v1/user`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register-doctor` | Public | Register a doctor (creates User + Doctor + DoctorSpecialties) |
| POST | `/create-admin` | SUPER_ADMIN | Create an admin |
| POST | `/create-super-admin` | SUPER_ADMIN | Create a super admin |

### 4. Doctors (`/api/v1/doctor`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | List doctors (search, filter, paginate, sort) |
| GET | `/:id` | Public | Get doctor by ID |
| PATCH | `/:id` | (controller) | Update doctor |
| DELETE | `/:id` | (controller) | Soft-delete doctor |
| PATCH | `/update-my-profile` | DOCTOR | Update own profile (photo upload) |

### 5. Admins (`/api/v1/admin`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | ADMIN, SUPER_ADMIN | List all admins |
| GET | `/:id` | ADMIN, SUPER_ADMIN | Get admin by ID |
| PATCH | `/:id` | SUPER_ADMIN | Update admin |
| DELETE | `/:id` | ADMIN, SUPER_ADMIN | Soft-delete admin |
| PATCH | `/update-my-profile` | ADMIN, SUPER_ADMIN | Update own profile |
| PATCH | `/change-user-status` | ADMIN, SUPER_ADMIN | Block/activate a user |
| PATCH | `/change-user-role` | SUPER_ADMIN | Change user role (Admin↔SuperAdmin) |

---

### 6. Super Admins (`/api/v1/super-admin`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | SUPER_ADMIN | List all super admins |
| GET | `/:id` | SUPER_ADMIN | Get super admin by ID |
| PATCH | `/:id` | SUPER_ADMIN | Update super admin |
| DELETE | `/:id` | SUPER_ADMIN | Soft-delete super admin |

### 7. Schedules (`/api/v1/schedule`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | ADMIN, SUPER_ADMIN | Create time-slot schedules (30-min intervals) |
| GET | `/` | ADMIN, SUPER_ADMIN, DOCTOR | List schedules |
| GET | `/:id` | ADMIN, SUPER_ADMIN, DOCTOR | Get schedule by ID |
| PATCH | `/:id` | ADMIN, SUPER_ADMIN | Update schedule |
| DELETE | `/:id` | ADMIN, SUPER_ADMIN | Delete schedule |

### 8. Doctor Schedules (`/api/v1/doctorSchedule`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/create-doctor-wise-schedule` | DOCTOR | Claim schedules for this doctor |
| GET | `/doctor-wise-schedules` | DOCTOR | List this doctor's schedules |
| GET | `/` | ADMIN, SUPER_ADMIN | List all doctor schedules |
| GET | `/:doctorId/schedule/:scheduleId` | ADMIN, SUPER_ADMIN | Get specific doctor schedule |
| PATCH | `/update-own-doctor-schedule` | DOCTOR | Update own doctor schedules |
| DELETE | `/delete-own-doctor-schedule/:id` | DOCTOR | Delete own doctor schedule |

---

### 9. Appointments (`/api/v1/appointment`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/book-appointment` | PATIENT | Book appointment + create Stripe Checkout |
| GET | `/my-appointments` | PATIENT, DOCTOR | List own appointments |
| PATCH | `/change-appointment-status/:id` | PATIENT, DOCTOR, ADMIN, SUPER_ADMIN | Change status |
| GET | `/my-single-appointment/:id` | PATIENT, DOCTOR | Get single appointment |
| GET | `/all-appointments` | ADMIN, SUPER_ADMIN | List all appointments |
| POST | `/book-appointment-with-pay-later` | PATIENT | Book without immediate payment |
| POST | `/initiate-payment/:id` | PATIENT | Create Stripe Checkout for existing appointment |

### 10. Patient (`/api/v1/patient`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| PATCH | `/update-my-profile` | PATIENT | Update profile, health data, medical reports (photo + up to 5 report files) |

### 11. Reviews (`/api/v1/review`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | List all reviews |
| POST | `/` | PATIENT | Create review (requires paid appointment) |
| GET | `/my-reviews` | PATIENT, DOCTOR | List own reviews |
| PATCH | `/:id` | PATIENT | Update own review |
| DELETE | `/:id` | PATIENT | Delete own review |

### 12. Prescriptions (`/api/v1/prescription`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | ADMIN, SUPER_ADMIN | List all prescriptions |
| GET | `/my-prescriptions` | PATIENT, DOCTOR | List own prescriptions |
| POST | `/` | DOCTOR | Create prescription (generates PDF + emails patient) |
| PATCH | `/:id` | DOCTOR | Update prescription (regenerates PDF + emails) |
| DELETE | `/:id` | DOCTOR | Delete prescription |

### 13. Statistics (`/api/v1/stats`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Any role | Dashboard stats (role-aware metrics) |

### 14. Stripe Webhook

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/webhook` | Public (Stripe signature verified) | Handles `checkout.session.completed` — updates payment, generates invoice PDF, emails patient |

> The webhook is mounted directly in `app.ts` (not under `/api/v1`) at `POST /webhook` with `express.raw()` body parsing.

---

## Database Design

The schema lives in `prisma/schema.prisma` (PostgreSQL). Prisma migrations are versioned under `prisma/migrations/`.

### Core Models (ER Diagram)

```mermaid
erDiagram
    User ||--o{ Session : owns
    User ||--o{ Account : owns
    User ||--o{ Verification : owns
    User ||--|| Patient : "has one"
    User ||--|| Doctor : "has one"
    User ||--|| Admin : "has one"
    User ||--|| SuperAdmin : "has one"

    Patient ||--o{ PatientHealthData : "has one"
    Patient ||--o{ MedicalReport : owns
    Patient ||--o{ Appointment : books
    Patient ||--o{ Review : writes
    Patient ||--o{ Prescription : receives

    Doctor ||--o{ DoctorSpecialty : "has many"
    Doctor ||--o{ Appointment : "receives"
    Doctor ||--o{ Review : receives
    Doctor ||--o{ Prescription : issues

    Specialty ||--o{ DoctorSpecialty : "has many"

    Schedule ||--o{ DoctorSchedules : "has many"
    DoctorSchedules }o--|| Doctor : "assigned to"
    DoctorSchedules }o--|| Schedule : "time slot"

    Appointment ||--|| Schedule : "uses"
    Appointment ||--o{ Payment : "has one"
    Appointment ||--o{ Prescription : "has one"
    Appointment ||--o{ Review : "has one"

    Payment }o--|| Appointment : linked
    Prescription }o--|| Appointment : linked
    Review }o--|| Appointment : linked
```

### Key Models

| Model | Description |
|---|---|
| `user` | Core identity: email, role, status, needPasswordChange, isDeleted, timestamps |
| `session` / `account` / `verification` | Better Auth tables (sessions, OAuth accounts, email verification) |
| `specialty` | Medical specialty (title, description, icon, soft-delete) |
| `doctor` | Doctor profile linked to `user` (name, email, photo, contact, address, registration number, experience, fee, qualifications, workplace, designation, averageRating) |
| `doctorSpecialty` | Junction: doctor ↔ specialty |
| `admin` / `super_admin` | Role-specific profiles linked to `user` (soft-delete) |
| `patient` | Patient profile linked to `user` |
| `patientHealthData` | Rich health profile (blood group, allergies, vitals, pregnancy, mental health, etc.) |
| `medicalReport` | Patient medical reports (name, link) |
| `schedule` | Generic time slot (startDateTime, endDateTime) |
| `doctorSchedules` | Junction: doctor + schedule + isBooked flag |
| `appointment` | Booking: patient + doctor + schedule, videoCallingId, status, paymentStatus |
| `payment` | Stripe payment: amount, transactionId, invoiceUrl, status (PAID/UNPAID) |
| `review` | Rating 1–5 + comment, unique per appointment |
| `prescription` | Instructions + followUpDate + pdfUrl, unique per appointment |

### Enums

| Enum | Values |
|---|---|
| `Role` | SUPER_ADMIN, ADMIN, PATIENT, DOCTOR |
| `UserStatus` | ACTIVE, BLOCK, DELETED |
| `AppointmentStatus` | SCHEDULED, INPROGRESS, COMPLETED, CANCELED |
| `PaymentStatus` | PAID, UNPAID |
| `BloodGroup` | A_POSITIVE, A_NEGATIVE, B_POSITIVE, B_NEGATIVE, AB_POSITIVE, AB_NEGATIVE, O_POSITIVE, O_NEGATIVE |
| `MaritalStatus` | MARRIED, UNMARRIED, DIVORCED, WIDOWED |
| `Gender` | MALE, FEMALE, OTHER |

### Indexing Strategy
- `user(email)` — unique
- `specialty(title)`, `specialty(isDeleted)` — query performance
- `session(token)` unique, `session(userId)`
- `account(userId)`, `verification(identifier)`
- `appointment(doctorScheduleId)`, `payment(appointmentId)`, `payment(transactionId)`
- `review(appointmentId)` unique
- `prescription(appointmentId)` unique
- `doctorSchedules(doctorId, scheduleId)` compound unique
- Soft-delete patterns: `isDeleted` indexes on specialty, admin, super_admin, doctor

---

## Authentication & Security

### Authentication Provider
**Better Auth** (`better-auth`) with the Prisma adapter (`@prisma/adapter-pg` + `pg`). Session state is stored in cookies (not JWT), providing automatic revocation on logout/password-change.

### Auth Strategies
1. **Email + Password** — `emailAndPassword: { enabled: true }`
2. **Email OTP** — verification OTPs sent on sign-up and sign-in; 6-digit codes, 2-minute expiry. Super Admins skip OTP emails.
3. **Google OAuth** — social login; Google accounts are patient-only and cannot change/reset passwords.

### Session Configuration
- `useSecureCookies`: `true` only in production
- `sameSite`: `lax` (dev) / `none` (prod)
- `httpOnly: true`, `path: '/'`
- Trusted origins: `FRONTEND_URL`

### Authorization Middleware (`checkAuth`)
- Validates the Better Auth session from request headers (`fromNodeHeaders`)
- Loads the `User` record from the database
- Rejects if account is `BLOCK`, `DELETED`, or `isDeleted`
- Enforces allowed roles (variadic `Role[]`)
- Attaches `req.user` (`{ id, role, email }`) and `req.session` for downstream use

### Password Security
- Passwords are hashed by Better Auth (bcrypt)
- `needPasswordChange` flag forces new users/admins to change password on first login
- Google accounts are exempt from password operations

### CSRF / CORS
- CORS configured with explicit origins: `FRONTEND_URL`, `BETTER_AUTH_URL`, `http://localhost:3000`
- `credentials: true` to allow cookies cross-origin
- Allowed methods: GET, POST, PUT, DELETE, PATCH

### Input Validation
- **Zod schemas** validate every request body via `validateRequest` middleware
- Sanitizes nested `body.data` JSON-string payloads (FormData compatibility)
- Global error handler converts Zod issues into structured `errorSources`

### Secrets Management
- All secrets live in `.env` (gitignored): `BETTER_AUTH_SECRET`, SMTP credentials, Stripe keys, Cloudinary secret, Google OAuth secret
- `envConfig` throws at startup if any required variable is missing — fails fast instead of runtime surprises

---

## Testing

There is **no automated test suite** configured (`"test": "echo \"Error: no test specified\" && exit 1"` in `package.json`). Manual API testing is the primary validation method.

### Manual Testing with Postman

The repo includes `HMS.postman_collection.json`. Import it into Postman and set the `localurl` variable to `http://localhost:5000/`.

**Recommended test flow:**
1. `POST /api/v1/auth/register` — register a patient
2. `GET /api/v1/auth/login` — login (save cookies)
3. `POST /api/v1/auth/verify-email` — verify with OTP
4. `GET /api/v1/specialty` — list specialties
5. `POST /api/v1/appointment/book-appointment` — book (requires doctor + schedule)
6. `POST /api/v1/review/` — review after payment

See `API_TESTING_GUIDE.md` for detailed Admin/Super Admin testing procedures including the 401/403/404/409 negative-test matrix.

### Running the Server for Testing

```bash
pnpm dev          # starts on http://localhost:5000
pnpm prisma studio  # optional: open Prisma Studio to inspect DB
```

---

## Deployment

### Production Build

```bash
pnpm install      # installs production dependencies
pnpm build        # compiles TypeScript to dist/
pnpm start        # runs node dist/server.js
```

### Production Checklist

- [ ] Set `NODE_ENV=production` (enables secure cookies, sameSite=none)
- [ ] Use a strong `BETTER_AUTH_SECRET` (rotate on deploy)
- [ ] Point `DATABASE_URL` at a managed PostgreSQL instance
- [ ] Configure `STRIPE_SECRET_KEY` with live keys (not test)
- [ ] Set `STRIPE_WEBHOOK_SECRET` and register the webhook endpoint in Stripe Dashboard pointing to `https://your-domain.com/webhook`
- [ ] Verify `CLOUDINARY_*` credentials
- [ ] Verify SMTP credentials and `EMAIL_SENDER_SMTP_FROM`
- [ ] Set `FRONTEND_URL` to your production frontend domain
- [ ] Run `pnpm prisma migrate deploy` (or `prisma migrate dev` on first deploy)
- [ ] Ensure `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` are strong

### Docker

No `Dockerfile` or `docker-compose.yml` is present in the repository. Containerization would be a straightforward addition (multi-stage build: `pnpm build` → `node dist/server.js`).

### CI/CD

No GitHub Actions or CI configuration is present. Recommended additions:
- Lint on PR (`pnpm lint`)
- Typecheck (`pnpm typecheck`)
- Migration check (`pnpm prisma migrate dev` against a test DB)

---

## Future Improvements

| Area | Suggested Improvement |
|---|---|
| **Testing** | Add unit/integration tests (Vitest or Jest + Supertest) |
| **Type Safety** | Replace `npm:@typescript/typescript6` with stable TypeScript 5.x |
| **Containerization** | Add `Dockerfile` + `docker-compose.yml` |
| **CI/CD** | GitHub Actions workflow for lint, typecheck, and migrations |
| **API Docs** | Add Swagger/OpenAPI (e.g., `swagger-ui-express`) |
| **Rate Limiting** | Add `express-rate-limit` on auth endpoints |
| **Pagination Consistency** | Some list endpoints (e.g., specialty) lack pagination |
| **Soft-Delete Consistency** | Some list endpoints don't filter `isDeleted` (noted in `API_TESTING_GUIDE.md`) |
| **File Validation** | Add file type/size limits for Cloudinary uploads |
| **Appointment Reminders** | Email/SMS reminders before scheduled appointments |
| **Doctor Availability** | Real-time availability checking instead of static slots |
| **Pagination Meta** | Ensure all paginated endpoints return consistent `meta` |

## Author

**Asifur Rahman**  
GitHub: [AsifurRahman10](https://github.com/AsifurRahman10)  
Repository: [hospital-management-system-back-end](https://github.com/AsifurRahman10/hospital-management-system-back-end)

## License

ISC License — see `package.json` for details.
---