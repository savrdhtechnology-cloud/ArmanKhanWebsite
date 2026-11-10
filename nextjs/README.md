# Arman Hair Studio — Next.js migration branch

## Current stage
This is a **Next.js compatibility migration**, not a fully native per-page App Router rewrite. The original React Router application is preserved and hosted client-side via a catch-all Next.js route while the new Arman Partner Network Phase 1 remains a separate static UI at /arman-network/index.html (or /network). This ensures the old website remains untouched on main and the new app can be reviewed.

Existing source: ../frontend/src and ../frontend/public (files remain intact).
Existing backend: ../backend (Python API unchanged).

## Local development
From the repository root:

    cd nextjs
    npm install
    NEXT_PUBLIC_BACKEND_URL=https://YOUR-EXISTING-BACKEND npm run dev

Open http://localhost:3001 for the existing site and http://localhost:3001/network for Partner Network.

## Deploy isolated preview
Create a SEPARATE Vercel project pointing to this repo and set Root Directory to nextjs. Do not repoint the existing production deployment. Set NEXT_PUBLIC_BACKEND_URL and backend CORS configuration for the preview URL. Ensure the build environment allows imports from ../frontend/src (Vercel's include-files-outside-root setting may be required), or promote a monorepo workspace at the repository root. Do not deploy without build validation.

## Pending native Next migration tasks
- Replace React Router with Next Link, usePathname, and per-route App Router pages.
- Move auth to a secure Next-compatible architecture without disrupting Python endpoints.
- Add server rendering/metadata per page and validate SEO parity.
- Refactor frontend assets for nextjs/public and restore PWA/service worker behavior as needed.
- Test every screen, API interaction, form, booking, payment and browser history.
- Phase 1 Partner Network uses local demo data, with no live login/payment/database and must not be presented as production-ready.

No changes to main, old website or backend are made by this branch.
