# SehatSetu — Defect & Vulnerability Report (BUG_REPORT.md)

**Project**: SehatSetu Rural Healthcare Access Platform  
**Evaluator**: Senior QA Engineer & Security Auditor  
**Date**: September 2026  

---

## Executive Defect Summary

During the comprehensive QA and code inspection across all 24 phases, **8 defects and security concerns** were identified:
- **Critical Severity**: 2
- **High Severity**: 3
- **Medium Severity**: 2
- **Low Severity**: 1

All software defects were remediated and verified with regression testing. The security concern regarding public client-side environment keys has been formally documented with mitigation instructions.

---

## Detailed Bug Reports

### BUG-01 [CRITICAL]: Missing Hospital Facility Referral Management Workflow
- **Module**: Hospital Portal (`HospitalAdminPreview.jsx`) / Referral Lifecycle
- **Phases Affected**: Phase 7 (Hospital Workflow), Phase 9 (Referral System), Phase 20 (End-to-End)
- **Description**: While Patient, Doctor, and ASHA dashboards had referral timelines and creation actions, `HospitalAdminPreview.jsx` was purely an administrative display of staff and ambulance fleet. There was no interface or capability for a receiving hospital to:
  1. View inbound referrals from rural PHCs or Sub-Centres.
  2. Accept inbound referrals with doctor & bed allocation.
  3. Mark patient arrival at the hospital reception.
  4. Initiate specialist treatment.
  5. Conclude treatment and close referrals.
- **Root Cause**: Architectural omission in frontend view routing and state management for `hospital_admin` role.
- **Remediation**:
  - Implemented the **Inter-Facility Referral Desk** tab in `HospitalAdminPreview.jsx`.
  - Added filter chips (`ALL`, `PENDING`, `UNDER_TREATMENT`, `COMPLETED`), search bar, and status pipeline counters.
  - Implemented interactive lifecycle action buttons (`Accept`, `Mark Arrived`, `Start Treatment`, `Complete Treatment`, `Close Referral`, `Reject`).
  - Added modal with input fields for Attending Physician, Department, Bed No., and Clinical Discharge Notes.
- **Status**: **RESOLVED & VERIFIED** (Tested via `TC-HOSP-01` through `TC-HOSP-07`).

---

### BUG-02 [CRITICAL]: Backend Missing All Referral REST Routes (HTTP 404)
- **Module**: Backend API (`backend/src/server.js`, `backend/src/routes/referralRoutes.js`)
- **Phases Affected**: Phase 7, Phase 9, Phase 13 (API Testing), Phase 14 (Data Consistency)
- **Description**: Calling `GET /api/referrals` returned HTTP 404. There were no referral endpoints on the Express server, meaning cross-device referral updates could not be queried or updated through the backend server.
- **Root Cause**: Route file was missing from backend routes directory and not mounted in `server.js`.
- **Remediation**:
  - Created `backend/src/routes/referralRoutes.js` supporting:
    - `GET /api/referrals` (all chains)
    - `GET /api/referrals/:id` (specific chain)
    - `POST /api/referrals` (new chain)
    - `POST /api/referrals/:id/hops` (doctor hop addition)
    - `PUT /api/referrals/:id/status` (hospital lifecycle status transition)
  - Added Socket.io broadcasts (`referral_chain_updated`, `referral_status_changed`).
  - Mounted router in `server.js` at `/api`.
  - Seeded initial referral chains in `backend/src/db/store.js`.
- **Status**: **RESOLVED & VERIFIED** (Tested via `TC-API-19` through `TC-API-27`).

---

### BUG-03 [HIGH]: Unhandled Exception in `complete-checkup` Crashes on Missing Patient
- **Module**: Backend OPD Queue (`backend/src/routes/appointmentRoutes.js`)
- **Phases Affected**: Phase 8 (Queue Management), Phase 13 (API Testing), Phase 21 (Negative Testing)
- **Description**: In `POST /api/queue/complete-checkup`, line 295 executed `Number(patient.tokenNumber || ...)` without validating whether `patient` was defined. When an empty payload or missing patient object was posted, Node.js threw `TypeError: Cannot read properties of undefined (reading 'tokenNumber')`, returning HTTP 500.
- **Root Cause**: Missing parameter validation on request body.
- **Remediation**:
  - Added input validation guarding against null/undefined `patient`:
    ```javascript
    if (!patient || (!patient.id && !patient.tokenNumber && !patient.token)) {
      return res.status(400).json({ success: false, message: 'Valid patient object with ID or token is required.' });
    }
    ```
- **Status**: **RESOLVED & VERIFIED** (Tested via `TC-API-08`).

---

### BUG-04 [HIGH]: Route Preservation Lost on Refresh & Role Guard Bypass
- **Module**: Frontend Navigation Shell (`frontend/src/App.jsx`)
- **Phases Affected**: Phase 3 (Authentication), Phase 15 (Role-Based Access)
- **Description**:
  1. When refreshing a page on any sub-view (e.g. `#prescriptions` or `#referrals`), `App.jsx` hardcoded `useState('home')`, resetting the user to the home dashboard every time.
  2. A patient typing `#doctor-portal` or `#asha-dashboard` directly into the address bar was not explicitly sanitized by a unified route boundary function.
- **Root Cause**: `window.location.hash` was ignored during state hydration.
- **Remediation**:
  - Implemented `resolveInitialRoute(userRole)` in `App.jsx` to parse and validate `window.location.hash` against allowed role sets on mount.
  - Added role boundary enforcement in `handleNavigate` preventing patients from navigating to doctor/ASHA/admin routes.
- **Status**: **RESOLVED & VERIFIED** (Tested via `TC-AUTH-08` and `TC-AUTH-10`).

---

### BUG-05 [HIGH]: Missing 404 Status Code on Non-Existent ASHA Request Updates
- **Module**: ASHA Consultation API (`backend/src/routes/ashaRoutes.js`)
- **Phases Affected**: Phase 13 (API Testing), Phase 21 (Negative Testing)
- **Description**: `PUT /api/asha/requests/:id` with an invalid ID returned HTTP 200 with `{ success: true, data: undefined }` instead of HTTP 404 Not Found.
- **Root Cause**: The route handler did not check whether the request was found before returning success.
- **Remediation**:
  - Added existence check:
    ```javascript
    const existing = (store.get('ashaRequests') || []).find(r => r.id === id);
    if (!existing) {
      return res.status(404).json({ success: false, message: `ASHA consultation request ${id} not found.` });
    }
    ```
- **Status**: **RESOLVED & VERIFIED** (Tested via `TC-API-18`).

---

### BUG-06 [MEDIUM]: Medicine Reminder Sync Overwrote Baseline Reminders
- **Module**: Medicine Reminders (`frontend/src/services/medicineReminderService.js`)
- **Phases Affected**: Phase 10 (Prescription & Medicine Testing)
- **Description**: In `syncNewPrescription`, reminders were fetched via `getStored(STORAGE_KEYS.MEDICINE_REMINDERS, [])`. If a doctor created a prescription before the patient ever navigated to the Medicines page, the initial mock reminders were wiped out because `getRemindersSync()` had not initialized them.
- **Root Cause**: Did not call the self-healing getter `this.getRemindersSync()`.
- **Remediation**: Updated `syncNewPrescription` to call `this.getRemindersSync()`.
- **Status**: **RESOLVED & VERIFIED** (Tested via `TC-API-12` and `TC-API-13`).

---

### BUG-07 [MEDIUM]: Missing Referral Status Transitions in Frontend Service
- **Module**: Referral Tracking Service (`frontend/src/services/referralTrackingService.js`)
- **Phases Affected**: Phase 7 (Hospital Workflow), Phase 9 (Referral System)
- **Description**: `referralTrackingService.js` had `addReferralHop` but lacked a dedicated status transition function (`updateReferralStatus`) to transition a referral through the hospital stages (`Accepted`, `Patient Arrived`, `Treatment Started`, `Treatment Completed`, `Referral Closed`).
- **Root Cause**: Partial service implementation.
- **Remediation**: Implemented `updateReferralStatus(trackingId, newStatus, details)` with local storage updates, backend synchronization, and event emission.
- **Status**: **RESOLVED & VERIFIED**.

---

### BUG-08 [LOW / SECURITY NOTE]: Client-Side Exposure of API Keys in Bundled `.env`
- **Module**: Frontend Environment Config (`frontend/.env`)
- **Phases Affected**: Phase 15 (Security & Role-Based Access)
- **Description**: `frontend/.env` contains `VITE_GEMINI_API_KEY`. Any environment variable prefixed with `VITE_` is automatically compiled into public JavaScript client bundles by Vite during `npm run build`.
- **Impact**: While Firebase Web API keys are meant to be public client identifiers, AI keys (Gemini) should ideally be proxied through a secure backend server endpoint (`/api/ai/chat`) so private quotas cannot be extracted from client bundles.
- **Status**: **DOCUMENTED AS REMAINING ARCHITECTURAL RISK & SECURITY RECOMMENDATION**.
