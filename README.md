# CreditSea LMS

A full-stack Loan Management System built for the CreditSea SDE Intern assignment. It provides a borrower application portal and an internal, role-gated dashboard for Sales, Sanction, Disbursement, and Collection teams.

The project uses a CreditSea-inspired visual treatment and microcopy while retaining the assignment's prescribed BRE, loan-math, and lifecycle rules.

## Highlights

- Borrower journey: sign up/sign in → personal details and BRE → salary-slip upload → loan configuration → application submission
- Server-enforced BRE with instant client-side feedback
- Server-computed simple interest and total repayment
- Salary-slip upload for PDF, JPG, and PNG files up to 5MB
- Role-based access control on both the Next.js UI and Express API
- Operations lifecycle: `APPLIED` → `SANCTIONED` → `DISBURSED` → `CLOSED`
- Collection safeguards: globally unique UTR, overpayment prevention, and automatic closure after full repayment
- Seeded accounts for all six roles

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js App Router, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcrypt |
| Uploads | Multer |

## Project Structure

```text
/client                 Next.js borrower portal and operations dashboard
/server/src/controllers Request handlers for onboarding, applications, dashboard
/server/src/models      Mongoose User, Application, and Payment schemas
/server/src/middleware  Auth, role, and upload middleware
/server/src/utils       BRE, loan math, JWT, reference number, and seed helpers
```

## Prerequisites

- Node.js 20+
- npm
- MongoDB connection string (MongoDB Atlas free tier is sufficient)

## Local Setup

1. Configure and start the backend.

   ```bash
   cd server
   npm install
   cp .env.example .env
   ```

   Set these values in `server/.env`:

   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/creditsea-lms
   JWT_SECRET=replace-with-a-long-random-string
   JWT_EXPIRES_IN=7d
   ```

   ```bash
   npm run dev
   ```

2. Configure and start the frontend in a separate terminal.

   ```bash
   cd client
   npm install
   cp .env.local.example .env.local
   npm run dev
   ```

   `client/.env.local` should contain:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

3. Seed the evaluator accounts.

   ```bash
   cd server
   npm run seed
   ```

Open [http://localhost:3000](http://localhost:3000).

## Seed Credentials

All seeded accounts use password: `Password123!`

| Role | Email | Portal access |
| --- | --- | --- |
| Admin | `admin@creditsea-lms.test` | All four operations modules |
| Sales | `sales@creditsea-lms.test` | Sales only |
| Sanction | `sanction@creditsea-lms.test` | Sanction only |
| Disbursement | `disbursement@creditsea-lms.test` | Disbursement only |
| Collection | `collection@creditsea-lms.test` | Collection only |
| Borrower | `borrower@creditsea-lms.test` | Application portal only |

Public sign-up always creates a `borrower`; executive roles are supplied by the seed workflow.

## Application Rules

### Business Rule Engine

Every rule must pass before the borrower can upload a salary slip or submit a loan:

| Rule | Accepted value |
| --- | --- |
| Age | 23–50 years, inclusive |
| Monthly salary | ₹25,000 or higher |
| PAN | `^[A-Z]{5}[0-9]{4}[A-Z]{1}$` |
| Employment | `Salaried` or `Self-Employed` only |

`Unemployed` is an allowed form option so the API can return a clear BRE failure, but it is never eligible.

### Loan Math

- Loan amount: ₹50,000–₹5,00,000
- Tenure: 30–365 days
- Interest rate: fixed at 12% p.a.
- Simple interest: `SI = (P × R × T) / (365 × 100)`
- Total repayment: `P + SI`

The browser updates the estimate live. The server recalculates and stores both monetary values when the borrower applies, so client-submitted totals are never trusted.

### Lifecycle

```text
DRAFT → APPLIED → SANCTIONED → DISBURSED → CLOSED
              └→ REJECTED
```

- Sanction approves or rejects an `APPLIED` loan. Rejection requires a reason.
- Disbursement marks a `SANCTIONED` loan as `DISBURSED` and records the timestamp.
- Collection records payments only for `DISBURSED` loans. A UTR is globally unique and a payment cannot exceed the outstanding balance.
- A loan closes automatically, never manually, when its outstanding balance reaches zero.

## API Overview

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/onboarding/sign-up` | Public | Create borrower account |
| POST | `/api/onboarding/sign-in` | Public | Sign in and receive JWT |
| POST | `/api/applications` | Borrower | Create or resume draft |
| PATCH | `/api/applications/:id/personal-details` | Borrower | Save details and run BRE |
| POST | `/api/applications/:id/upload-slip` | Borrower | Upload salary slip |
| PATCH | `/api/applications/:id/apply` | Borrower | Compute loan values and submit |
| GET | `/api/applications/me` | Borrower | Get own applications |
| GET | `/api/dashboard/sales` | Sales, Admin | Registered, not-yet-applied leads |
| GET/PATCH | `/api/dashboard/sanction` | Sanction, Admin | Queue, approve, or reject loans |
| GET/PATCH | `/api/dashboard/disbursement` | Disbursement, Admin | Queue and mark loans disbursed |
| GET/POST | `/api/dashboard/collection` | Collection, Admin | Queue and record payments |

Sanction action endpoints are `/api/dashboard/sanction/:id/approve` and `/reject`; disbursement is `/api/dashboard/disbursement/:id/disburse`; payments use `/api/dashboard/collection/:loanId/payment`.

## Design Decisions

### Role storage and checks

Roles are stored directly as a fixed `role` enum on the `User` document:

```text
admin | sales | sanction | disbursement | collection | borrower
```

Six fixed roles do not warrant a separate roles/permissions collection. Every protected route composes two middleware layers in order:

1. `authMiddleware` verifies the JWT and attaches its user payload to `req.user`.
2. `roleMiddleware(...allowedRoles)` checks that role against the endpoint allow-list.

This is enforced independently of navigation: the UI redirects users away from unavailable modules, and the API returns `403` for a valid token with the wrong role. A missing, malformed, invalid, or expired token returns `401`.

### BRE placement

The client mirrors the BRE for immediate feedback while the borrower fills the form. The server runs the same checks before persisting the decision and remains the source of truth, because client-side JavaScript can be bypassed with a direct API request.

### Data model

- `User` stores account, authentication, role, and contact data.
- `Application` stores borrower details, BRE result/reasons, uploaded salary slip URL, loan math, lifecycle fields, and status history.
- `Payment` stores each collection payment with a unique UTR and its recording executive.

`loanRefNumber` is a human-readable application reference. `statusHistory` preserves an auditable record of each material lifecycle change.

## Verification

```bash
cd server && npm run build
cd ../client && npm run lint
cd ../client && npm run build -- --webpack
```

Phase 4 verification exercised the full API flow: BRE failure and correction, application submission, RBAC bypass rejection, sanction, disbursement, partial payment, duplicate UTR rejection, overpayment rejection, and automatic closure.

## Assignment Note

The assignment's eligibility values (age 23–50 and ₹25,000/month) are illustrative requirements for this implementation. They are intentionally kept separate from any live CreditSea production eligibility criteria.
