# Smart Bluetooth Attendance System

A full-stack, proximity-based attendance system using the **Web Bluetooth API** (GATT) and **FastAPI** backend with **SQLite** storage. Teachers run a 5-minute session window; student phones advertise a BLE service and are detected and marked automatically.

---

## 📁 Project Structure

```
d:\demo\
├── backend/                   # FastAPI Python backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # All API endpoints
│   │   ├── database.py        # SQLAlchemy + SQLite setup
│   │   ├── models.py          # ORM: Student, Session, Attendance
│   │   ├── schemas.py         # Pydantic request/response schemas
│   │   └── crud.py            # All DB operations
│   ├── attendance.db          # Auto-created SQLite database
│   ├── requirements.txt
│   └── venv/                  # Python virtual environment
│
├── frontend/                  # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx  # Main teacher dashboard
│   │   │   ├── Login.jsx      # Login page
│   │   │   ├── StatsCards.jsx # Attendance ratio cards
│   │   │   ├── AttendanceLogs.jsx # Real-time log table + CSV export
│   │   │   ├── StudentRoster.jsx  # Registered students list
│   │   │   └── Toast.jsx      # Toast notification system
│   │   ├── App.jsx            # Root router (Login ↔ Dashboard)
│   │   ├── main.jsx
│   │   └── index.css          # Tailwind + glassmorphism styles
│   ├── index.html
│   ├── vite.config.js         # Proxy: /api → FastAPI:8000
│   └── tailwind.config.js
│
└── README.md
```

---

## 🚀 Quick Start

### 1. Start the Backend (FastAPI)

```powershell
cd d:\demo\backend

# (First time only) Create virtual environment
python -m venv venv

# (First time only) Install dependencies
.\venv\Scripts\pip install -r requirements.txt

# Run the server
.\venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be live at **http://127.0.0.1:8000**  
Interactive docs: **http://127.0.0.1:8000/docs**

The database is auto-created and seeded with **10 students** on first launch.

---

### 2. Start the Frontend (React + Vite)

```powershell
cd d:\demo\frontend

# (First time only) Install node modules
npm install

# Run the dev server
npm run dev
```

The app will be live at **http://localhost:5173** (or 5174 if 5173 is in use).

---

### 3. Login Credentials

| Field    | Value   |
|----------|---------|
| Username | `admin` |
| Password | `admin` |

---

## 📡 How It Works

### Architecture

```
[React Frontend :5173]
       │  /api/*  (Vite proxy)
       ▼
[FastAPI Backend :8000]
       │
       ▼
[SQLite attendance.db]
```

The Vite dev proxy forwards all `/api/*` requests to `http://127.0.0.1:8000`, so the frontend never needs to know the backend port.

### Session Flow

1. Teacher clicks **Start Session** → 5-minute window opens on backend
2. The countdown timer starts in the UI
3. Students are detected via:
   - **Real BLE**: Teacher clicks the 🔵 Bluetooth icon → browser shows device picker → student's phone is selected → Student ID is read from GATT characteristic and sent to backend
   - **Demo Mode**: Toggle **Simulation Mode ON** → system automatically picks random absent students every ~7 seconds and marks them present
4. Attendance log updates live; stats cards refresh
5. Session auto-expires after 5 minutes (or can be stopped manually)
6. Click **Export CSV** to download the attendance sheet

---

## 🔵 Real Web Bluetooth Setup (Physical Devices)

To test with a real phone, the student's device must advertise a BLE service.

### Using nRF Connect App (Android/iOS)

1. Install **nRF Connect** from the Play Store / App Store
2. Go to **Advertiser** tab → tap **+** to add a new advertiser
3. Set:
   - **Name**: `StudentDevice`
   - Add a **Complete Local Name**: `student-S1001` (or any Bluetooth ID from the roster)
4. Add a **GATT Server**:
   - **Service UUID**: `00001234-0000-1000-8000-00805f9b34fb`
   - **Characteristic UUID**: `0000abcd-0000-1000-8000-00805f9b34fb`
   - **Properties**: READ
   - **Value (UTF-8)**: `S1001` *(or the student's ID from the roster)*
5. Start advertising
6. On the teacher's PC (Chrome/Edge), click the 🔵 Bluetooth scan button
7. Select the student's phone from the picker
8. The system reads the value, looks up the student, and marks attendance

> **Note**: Web Bluetooth requires **Chrome or Edge** on desktop. It does **not** work in Firefox or Safari. The page must be served over `localhost` or HTTPS.

---

## 🔌 API Reference

| Method | Endpoint                | Description                              |
|--------|-------------------------|------------------------------------------|
| POST   | `/api/auth/login`       | Authenticate teacher (admin/admin)       |
| POST   | `/api/session/start`    | Start a new 5-minute attendance session  |
| POST   | `/api/session/stop`     | Stop the active session early            |
| GET    | `/api/session/active`   | Get active session + time remaining      |
| POST   | `/api/mark-attendance`  | Mark a student present (by ID or BLE ID) |
| GET    | `/api/stats`            | Get total/present/absent/rate counts     |
| GET    | `/api/students`         | List all registered students             |
| GET    | `/api/attendance`       | List attendance logs for active session  |
| POST   | `/api/seed`             | Re-seed the student database             |

---

## 🗄️ Pre-seeded Students

| ID    | Name          | Bluetooth ID      |
|-------|---------------|-------------------|
| S1001 | Alice Smith   | student-alice     |
| S1002 | Bob Jones     | student-bob       |
| S1003 | Charlie Brown | student-charlie   |
| S1004 | David Davis   | student-david     |
| S1005 | Eva Green     | student-eva       |
| S1006 | Frank White   | student-frank     |
| S1007 | Grace Miller  | student-grace     |
| S1008 | Henry Wilson  | student-henry     |
| S1009 | Ivy Taylor    | student-ivy       |
| S1010 | Jack Evans    | student-jack      |

---

## ✨ Features

- 🔵 **Real Web Bluetooth GATT scanning** (Chrome/Edge)
- 🎭 **Demo Mode** — simulates student check-ins every 7 seconds without any hardware
- ⏱️ **5-minute session timer** with live progress bar
- 🚫 **Duplicate prevention** — each student can only be marked once per session
- 📊 **Live stats cards** — Total / Present / Absent / Attendance Rate
- 📋 **Searchable tables** — for both the log and the roster
- 💾 **CSV export** of the attendance log
- 🔔 **Toast notifications** for every action
- 🌙 **Dark glassmorphism UI** built with Tailwind CSS v3
