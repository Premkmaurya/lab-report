# Laboratory Management System (LMS) - Enterprise Edition

Welcome to the Enterprise Edition of the Laboratory Management System. This repository contains both the React/Vite frontend and the Node.js/Express backend for a production-grade, highly optimized, and resilient healthcare application.

## Overview
This platform is designed to manage patients, laboratory tests, doctors, and departments. It is feature-complete with robust security, observability, and data-durability mechanisms built directly into the application layer.

## Enterprise Architecture Enhancements

### 1. Robust Security & Authorization
- **JWT & Role-Based Access Control (RBAC):** Every route is protected. Only specific roles (`admin`, `lab_technician`, etc.) can access authorized endpoints.
- **Strict Rate Limiting:** All API endpoints are protected from DDoS and brute force attacks using `express-rate-limit`.

### 2. Observability & Logging
- **Winston Centralized Logging:** Console logs have been replaced with a centralized Winston logging strategy. Logs are automatically rotated, saved locally to `logs/`, and completely redact sensitive PII (passwords, tokens, cookies).
- **Express Status Monitor:** Real-time observability dashboard (CPU, Memory, Request Rate, Response Times) available to administrators at `/status`.
- **Health Checks:** Native `/api/health` endpoint for infrastructure orchestrators (Kubernetes, Docker Swarm, UptimeRobot) to ping the application and database health.

### 3. Data Durability & Integrity
- **Native MongoDB Backups:** A native backup service using `node-cron` automatically archives the entire database every night at 2:00 AM using `mongodump`.
- **Automated Retention Policies:** Backups older than 7 days are automatically purged to prevent server disk space exhaustion.
- **Soft Deletion:** The system uses `mongoose-delete` to globally prevent hard-deletions of critical patient and laboratory data. Deleted records are flagged as invisible rather than physically destroyed, ensuring zero risk of accidental data loss.

### 4. Performance Optimization
- **B-Tree Indexing:** Core Mongoose schemas (`Patient`, `Test`, `Department`) are optimized with strategic indexing to eliminate full collection scans.
- **Centralized Configuration:** Environment variables are strictly parsed, validated, and normalized in `config.js` to prevent missing credentials and environment drift.
- **Centralized Error Handling:** Refactored controllers using `asyncHandler` logic combined with a global error handling middleware to automatically catch unhandled exceptions, normalize API error responses, and prevent server crashes.

## Tech Stack
- **Frontend:** React, Vite, TailwindCSS
- **Backend:** Node.js, Express, Winston
- **Database:** MongoDB (Mongoose)

## Getting Started

1. Set up your environment variables. You can find an example template in `backend/.env.example`.
2. Install dependencies:
   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```
3. Run the development server:
   ```bash
   cd backend
   npm run dev
   ```

*Built with ❤️ for enterprise reliability.*
