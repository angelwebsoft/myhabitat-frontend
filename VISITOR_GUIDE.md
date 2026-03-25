# 👤 Visitor Module Guide

This document defines structure and rules for visitor management.

---

## 📦 Data Model (As per Database)

Visitor Object:

{
\_id?: ObjectId,
id: string,
visitor_name: string,
mobile: string,
flat_number: string,
purpose: string,
status: 'checked-in' | 'checked-out',
check_in_time?: string,
check_out_time?: string,
gatekeeper_id: string,
resident_id: string,
society_id: string,
created_at: string
}

---

## 🔌 APIs Used

- GET /visitors → fetch visitor list
- POST /visitor/add → create visitor entry

---

## 📍 Usage by Role

### 👮 Gatekeeper

- Add new visitor
- Scan QR (for pre-approved guests)
- Check-in / Check-out visitor
- View visitor logs

---

### 👨‍💼 Admin

- View all visitor records
- Monitor activity

---

### 🏠 Resident

- View visitor history
- Pre-approve visitors (stored in preapprovedguests collection)

---

## 🧠 Coding Rules

- Use exact field names from database:
  - visitor_name (NOT name)
  - mobile (NOT phone)
  - check_in_time / check_out_time

- Do NOT use `any`
- Keep API logic in api.service.ts
- Do NOT write API logic in components

---

## 🔄 Data Flow

1. Component calls api.service
2. Service calls backend API
3. API returns data (same structure as DB)
4. Component renders UI

---

## ⚡ Optimization Rules

- Avoid duplicate API calls
- Reuse visitor data using data.service.ts (if needed)
- Use caching for performance

---

## 🎨 UI Rules

- Use existing components:
  - common-input
  - common-button

- Keep UI simple and consistent

---

## ⚠️ Validation

- visitor_name is required
- mobile is required
- flat_number is required
- Do NOT allow empty values

---

## ❌ Restrictions

- Do NOT change API field names
- Do NOT modify response structure
- Do NOT duplicate logic
- Do NOT use incorrect status values

---

## 🚀 Status Rules

- "checked-in" → visitor entered
- "checked-out" → visitor exited

---

## 🔗 Related Collection

### preapprovedguests

- Used for QR-based entry
- Linked via:
  - resident_id
  - mobile

- status:
  - pending
  - used
  - expired

---

## 🚧 Future Scope

- Visitor filters (date-wise)
- Export visitor data
- Complaint & notice integration (later)
