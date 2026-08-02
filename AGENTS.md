# CRM-Easy — Agent Instructions

Electron + React + TypeScript + SQLite desktop CRM. See SRD.md for product requirements.

## Commands

- `npm run dev` — electron-vite dev (HMR)
- `npm run typecheck` — strict TS check (node + web projects)
- `npm run lint` — ESLint (flat config)
- `npm test` — Vitest unit tests (tests/unit)
- `npm run format` — Prettier write; `format:check` in CI
- `npm run build` — typecheck + electron-vite build
- `npx electron-vite build` — build only
- `npm run build:linux` / `build:win` — full package with electron-builder
- `npx drizzle-kit generate --name <name>` — generate migration after schema change

## Conventions

- TypeScript strict; no `any`; type-only imports with `import type` (verbatimModuleSyntax).
- No semicolons, single quotes, printWidth 100 (Prettier enforced).
- Security baseline: renderer never touches Node — all access via typed IPC through
  preload `window.crm` (channels in `src/shared/ipc.ts`, types in `src/shared/types.ts`).
- All UI strings go through i18next; **en.json and bn.json must stay key-identical**
  (tested in tests/unit/i18n.test.ts). Never hardcode UI text.
- DB: Drizzle schema in `src/main/db/schema.ts`; never edit applied migrations in
  `drizzle/` — generate a new one. Migrations run on startup automatically.
- Data model changes → generate migration → add/adjust unit tests.
- Electron main-process modules must not be imported in renderer or unit tests
  (better-sqlite3 is rebuilt for Electron ABI; vitest runs under Node).
- After adding/removing dependencies: `npm run postinstall` rebuilds native modules.
