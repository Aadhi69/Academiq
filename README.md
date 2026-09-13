# ACADEMIQ — Faculty Work Assignment & Progress Management Platform

> **Academic Work. Simplified.**  
> *A modern digital command center for departmental academic work, NBA/NAAC accreditation deliverables, and Google Drive submissions.*  
> **Institution**: Kalasalingam Academy of Research and Education (KLU) &bull; **Department**: Electrical & Electronics Engineering (EEE)

---

## 📌 Product Overview

Academiq is an institutional SaaS platform designed for college engineering departments. It enables the Head of Department (HOD) to delegate responsibilities, set deadlines and priorities, integrate Google Drive submission folders, monitor progress, request revisions, and verify completions with real-time auditability. Faculty members receive clear notifications, deadlines, and a direct workflow to submit their work and track approval status.

### 🌟 Key Features

1. **Two-Sided Institutional RBAC**:
   - **HOD / Admin (`Dr. K. Vijayakumar`)**: Assign work to one or multiple faculty, monitor real-time department KPIs, review submissions, request revisions with feedback notes, approve completions, and export audit reports to CSV.
   - **Faculty (7 Official EEE Members)**: View personalized work items, see priorities and deadlines, launch Google Drive folders with one click, confirm submission of deliverables, and track revision feedback.
2. **Firebase Cloud Backend**:
   - **Firebase Authentication**: Institutional Google Sign-In (`@klu.ac.in`) and Development Account Switcher.
   - **Cloud Firestore**: Real-time collections for `users`, `departments`, `tasks`, `taskAssignees`, `taskActivities`, `notifications`, `emailLogs`, and `auditLogs`.
   - **Firestore Security Rules**: Role-based access control protecting administrative data and privacy.
3. **Google Drive Workflow**:
   - HOD provides a shared Google Drive folder URL for every task.
   - Faculty upload deliverables directly to Google Drive and confirm in Academiq.
   - Zero file-storage hosting costs for the university.
4. **Complete Task Lifecycle**:
   - `PENDING` &rarr; `IN_PROGRESS` &rarr; `SUBMITTED` &rarr; `UNDER_REVIEW` &rarr; `COMPLETED`
   - Revision Loop: `SUBMITTED` &rarr; `REVISION_REQUIRED` (with HOD instructions) &rarr; `IN_PROGRESS` &rarr; `SUBMITTED` &rarr; `COMPLETED`.
5. **Night / Dark Mode**: Full institutional dark mode palette (charcoal/navy background with high contrast readability) toggled seamlessly across the app.
6. **Zero-Cost Operation (₹0 / month)**: Designed entirely to run within Firebase Spark Free Tier and Vercel Free hosting quotas.

---

## 👥 Initial Seed Roster (EEE Department)

| Faculty Name | Designation | KLU ID | EDU ID | Institutional Email | Role |
|---|---|---|---|---|---|
| **Dr. K. Vijayakumar** | Associate Professor & Head | `klu1043` | `KVKEEE` | `k.vijayakumar@klu.ac.in` | **HOD / Admin** |
| **Dr. D. Devaraj** | Senior Professor | `klu875` | `DDREEE` | `d.devaraj@klu.ac.in` | Faculty |
| **Dr. A. Ramkumar** | Professor | `klu792` | `ARKEEE` | `a.ramkumar@klu.ac.in` | Faculty |
| **Dr. K. Rajesh** | Associate Professor | `klu1018` | `KRSEEE` | `k.rajesh@klu.ac.in` | Faculty |
| **Dr. M. Krishna Paramathma** | Associate Professor | `klu1083` | `MKPECE` | `m.krishnaparamathma@klu.ac.in` | Faculty |
| **Dr. S. Rajendran** | Associate Professor | `KLU1368` | `SRNEEE` | `s.rajendran@klu.ac.in` | Faculty |
| **Dr. M. Karuppasamypandiyan** | Associate Professor | `klu1084` | `MKSEEE` | `m.karuppasamypandian@klu.ac.in` | Faculty |
| **P. Priya** | Associate Professor | `klu1196` | `PPAEEE` | `priya.p@klu.ac.in` | Faculty |

---

## 🚀 Quick Start & Local Development

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd Academiq
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*(Note: Academiq includes an out-of-the-box in-memory/localStorage reactive fallback engine, so you can test all features and workflows locally even before configuring your Firebase API keys!)*

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔄 End-to-End Workflow Verification

1. **Sign In**:
   - Go to `/login`.
   - Click on **Dr. K. Vijayakumar (HOD / Admin)** in the Quick Demo Access panel or sign in with Google.
2. **HOD Work Assignment**:
   - Navigate to `/admin/dashboard` &rarr; Click **+ Assign New Work**.
   - Select faculty (e.g. `Dr. A. Ramkumar` & `P. Priya`), set Priority to `HIGH`, pick a deadline, paste a Google Drive link, and click **Create & Assign Work**.
   - An email notification is logged and in-app notifications are dispatched.
3. **Faculty Submission**:
   - Switch active account using the top-right profile switcher to **Dr. A. Ramkumar**.
   - Open the task from `/faculty/dashboard` or `/faculty/tasks`.
   - Click **Start Work** &rarr; click **Open Submission Folder** to open Google Drive.
   - Click **Submit Work** and confirm upload.
4. **HOD Review & Revision/Completion**:
   - Switch back to **Dr. K. Vijayakumar**.
   - The task appears under `SUBMITTED`.
   - Open the task, test **Request Revision** with a comment (e.g. *"Please attach signed sanction letter"*), or click **Mark as Completed**.
5. **Reports & CSV Export**:
   - Go to `/admin/reports` &rarr; click **Export All Data (CSV)** to download the consolidated audit spreadsheet.

---

## 🔒 Firestore Security Rules

Deploy rules to your Firebase console:
```bash
firebase deploy --only firestore:rules
```

---

## 📄 License
Institutional software developed for the Department of Electrical & Electronics Engineering, Kalasalingam Academy of Research and Education.
