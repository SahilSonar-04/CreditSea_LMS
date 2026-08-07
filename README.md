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
_To be filled in once the seed script exists._
