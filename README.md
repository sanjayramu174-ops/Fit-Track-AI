# AI FitTrack

A full-stack gym membership management project built with:

- Node.js
- Express.js
- MongoDB + Mongoose
- HTML, CSS and JavaScript
- JWT authentication
- bcrypt password hashing
- REST API architecture

## Implemented Features

### Member
- Register and login
- Browse membership plans
- Subscribe to a plan (records the amount actually paid)
- View active subscription and history
- Update name and phone
- Send ratings and feedback
- Send contact inquiries
- Use the fitness coach — powered by Google Gemini when `GEMINI_API_KEY` is set,
  otherwise an honestly-labelled rule-based fallback

### Admin
- Secure role-based login
- Create membership plans
- Edit plan prices and activate/deactivate plans
- View dashboard statistics
- View subscriptions and revenue (revenue uses the amount paid at purchase time,
  so later plan price edits never change historical numbers)
- Review feedback
- Review member inquiries and update their status (open / in-progress / closed)

## Project Structure

```
AI-FitTrack/
├── server.js              # Bootstrap: env validation → MongoDB → admin seed → HTTP listen
├── src/
│   ├── app.js             # Express app (routes, static files, central error handler)
│   ├── config/
│   │   ├── db.js          # MongoDB connection with actionable error messages
│   │   └── env.js         # Fails startup with a clear error when required vars are missing
│   ├── middleware/auth.js # JWT verification + role-based authorization
│   ├── models/            # User, Plan, Subscription, Feedback, Inquiry
│   ├── routes/            # auth, plans, subscriptions, feedback, inquiries, dashboard, ai
│   ├── services/
│   │   └── aiCoach.js     # Gemini REST integration + rule-based fallback
│   └── utils/             # token, dates (safe month arithmetic), seedAdmin, asyncHandler
├── public/                # Frontend (index.html, app.js, styles.css)
└── tests/
    ├── smoke.js           # End-to-end API test suite (uses an in-memory MongoDB)
    └── dev-memory.js      # Runs the app without a local MongoDB installation
```

The Express app (`src/app.js`) is separate from the server bootstrap (`server.js`),
so the app can be imported and tested without connecting to MongoDB.

## 1. Install requirements

Install:

1. Node.js 18+
2. MongoDB Community Server, or use MongoDB Atlas
3. Postman (optional)

## 2. Open the project and install

```bash
cd AI-FitTrack
npm install
```

## 3. Create `.env`

Copy `.env.example` to `.env` and fill in the values. Required variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | no (default 5000) | HTTP port |
| `NODE_ENV` | no | `development` or `production` |
| `MONGO_URI` | **yes** | MongoDB connection string |
| `JWT_SECRET` | **yes** | Long random string used to sign tokens |
| `JWT_EXPIRES_IN` | no (default 7d) | Token lifetime |
| `ADMIN_NAME` | no | Seeded admin display name |
| `ADMIN_EMAIL` | no* | Seeded admin login email |
| `ADMIN_PASSWORD` | no* | Seeded admin login password |
| `PAYMENT_MODE` | no (only `mock` supported) | Mock payment mode |
| `GEMINI_API_KEY` | no | Enables the real AI coach |
| `GEMINI_MODEL` | no (default `gemini-2.0-flash`) | Gemini model name |
| `GEMINI_BASE_URL` | no | Override for proxies/testing |

*If `ADMIN_EMAIL` and `ADMIN_PASSWORD` are both set, the app creates that admin
account on first start. Otherwise admin seeding is skipped with a warning.

The app refuses to start with a clear error if `MONGO_URI` or `JWT_SECRET` is missing.
Never commit your real `.env` — it is git-ignored.

## 4. Start MongoDB

If using local MongoDB, make sure the MongoDB service is running.

**No MongoDB installed?** You can run the whole app against a temporary
in-memory database (test data is lost when it stops):

```bash
npm run dev:memory
```

## 5. Start FitTrack

Development:

```bash
npm run dev
```

Or production style:

```bash
npm start
```

Open: `http://localhost:5000`

## 6. Default admin login

If seeded from `.env` (see step 3), the example defaults are:

- Email: `admin@fittrack.com`
- Password: `Admin@123`

Change these values for anything beyond local development.

## 7. Testing Member Flow

1. Open the website.
2. Register a member account.
3. Ask the admin to create one or more membership plans.
4. Open Plans and click Subscribe.
5. Open Dashboard to see subscription details and history.
6. Submit feedback and an inquiry.
7. Try the Fitness Coach form (shows whether the plan came from Gemini or the rule-based fallback).

## 8. Testing Admin Flow

1. Log out, then log in with the admin credentials.
2. Create a plan, edit its price, deactivate/activate plans.
3. Check dashboard statistics (revenue comes from recorded purchase amounts).
4. View subscriptions, feedback and inquiries.
5. Update an inquiry status with the dropdown in the Inquiries table.

## 9. Automated tests

```bash
npm test
```

This boots an in-memory MongoDB (downloaded automatically on first run),
starts the app, and exercises the API end to end: health, static files,
registration, login, protected and invalid authentication, role checks,
plan CRUD, subscription lifecycle (including expiry and revenue snapshots),
inquiries, feedback, the AI fallback path, and invalid-request handling.

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/me`

### Plans
- `GET /api/plans` (active plans, public)
- `GET /api/plans/admin/all` (admin)
- `POST /api/plans` (admin)
- `PUT /api/plans/:id` (admin)
- `DELETE /api/plans/:id` (admin, soft-deactivates)

### Subscriptions
- `POST /api/subscriptions/subscribe/:planId` (member)
- `GET /api/subscriptions/me` (member)
- `GET /api/subscriptions` (admin)

### Feedback
- `POST /api/feedback` (member)
- `GET /api/feedback` (admin)

### Inquiries
- `POST /api/inquiries` (member)
- `GET /api/inquiries/me` (member)
- `GET /api/inquiries` (admin)
- `PUT /api/inquiries/:id/status` (admin)

### Dashboard
- `GET /api/dashboard/admin` (admin)

### Fitness coach
- `POST /api/ai/coach` (any logged-in user)

### Health
- `GET /api/health` — also reports the MongoDB connection state

## Payment Gateway Note

This project uses a mock payment flow so it works immediately without payment
credentials. Subscriptions record the amount paid (`amount` on each subscription),
and revenue is computed from those snapshots.

For a production payment gateway:
1. Create a Razorpay or Stripe account.
2. Create payment orders only on the backend.
3. Never put secret keys in frontend JavaScript.
4. Verify payment signatures/webhooks on the backend.
5. Mark a subscription as paid only after successful verification.

## Production Improvements

Before production deployment, add:
- Real payment gateway verification
- Email verification and password reset
- Rate limiting and security headers (e.g. helmet)
- Input validation library
- Audit logs
- Trainer scheduling
- Attendance scanning
- Notifications
- Better analytics charts
