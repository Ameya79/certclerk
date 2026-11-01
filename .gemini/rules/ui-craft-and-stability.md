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
- **Zero Login Walls**: CertClerk is a local-first workstation tool running directly on the organizer's personal computer. Never introduce mandatory sign-up, sign-in, or cloud authentication barriers.
- **Immediate Desktop Utility**: The home page must drop directly into the certificate studio and feature interactive local tools without gating features behind an account.
- **Local Data Boundary**: All jobs, uploaded templates, and generated certificates reside exclusively on the local machine (`data/jobs/`).
- **BYOK / Offline Parity**: Support offline heuristic rule execution by default, with optional runtime BYOK (Bring Your Own Key) for free AI providers stored locally in `.env`.

## 6. Strict Anti-Vibe-Coding Standard (Zero Slop Policy)
Every interface must be engineered like precision desktop software (Linear, Raycast, Vercel), actively eliminating all 50 "vibe-coded" tropes:
- **No Cookie-Cutter SaaS Landing Pages**: Do not generate multi-paragraph marketing copy, fake testimonials, or rows of cards containing icons in colored circles. Deliver high-density, tactile workstation tools with direct utility.
- **Spacing & Alignment Invariants**: Symmetrical vertical/horizontal padding (`p-4 sm:p-6`), strict 8pt rhythm, zero grid orphans, zero wandering headers, zero negative margins, and `flex-shrink: 0` on all icons/badges.
- **Zero Aceternity/Neon Slop**: Strictly flat white/slate theme (`#ffffff`, `#f8fafc`, `#f1f5f9`, border `#e2e8f0`). No dark purple-to-blue linear gradients, no glowing border rings, and no heavy stamp shadows.
- **Natural Interaction Curves**: Micro-interactions only (tactile `active:scale-[0.99]`, subtle 1px border hover). No aggressive `scale-110` jumps, no linear robotic easing, no uncanny text-scrambling, no cursor orbs.
- **Semantic & Accessible Code**: Semantic HTML5 tags (`<header>`, `<main>`, `<section>`, `<nav>`, `<footer>`), `focus-visible` keyboard rings, `aria-label` on all icon-only buttons, dynamic `new Date().getFullYear()`, and 100% clean browser console.

## 7. Vercel Geist Typography Mandate
- The application must exclusively use the official Vercel `geist` package (`npm i geist`):
  - `GeistSans` for primary user interface, labels, headings, and buttons.
  - `GeistMono` for tabular data, file paths, batch IDs, hashes, recipient counts, and code.
  - `GeistPixel` for cryptographic signatures, invariant status badges, and precision tags.
  - `GeistSerif` for certificate typography previews and formal document headers.
- Never fall back to generic system sans-serif or un-configured Inter.

