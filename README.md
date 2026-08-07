# CreditSea LMS

A Loan Management System with a borrower application portal and a role-gated internal operations dashboard (Sales, Sanction, Disbursement, Collection).

**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS · Node.js + Express + TypeScript · MongoDB + Mongoose · JWT + bcrypt

## Project Structure
```
/client   Next.js frontend (borrower portal + dashboard UI)
/server   Express + TypeScript backend (API, auth, BRE, RBAC)
```

## Prerequisites
- Node.js 20+ and npm
- A MongoDB connection string (MongoDB Atlas free tier works fine)

## Setup

### 1. Backend
```bash
cd server
npm install
cp .env.example .env   # then fill in MONGO_URI and JWT_SECRET
npm run dev             # starts on http://localhost:5000
```

### 2. Frontend
```bash
cd client
npm install
cp .env.local.example .env.local
npm run dev              # starts on http://localhost:3000
```

### 3. Seed demo accounts
```bash
cd server
npm run seed
```
This creates one account per role.

## Seed Credentials
Password for every seeded account: `Password123!`

| Role | Email |
|---|---|
| Admin | admin@creditsea-lms.test |
| Sales | sales@creditsea-lms.test |
| Sanction | sanction@creditsea-lms.test |
| Disbursement | disbursement@creditsea-lms.test |
| Collection | collection@creditsea-lms.test |
| Borrower | borrower@creditsea-lms.test |

## Design Decisions

**Role storage:** a single `role` enum field on the `User` document (`admin \| sales \| sanction \| disbursement \| collection \| borrower`). With exactly 6 fixed roles and no plans for custom/dynamic permissions, a separate roles/permissions collection would be unnecessary complexity.

**Middleware design:** two composable layers, always applied in order. `authMiddleware` verifies the JWT and attaches the decoded payload to `req.user`; returns `401` if the token is missing, malformed, or invalid/expired. `roleMiddleware(...allowedRoles)` runs after it, checks `req.user.role` against an allow-list, and returns `403` if the role isn't permitted. This keeps "are you logged in" and "are you allowed to do this" as separate, independently-testable concerns.

**HTTP status codes:** `401 Unauthorized` = no/invalid/expired token (an authentication problem). `403 Forbidden` = valid token, wrong role (an authorization problem). Kept strictly distinct across every protected route.

**BRE placement (client vs. server):** the client mirrors the BRE for instant feedback while the applicant completes the form, but the server is the source of truth and re-validates every rule before accepting personal details. Client-side checks can be bypassed with a direct API call, so a business-critical eligibility decision must never rely on them alone.
