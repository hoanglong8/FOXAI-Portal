# FOXAI Portal

Cổng thông tin nội bộ tập trung danh mục giải pháp AI & ERP của FOXAI — demo links, tài liệu pitching, hướng dẫn sử dụng, changelog và feedback.

## Tech Stack
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Database & Auth:** Supabase (PostgreSQL + Supabase Auth)
- **i18n:** next-intl (VI / EN / LA / ZH)
- **Deployment:** Vercel + Supabase Cloud

---

## Cấu trúc tài liệu trong folder này

```
foxai-portal/
├── README.md              ← File này
├── claude-harness/        ← Copy vào .claude/ trong project root
│   ├── CLAUDE.md          ← Claude Code config (Layer 1)
│   ├── MEMORY.md          ← Project knowledge base (Layer 1)
│   └── settings.json      ← Permissions & guardrails (Layer 3-4)
└── docs/
    ├── BRD.md             ← Business Requirements Document
    ├── SRS.md             ← Software Requirements Specification
    ├── UI-UX.md           ← UI/UX Design Specification
    ├── ERD.md             ← Database Schema + SQL migrations
    └── API-SPEC.md        ← API Endpoint Specification
```

---

## Hướng dẫn đưa vào Claude Code

### Bước 1: Khởi tạo project
```bash
npx create-next-app@latest foxai-portal \
  --typescript --tailwind --eslint \
  --app --src-dir --import-alias "@/*"
cd foxai-portal
```

### Bước 2: Setup Harness
```bash
mkdir -p .claude
cp path/to/claude-harness/CLAUDE.md .claude/CLAUDE.md
cp path/to/claude-harness/MEMORY.md .claude/MEMORY.md
cp path/to/claude-harness/settings.json .claude/settings.json
```

### Bước 3: Copy docs
```bash
mkdir -p docs
cp path/to/docs/*.md docs/
```

### Bước 4: Khởi chạy Claude Code
```bash
claude
```

Claude Code sẽ đọc `.claude/CLAUDE.md` và bắt đầu có context đầy đủ về project.

### Bước 5: Prompt khởi động cho Claude Code
Dùng prompt này khi mở Claude Code lần đầu:

```
Đọc .claude/CLAUDE.md và docs/ để hiểu project FOXAI Portal.

Nhiệm vụ đầu tiên:
1. Cài dependencies: npm install @supabase/supabase-js @supabase/ssr next-intl lucide-react @radix-ui/react-dialog zustand @tanstack/react-query sharp
2. Cài shadcn/ui: npx shadcn@latest init
3. Tạo cấu trúc folder theo CLAUDE.md
4. Tạo migration SQL từ docs/ERD.md vào supabase/migrations/001_initial_schema.sql
5. Tạo .env.local.example
6. Setup next-intl middleware và routing

Bắt đầu từ bước 1 và làm tuần tự.
```

---

## Thứ tự build được đề xuất (cho Claude Code)

| Sprint | Nội dung |
|:-------|:---------|
| Sprint 1 | Setup project, Supabase schema, Auth middleware, Login page |
| Sprint 2 | Home page (solution grid + sector tabs + search) |
| Sprint 3 | Solution detail page (tabs: Tài liệu, Changelog, Phản hồi) |
| Sprint 4 | Admin: Solution CRUD + Document management |
| Sprint 5 | Admin: User management + Analytics dashboard |
| Sprint 6 | i18n (4 ngôn ngữ) + Polish + Deploy Vercel |

---

## Accounts (v1.0 seed)
| Role | Email | Password |
|:-----|:------|:---------|
| Admin | admin@fox.ai.vn | Admin@FOXAI2024! |
| User | demo@fox.ai.vn | Demo@FOXAI2024! |

> Tạo 2 tài khoản này trong Supabase Auth dashboard, sau đó chạy seed.sql để insert vào user_profiles.

---

## Links
- Tài liệu Supabase Auth SSR: https://supabase.com/docs/guides/auth/server-side/nextjs
- next-intl App Router: https://next-intl-docs.vercel.app/docs/getting-started/app-router
- shadcn/ui: https://ui.shadcn.com
- Vercel deploy: https://vercel.com/docs/frameworks/nextjs
