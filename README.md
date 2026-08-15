<div align="center">

# DevHunt — Backend API

**Production-grade REST API for a full-stack developer job portal.**

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue?style=flat-square)

[Live API](https://job-hunt-backend-phi.vercel.app) · [Interactive Docs](https://job-hunt-backend-phi.vercel.app/api-docs) · [Report Bug](https://github.com/kaioumdev/Job-Hunt-Backend/issues)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Architecture](#architecture)

---

## Overview

DevHunt Backend is a RESTful API built with **Node.js + Express + MongoDB Atlas**. It powers a developer job portal where:

- **Students** can register, browse jobs, apply, and track their applications.
- **Recruiters** can post job listings, manage companies, and review / accept applicants.

Authentication uses **HTTP-only JWT cookies** with a full OTP email verification flow. File uploads go directly to **Cloudinary**. An **AI-powered recommendation engine** surfaces similar jobs on every job detail page.

---

## Key Features

| Feature | Details |
|---|---|
| **OTP Email Verification** | 6-digit OTP via Gmail SMTP; account locked until verified |
| **Secure JWT Cookies** | HttpOnly + SameSite=None + Secure — XSS-safe, cross-origin ready |
| **Role-based Auth** | Student and Recruiter roles with protected route middleware |
| **Cloud File Uploads** | Profile photos and company logos stored on Cloudinary via Multer |
| **AI Job Recommendations** | OpenAI-compatible API picks similar jobs; fallback by type/location |
| **Swagger API Docs** | Interactive OpenAPI 3.0 UI at `/api-docs` (CDN-loaded, Vercel-safe) |
| **OTP Password Reset** | Forgot-password flow via email OTP, no session required |
| **Application Lifecycle** | Apply once per job; recruiter sets pending / accepted / rejected status |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js 4.21 |
| Database | MongoDB Atlas — Mongoose 8 |
| Auth | jsonwebtoken + bcryptjs |
| File Storage | Cloudinary v2 |
| Email | Nodemailer (Gmail SMTP + App Password) |
| File Parsing | Multer memory storage + datauri |
| API Docs | swagger-jsdoc + swagger-ui-express |
| AI | OpenAI-compatible fetch (openrouter.ai) |
| Deployment | Vercel Serverless |

---

## Project Structure

```
Backend/
├── controllers/
│   ├── user.controller.js         # Register, login, OTP, profile
│   ├── company.controller.js      # Company CRUD
│   ├── job.controller.js          # Post, search, AI recommendations
│   └── application.controller.js  # Apply, track, update status
│
├── middleware/
│   ├── isAuthenticated.js         # JWT cookie guard
│   └── multer.js                  # Memory-storage file upload
│
├── models/
│   ├── user.model.js              # Schema: Student/Recruiter, OTP, profile
│   ├── company.model.js           # Schema: name, logo, location
│   ├── job.model.js               # Schema: title, salary, applications[]
│   └── application.model.js      # Schema: job ref, applicant ref, status
│
├── routes/
│   ├── user.route.js              # /api/user/*
│   ├── company.route.js           # /api/company/*
│   ├── job.route.js               # /api/job/*
│   └── application.route.js      # /api/application/*
│
├── utils/
│   ├── db.js                      # Mongoose singleton (Vercel cold-start safe)
│   ├── cloud.js                   # Cloudinary SDK config
│   ├── datauri.js                 # Buffer to base64 data URI
│   ├── mailer.js                  # sendOtpEmail via Gmail SMTP
│   ├── aiClient.js                # OpenAI-compatible fetch (8s timeout)
│   └── swagger.js                 # OpenAPI spec + CDN UI at /api-docs
│
├── index.js                       # Entry: middleware, routes, server start
├── vercel.json                    # Serverless routing config
└── package.json
```

---

## API Reference

**Base URL (Production):** `https://job-hunt-backend-phi.vercel.app`

Full interactive documentation: [https://job-hunt-backend-phi.vercel.app/api-docs](https://job-hunt-backend-phi.vercel.app/api-docs)

### Auth & User — `/api/user`

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/register` | — | Create account; sends 6-digit OTP to email |
| `POST` | `/verify-otp` | — | Verify OTP → activate account + set JWT cookie |
| `POST` | `/resend-otp` | — | Resend OTP for unverified accounts |
| `POST` | `/login` | — | Authenticate → set JWT cookie |
| `POST` | `/logout` | ✓ | Clear JWT cookie |
| `POST` | `/forgot-password` | — | Send OTP for password reset |
| `POST` | `/reset-password` | — | Verify OTP → update password |
| `POST` | `/profile/update` | ✓ | Update name, bio, skills, resume URL, photo |

### Companies — `/api/company`

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/register` | Recruiter | Register a new company |
| `GET` | `/get` | Recruiter | List recruiter's own companies |
| `GET` | `/get/:id` | ✓ | Get company by MongoDB ID |
| `PUT` | `/update/:id` | Recruiter | Update company details + upload logo |

### Jobs — `/api/job`

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/post` | Recruiter | Create a new job listing |
| `GET` | `/get?keyword=` | — | Browse all jobs / keyword search |
| `GET` | `/get/:id` | — | Get single job with application refs |
| `GET` | `/getadminjobs` | Recruiter | Recruiter's own listings |
| `GET` | `/recommendations/:id` | — | Up to 6 AI-recommended similar jobs |

### Applications — `/api/application`

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/apply/:id` | Student | Apply to a job (once per job) |
| `GET` | `/get` | Student | List all jobs the student applied to |
| `GET` | `/:id/applicants` | Recruiter | All applicants for a specific job |
| `POST` | `/status/:id/update` | Recruiter | Set status: pending / accepted / rejected |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account — [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas)
- Cloudinary account — [cloudinary.com](https://cloudinary.com)
- Gmail with [App Password](https://support.google.com/accounts/answer/185833) enabled
- _(Optional)_ OpenRouter account for AI — [openrouter.ai](https://openrouter.ai)

### 1. Clone the repository

```bash
git clone https://github.com/kaioumdev/Job-Hunt-Backend.git
cd Job-Hunt-Backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your real credentials
```

### 4. Start the development server

```bash
npm run dev
```

| URL | Purpose |
|---|---|
| `http://localhost:5001/` | Health check response |
| `http://localhost:5001/api-docs` | Swagger UI |
| `http://localhost:5001/api-docs.json` | Raw OpenAPI JSON |

---

## Environment Variables

Create `.env` in the project root. **Never commit this file.**

```env
# Server
PORT=5001
NODE_ENV=development        # must be "production" on Vercel

# MongoDB Atlas
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/<dbname>

# JWT
JWT_SECRET=replace_with_a_long_random_secret_min_32_chars

# Cloudinary
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret

# Gmail SMTP
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop   # 16-char App Password (spaces stripped automatically)

# AI Recommendations (optional)
AI_BASE_URL=https://openrouter.ai/api/v1
AI_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx
AI_MODEL=google/gemma-4-26b-a4b-it:free
```

### Generating a Gmail App Password

1. Enable **2-Step Verification** on your Google account
2. Go to **Google Account → Security → App Passwords**
3. Select **Mail**, click **Generate**
4. Paste the 16-character code as `EMAIL_PASS`

---

## Deployment

### Vercel (recommended)

#### 1. Push to GitHub

```bash
git add .
git commit -m "chore: production deploy"
git push origin main
```

#### 2. Import on Vercel

1. Visit [vercel.com/new](https://vercel.com/new) → import the repo
2. Vercel detects `vercel.json` and uses `@vercel/node` automatically
3. Click **Deploy**

#### 3. Add Environment Variables

**Project Settings → Environment Variables:**

| Key | Required | Note |
|---|:---:|---|
| `MONGO_URI` | ✓ | Full Atlas connection string with DB name |
| `JWT_SECRET` | ✓ | Min 32 random characters |
| `EMAIL_USER` | ✓ | Gmail address |
| `EMAIL_PASS` | ✓ | App Password — no spaces |
| `CLOUD_NAME` | ✓ | Cloudinary cloud name |
| `CLOUD_API` | ✓ | Cloudinary API key |
| `API_SECRET` | ✓ | Cloudinary API secret |
| `NODE_ENV` | ✓ | Must be `production` |
| `AI_BASE_URL` | — | OpenRouter base URL |
| `AI_API_KEY` | — | OpenRouter API key |
| `AI_MODEL` | — | Model name string |

#### 4. Redeploy

**Deployments → latest → ⋮ → Redeploy** after adding env vars.

> **Why `NODE_ENV=production` is critical:** The JWT cookie uses `SameSite=None; Secure=true` in production — mandatory for cross-origin cookies between Vercel-hosted frontend and backend. Without it, every protected API call returns 401.

---

## Architecture

```
HTTP Request
      |
      v
  index.js — middleware pipeline
  express.json() → cookieParser() → cors()
      |
      v
  routes/*.js — URL matching + Swagger JSDoc annotations
      |
      v
  isAuthenticated.js — JWT cookie verification (protected routes only)
      |
      v
  controllers/*.js — business logic
      |
      ├── models/*.js ─────────────► MongoDB Atlas
      ├── cloud.js + datauri.js ───► Cloudinary CDN
      ├── mailer.js ───────────────► Gmail SMTP
      └── aiClient.js ─────────────► OpenRouter AI API
```

### Cookie auth lifecycle

```
Login:
  POST /api/user/login
    1. bcrypt.compare(password, hash)
    2. jwt.sign({ userId }, secret, { expiresIn: '1d' })
    3. res.cookie('token', jwt, { httpOnly, sameSite: 'None', secure: true })

Protected request:
  GET /api/application/apply/:id
    1. isAuthenticated reads req.cookies.token
    2. jwt.verify(token, secret) → req.id = userId
    3. applyJob controller uses req.id
```

---

## License

ISC © 2025 DevHunt
