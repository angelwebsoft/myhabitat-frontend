# 📌 Project Overview (Frontend)

This is an Ionic Angular mobile application for society management.

### ✅ Implemented Features:

- Authentication (Login)
- Role-based system (Admin, Gatekeeper, Resident)
- Visitor Management
- QR Scan (Gatekeeper)
- Pre-approve visitor (Resident)
- Dashboard (All roles)

### 🚧 Pending Features:

- Complaint Management (NOT IMPLEMENTED)
- Notice Board (NOT IMPLEMENTED)

---

# ⚠️ Important Context

- This is ONLY frontend project
- Backend is separate
- Do NOT modify backend logic

---

# 📁 Folder Structure (Important)

src/app/

- components/ → reusable UI components
- core/ → config & constants
- guards/ → route protection (home.guard, role.guard)
- models/ → data models (visitor.model.ts)
- pages/ → role-based pages (admin, gatekeeper, resident, auth)
- services/ → API & business logic

---

# 🧠 Coding Rules

- Use strict TypeScript
- Do NOT use `any`
- Use models for typing
- Keep logic inside services (NOT in pages)
- Use optional chaining (?.)

---

# 🎨 UI Rules

- Use Ionic components
- Reuse components from `/components`
- Maintain consistent spacing (Tailwind)
- Do NOT create duplicate components

---

# 🔐 Authentication

- localStorage keys:
  - `user`
  - `userRole`

- Use `role.guard.ts` for access control

---

# 🔌 API Rules

### ✅ Available APIs:

- POST /login
- GET /visitors
- POST /visitor/add

### ❌ Not Available:

- /complaints
- /notices

👉 Do NOT use non-existing APIs

---

# 🔄 Navigation

- Role-based routing:
  - Admin → /admin/dashboard
  - Gatekeeper → /gatekeeper/dashboard
  - Resident → /resident/dashboard

- Use Angular Router

- Handle Ionic back navigation properly

---

# ⚠️ Feature Restrictions

- Do NOT create complaints module
- Do NOT create notices module
- Work ONLY on existing features unless asked

---

# ⚡ Do's

- Follow existing folder structure
- Reuse services and components
- Write clean and maintainable code

---

# ❌ Don'ts

- Do not break existing functionality
- Do not change API response structure
- Do not add unnecessary libraries
- Do not write business logic in components

---

# 🤖 Instructions for Claude

- Always provide FULL working code
- Follow this project structure strictly
- Do NOT generate unnecessary features
- Do NOT break existing flow
- Keep solution simple and practical
- Ask if requirement is unclear

---

# 📚 Additional Docs

- API Mapping → see API_MAPPING.md
- Role Flow → see ROLE_FLOW.md
- Visitor Guidelines → see VISITOR_GUIDE.md

---

# 📝 Task Handling

- Provide complete solution (HTML + TS if needed)
- Keep compatibility with current code
- Avoid over-engineering
