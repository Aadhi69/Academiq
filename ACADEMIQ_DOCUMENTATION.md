# ACADEMIQ — Institutional Faculty Work Assignment & Progress Management Platform

**Department of Electrical and Electronics Engineering (EEE)**  
**Kalasalingam Academy of Research and Education (KLU)**  

---

## 1. Executive Summary & Vision

**Academiq** is a production-grade, internal departmental SaaS platform engineered specifically for academic governance, task delegation, deliverable tracking, and accreditation documentation compliance (NAAC/NBA).

It eliminates fragmented communication (email chains, WhatsApp notices, untracked spreadsheets) by centralizing all faculty workload assignments under a unified dashboard.

---

## 2. Core Architectural Pillars

### A. Academic-First Focus (Zero Financial / E-Commerce Clutter)
- Replaced all generic template metrics with real academic KPIs: **Department Deliverables**, **Faculty On-Time Completion Rate**, **NAAC Criteria Compliance**, and **Overdue Mitigation**.
- No pricing tiers, no revenue counters, no commercial placeholders.

### B. Pure White SaaS Visual System
- **Background**: Pristine `#F8FAFC` canvas with pure `#FFFFFF` card elevations and crisp `1px border-slate-200` micro-borders.
- **Brand Typography & Logo**: High-contrast slate typography (`#0F172A`) paired with the official **`ACADEMIQ`** brandmark featuring the signature crimson `Q` terminal.
- **Sidebar & Navigation**: Streamlined collapsible navigation sidebar without any non-institutional tags (`PRO`/`NEW` removed).

### C. 1-Click Drive Upload & Immediate Completion
- When faculty attach and verify their deliverable's **Google Drive Link**, Academiq updates the status directly to **`COMPLETED`**, records the submission timestamp, logs the activity in the departmental audit trail, and dispatches a notification to the HOD.

---

## 3. User Roles & Workflows

### 👑 Head of Department (HOD / Admin)
- **Dashboard Command Center**: 
  - 4-Card Overview: Total Department Tasks, In Progress, Completed, and Overdue deliverables.
  - Interactive Analytics: On-Time Delivery Compliance Sparkline, Active Faculty Engagement Curve, and Deliverable Category Breakdown.
  - Urgent Attention Queue: Highlights overdue assignments requiring immediate intervention.
- **Task Delegation Engine (`/admin/tasks/new`)**:
  - Multi-faculty assignment support.
  - Priority levels (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) with color-coded badges.
  - Designated Google Drive target folder URL specification.
  - Categorization across Syllabus Revision, NAAC Criteria, NBA Tier-1, Examination Duties, and Research Grants.
- **Faculty Roster & Capacity Tracker (`/admin/faculty`)**:
  - Live workload status, assigned tasks count, and historical on-time completion rates for all 8 EEE faculty members.
- **Accreditation Reports & CSV Export (`/admin/reports`)**:
  - Comprehensive department metrics exportable to standard `.csv` with a single click.
- **System Settings & Audit Log (`/admin/settings`)**:
  - Immutable event log capturing all creation, status change, and revision timestamps.

---

### 👨‍🏫 Faculty Member
- **Personal Workbench (`/faculty/dashboard`)**:
  - At-a-glance KPI summary of personal assignments.
  - Completion performance curve and active deliverable queue.
- **Deliverable Submission Portal (`/faculty/tasks/[id]`)**:
  - Direct access to HOD instructions and Google Drive destination folder.
  - 1-Click submission modal to provide the artifact link and mark the deliverable as **`COMPLETED`**.
- **First-Time User Onboarding**:
  - Built-in interactive modal upon first login introducing the dashboard features and submission workflow.
- **Faculty Profile & Credentials (`/faculty/profile`)**:
  - Official KLU ID, EDU ID, designation, and individual performance metrics.

---

## 4. Official Seeded EEE Department Roster

| Name | Role | Designation | Institutional Email | KLU ID / EDU ID |
| :--- | :--- | :--- | :--- | :--- |
| **Dr. K. Vijayakumar** | `HOD / Admin` | Head of Department & Professor | `hod.eee@klu.ac.in` | `KLU-EEE-001` / `EDU-001` |
| **Dr. P. Aruna** | `Faculty` | Associate Professor | `aruna.p@klu.ac.in` | `KLU-EEE-002` / `EDU-002` |
| **Dr. M. Senthil Kumar** | `Faculty` | Associate Professor | `senthil.m@klu.ac.in` | `KLU-EEE-003` / `EDU-003` |
| **Dr. R. Karthik** | `Faculty` | Assistant Professor (SG) | `karthik.r@klu.ac.in` | `KLU-EEE-004` / `EDU-004` |
| **Dr. S. Balamurugan** | `Faculty` | Assistant Professor | `balamurugan.s@klu.ac.in` | `KLU-EEE-005` / `EDU-005` |
| **Dr. N. Deepa** | `Faculty` | Assistant Professor | `deepa.n@klu.ac.in` | `KLU-EEE-006` / `EDU-006` |
| **Dr. G. Ramesh** | `Faculty` | Assistant Professor | `ramesh.g@klu.ac.in` | `KLU-EEE-007` / `EDU-007` |
| **Dr. K. Saravanan** | `Faculty` | Assistant Professor | `saravanan.k@klu.ac.in` | `KLU-EEE-008` / `EDU-008` |

---

## 5. Technology Stack & Key Libraries

- **Framework**: Next.js 15.5+ (App Router)
- **Frontend Engine**: React 19, TypeScript
- **Styling**: Tailwind CSS v4 (Pure White institutional SaaS design system)
- **Icons**: Lucide React
- **Authentication**: Firebase Authentication (Google OAuth ready + 1-Click Roster quick-login)
- **Database & Sync**: Cloud Firestore client + In-Memory Reactive Store fallback
- **Search**: Global Command Palette (`⌘K` / `Ctrl+K`)
- **Error Handling**: Custom 404 (`not-found.tsx`) and Error Boundary (`error.tsx`)

---

## 6. Local Development & Firebase Setup

### Running Locally
```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Build for production verification
npm run build
```
Navigate to `http://localhost:3000` in your browser.

### Connecting Live Firebase Credentials
Create a `.env.local` file in the root directory with your Firebase Project keys:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=academiq-klu.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=academiq-klu
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=academiq-klu.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
```

---

## 7. Vercel Deployment Guide

1. Push the repository to GitHub:
   ```bash
   git add .
   git commit -m "Deploy Academiq EEE Department Platform"
   git push origin main
   ```
2. In the **Vercel Dashboard**, click **Add New Project** &rarr; Select your GitHub repository.
3. Configure the Environment Variables under **Settings &rarr; Environment Variables** using the Firebase keys above.
4. Click **Deploy**. Vercel will automatically run `npm run build` and launch the application.

---
*Built for the Department of Electrical & Electronics Engineering, Kalasalingam Academy of Research and Education.*
