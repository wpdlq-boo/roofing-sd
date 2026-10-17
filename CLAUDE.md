@AGENTS.md

# Ermie's Roofing and Renovations website

Next.js 16 + Tailwind v4 + shadcn/ui site and admin area, built to the SRS at
`~/Downloads/SRS ERMIE'S ROOFING AND RENOVATIONS.md` (requirement IDs like QR-04 are cited in code comments).
Design source: Stitch export at `~/Downloads/html file for frontend` (11 screens concatenated in one file).
Setup and deployment steps: `README.md`.

## Status

- Full app built: public pages, admin (login/reset, dashboard, Manage Portfolio/Services/FAQs), `/api/quote` (Resend), `/api/revalidate`, `/api/keep-alive` cron, Supabase SQL in `supabase/`.
- Verified locally: `npx tsc --noEmit`, `npx eslint` (0 problems), `npm run build`, curl smoke tests of pages and quote API paths.
- **Not yet tested against real Supabase/Resend** (no accounts exist). Not committed or deployed.
- Real phone + email and logo (`public/logo/`, favicon, OG image) are in. Remaining `TODO(client)`: domain, About copy, Privacy review.

## Key decisions

| Decision | Why |
| --- | --- |
| Removed all invented Stitch content (reviews, BBB/HomeStars badges, license #, "15+ years", 24/7 tarping, siding/soffit) | Not supported by SRS; INV-10 bans customer names. Don't reintroduce. |
| Home hero uses a CTA card to `/quote`, not the Stitch mini form | SRS: quote page is the only customer form |
| Where SRS sections conflict, Section 3 wins over 1.2 | Confirmation text is "We have received your email."; quote form is photos only (no videos) |
| Classic ISR (`revalidate = 60`) + `revalidatePath("/", "layout")` after admin saves; no `cacheComponents` | Simplest model that meets the 60-second rule and REL-03 (data functions throw so stale pages stay up) |
| Admin writes go browser → Supabase under RLS; no service-role key anywhere | Matches SRS sequence diagrams; fewer secrets. Every `authenticated` user is the admin, so sign-ups must stay disabled |
| Project + photos saved via `save_project` RPC; a deferred constraint trigger blocks publishing without photos | REL-04, PM-08 |
| CTAs use `secondary-container`/`on-secondary-container`; body text uses `on-surface-variant`, not `outline` | Stitch's amber-on-white (3.19:1) and `outline` text (4.48:1) fail WCAG AA |
| AA-08 relies on Supabase Auth rate limits (per IP) | No extra login-attempts table; documented in README |
| Vercel Hobby is non-commercial; Pro needs client approval | DC-08 budget rule |

## Patterns and gotchas

- Next 16: middleware is `src/proxy.ts` (export `proxy`); `params`/`searchParams` are Promises; use `PageProps<"/route">` (not in route-group layouts; use plain `{ children }` there).
- After adding routes, run `npx next typegen` or tsc reports bogus `AppRoutes` errors.
- Tailwind v4 needs the `@tailwindcss/turbopack` loader rule in `next.config.ts`; there is no postcss config. Don't drop it when editing the config.
- Stitch tokens (`primary-container`, `on-surface-variant`, `text-headline-display`, …) are defined in `src/app/globals.css` `@theme`; shadcn vars point at the same palette.
- shadcn here is the Base UI flavour: `render` prop instead of `asChild`, `Accordion multiple`, `Switch onCheckedChange`. `cn` comes from the `cn` package. The `shadcn` CLI is a devDependency (keeps `npm audit --omit=dev` clean).
- Public pages read via `createPublicClient()` (`src/lib/supabase/public.ts`, no cookies) so they stay static; cookie client in `server.ts` is for admin/route handlers only.
- Lint rules to respect: no setState directly in effects (initial loads are deferred via `Promise.resolve().then`), no `Date.now()`/ref writes during render, no `window.location.assign` (use `hardNavigate` in `src/lib/admin-client.ts`).
- Quote route must never log or store customer data (QR-08); log error names only.
