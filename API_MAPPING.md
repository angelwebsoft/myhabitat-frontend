# 🔌 API Mapping (Frontend ↔ Backend)

This document defines which frontend pages use which APIs.

---

## 🔐 Authentication

### Login Page

Route: /auth/login
API:

- POST /login

Purpose:

- Authenticate user
- Store user & role in localStorage
- Redirect based on role

---

## 👮 Gatekeeper Module

### Dashboard

Route: /gatekeeper/dashboard
API:

- GET /visitors

Purpose:

- Display visitor logs
- Show recent entries

---

### New Visitor

Route: /gatekeeper/new-visitor
API:

- POST /visitor/add

Purpose:

- Add new visitor entry

---

### Scan QR

Route: /gatekeeper/scan-qr
API:

- GET /visitors (by ID / QR data)

Purpose:

- Fetch visitor details
- Verify entry

---

## 👨‍💼 Admin Module

### Dashboard

Route: /admin/dashboard
API:

- GET /visitors

Purpose:

- Show overall visitor activity

---

### Residents

Route: /admin/residents
API:

- Not implemented

Purpose:

- Future feature

---

## 🏠 Resident Module

### Dashboard

Route: /resident/dashboard
API:

- GET /visitors

Purpose:

- View visitor history

---

### Pre-Approve Visitor

Route: /resident/pre-approve
API:

- POST /visitor/add

Purpose:

- Pre-approve visitor before arrival

---

## 🚫 Not Implemented APIs

- /complaints ❌
- /notices ❌

---

## ⚠️ Rules

- Do NOT use APIs that are not implemented
- Always handle API errors
- Use centralized api.service.ts
