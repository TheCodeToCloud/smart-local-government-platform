<div align="center">
  <img src="frontend/public/Emblem_of_Nepal.svg.png" alt="Emblem of Nepal — Government of Nepal official seal" width="120" />
  <h1>🇳🇵 Smart Local Government Platform</h1>
  <p><strong>स्मार्ट स्थानीय सरकार प्लेटफर्म</strong></p>
  <p>A comprehensive, full-stack digital governance solution designed to modernize local government services in Nepal — with genuine AI-adjacent smart features built for final year project defense.</p>
</div>

<hr />

## 📖 Table of Contents
- [About the Project](#about-the-project)
- [What Makes This Platform Smart](#-what-makes-this-platform-smart)
- [Key Features](#-key-features)
- [Technology Stack](#️-technology-stack)
- [Smart Services Architecture](#-smart-services-architecture)
- [Folder Structure](#-folder-structure)
- [Prerequisites](#️-prerequisites)
- [Step-by-Step Installation](#-step-by-step-installation)
- [Environment Variables](#-environment-variables)
- [Usage Guide](#-usage-guide)
- [Deployment](#️-deployment)

---

## 🏛️ About the Project
The **Smart Local Government Platform** digitizes and streamlines the process of acquiring civic certificates (Birth, Marriage, Citizenship, Residence, Death, Income, Character) from local ward offices in Nepal. It eliminates physical paperwork, reduces processing times, and provides a transparent, trackable system for both citizens and government administrators — backed by rule-based intelligence that processes data, flags anomalies, and guides users automatically.

---

## 🧠 What Makes This Platform Smart

> **This section is for viva defense. Read these answers directly if asked "why is this smart and not just a CRUD app?"**

### 1. 📄 OCR-Powered Document Auto-Fill
When a citizen uploads their citizenship card, the system uses **Tesseract.js** (an open-source OCR engine) to read the image and automatically extract their citizenship number, full name, and date of birth. The citizen then sees a banner: *"We detected: Name: X, Citizenship No: Y — Use this to auto-fill?"* and can accept with one click. This eliminates manual transcription errors — a genuine data-extraction pipeline, not a form shortcut.

### 2. ⏱️ Predictive Processing Time Estimates
Instead of a hardcoded "7 days" label, the platform predicts a **personalized processing time range** for each certificate type using a weighted formula derived from real historical data:
> **Estimated Days = Base Historical Average + (Current Backlog ÷ Daily Approval Rate)**
This is a lightweight **regression-style prediction** that factors in the current queue length and office throughput. It updates dynamically as the backlog changes.

### 3. 🚨 Anomaly Detection for Fraud Prevention
Before every application is saved, the system runs a 3-rule anomaly detection engine:
- **Identity fraud check**: is the submitted citizenship number already associated with an approved application for a *different* user?
- **Abuse/spam check**: has the same user submitted more than 3 applications for the same certificate type in the last 30 days?
- **Age constraint check**: is the applicant below the legal minimum age for that certificate type (e.g., 16+ for citizenship, 20+ for marriage)?
Flagged applications are still accepted but marked `flaggedForReview: true` with specific `flagReasons[]`, surfaced prominently in the admin dashboard. The system never auto-rejects citizens — it assists admins in prioritizing review.

### 4. 🤖 Rule-Based Smart Assistant Widget
A floating chat widget available on all citizen-facing pages implements a **rule-based expert system** — a legitimate and established form of AI for regulated domains. Citizens type natural-language queries like *"I need proof I live here"* and the assistant maps keywords to the correct certificate type, returns the required documents checklist, and pulls a **live processing time estimate** from the prediction engine. No external LLM API needed — it works offline, has zero recurring cost, and produces consistent, legally-sound answers.

---

## ✨ Key Features

### 👥 For Citizens (Users)
- **Authentication:** Secure Registration and Login using JWT with brute-force lockout
- **Certificate Applications:** Apply for 7 distinct certificate types with multi-step form
- **OCR Auto-Fill:** Upload citizenship document → system extracts and pre-fills personal details
- **Processing Time Prediction:** See a personalized estimated processing window before submitting
- **Smart Validation:** Rule-based pre-submission check catches missing fields and document gaps
- **Real-Time Tracking:** Live application status updates via WebSocket (Socket.IO)
- **Instant Notifications:** In-app push notifications the moment an admin acts on an application
- **Digital Certificates & QR Code:** Download officially generated PDF certificates with verifiable QR codes
- **Smart Assistant:** Floating chat widget helps citizens identify the right certificate and required documents

### 👨‍💼 For Administrators
- **Admin Dashboard:** Live metrics with priority queue, certificate distribution chart, smart insights panel
- **Anomaly/Fraud Flagging:** Automatically flagged suspicious applications with specific reason badges
- **Application Review:** View uploaded documents (stored on Cloudinary), approve/reject with remarks
- **Automated Certificate Issuance:** Approval auto-generates a PDF, uploads it to Cloudinary, and triggers a real-time notification to the citizen
- **User Management:** Paginated user list with search, role filter, and status toggle

### 🔒 Security & System Features
- **express-validator middleware** on all POST/PUT routes (email format, date ranges, enum validation)
- **File-Type magic-byte verification** on document uploads (prevents disguised malicious files)
- **React Error Boundary** catching render crashes with a friendly fallback UI
- **CORS strict allowlist** — no wildcards, only whitelisted origins
- **Morgan production logging** — logs paths/status only, never request bodies or tokens
- **MongoDB connection retry** — exponential backoff (up to 5 attempts) before fatal crash
- **Public Verification Portal** — scan QR or enter certificate number to verify authenticity

---

## 🛠️ Technology Stack

### Frontend (Client-Side)
| Technology | Version | Purpose |
|---|---|---|
| **React.js** | v18 | Component-based UI library |
| **TypeScript** | v5 | Type safety across all components |
| **Vite** | v5 | Lightning-fast dev server and build tool |
| **TailwindCSS** | v3 | Utility-first CSS with custom design tokens |
| **React Router DOM** | v6 | Client-side routing with protected routes |
| **Socket.IO Client** | v4 | Receiving real-time WebSocket events |
| **Axios** | v1 | HTTP client with interceptors for JWT auth |

### Backend (Server-Side)
| Technology | Version | Purpose |
|---|---|---|
| **Node.js & Express.js** | LTS / v4 | REST API framework |
| **MongoDB & Mongoose** | v8 | NoSQL database with schema validation |
| **Socket.IO** | v4 | Real-time bi-directional event communication |
| **JSON Web Token** | v9 | Stateless authentication |
| **Cloudinary** | v1 | Cloud storage for uploaded documents and generated PDFs |
| **Multer** | v1 | Multipart file upload handling |
| **Tesseract.js** | v7 | OCR engine for citizenship document text extraction |
| **file-type** | v16 | Magic-byte file validation (security layer) |
| **PDFKit** | v0.14 | Server-side PDF generation for certificates |
| **QRCode** | v1 | Generating verifiable QR codes embedded in PDFs |
| **express-validator** | v7 | Route-level request validation middleware |
| **Helmet** | v7 | HTTP security headers |
| **Morgan** | v1 | Production-safe HTTP request logging |
| **express-rate-limit** | v7 | Rate limiting on auth and API routes |
| **bcryptjs** | v2 | Password hashing |

---

## 🏗️ Smart Services Architecture

```
backend/services/
├── ocrService.js           — Tesseract.js OCR pipeline for citizenship document extraction
├── predictionService.js    — Processing time prediction using historical + backlog formula
├── smartValidationService.js — Rule-based anomaly detection (fraud, abuse, age)
├── assistantService.js     — Rule-based expert system for citizen guidance widget
├── certificateService.js   — PDF generation with QR code embedding
└── notificationService.js  — In-app notification creation
```

---

## 📁 Folder Structure

```text
Smart Local Government Platform/
├── render.yaml              # Render deployment blueprint (backend + frontend)
├── DEPLOYMENT.md            # Step-by-step production deployment guide
├── backend/
│   ├── config/              # MongoDB (with retry backoff) + Cloudinary setup
│   ├── controllers/         # Route logic (Auth, Admin, Applications)
│   ├── middleware/           # JWT auth, validation chains, upload, error handling
│   ├── models/              # Mongoose schemas (User, Application, Certificate, Notification)
│   ├── routes/              # Express API routes
│   ├── services/            # All smart feature logic (OCR, prediction, anomaly, assistant)
│   ├── socket.js            # Socket.IO singleton (getIO pattern)
│   ├── Dockerfile           # Node 20 Alpine production container
│   └── server.js            # App entry point
│
└── frontend/
    ├── public/              # Static assets
    ├── src/
    │   ├── components/
    │   │   ├── common/      # ErrorBoundary, Navbar, Loader, EmptyState, StatusBadge
    │   │   ├── smart/       # AssistantWidget, ProcessingTimeEstimate, DocumentUploadZone
    │   │   └── ui/          # Toast notifications, modals
    │   ├── hooks/           # useAuth, useSocket, useNotifications
    │   ├── pages/           # All page-level components
    │   ├── services/        # api.ts — centralized Axios API interface
    │   └── types/           # TypeScript interfaces
    └── vite.config.ts
```

---

## ⚙️ Prerequisites
- **Node.js** v20 or higher
- **Git**
- A **MongoDB Atlas** account (free M0 cluster)
- A **Cloudinary** account (free tier)

---

## 🚀 Step-by-Step Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/smart-gov-nepal.git
cd smart-gov-nepal
```

### 2. Setup the Backend
```bash
cd backend
npm install
# Copy and fill in your environment variables:
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and Cloudinary credentials
npm run dev
# Server starts on http://localhost:5000
```

### 3. Setup the Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if needed (defaults work for local development)
npm run dev
# App starts on http://localhost:5173
```

---

## 🔑 Environment Variables

See [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example) for the full annotated list with instructions.

### Backend (required variables)
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/smartgov
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
PORT=5000
```

### Frontend
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 💻 Usage Guide

### Citizen Flow
1. **Register** a new account
2. Go to **Apply for Certificate** and choose a type
3. Upload your citizenship document — the OCR engine auto-fills your details
4. The **Processing Time Estimate** shows a data-driven time range before you submit
5. Submit — if anomalies are detected, your application is still accepted but flagged for admin review
6. Track status in **My Applications** with live Socket.IO updates
7. Once approved, download your PDF certificate and verify it with the public QR portal

### Admin Flow
1. Login with an admin account (run `node updateAdmin.js` once to seed)
2. **Admin Dashboard** shows flagged applications prominently, priority queue, and smart insights
3. Review an application → view uploaded documents → Approve or Reject with remarks
4. Approval automatically: generates a PDF, uploads to Cloudinary, sends a WebSocket notification to the citizen

---

## ☁️ Deployment

See the full step-by-step guide in [DEPLOYMENT.md](DEPLOYMENT.md).

The project deploys to **Render** as two services defined in `render.yaml`:
- **Backend**: Node.js web service with health check at `/health` and MongoDB retry on startup
- **Frontend**: Static site with SPA rewrite rules (all 404s → `index.html` for React Router)

---

<div align="center">
  <p>Built to empower citizens and digitize Nepal's local administrative services.</p>
  <p><em>Developed as a final year Computer Science project — Tribhuvan University</em></p>
</div>
