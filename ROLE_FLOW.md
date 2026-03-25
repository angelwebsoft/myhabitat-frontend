# 🔁 Role-Based Flow

This document explains user navigation based on roles.

---

## 🔐 Login Flow

1. User enters credentials
2. API call: POST /login
3. On success:
   - Store user in localStorage (`user`)
   - Store role in localStorage (`userRole`)

---

## 🔀 Role-Based Redirect

After login:

- Admin → /admin/dashboard
- Gatekeeper → /gatekeeper/dashboard
- Resident → /resident/dashboard

---

## 👨‍💼 Admin Flow

- Access:
  - Dashboard
  - Residents (future)

- Restrictions:
  - Cannot access gatekeeper pages
  - Cannot access resident pages

---

## 👮 Gatekeeper Flow

- Access:
  - Dashboard
  - New Visitor
  - Scan QR

- Restrictions:
  - Cannot access admin pages
  - Cannot access resident pages

---

## 🏠 Resident Flow

- Access:
  - Dashboard
  - Pre-Approve Visitor

- Restrictions:
  - Cannot access admin pages
  - Cannot access gatekeeper pages

---

## 🔐 Route Protection

- Use role.guard.ts
- Check `userRole` before navigation
- Redirect unauthorized users to login

---

## ⚠️ Rules

- Always validate role before page access
- Do NOT allow cross-role navigation
- Maintain strict role separation
