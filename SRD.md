# CRM-Easy — Software Requirements & Development (SRD)

> Version: 1.0 (Draft)
> Date: 2026-08-02
> Status: Proposed / For Review

---

## 1. Document Purpose

This document defines the software requirements and development plan for **CRM-Easy**, a
desktop CRM suite designed to be simple enough for any individual — solo entrepreneurs,
freelancers, small shop owners, and non-technical users — to operate, manage, and adopt
without training or cloud dependency.

The document is the single source of truth for scope, architecture, feature definition,
and release planning. It is intended for the product owner, developers, and reviewers.

---

## 2. Project Overview

| Item           | Description                                                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product name   | CRM-Easy                                                                                                                                                                |
| Product type   | Offline-first desktop CRM suite                                                                                                                                         |
| Primary UI     | Desktop application (Electron + React)                                                                                                                                  |
| Storage        | Local-first (on-device database). Cloud optional, never required                                                                                                        |
| Languages (UI) | Bangla (bn) and English (en), switchable at runtime                                                                                                                     |
| Target OS      | Linux (Debian/Ubuntu `.deb`, Fedora `.rpm`, Arch `.pacman`, portable formats), Windows `.exe`/`.msi`                                                                    |
| Post-MVP OS    | macOS (`.dmg`)                                                                                                                                                          |
| License        | Source-available, dual license: **free for individuals (personal, non-commercial use)**; **paid commercial license** required for any business/commercial use (see §12) |

### 2.1 Vision

> A CRM that a single person can install, open, and start using in under five minutes —
> with no signup, no server, no internet, and no confusing menus. Data belongs to the user.

### 2.2 Core Principles

1. **Local-first by default** — all data stored on-device; works fully offline.
2. **Simple enough for anyone** — plain-language UI (Bn/En), guided flows, no jargon.
3. **User owns data** — zero cloud dependency; optional user-controlled backup.
4. **Practical tools first** — contacts, leads, deals, follow-ups, notes, reminders.
5. **Open formats** — export everything to `.xlsx` / `.csv` on demand.

---

## 3. Goals & Non-Goals

### 3.1 Goals (MVP)

- Deliver installable desktop apps for Linux (`.deb`, `.rpm`, `.pacman`, AppImage/tar) and
  Windows (`.exe`, `.msi`).
- Provide core CRM modules: Contacts, Leads, Deal Pipeline, Activities/Follow-ups,
  Notes, and Reminders.
- Full bilingual UI (Bangla + English) switchable without restart.
- Local database with automatic integrity protection and simple backup/restore.
- Export any visible table (or filtered subset) to `.xlsx` and `.csv`.
- Optional backups to S3-compatible storage, Dropbox, or Google Drive (user-configured).
- Zero telemetry; all data stays on-device unless the user chooses to sync/backup.

### 3.2 Post-MVP Goals

- macOS build (`.dmg`).
- Two-way synchronization of a single database across multiple devices via the user's
  own S3-compatible bucket.
- Multi-user local mode (shared network database with roles).
- Advanced reporting dashboards.
- Email/SMS templates and integrations.
- Mobile companion apps (read-only) — future.

### 3.3 Non-Goals (explicitly out of scope for now)

- Cloud-hosted/SaaS version of the product (may be considered later as a separate product).
- Server-side user accounts or mandatory sign-in.
- Online collaboration in real time.
- Native mobile apps.
- CRM for teams/enterprises (requires roles, ACLs, audit trails — deferred to later).

---

## 4. Target Users & Personas

1. **The Solo Freelancer** — needs to track clients, projects, invoices follow-ups, and
   who owes them what. Works mostly offline.
2. **The Small Shop Owner** — non-technical; needs leads (walk-in/call) tracked simply in
   Bangla, with Excel export for the accountant.
3. **The Independent Agent/Consultant** — needs a deal pipeline and reminders, exports
   weekly reports to CSV for their own spreadsheet workflow.
4. **The Privacy-Conscious Professional** — refuses SaaS CRMs; wants full local control,
   optional backup to their own cloud (S3/Dropbox/Drive).

### 4.1 Usability Requirements (for all personas)

- **First-run wizard** (language choice, optional sample data, "skip" always available).
- Every screen usable with keyboard alone; sensible default focus.
- Search available from every screen (global quick search).
- Plain-language labels in both languages; no CRM jargon unless translatable.
- Data entry forms with inline validation messages in the active language.
- All destructive actions require confirmation ("Are you sure? This cannot be undone.").
- Undo for recent changes (e.g., undo a deleted contact within the session).

---

## 5. Functional Requirements

Requirement IDs use prefixes: `FR` (functional), `NFR` (non-functional), `AR` (architecture),
`SR` (security), `DR` (data). Priorities: **M** = Must (MVP), **S** = Should, **C** = Could
(post-MVP).

### 5.1 Contacts Module

| ID     | Priority | Requirement                                                                                             |
| ------ | -------- | ------------------------------------------------------------------------------------------------------- |
| FR-101 | M        | Create, view, edit, delete contacts (name, phone, email, address, company, tags, notes, custom fields). |
| FR-102 | M        | Search/filter contacts by any field; sortable columns.                                                  |
| FR-103 | M        | Merge duplicate contacts (pick master, keep history).                                                   |
| FR-104 | M        | Import contacts from `.csv` / `.xlsx` with field mapping screen.                                        |
| FR-105 | M        | Export contacts (or filtered set) to `.xlsx` / `.csv`.                                                  |
| FR-106 | S        | Contact activity timeline (calls, notes, deals, follow-ups tied to the contact).                        |
| FR-107 | S        | Duplicate detection on create/import (warning, not blocking).                                           |
| FR-108 | S        | Custom fields (user-defined key/value, typed: text/number/date/select).                                 |
| FR-109 | C        | Contact groups/lists (dynamic saved filters).                                                           |
| FR-110 | C        | Quick actions from contact row (call, email, create follow-up) with one click.                          |

### 5.2 Leads Module

| ID     | Priority | Requirement                                                                                             |
| ------ | -------- | ------------------------------------------------------------------------------------------------------- |
| FR-201 | M        | Create/manage leads with source (walk-in, call, web, referral, other), status, owner.                   |
| FR-202 | M        | Pipeline board (Kanban): configurable stages (e.g., New → Contacted → Qualified → Proposal → Won/Lost). |
| FR-203 | M        | Drag-and-drop leads between stages.                                                                     |
| FR-204 | M        | Lead detail view with notes, next action, expected value, and close date.                               |
| FR-205 | M        | Convert lead → contact (and optionally create deal) in one step.                                        |
| FR-206 | S        | Lead scoring rules (simple weighted criteria set by user).                                              |
| FR-207 | S        | Bulk actions: move, tag, delete, export selected leads.                                                 |
| FR-208 | C        | Duplicate leads suggestion when creating from same phone/email.                                         |

### 5.3 Deals & Pipeline

| ID     | Priority | Requirement                                                                                                            |
| ------ | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| FR-301 | M        | Deals linked to a contact/lead; fields: title, value (currency-aware), stage, expected close date, probability, owner. |
| FR-302 | M        | Customizable pipeline stages (add/rename/reorder/delete).                                                              |
| FR-303 | M        | Pipeline summary: total value per stage, weighted forecast.                                                            |
| FR-304 | M        | Win/lose with a reason (optional selectable reasons list).                                                             |
| FR-305 | S        | Deal history log (stage changes with timestamps).                                                                      |
| FR-306 | S        | Won/lost reports with filters by date range and owner.                                                                 |

### 5.4 Activities, Follow-ups & Reminders

| ID     | Priority | Requirement                                                                                       |
| ------ | -------- | ------------------------------------------------------------------------------------------------- |
| FR-401 | M        | Log activities (call, email, meeting, note, task) against contacts/leads/deals.                   |
| FR-402 | M        | Create follow-up tasks with due date/time and optional reminder.                                  |
| FR-403 | M        | Desktop notifications for due reminders (while app is running; OS notification on Windows/Linux). |
| FR-404 | M        | Today/Overdue/Upcoming views for tasks.                                                           |
| FR-405 | S        | Snooze/reschedule reminders with one click.                                                       |
| FR-406 | S        | Recurring follow-up templates (e.g., "Call every 7 days").                                        |
| FR-407 | C        | Calendar view (monthly/weekly) of tasks and activities.                                           |

### 5.5 Notes & Documents

| ID     | Priority | Requirement                                                                          |
| ------ | -------- | ------------------------------------------------------------------------------------ |
| FR-501 | M        | Free-text notes with timestamps attached to contacts, leads, deals.                  |
| FR-502 | S        | Attach files (PDF, images, docs) to contacts/deals; stored in the local data folder. |
| FR-503 | S        | Notes search across all entities.                                                    |
| FR-504 | C        | Rich-text notes (bold, lists, links) — plain text acceptable at MVP.                 |

### 5.6 Reporting & Export

| ID     | Priority | Requirement                                                                             |
| ------ | -------- | --------------------------------------------------------------------------------------- |
| FR-601 | M        | Export any table view (all rows or current filter) to `.xlsx` and `.csv` on demand.     |
| FR-602 | M        | Export includes headers localized to active UI language.                                |
| FR-603 | M        | Column selection before export (choose which fields to include).                        |
| FR-604 | S        | Standard reports: pipeline summary, deal forecast, activities per period, lead sources. |
| FR-605 | S        | Export reports as `.xlsx` with computed totals (e.g., sum of deal values).              |
| FR-606 | C        | Printable reports (PDF via system print dialog).                                        |
| FR-607 | C        | Recurring automatic exports to a chosen folder.                                         |

### 5.7 Data Management (Backup/Restore/Import)

| ID     | Priority | Requirement                                                                                   |
| ------ | -------- | --------------------------------------------------------------------------------------------- |
| DR-601 | M        | Manual backup to a user-chosen local folder (single self-contained backup file).              |
| DR-602 | M        | Restore from a backup file with confirmation and automatic safety copy of current data.       |
| DR-603 | M        | Automatic backup on a schedule (daily/weekly, configurable, retention count).                 |
| DR-604 | M        | Database integrity check on startup; self-repair from last good backup if corrupted.          |
| DR-605 | S        | Import contacts/leads from `.csv` and `.xlsx` with mapping preview.                           |
| DR-606 | S        | Export full database (all tables) to backup file, optionally encrypted (see SR-501).          |
| DR-607 | C        | Two-way sync of database with S3-compatible storage (single-device ownership at MVP of sync). |
| DR-608 | C        | Cloud backup providers: S3-compatible (AWS/MinIO/Wasabi/R2...), Dropbox, Google Drive.        |
| DR-609 | C        | Restore from cloud backup during first-run wizard.                                            |

### 5.8 Settings & Personalization

| ID     | Priority | Requirement                                                                      |
| ------ | -------- | -------------------------------------------------------------------------------- |
| FR-701 | M        | Language switcher (Bn/En) in settings — applies immediately, no restart.         |
| FR-702 | M        | Currency symbol/format settings (BDT, USD, INR, ...).                            |
| FR-703 | M        | Date/number formats follow selected language or user override.                   |
| FR-704 | S        | Appearance: light/dark/system theme.                                             |
| FR-705 | S        | Default pipeline stages per new installation (sensible defaults; user can edit). |
| FR-706 | C        | Keyboard shortcut customization.                                                 |

---

## 6. i18n Requirements (Bangla & English)

| ID      | Priority | Requirement                                                                                                                                             |
| ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I18N-01 | M        | All UI strings externalized to locale files (`en.json`, `bn.json`).                                                                                     |
| I18N-02 | M        | Runtime language switch without restart; state preserved.                                                                                               |
| I18N-03 | M        | Bangla locale: correct digits preference (Bangla digits `০১২৩` optional setting), date format `dd/mm/yyyy` (default for bn), proper pluralization.      |
| I18N-04 | M        | Right-to-left not required (Bangla is LTR).                                                                                                             |
| I18N-05 | M        | Exported files use localized headers (FR-602).                                                                                                          |
| I18N-06 | M        | First-run setup wizard asks the user to choose their language (Bn/En) explicitly — no auto-detection. Choice is stored, switchable anytime in Settings. |
| I18N-07 | S        | Help/inline hints available in both languages.                                                                                                          |
| I18N-08 | S        | Error messages and validation text localized.                                                                                                           |
| I18N-09 | C        | Additional languages pluggable via adding a locale file (architecture supports it).                                                                     |

---

## 7. Non-Functional Requirements

### 7.1 Performance (NFR)

| ID     | Requirement                                                                                                |
| ------ | ---------------------------------------------------------------------------------------------------------- |
| NFR-01 | Cold start ≤ 3 seconds on a typical laptop (SSD, 8 GB RAM).                                                |
| NFR-02 | Smooth interactions with ≥ 10,000 contacts / 50,000 records in the database (paged lists, indexed search). |
| NFR-03 | All queries except exports/imports complete in < 300 ms.                                                   |
| NFR-04 | Export of 10,000 rows to `.xlsx` ≤ 5 seconds.                                                              |
| NFR-05 | Memory footprint ≤ 400 MB idle, ≤ 800 MB under heavy load.                                                 |
| NFR-06 | Renderer never blocks on I/O; heavy work in main process or worker threads.                                |

### 7.2 Security & Privacy (SR)

| ID    | Requirement                                                                                                    |
| ----- | -------------------------------------------------------------------------------------------------------------- |
| SR-01 | Zero telemetry, zero analytics, zero network calls unless user initiates backup/sync.                          |
| SR-02 | No data leaves the device except: (a) user-initiated backup/sync, (b) automatic update checks (metadata only). |
| SR-03 | Backup files can be encrypted with a user passphrase (AES-256-GCM).                                            |
| SR-04 | Optional app lock (PIN/passphrase) to open the app.                                                            |
| SR-05 | Data folder permissions restricted to the current OS user.                                                     |
| SR-06 | No secrets stored in plain text; cloud credentials kept in OS keychain where available (Electron safeStorage). |
| SR-07 | All dependencies pinned and scanned for known vulnerabilities (CI step).                                       |
| SR-08 | `contextIsolation: true`, `nodeIntegration: false` in renderer; only preload with a narrow API surface.        |

### 7.3 Reliability & Data Integrity (NFR)

| ID     | Requirement                                                                           |
| ------ | ------------------------------------------------------------------------------------- |
| NFR-10 | Database is transactional (SQLite WAL mode); crash-safe.                              |
| NFR-11 | Integrity check on startup; auto-restore from latest backup when corruption detected. |
| NFR-12 | Backup files are self-contained and versioned (schema version embedded).              |
| NFR-13 | Graceful shutdown persists pending state.                                             |
| NFR-14 | Update process never runs while a backup/export is in progress (queued, not lost).    |

### 7.4 Usability & Accessibility (NFR)

| ID     | Requirement                                                                                 |
| ------ | ------------------------------------------------------------------------------------------- |
| NFR-20 | WCAG 2.1 AA level contrast; keyboard navigable; screen-reader labels on all inputs.         |
| NFR-21 | Minimum click distance: primary actions reachable within 2 clicks from any screen.          |
| NFR-22 | All confirmations and errors written in plain language (Bn/En).                             |
| NFR-23 | App usable offline 100% of the time; cloud features degrade gracefully with clear messages. |

### 7.5 Maintainability & Quality (NFR)

| ID     | Requirement                                                                                     |
| ------ | ----------------------------------------------------------------------------------------------- |
| NFR-30 | Monorepo structure with clear boundaries: `main`, `preload`, `renderer`, `shared`, `tests`.     |
| NFR-31 | TypeScript strict mode across the codebase.                                                     |
| NFR-32 | Unit + integration tests ≥ 70% coverage on shared/domain logic; E2E smoke tests for core flows. |
| NFR-33 | Lint (ESLint) + format (Prettier) enforced in CI.                                               |
| NFR-34 | Semantic versioning; changelog maintained per release.                                          |

---

## 8. Architecture Requirements (AR)

### 8.1 Technology Stack (Proposed)

| Layer                 | Choice                                                                                                                            | Notes                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Shell                 | Electron (latest stable LTS)                                                                                                      | Cross-platform desktop packaging                                        |
| UI                    | React + TypeScript                                                                                                                | Vite for renderer bundling                                              |
| State                 | Zustand (or Redux Toolkit) + React Query for async                                                                                | Lightweight, approachable                                               |
| Local DB              | SQLite via `better-sqlite3`                                                                                                       | Single-file, transactional, mature                                      |
| DB abstraction        | Drizzle ORM (or Kysely)                                                                                                           | Type-safe queries, migrations                                           |
| Schema migrations     | Versioned migration files, run on startup                                                                                         | See AR-04                                                               |
| Export                | `exceljs` (`.xlsx`) + built-in CSV writer                                                                                         | Streaming for large sets                                                |
| i18n                  | `i18next` + `react-i18next`                                                                                                       | Runtime language switch, pluralization                                  |
| Desktop notifications | Electron `Notification` API                                                                                                       | Windows/Linux native                                                    |
| Cloud backup SDKs     | `@aws-sdk/client-s3` (S3-compatible), Dropbox API, Google Drive API                                                               | Optional modules (dynamic import)                                       |
| Packaging             | `electron-builder`                                                                                                                | `.deb`, `.rpm`, `.pacman`, `.AppImage`, `.exe`, `.msi`; `.dmg` post-MVP |
| Auto-update           | `electron-updater` with **generic provider** pointing at a user-owned S3-compatible bucket (supports staging/production channels) | Chosen channel — see §12.2                                              |
| Tests                 | Vitest (unit), Playwright (E2E)                                                                                                   |                                                                         |
| CI/CD                 | GitHub Actions                                                                                                                    | Matrix: linux/windows/mac, lint, test, package                          |

### 8.2 Process Architecture

- **Main process:** DB access, migrations, backup/export jobs, cloud sync, notifications,
  file dialogs, keychain (safeStorage).
- **Preload:** minimal, typed IPC bridge (`window.crm.*`); no Node APIs in renderer.
- **Renderer:** UI only; talks to main via typed IPC (never raw `ipcRenderer.send`).
- **Workers:** heavy export/sync runs in utility process or worker threads to keep UI at 60fps.

### 8.3 Data Model (Core Entities, MVP)

```
Contact  ──1:N── Deal
Contact  ──1:N── Activity / Task / Note
Lead     ──1:N── Deal
Contact  ──N:M── Tag
Deal     ──1:N── DealLog (stage history)
Entity   ──1:N── CustomFieldValue
Backup/restore: full database dump + schema version + meta
```

Entity drafts: `contacts`, `leads`, `deals`, `pipeline_stages`, `activities`,
`tasks`, `notes`, `tags`, `contact_tags`, `custom_field_defs`, `custom_field_values`,
`settings`, `schema_meta`.

### 8.4 Migration & Versioning

| ID    | Requirement                                                                                    |
| ----- | ---------------------------------------------------------------------------------------------- |
| AR-01 | Schema version stored in DB; migrations run automatically on launch before UI shows.           |
| AR-02 | Backup files embed schema version; restore refuses incompatible versions with a clear message. |
| AR-03 | Export formats are stable and documented (column layout documented per export type).           |
| AR-04 | Rollback path: keep last known-good backup before migration.                                   |

---

## 9. Development Plan / Milestones

### 9.1 Phase 0 — Foundations (Sprint 0–1)

- Monorepo scaffold (Electron + Vite + React + TS strict).
- Electron security baseline (contextIsolation, CSP, safe IPC).
- SQLite + migrations + repository layer.
- i18next setup with `en.json`/`bn.json`, language switcher.
- CI: lint, typecheck, unit tests, electron-builder matrix for Linux.

### 9.2 Phase 1 — MVP Core (Sprint 2–6)

- Contacts CRUD, search, import/export `.csv`/`.xlsx`.
- Leads + Kanban pipeline with drag-and-drop.
- Deals with stages, value, forecast summary.
- Activities, follow-ups, reminders, desktop notifications.
- Notes + attachments.
- Backup/restore local + scheduled backups + integrity check.
- First-run wizard, settings (language, currency, theme).
- Packaging: `.deb`, `.rpm`, `.pacman`, `.AppImage`, Windows `.exe`/`.msi`.
- E2E smoke tests on Linux + Windows.

### 9.3 Phase 2 — Polishing & Cloud Backups (Sprint 7–9)

- Cloud backup: S3-compatible first, then Dropbox, then Google Drive.
- **Auto-update enabled** via generic provider (S3-compatible bucket; staging + production channels).
- Encrypted backups (SR-03).
- Standard reports (FR-604/605).
- App lock (SR-04).
- Duplicate merge UX improvements.

### 9.4 Phase 3 — Post-MVP (ongoing)

- macOS `.dmg`.
- Two-way sync (single-writer sync) with S3-compatible storage.
- Calendar view, saved lists, custom fields UI.
- Additional locales via plugin files.

---

## 10. Acceptance Criteria (MVP Definition of Done)

1. App installs and runs on: Debian/Ubuntu (`.deb`), Fedora (`.rpm`), Arch (`.pacman`),
   portable Linux (AppImage), Windows 10/11 (`.exe` installer + portable).
2. All MVP `FR-*` (priority M) items implemented and passing tests.
3. UI fully available in Bangla and English; switching works without restart.
4. App works 100% offline; no network calls unless user triggers backup/sync.
5. Contacts/leads/deals/tasks survive app restart; integrity check passes; restore works.
6. Exports to `.xlsx` and `.csv` verified for 10k rows, headers localized.
7. No telemetry; privacy policy documented in-app.
8. Automated test suite green in CI on Linux and Windows.

---

## 11. Risks & Mitigations

| Risk                                        | Impact           | Mitigation                                                                      |
| ------------------------------------------- | ---------------- | ------------------------------------------------------------------------------- |
| Electron bundle size / RAM usage            | Perf             | Lazy-load modules, dynamic import of cloud SDKs, worker threads                 |
| `better-sqlite3` native module packaging    | Install issues   | electron-builder native rebuild; test on all targets in CI matrix               |
| Bangla font rendering/Linux distro variance | UX               | Bundle a Bangla font (e.g., Noto Sans Bengali subset); CSS font stack fallbacks |
| Data loss from corruption                   | Trust            | WAL mode, startup integrity check, auto-restore, encrypted backups              |
| Dropbox/Drive API changes                   | Feature risk     | Adapter interface; S3-compatible path is the stable primary                     |
| Scope creep (features beyond MVP)           | Delay            | Strict MVP gate; non-goals enforced; backlog-only items labeled `C`             |
| Windows Defender / code signing             | Install friction | Code-signing cert planned for release builds; document SmartScreen workaround   |

---

## 12. Decisions & Open Questions

### 12.1 Resolved Decisions

| #   | Topic               | Decision                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | License model       | **Dual license, source-available**: individuals may use the software **free** for personal, non-commercial use. Any **commercial/business use requires a paid license** (per-seat or per-license, TBD). Implemented as a source-available license (e.g., PolyForm Noncommercial or custom EULA) + paid commercial license. Final wording to be reviewed by legal counsel. |
| 2   | Auto-update channel | **Generic provider on a user-owned S3-compatible bucket** (`electron-updater`), with separate staging/production channels. Rationale: no public repo required (protects source under the source-available model), reuses existing S3-compatible infra, full release control.                                                                                              |
| 3   | Language selection  | Chosen **explicitly in the first-run setup wizard** (Bn/En), stored, switchable in Settings anytime (I18N-06). No OS-locale auto-detection.                                                                                                                                                                                                                               |

### 12.2 Open Questions (To Be Decided)

1. Data directory default location per OS (standard `AppData`/`~/.local/share` vs user-chosen).
2. Bangla digits: default to Bangla numerals or Latin digits in UI input fields?
3. Currency default: BDT with multi-currency support, or user-chosen single currency first?
4. Windows installer type priority: NSIS `.exe` vs WiX `.msi` first?
5. Paid commercial license mechanics: per-seat, per-device, or one-time per business? Trial/grace period?

---

## 13. References & Definitions

- **Local-first:** data lives on the user's device; network optional.
- **S3-compatible:** any object store implementing the S3 REST API (AWS S3, MinIO,
  Wasabi, Cloudflare R2, Backblaze B2, ...).
- **SRD:** Software Requirements & Development document.
- **MVP:** Minimum Viable Product (Phase 1 scope above).

_End of document._
