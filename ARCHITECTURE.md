# Society Visitor Management System (VMS) - Architecture (Updated for MongoDB)

## 1. Database Schema (MongoDB / Mongoose)

### Collections

#### `societies`
- `name`: String
- `address`: String
- `total_flats`: Number
- `created_at`: Date

#### `users`
- `id`: String (Firebase Auth UID or unique ID)
- `name`: String
- `mobile`: String (Unique)
- `role`: 'admin' | 'resident' | 'gatekeeper'
- `flat_number`: String (optional)
- `society_id`: String (ref: societies.id)
- `fcm_token`: String
- `created_at`: Date

#### `visitors`
- `visitor_name`: String
- `mobile`: String
- `flat_number`: String
- `purpose`: String
- `photo_url`: String
- `status`: 'pending' | 'approved' | 'rejected' | 'checked-in' | 'checked-out'
- `check_in_time`: Date | null
- `check_out_time`: Date | null
- `gatekeeper_id`: String (ref: users.id)
- `resident_id`: String (ref: users.id)
- `society_id`: String (ref: societies.id)
- `created_at`: Date

#### `pre_approved_guests`
- `resident_id`: String (ref: users.id)
- `visitor_name`: String
- `mobile`: String
- `valid_date`: Date
- `society_id`: String (ref: societies.id)
- `status`: 'pending' | 'used'

---

## 2. Backend API (Node.js + Express)

- **Port**: 5000
- **Base URL**: `/api`
- **Endpoints**:
    - `POST /api/users`: Create/Register user.
    - `GET /api/users`: List users.
    - `POST /api/visitors`: Create visitor entry.
    - `GET /api/visitors`: List visitors (filtered by society/status).
    - `PUT /api/visitors/:id`: Update status (Approve/Reject).

---

## 3. App Screens (Ionic)

### Auth
- **OTP**: Phone login via Firebase Auth (maintained for security).
- **Role Redirect**: Check user role from MongoDB and navigate.

### Gatekeeper
- **Dashboard**: Stats and quick actions.
- **New Entry**: Form with photo capture. Calls `POST /api/visitors`.

### Resident
- **Dashboard**: Current visitors at home.
- **Approvals**: Pending requests. Calls `PUT /api/visitors/:id`.

---

## 4. Folder Structure

```text
GatePass/
├── server/            # Node.js + MongoDB Backend
│   ├── config/        # DB connection
│   ├── models/        # Mongoose Schemas
│   └── index.js       # Express Server & Routes
├── src/               # Ionic / Angular Frontend
│   ├── app/
│   │   ├── services/
│   │   │   ├── api.service.ts  # Connector to Node backend
│   │   │   └── data.service.ts # Legacy / State management
│   └── environments/  # API configuration
```
