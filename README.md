# Ermie's Roofing and Renovations — Website

The public website and admin area for Ermie's Roofing and Renovations, built to the SRS
(`SRS ERMIE'S ROOFING AND RENOVATIONS.md`).

- **Next.js 16** (App Router, React, TypeScript), **Tailwind CSS v4**, **shadcn/ui** (DC-01, DC-02)
- **Supabase** for the database, admin login, and image storage (DC-03)
- **Resend** to email quote requests to the owner (DC-05)
- Hosted on **Vercel** (DC-04)

## What's where

| Path | What it is |
| --- | --- |
| `src/config/site.ts` | **Phone, email, service area, Facebook link** (MNT-04), quote form service list and FAQ categories (MNT-05) |
| `src/app/(public)/` | Public pages: Home, About, Services, Portfolio, Project Detail, FAQ, Contact, Request a Quote, Privacy |
| `src/app/admin/` | Admin login, forgot/reset password, dashboard, Manage Portfolio / Services / FAQs |
| `src/app/api/quote/route.ts` | Quote form handler: validates, checks for spam, and emails through Resend. Stores nothing (INV-01) |
| `src/app/api/revalidate/route.ts` | Refreshes public pages right after the admin saves |
| `src/app/api/keep-alive/route.ts` | Daily ping so a free Supabase project isn't paused (AVL-04) |
| `src/proxy.ts` | Refreshes the admin session and redirects logged-out visitors to the login page |
| `supabase/migrations/0001_init.sql` | Tables, constraints, Row Level Security, storage buckets, `save_project` |
| `supabase/seed.sql` | The 7 launch services (placeholder descriptions) and a few starter FAQs |

Search the code for `TODO(client)` to find every placeholder that needs the client's real details.

## Run it locally

Requires Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev                  # http://localhost:3000
```

Other scripts: `npm run build`, `npm run lint`, `npx tsc --noEmit`.

The public pages work without Supabase; they show their "being updated" empty states.
The admin area and quote form need the services below.

---

## Deployment guide

Do the steps in this order. Steps 1–3 take about 30 minutes; DNS verification for
the email domain can take up to a few hours.

### 1. Supabase (database, admin login, image storage)

1. Create a project at [supabase.com](https://supabase.com). Choose the **Canada (Central)**
   region so data stays in Canada and pages load fast for Winnipeg.
2. **Create the database.** Open **SQL Editor → New query**, paste all of
   `supabase/migrations/0001_init.sql`, and select **Run**. Then do the same with
   `supabase/seed.sql`.
3. **Copy the keys.** Go to **Project Settings → API Keys**. You need:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Publishable key (`sb_publishable_…`; the legacy `anon` key also works) →
     `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

   You do **not** need the secret/service-role key. Never put it in this app.
4. **Lock down sign-in** under **Authentication**:
   - **Sign In / Providers → Email:** turn **off** "Allow new users to sign up" (AA-02, INV-08).
     This matters: every logged-in user is treated as the admin.
   - **Password security:** set minimum password length to **12** (AA-03).
   - **Rate Limits:** lower "sign-ins and sign-ups" to the smallest value your plan allows
     (AA-08). Supabase limits failed attempts per IP address; the login page shows a
     "too many attempts" message when the limit is hit.
   - **URL Configuration:**
     - Site URL: `https://your-domain.ca`
     - Redirect URLs: add `https://your-domain.ca/auth/confirm`,
       `http://localhost:3000/auth/confirm`, and `https://*-your-vercel-team.vercel.app/auth/confirm`
5. **Fix the password reset email** (AA-05). Go to **Authentication → Emails → Reset Password**
   and change the link in the template to:

   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Reset your password</a>
   ```

   This lets the link work even if it's opened on a different device than the one that requested it.
6. **Send auth emails through Resend.** Supabase's built-in email sender is limited to a
   few emails per hour. After step 2 below, go to **Authentication → Emails → SMTP Settings**,
   turn on custom SMTP, and enter: host `smtp.resend.com`, port `465`, username `resend`,
   password = your Resend API key, sender = an address on your verified domain.
7. **Create the single admin account.** Go to **Authentication → Users → Add user → Create new user**.
   Enter the owner's email and a password of at least 12 characters, and tick
   **Auto Confirm User**.

### 2. Resend (quote request emails)

1. Sign up at [resend.com](https://resend.com).
2. **Domains → Add Domain**, enter the company domain (for example `ermiesroofing.ca`), and add
   the DNS records Resend shows (SPF and DKIM, plus the optional DMARC record) at your domain
   registrar. Wait until the domain shows **Verified**. This keeps quote emails out of spam
   (REL-05, CI-03).
3. **API Keys → Create API Key** with "Sending access" → `RESEND_API_KEY`.
4. Set `QUOTE_FROM_EMAIL` to an address on that domain, such as `website@ermiesroofing.ca`
   (it doesn't need a real mailbox), and `QUOTE_ADMIN_EMAIL` to the owner's inbox.

> Before the domain is verified, you can test with `QUOTE_FROM_EMAIL=onboarding@resend.dev`.
> Resend then only delivers to the email address you signed up with.

### 3. Vercel (hosting)

1. Push this repository to GitHub.
2. In [vercel.com](https://vercel.com), select **Add New → Project**, import the repository, and keep
   the detected **Next.js** settings.
3. Under **Environment Variables**, add every variable from `.env.example`:

   | Variable | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-domain.ca` (no trailing slash) |
   | `NEXT_PUBLIC_SUPABASE_URL` | from Supabase step 3 |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | from Supabase step 3 |
   | `RESEND_API_KEY` | from Resend step 3 |
   | `QUOTE_ADMIN_EMAIL` | owner's inbox |
   | `QUOTE_FROM_EMAIL` | e.g. `website@your-domain.ca` |
   | `CRON_SECRET` | a long random string (e.g. from `openssl rand -hex 32`) |

4. Select **Deploy**.
5. The daily keep-alive job in `vercel.json` is registered automatically. Vercel sends
   `CRON_SECRET` with each call. Check it under **Settings → Cron Jobs**.

If you change an environment variable later, redeploy (**Deployments → ⋯ → Redeploy**)
so the new value takes effect. The `NEXT_PUBLIC_` values are built into the site.

### 4. Domain and HTTPS

1. In Vercel, go to **Project → Settings → Domains** and add `your-domain.ca` and `www.your-domain.ca`.
2. Add the DNS records Vercel shows at your registrar.
3. Vercel issues the HTTPS certificate and redirects HTTP to HTTPS automatically (CI-01).
4. Make sure `NEXT_PUBLIC_SITE_URL` and the Supabase Site URL both use the final domain.
5. Put the new website link on the Facebook page (SRS 2.1).

### 5. Check the live site

- [ ] Submit a quote request with 5 phone photos. The confirmation appears and the email
      arrives with `quote-photo-1.jpg` … attached, with Reply-To set to the customer.
- [ ] Log in at `/admin/login`. A wrong password shows "Incorrect email or password."
- [ ] Use "Forgot password?", open the email link, and set a new password.
- [ ] Add a project with photos, publish it, and confirm it appears on `/portfolio` within a minute.
- [ ] Try to delete a service that a project uses. It is blocked with a message.
- [ ] Run [PageSpeed Insights](https://pagespeed.web.dev) on the home page (PERF-01/02).

---

## Plans and costs (DC-08)

| Service | Free plan | Things to know |
| --- | --- | --- |
| **Vercel** | Hobby | Hobby is for **non-commercial use only**. A business website needs **Pro** (about US$20/month). The client must approve this before launch. |
| **Supabase** | Free | Pauses after 7 days without activity; the daily keep-alive cron prevents that. Free has no automatic backups (see below). |
| **Resend** | Free | 3,000 emails/month, 100/day, 1 domain. Plenty for quote requests. |

## Monthly backup (DB-08)

Supabase Free does not keep backups you can download. Once a month:

1. **Database:** go to **Project Settings → Database → Connection string**, copy the URI
   (session pooler), and run:

   ```bash
   pg_dump "postgresql://postgres.xxxx:PASSWORD@aws-0-ca-central-1.pooler.supabase.com:5432/postgres" \
     --schema=public --no-owner --file=ermies-backup-$(date +%Y-%m).sql
   ```

   The file is a standard PostgreSQL export (PRT-03).
2. **Images:** download the `service-images` and `portfolio-photos` buckets from
   **Storage**, or use the Supabase CLI: `supabase storage cp -r ss:///portfolio-photos ./backup`.
3. Keep both somewhere outside Supabase, such as the owner's cloud drive.

## How it works

- **Public pages** are pre-rendered and refreshed every 60 seconds (ISR). After each admin
  save, the admin pages call `/api/revalidate` so changes show immediately (SC-04, PG-08, FQ-06).
  If Supabase is down, visitors still get the last good version of each page (REL-03).
- **Quote form:** photos are resized to 1,600 px and compressed in the browser to 4 MB or less
  in total (QR-04, Vercel's 4.5 MB limit). The server re-validates everything, checks file
  types by their bytes, discards spam (hidden field or sent in under 3 seconds), and sends one
  email. Nothing is saved or logged (QR-08). The confirmation only appears after Resend
  accepts the email (REL-02).
- **Admin:** the browser talks to Supabase directly. Row Level Security allows writes only
  for the logged-in admin (SEC-02, SEC-03). Admin photos are resized to 2,400 px / 1 MB and
  uploaded straight to Storage with a progress bar (PM-07, DB-07). A project and its photos are
  saved in one transaction (`save_project`, REL-04). The admin is logged out after 60 minutes
  without activity (AA-07).
