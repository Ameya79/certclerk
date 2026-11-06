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

## 13. Mobile-First Viewport & Touch Ergonomics Standard
- **React Portal Overlay Mandate**: Modals, popups, and full-screen overlays must be mounted directly to `document.body` via `createPortal(..., document.body)`. Mounting modals inside components located within sticky headers or elements with CSS `backdrop-filter` or `transform` causes the browser to create a new containing block and stacking context, trapping the modal inside the header's bounds and breaking fixed positioning.
- **iOS Safari Auto-Zoom Prevention**: Every interactive form control (`<input>`, `<select>`, `<textarea>`) must use `text-base sm:text-xs` or `text-[16px] sm:text-xs`. Font sizes below 16px on mobile viewports cause iOS Safari to aggressively zoom into the field on focus, breaking responsive layouts.
- **Minimum Touch Targets**: All interactive buttons, action chips, and dropdown triggers must maintain a minimum touch hit target of 44×44px with tactile `active:scale-[0.98]` micro-interactions.
- **Adaptive Mobile Card Views**: Data tables with > 3 columns must provide a dedicated card layout on mobile viewports (`block md:hidden`) and show the full tabular layout only on desktop (`hidden md:block`).
- **Segmented Mobile Steppers**: Multi-step wizards with > 4 steps must render a compact segmented progress indicator (`Step X of Y: Step Name`) on mobile rather than an overflow horizontal bar.
- **Mobile Stacked Action Footers**: Wizard and modal action bars must stack vertically on mobile (`flex-col sm:flex-row gap-3 items-stretch sm:items-center sm:justify-between`) with full-width primary CTA buttons (`w-full sm:w-auto`).

## 14. Plain-Language UI Copy & Jargon Elimination
- **User-Facing Copy Simplification**: Never expose low-level database or backend engineering jargon to end users.
  - Ban "WAL", "WAL Safe", "WAL crash-safe" from user-facing copy. Replace with "Crash-Proof Progress", "Crash-Resistant Delivery", or "Safe Auto-Save".
  - Ban "Letter Invariant", "Character Invariant", or "Alphabet invariant" from general copy. Replace with "Zero Typo Guarantee", "Exact Name Accuracy", or "Spelling Safeguard".
- **Mathematical Integrity**: When mathematical formulations are needed in developer READMEs or technical documentation, frame them clearly under human-understandable benefits: "Exact Name Accuracy (Zero-Typo Guarantee)".

## 15. Navbar Singularity & Layman Onboarding Standard
- **No Duplicate Navbar CTAs**: A navbar must never duplicate destinations (e.g. having both "Studio" text link and "Open Studio" CTA button). Use exactly one clear, prominent action button ("Open Studio" when on landing/docs pages, and "Overview" when on the Studio workstation).
- **Layman Help & Quickstart Accessible in 1 Click**: Include a high-visibility "How to Use" / "Guide" button in the navigation bar that opens a friendly, visual 4-step modal:
  1. Canva Template Blueprint: Single-page PDF with placeholder word (e.g. `AGENT`).
  2. Excel / CSV Roster: Required `Name` column, optional `Email` column.
  3. Free Gemini API Key: 1-click link to Google AI Studio with default `gemini-3.6-flash`.
  4. Secure SMTP Setup: Gmail 16-character App Password, port 587, with in-memory security guarantee.

## 16. Open Registry & Creator Attribution Standard
- **Global Footer Attribution**: The application footer across all pages and the repository README must clearly credit the creator with verified links:
  - Full Name: Ameya Kulkarni
  - GitHub: [@Ameya79](https://github.com/Ameya79)
  - LinkedIn: [in/ameya-kulkarni-a31b74246](https://www.linkedin.com/in/ameya-kulkarni-a31b74246/)
- **Benchtop Labs Open Registry Verification**: Every verified open-source utility in the suite must feature the official Benchtop Labs Verified badge linking to the registry (`https://benchtoplabs.vercel.app`), with corresponding manifest registered in `benchtoplabs-registry/projects/<slug>.json`.

## 17. Punctuation & Copy Tone Invariants
- **Strict Em Dash Prohibition**: Never use em dashes (`—`) in user-facing copy, READMEs, profile showcases, or UI text. Use clean colons, commas, periods, or parentheses instead.
- **Tame, Grounded Copy**: Write copy that is humble, punchy, and instantly understandable to human recruiters and developers. Never inflate simple concepts with pretentious phrasing (e.g. avoid "turnaround compression" or unsolicited LaTeX math when plain English works better).
- **No Vibe-Coded Boxes or Neon Glow**: Never wrap hero typography in dark artificial boxes, pseudo-terminals, or neon glow effects on light-themed websites. Keep hero headlines clean, borderless, and integrated directly into the natural page canvas.

## 18. Agentic Architecture & Evaluation Standards
- **Transparent Reasoning & Tool Contracts**: Any agentic system must expose its tool contracts, input/output schemas, and execution traces so decisions are fully interpretable and auditable.
- **Dedicated Evaluation Harness**: Pair agent pipelines with an automated benchmark harness (`eval/benchmark.py`) and an adversarial edge-case dataset, reporting quantitative metrics (hallucination rate, tool error rate, latency).
- **Explicit Failure Mode Documentation**: Always document primary failure modes and their concrete code-level mitigations (e.g. invariant assertions, boundary checking, retry limits).
