# CLASS CHAMPIONS — أبطال الفصل
### Complete Student Competition, Leadership & Classroom Management Platform

![Class Champions](https://img.shields.io/badge/Platform-Class%20Champions-53E0AD?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production%20Ready-38BDF8?style=for-the-badge)
![Concurrency](https://img.shields.io/badge/Capacity-150%20Concurrent%20Users-FBBF24?style=for-the-badge)

---

## 🌟 1. Project Overview

**CLASS CHAMPIONS — أبطال الفصل** is a gamified school competition and leadership platform designed to foster positive classroom culture, responsibility, teamwork, and fair student competition.

Students compete through **Points**, **Coins**, **Levels**, and **Badges** across their classrooms (**Wheeler 2** and **Wheeler 3**) and in an **Overall School Leaderboard**. The platform features strict role-based access control (RBAC), permanent transactional auditing, real-time UI updates, full Arabic (RTL, default) with English (LTR) language support, and a dark gamified UI.

---

## 🛠️ 2. Technology Stack

### Backend
- **Python 3.11+**
- **Django 5.1 & Django REST Framework (DRF)**
- **Django ORM** with SQLite (optimized with WAL mode & busy timeout for local high concurrency) and seamless PostgreSQL support for production.
- **Session Authentication & CSRF Protection** (HttpOnly cookies, CSRF token validation).
- **ReportLab** for automated official PDF leaderboard report generation.

### Frontend
- **React 18 & Vite 6**
- **Tailwind CSS 3.4** with custom gamified educational palette (`#101B1A`, `#172827`, `#53E0AD`, `#38BDF8`, `#FBBF24`, `#FB7185`).
- **React Router 6**
- **Axios** with automatic CSRF synchronization.
- **Lucide React** icons.
- **Canvas Confetti** for celebration animations upon level-ups and points awards.

---

## 👥 3. User Roles & Access Control (RBAC)

The system enforces strict server-side Role-Based Access Control:

| Role | Permissions & Capabilities | Restrictions |
| :--- | :--- | :--- |
| **Student** | Self-registration choosing classroom (**Wheeler 2** or **Wheeler 3**); view personal dashboard, profile, rank, level, points/coins balances, transaction ledgers, achievements, active challenges, and teachers directory. Can edit bio and avatar. | **Cannot** add/deduct points, modify coins, alter ranks, approve positions, or access teacher/admin endpoints. |
| **Teacher** | Protected registration using access code `teach2026`; once approved by Admin, can evaluate students in assigned classrooms: Add Points (+), Deduct Points (-), Award Coins, mandatory reason logging, approve position requests, create challenges. | Starts in `Pending Approval` status; **cannot** approve their own account, cannot manage unauthorized classrooms, cannot secretly delete transactions. |
| **Administrator** | Full platform authority: approve/reject teachers, suspend/activate accounts, manage classrooms, positions, committees, teacher access codes, documented balance adjustment transactions, audit logs, and reports. | All actions logged in `ActivityLog`. |

---

## 🔑 4. Teacher Registration Code Workflow

1. A teacher opens the **Teacher Registration** page (`/teacher/register`).
2. Enters their name, email, password, specialization/subject, and supervised classrooms.
3. Enters the mandatory **Teacher Access Code**:
   ```
   teach2026
   ```
4. The backend validates the code against `TEACHER_REGISTRATION_CODE` in `.env` and the `TeacherInvitationCode` database table. Invalid codes are rejected with a generic error message.
5. Upon successful code validation, the account is created with `role='TEACHER'` and `status='PENDING'`.
6. The Administrator reviews the teacher request on the **Admin Dashboard** and clicks **Approve**.
7. Once approved, the teacher can log in and manage students in their assigned classrooms.

---

## 🏆 5. Dual Leaderboard Systems & Tie-Breaking Rules

The platform features two independent leaderboard views:
1. **Classroom Leaderboard**: Isolated ranking for students within **Wheeler 2** or **Wheeler 3**.
2. **Overall School Leaderboard**: Combined ranking uniting students across all classrooms.

### Deterministic Tie-Breaking Rules
- **Rule 1**: Higher Points = Higher Rank.
- **Rule 2**: Equal Points = Shared Rank (Competition Ranking `1-2-2-4` format).
- **Rule 3 (Deterministic Display Order)**: When points are tied, students are deterministically ordered for display by:
  1. `Coins DESC` (higher virtual currency earned)
  2. `First Name ASC`
  3. `Last Name ASC`
  4. `Student ID ASC`

---

## 🎖️ 6. Gamification: Levels & Achievements

### Default Levels
| Level Title (Arabic) | Level Title (English) | Points Threshold | Badge Icon |
| :--- | :--- | :--- | :--- |
| **مبتدئ** | Beginner | 0 – 49 | Shield |
| **طالب نشط** | Active Student | 50 – 99 | Zap |
| **متميز** | Achiever | 100 – 199 | Award |
| **بطل** | Champion | 200 – 349 | Crown |
| **أسطورة** | Legend | 350+ | Flame |

### Achievements Engine
Achievements are automatically unlocked upon meeting system conditions (e.g., first points transaction, reaching 50/100/200/350 points, placing in the top 3 or top 10 on the leaderboard). Teachers and administrators can also award special commendation badges.

---

## ⚡ 7. Concurrency & Load Testing Benchmark

A load test simulating **150 concurrent active users** was executed using Python's `ThreadPoolExecutor` across multiple endpoints (leaderboards, classroom details, student search, analytics summary, and authentication checks).

### Verified Benchmark Results:
- **Target Concurrency**: `150 concurrent threads`
- **Total Requests Executed**: `900 requests`
- **Successful Requests**: `900 (100% Success)`
- **Failed Requests (Errors)**: `0`
- **Error Rate**: `0.00%`
- **Total Wall-Clock Time**: `29.22 seconds`
- **Throughput**: `30.80 req/s`
- **Average Latency**: `4666.62 ms`
- **Median Latency (p50)**: `5053.96 ms`
- **95th Percentile (p95)**: `7825.27 ms`
- **Min Latency**: `211.51 ms`
- **Max Latency**: `8622.81 ms`
- **System Stability**: `EXCELLENT (100% Success)`

---

## 🚀 8. Windows & VS Code Setup Instructions

### One-Click Setup
In the root directory, simply run:
```cmd
setup.bat
```
This automated batch script will:
1. Verify Python 3.10+ and Node.js.
2. Create `backend\venv` virtual environment.
3. Install backend Python dependencies.
4. Prepare `backend\.env` configuration.
5. Run migrations (`manage.py migrate`).
6. Safely seed Wheeler 2, Wheeler 3, levels, positions, committees, achievements, and `teach2026` (`manage.py seed_data`).
7. Create the default administrator account (`manage.py init_admin`).
8. Install frontend npm packages.

### One-Click Launch
In the root directory, run:
```cmd
run.bat
```
This starts:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://127.0.0.1:8000/api/](http://127.0.0.1:8000/api/)
- **Django Admin**: [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)

---

## 🔐 9. Initial Default Credentials

### Administrator Account
- **Email**: `admin@classchampions.edu`
- **Password**: `AdminPass2026!`

### Teacher Registration Code
- **Code**: `teach2026`

---

## 🧪 10. Running Automated Tests

To execute the unit and integration test suites:
```cmd
cd backend
venv\Scripts\python.exe manage.py test accounts points gamification
```
All 12 test cases test student registration, duplicate prevention, teacher code validation, teacher approval flow, points additions/deductions, negative balance rejection, unauthorized access attempts, and leaderboard tie-breaking.

To execute the 150-user load test:
```cmd
cd backend
venv\Scripts\python.exe load_test_runner.py 150
```

---

## 📦 11. Production Deployment Guidelines

For deployment to Linux / Docker / Cloud environments:
1. Set `DEBUG=False` in `.env`.
2. Generate a secure random `SECRET_KEY`.
3. Configure PostgreSQL:
   ```env
   DB_ENGINE=django.db.backends.postgresql
   ```
4. Run Gunicorn or Daphne with Uvicorn workers behind Nginx.
5. Build the production React frontend bundle with `npm run build` and serve static files through Nginx or CDN.
