# CreditSea — Loan Management System

A small lending platform. Borrowers can sign up and apply for a short-term loan through a guided flow, and internal teams (Sales, Sanction, Disbursement, Collection) move that loan through its lifecycle from a role-gated dashboard.

Stack is MERN-ish: Next.js (App Router) + TypeScript on the frontend, Express + TypeScript + Mongoose on the backend, JWT for auth.

---

## What's in here

```
/client                 Next.js app — borrower portal + ops dashboard
/server/src/controllers onboarding, applications, dashboard route handlers
/server/src/models      User, Application, Payment (Mongoose schemas)
/server/src/middleware  auth, role, and upload (multer) middleware
/server/src/utils       BRE, loan math, JWT, ref-number, and seed helpers
```

The frontend and backend are two independent apps with their own `package.json`, run separately.

---

## Running it locally

You'll need Node 20+, npm, and a MongoDB connection string.

**1. Backend**

```bash
cd server
npm install
cp .env.example .env
```

Fill in `server/.env`:

```env
PORT=5000 #For Local Dev
CLIENT_ORIGIN=frontend-url #For Production
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/creditsea-lms
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=7d
```

```bash
npm run dev
```

**2. Frontend**

```bash
cd client
npm install
```

Create `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api #Backend Url
```

```bash
npm run dev
```

**3. Seed accounts**

```bash
cd server
npm run seed
```

This creates one account per role so you can log in immediately without signing up manually. Open [http://localhost:3000](http://localhost:3000).

### Seed logins

Password for every seeded account is `Password@123`.

| Role | Email |
| --- | --- |
| Admin | `admin@creditsea.test` |
| Sales | `sales@creditsea.test` |
| Sanction | `sanction@creditsea.test` |
| Disbursement | `disbursement@creditsea.test` |
| Collection | `collection@creditsea.test` |
| Borrower | `borrower@creditsea.test` |

Public sign-up always creates a `borrower` account — the other five roles only exist because the seed script created them.

---

## Borrower flow

Sign up / sign in → personal details (BRE runs here) → upload salary slip → configure loan and apply. The application is a single `DRAFT` document that gets updated at each step, so a borrower can leave and come back without losing progress.

**Eligibility (BRE)** — checked on the server before anything else can happen:

| Rule | Passes if |
| --- | --- |
| Age | Between 23 and 50 (inclusive) |
| Monthly salary | ₹25,000 or more |
| PAN | Matches `^[A-Z]{5}[0-9]{4}[A-Z]{1}$` |
| Employment | `Salaried` or `Self-Employed` (not `Unemployed`) |

The client runs the same checks too, so the borrower gets instant feedback while typing instead of waiting for a round trip. The server re-runs the BRE independently and is what actually decides whether the application can proceed, because a client check is trivial to bypass with a raw API call.

**Loan math** — fixed 12% p.a., simple interest:

```
SI = (P × R × T) / (365 × 100)     T = tenure in days
Total repayment = P + SI
```

Amount is ₹50,000–₹5,00,000, tenure is 30–365 days, both picked with sliders that update the repayment estimate live. Same story as the BRE: the browser shows a live number for UX, but the server recalculates and stores the real figures when "Apply" is hit, so nothing client-submitted is trusted for money.

---

## Lifecycle

```
DRAFT → APPLIED → SANCTIONED → DISBURSED → CLOSED
              ↘ REJECTED
```

- **Sales** — read-only. Shows registered borrowers who haven't submitted an application yet (i.e. still stuck in `DRAFT` or never started one). Treat it as a lead list.
- **Sanction** — reviews `APPLIED` loans, approves (→ `SANCTIONED`) or rejects (→ `REJECTED`, reason required).
- **Disbursement** — marks a `SANCTIONED` loan `DISBURSED` and stamps the timestamp.
- **Collection** — records payments against `DISBURSED` loans. Each payment needs a UTR (globally unique — enforced with a unique index), amount, and date. Outstanding balance is decremented on each payment; once it hits zero the loan auto-closes to `CLOSED`. There's no manual "close" action anywhere — closing only ever happens as a side effect of the balance reaching zero.

Every status change gets appended to a `statusHistory` array on the application, so there's an audit trail of who did what and when, even though the UI doesn't currently surface all of it.

---

## Access control

Six roles: `admin`, `sales`, `sanction`, `disbursement`, `collection`, `borrower`. Stored as a plain string enum on the `User` document.

Every protected route runs two middlewares in order:

1. `authMiddleware` — verifies the JWT, attaches the payload to `req.user`. No/garbage/expired token → `401`.
2. `roleMiddleware(...allowed)` — checks `req.user.role` against an allow-list for that route. Wrong role but valid token → `403`.

The frontend also redirects people away from modules they can't use, but that's just UX — it's not where the actual enforcement lives. If you hit a dashboard API directly with a borrower's token, you get a `403`, same as clicking around would never let you see.

Admin bypasses the role check on every dashboard route and can see all four modules.

---

## API surface

| Method | Route | Who | What |
| --- | --- | --- | --- |
| POST | `/api/onboarding/sign-up` | anyone | create a borrower account |
| POST | `/api/onboarding/sign-in` | anyone | log in, get a JWT |
| GET | `/api/users/me` | any authed user | current profile |
| POST | `/api/applications` | borrower | create or resume the open draft |
| GET | `/api/applications/me` | borrower | list own applications |
| PATCH | `/api/applications/:id/personal-details` | borrower | save details, run BRE |
| POST | `/api/applications/:id/upload-slip` | borrower | upload salary slip (multipart) |
| PATCH | `/api/applications/:id/apply` | borrower | set loan amount/tenure, submit |
| GET | `/api/uploads/:id` | owner or sanction/admin | fetch the raw salary slip |
| GET | `/api/dashboard/sales` | sales, admin | leads that haven't applied |
| GET | `/api/dashboard/sanction` | sanction, admin | applications awaiting a decision |
| PATCH | `/api/dashboard/sanction/:id/approve` | sanction, admin | approve |
| PATCH | `/api/dashboard/sanction/:id/reject` | sanction, admin | reject (needs `reason`) |
| GET | `/api/dashboard/sanction/history` | sanction, admin | past decisions |
| GET | `/api/dashboard/disbursement` | disbursement, admin | sanctioned, awaiting funds |
| PATCH | `/api/dashboard/disbursement/:id/disburse` | disbursement, admin | mark disbursed |
| GET | `/api/dashboard/disbursement/history` | disbursement, admin | past disbursements |
| GET | `/api/dashboard/collection` | collection, admin | active loans with a balance |
| POST | `/api/dashboard/collection/:loanId/payment` | collection, admin | record a payment |
| GET | `/api/dashboard/collection/history` | collection, admin | all payments |

---

## Verification / sanity checks

```bash
cd server && npm run build
cd client && npm run lint
cd client && npm run build -- --webpack
```
---

