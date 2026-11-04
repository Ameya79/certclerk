# UI Craft and Layout Stability Standards

## 1. Container Geometry Invariant
- Multi-step wizards and workflows must maintain a consistent container width (e.g. `max-w-5xl`) across all steps.
- Avoid switching abruptly between full-width tables and narrow centered modal-like cards.

## 2. In-Place Action Morphing
- When a user triggers an irreversible or milestone action (e.g., Approve, Lock, Confirm), the target container must not resize or push adjacent elements down jarringly.
- Use in-place button morphs or predefined height allocations with smooth CSS transitions.

## 3. Persistent Batch & Document Context
- Multi-step workflows must feature a persistent, compact context header (showing template preview, active record count, document status, and current step) so the user never loses orientation.

## 4. Secret Persistence Invariant
- Never use regex substitution (`re.sub`) to update `.env` files, as backslashes in secrets trigger escape sequence errors.
- Always perform line-by-line updates with atomic replacement (`.tmp` -> replace with Windows lock retries).
- Mask secrets in all API responses and sanitize exception messages.

## 5. Local-First Organizer Invariant
- **Zero Login Walls**: galeus is a local-first workstation tool running directly on the organizer's personal computer. Never introduce mandatory sign-up, sign-in, or cloud authentication barriers.
- **Immediate Desktop Utility**: The home page must feature the batch studio and interactive local tools with direct utility.
- **Local Data Boundary**: All jobs, uploaded templates, and generated certificates reside exclusively on the local machine (`data/jobs/`).
- **BYOK / Offline Parity**: Support offline heuristic rule execution by default, with optional runtime BYOK (Bring Your Own Key) for free AI providers stored locally in `.env`.

## 6. Strict Anti-Vibe-Coding Standard (Flat, Minimal & Juicy)
Every interface must be engineered like precision desktop software (Linear, Raycast, Vercel), actively eliminating all 50 "vibe-coded" tropes:
- **Spacing & Alignment Invariants**: Symmetrical vertical/horizontal padding (`p-4 sm:p-6`), strict 8pt rhythm, zero grid orphans, zero wandering headers, zero negative margins, and `flex-shrink: 0` on all icons/badges.
- **Flat, Tactile Aesthetic**: Strictly crisp flat slate/white theme (`#ffffff`, `#fbfbfc`, border `#e2e8f0`). No dark purple-to-blue linear gradients, no glowing border rings, and no heavy stamp shadows.
- **Natural Interaction Curves**: Micro-interactions only (tactile `active:scale-[0.98]`, subtle 1px border hover). No aggressive `scale-110` jumps, no linear robotic easing, no uncanny text-scrambling, no cursor orbs.
- **Semantic & Accessible Code**: Semantic HTML5 tags (`<header>`, `<main>`, `<section>`, `<nav>`, `<footer>`), `focus-visible` keyboard rings, `aria-label` on all icon-only buttons, dynamic `new Date().getFullYear()`, and 100% clean browser console.

## 7. Vercel Geist Typography Mandate
- The application must exclusively use the official Vercel `geist` package (`npm i geist`):
  - `GeistSans` for primary user interface, labels, headings, and buttons.
  - `GeistMono` for tabular data, file paths, batch IDs, hashes, recipient counts, and code.
  - `GeistPixel` for cryptographic signatures, invariant status badges, and precision tags.
  - `GeistSerif` for certificate typography previews and formal document headers.
- Never fall back to generic system sans-serif or un-configured Inter.

## 8. Build Concurrency & Cache Integrity
- **Never Run `next build` While `next dev` Is Active**: Running production builds concurrently in the same directory mutates `.next/` chunk manifests and corrupts Webpack module resolution for the running dev server (`TypeError: __webpack_modules__[moduleId] is not a function`). Always terminate the dev server before building, or use isolated directories.
- **Cache Recovery**: If Webpack module mismatch occurs, terminate the dev process, run `npm run clean` (`fs.rmSync('.next')`), and restart cleanly.

## 9. Systematic Brand Consistency (galeus)
- Maintain brand integrity across the application:
  1. High-resolution shark fin logo (`/galeus-logo.png`) and emblem (`/galeus-icon.png`).
  2. Root metadata (`<title>`, `<meta description>`, OpenGraph tags, favicons).
  3. Header navigation brand marks and logos.
  4. Landing page copy, feature cards, and footers.
  5. Package manifest (`package.json`) and API metadata (`FastAPI(title="galeus API")`).
  6. Documentation (`README.md`, `DEPLOYMENT.md`).

## 10. Local-First Infrastructure & Demo Positioning Standard
- **Primary Architecture**: Present the tool primarily as a 100% on-device, self-hosted, private local infrastructure (`docker compose up --build` or local Python).
- **Secondary Cloud Links**: Host and document live deployments (e.g. Vercel) as secondary "Try the Demo" preview environments.
- **Privacy & Security**: Emphasize zero telemetry, ephemeral `/tmp` storage, and in-memory SMTP credential handling.

## 11. Header Status Chip & Modal Viewport Hygiene
- **No Mashed Labels**: Do not combine two disparate concepts with pipes inside a single button (e.g. avoid `Rules Engine | Config`). Use clean, recognizable badge icons with clear status indicators.
- **Accurate Model Identifiers**: Always use verified, active model strings (e.g. `gemini-2.0-flash` or `gemini-1.5-flash`, never unreleased version numbers).
- **Modal Viewport Hygiene & Clamping Invariant**:
  - Modals must be wrapped in `fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex min-h-full items-center justify-center p-3 sm:p-4`.
  - The dialog container must have `relative w-full max-w-lg my-auto max-h-[calc(100vh-2rem)] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden`.
  - The Header must have `shrink-0` (never clipped off-screen on short viewports).
  - The Body must have `flex-1 overflow-y-auto` (smooth scrollable content).
  - The Action Footer must have `shrink-0` (buttons pinned at bottom, always visible).

## 12. Repository Media & Native Video Invariant
- **GitHub README Media Sanitization**: GitHub strictly strips relative `<video src="assets/..."></video>` tags.
- High-craft READMEs must embed:
  1. Official branding banner at the top (`assets/galeus-hero-banner.png`).
  2. High-res animated walkthrough preview (`assets/galeus-walkthrough.gif` <= 10MB) linking to GitHub's native video player (`https://github.com/<owner>/<repo>/blob/main/assets/video.mp4`).
  3. Prominent CTA buttons right below the preview for HD Video in GitHub player, live interactive web demo, and direct MP4 download.
