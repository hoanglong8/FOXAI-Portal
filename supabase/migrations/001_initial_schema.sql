-- ============================================================
-- File: supabase/migrations/001_initial_schema.sql
-- FOXAI Portal v1.0 — Initial Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- TABLE: user_profiles
-- Extends Supabase auth.users
-- ─────────────────────────────────────────────
CREATE TABLE public.user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     VARCHAR(100) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'user'
                CHECK (role IN ('admin', 'user')),
  language_pref VARCHAR(5)   NOT NULL DEFAULT 'vi'
                CHECK (language_pref IN ('vi', 'en', 'la', 'zh')),
  department    VARCHAR(100),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABLE: sectors
-- ─────────────────────────────────────────────
CREATE TABLE public.sectors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        VARCHAR(50) UNIQUE NOT NULL,
  icon        VARCHAR(50) NOT NULL DEFAULT 'building',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.sector_translations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sector_id   UUID NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
  locale      VARCHAR(5) NOT NULL CHECK (locale IN ('vi', 'en', 'la', 'zh')),
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  UNIQUE (sector_id, locale)
);

-- ─────────────────────────────────────────────
-- TABLE: tags
-- ─────────────────────────────────────────────
CREATE TABLE public.tags (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(50) UNIQUE NOT NULL,
  slug       VARCHAR(60) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABLE: solutions
-- ─────────────────────────────────────────────
CREATE TABLE public.solutions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          VARCHAR(60) UNIQUE NOT NULL
                CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  demo_url      TEXT NOT NULL CHECK (demo_url LIKE 'https://%'),
  video_url     TEXT,
  download_url  TEXT,
  logo_url      TEXT,
  status        VARCHAR(20) NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'active', 'inactive')),
  view_count    INTEGER NOT NULL DEFAULT 0,
  created_by    UUID NOT NULL REFERENCES user_profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER solutions_updated_at
  BEFORE UPDATE ON solutions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────
-- TABLE: solution_translations
-- ─────────────────────────────────────────────
CREATE TABLE public.solution_translations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solution_id   UUID NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,
  locale        VARCHAR(5) NOT NULL CHECK (locale IN ('vi', 'en', 'la', 'zh')),
  name          VARCHAR(100) NOT NULL,
  short_desc    VARCHAR(500),
  full_desc     TEXT,
  UNIQUE (solution_id, locale)
);

-- ─────────────────────────────────────────────
-- TABLE: solution_sectors (junction)
-- ─────────────────────────────────────────────
CREATE TABLE public.solution_sectors (
  solution_id UUID NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,
  sector_id   UUID NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
  PRIMARY KEY (solution_id, sector_id)
);

-- ─────────────────────────────────────────────
-- TABLE: solution_tags (junction)
-- ─────────────────────────────────────────────
CREATE TABLE public.solution_tags (
  solution_id UUID NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (solution_id, tag_id)
);

-- ─────────────────────────────────────────────
-- TABLE: documents
-- ─────────────────────────────────────────────
CREATE TABLE public.documents (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solution_id  UUID NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,
  type         VARCHAR(30) NOT NULL DEFAULT 'presentation'
               CHECK (type IN ('presentation', 'user_guide', 'technical')),
  title        VARCHAR(200) NOT NULL,
  url          TEXT NOT NULL,
  locale       VARCHAR(5) DEFAULT 'vi' CHECK (locale IN ('vi', 'en', 'la', 'zh')),
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABLE: changelogs
-- ─────────────────────────────────────────────
CREATE TABLE public.changelogs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solution_id  UUID NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,
  version      VARCHAR(20) NOT NULL
               CHECK (version ~ '^\d+\.\d+\.\d+$'),
  release_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by   UUID NOT NULL REFERENCES user_profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (solution_id, version)
);

CREATE TABLE public.changelog_translations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  changelog_id UUID NOT NULL REFERENCES changelogs(id) ON DELETE CASCADE,
  locale       VARCHAR(5) NOT NULL CHECK (locale IN ('vi', 'en', 'la', 'zh')),
  title        VARCHAR(200),
  content      TEXT NOT NULL,
  UNIQUE (changelog_id, locale)
);

-- ─────────────────────────────────────────────
-- TABLE: comments
-- ─────────────────────────────────────────────
CREATE TABLE public.comments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solution_id  UUID NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES user_profiles(id),
  type         VARCHAR(20) NOT NULL DEFAULT 'comment'
               CHECK (type IN ('comment', 'feedback', 'bug', 'note')),
  content      TEXT NOT NULL CHECK (LENGTH(content) <= 2000),
  status       VARCHAR(20) NOT NULL DEFAULT 'open'
               CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────
-- TABLE: page_views (analytics)
-- ─────────────────────────────────────────────
CREATE TABLE public.page_views (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solution_id  UUID REFERENCES solutions(id) ON DELETE SET NULL,
  sector_id    UUID REFERENCES sectors(id) ON DELETE SET NULL,
  user_id      UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  ip_hash      VARCHAR(64),
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX idx_solutions_slug        ON solutions(slug);
CREATE INDEX idx_solutions_status      ON solutions(status);
CREATE INDEX idx_solution_sectors_sol  ON solution_sectors(solution_id);
CREATE INDEX idx_solution_sectors_sec  ON solution_sectors(sector_id);
CREATE INDEX idx_solution_tags_sol     ON solution_tags(solution_id);
CREATE INDEX idx_solution_trans_sol    ON solution_translations(solution_id);
CREATE INDEX idx_solution_trans_locale ON solution_translations(locale);
CREATE INDEX idx_documents_sol         ON documents(solution_id);
CREATE INDEX idx_changelogs_sol        ON changelogs(solution_id);
CREATE INDEX idx_changelog_trans_cl    ON changelog_translations(changelog_id);
CREATE INDEX idx_comments_sol          ON comments(solution_id);
CREATE INDEX idx_comments_user         ON comments(user_id);
CREATE INDEX idx_page_views_sol        ON page_views(solution_id);
CREATE INDEX idx_page_views_created    ON page_views(created_at DESC);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────
ALTER TABLE user_profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE solutions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE solution_translations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE solution_sectors       ENABLE ROW LEVEL SECURITY;
ALTER TABLE solution_tags          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors                ENABLE ROW LEVEL SECURITY;
ALTER TABLE sector_translations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents              ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelogs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelog_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views             ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- user_profiles
CREATE POLICY "Users see own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid() OR is_admin());

CREATE POLICY "Admin manages users"
  ON user_profiles FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- solutions: active visible to all auth users; admin sees all
CREATE POLICY "Auth users see active solutions"
  ON solutions FOR SELECT
  USING (auth.uid() IS NOT NULL AND (status = 'active' OR is_admin()));

CREATE POLICY "Admin CRUD solutions"
  ON solutions FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- solution_translations
CREATE POLICY "Auth users see active solution translations"
  ON solution_translations FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      is_admin() OR
      EXISTS (SELECT 1 FROM solutions s WHERE s.id = solution_id AND s.status = 'active')
    )
  );

CREATE POLICY "Admin manages solution translations"
  ON solution_translations FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- sectors + tags: all authenticated users can read
CREATE POLICY "Auth read sectors"
  ON sectors FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth read sector translations"
  ON sector_translations FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth read tags"
  ON tags FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin manage tags"
  ON tags FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- solution_sectors + solution_tags
CREATE POLICY "Auth read solution_sectors"
  ON solution_sectors FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin manage solution_sectors"
  ON solution_sectors FOR ALL USING (is_admin());

CREATE POLICY "Auth read solution_tags"
  ON solution_tags FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin manage solution_tags"
  ON solution_tags FOR ALL USING (is_admin());

-- documents
CREATE POLICY "Auth read documents"
  ON documents FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin manage documents"
  ON documents FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- changelogs + translations
CREATE POLICY "Auth read changelogs"
  ON changelogs FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin manage changelogs"
  ON changelogs FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Auth read changelog translations"
  ON changelog_translations FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin manage changelog translations"
  ON changelog_translations FOR ALL USING (is_admin());

-- comments
CREATE POLICY "Auth see comments"
  ON comments FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Users update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id OR is_admin());

-- page_views
CREATE POLICY "Auth insert page views"
  ON page_views FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin read analytics"
  ON page_views FOR SELECT USING (is_admin());
