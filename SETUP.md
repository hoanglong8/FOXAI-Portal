# FOXAI Portal v1.0 — Setup & Deployment Guide

## Prerequisites
- Node.js 20+
- npm 10+
- Supabase account (free tier works)
- Vercel account (for deployment)

---

## 1. Local Development

### 1.1 Clone & Install

```bash
git clone <repo-url> foxai-portal
cd foxai-portal
npm install
```

### 1.2 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New project
2. Set a strong database password (save it)
3. Wait for project to provision (~2 min)
4. Go to **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

### 1.3 Configure Environment

```bash
cp .env.local.example .env.local
# Edit .env.local and fill in your Supabase keys
```

`.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_LOCALE=vi
```

### 1.4 Run Database Migrations

Open **Supabase Dashboard → SQL Editor** and run these files **in order**:

1. Copy-paste content of `supabase/migrations/001_initial_schema.sql` → Run
2. Copy-paste content of `supabase/migrations/002_functions.sql` → Run
3. Copy-paste content of `supabase/seed.sql` (sectors + tags section only) → Run

### 1.5 Create Auth Users

In Supabase Dashboard → **Authentication → Users → Invite user** (or Add user):

| Email | Password | Role |
|-------|----------|------|
| `admin@fox.ai.vn` | `Admin@FOXAI2024!` | (set role below) |
| `demo@fox.ai.vn` | `Demo@FOXAI2024!` | (set role below) |

After creating, copy each user's **UUID** from the Users table.

Then run in SQL Editor (replace the UUIDs):

```sql
INSERT INTO user_profiles (id, full_name, role, language_pref) VALUES
  ('<admin-uuid>', 'FOXAI Admin', 'admin', 'vi'),
  ('<demo-uuid>',  'Demo User',   'user',  'vi');
```

### 1.6 Create Storage Bucket

In Supabase Dashboard → **Storage → New bucket**:
- Name: `logos`
- Public bucket: **Yes**
- Click Create

Then go to **Storage → Policies** and add a policy for `logos`:
- For SELECT: `true` (public read)
- For INSERT: `auth.role() = 'authenticated'`

### 1.7 Start Dev Server

```bash
npm run dev
# → http://localhost:3000
# Redirects to /vi (default locale)
```

---

## 2. Verify Setup

| Check | Expected |
|-------|---------|
| `/vi/login` | Login page renders |
| Login as `admin@fox.ai.vn` | Redirects to `/vi` |
| `/vi/admin/solutions` | Admin solution list |
| Create a solution | Appears on home grid |
| Upload logo | Logo shows in form |
| `/vi/admin/analytics` | Dashboard with 4 KPI cards |

---

## 3. Deploy to Vercel

### 3.1 Push to GitHub

```bash
git init
git add .
git commit -m "initial: FOXAI Portal v1.0"
git remote add origin <your-github-repo>
git push -u origin main
```

### 3.2 Import to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)
4. Add **Environment Variables** (same as `.env.local` but with production values):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` = `https://your-domain.vercel.app`
   - `NEXT_PUBLIC_DEFAULT_LOCALE` = `vi`
5. Deploy

### 3.3 Post-Deploy

After deploy, copy your production URL and update `NEXT_PUBLIC_APP_URL` in Vercel env vars if needed.

In Supabase Dashboard → **Authentication → URL Configuration**:
- Add `https://your-domain.vercel.app/**` to **Redirect URLs**

---

## 4. Database Schema Overview

```
sectors                 — 6 fixed sectors (enterprise, fintech, government, healthcare, education, security)
sector_translations     — name per locale (vi/en/la/zh)
solutions               — core solution record (slug, status, view_count, urls)
solution_translations   — name/short_desc/full_desc per locale
solution_sectors        — M:M join
solution_tags           — M:M join
tags                    — reusable tag names
documents               — files/links attached to solutions
changelogs              — version history per solution
changelog_translations  — content per locale
comments                — user feedback (type, status)
user_profiles           — extends auth.users (role, department, language_pref)
page_views              — view tracking (solution_id, hashed IP)
```

All tables have **Row Level Security (RLS)** enabled. Key policies:
- `solutions`: non-admin only sees `status = 'active'`
- `comments`: any authenticated user can read; users can INSERT own, DELETE own-or-admin
- `user_profiles`: admin can read all; users can read own

---

## 5. Seed Accounts

| Email | Password | Role | Access |
|-------|----------|------|--------|
| `admin@fox.ai.vn` | `Admin@FOXAI2024!` | admin | Full admin panel |
| `demo@fox.ai.vn` | `Demo@FOXAI2024!` | user | Browse solutions only |

---

## 6. Tech Stack Reference

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v3 + shadcn/ui |
| Auth & DB | Supabase (Auth + PostgreSQL + Storage) |
| i18n | next-intl (vi/en/la/zh) |
| State | Zustand (auth) + React Query v5 (server data) |
| Charts | Recharts 2.x |
| Markdown | react-markdown + remark-gfm |
| Image processing | sharp (logo resize → WebP 256×256) |
| Deployment | Vercel |
