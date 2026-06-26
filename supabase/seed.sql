-- ============================================================
-- File: supabase/seed.sql
-- FOXAI Portal v1.0 — Seed Data
-- ============================================================

-- ─────────────────────────────────────────────
-- Seed Sectors (6 fixed sectors per BRD)
-- ─────────────────────────────────────────────
INSERT INTO sectors (id, slug, icon, sort_order) VALUES
  ('11111111-0001-0000-0000-000000000000', 'enterprise',  'building-2',     1),
  ('11111111-0002-0000-0000-000000000000', 'fintech',     'landmark',       2),
  ('11111111-0003-0000-0000-000000000000', 'government',  'landmark',       3),
  ('11111111-0004-0000-0000-000000000000', 'healthcare',  'heart-pulse',    4),
  ('11111111-0005-0000-0000-000000000000', 'education',   'graduation-cap', 5),
  ('11111111-0006-0000-0000-000000000000', 'security',    'shield-check',   6);

INSERT INTO sector_translations (sector_id, locale, name) VALUES
  -- Enterprise
  ('11111111-0001-0000-0000-000000000000', 'vi', 'Doanh nghiệp'),
  ('11111111-0001-0000-0000-000000000000', 'en', 'Enterprise'),
  ('11111111-0001-0000-0000-000000000000', 'la', 'ວິສາຫະກິດ'),
  ('11111111-0001-0000-0000-000000000000', 'zh', '企业'),
  -- Fintech
  ('11111111-0002-0000-0000-000000000000', 'vi', 'Tài chính - Ngân hàng'),
  ('11111111-0002-0000-0000-000000000000', 'en', 'Fintech & Banking'),
  ('11111111-0002-0000-0000-000000000000', 'la', 'ການເງິນ - ທະນາຄານ'),
  ('11111111-0002-0000-0000-000000000000', 'zh', '金融科技'),
  -- Government
  ('11111111-0003-0000-0000-000000000000', 'vi', 'Chính phủ - Hành chính công'),
  ('11111111-0003-0000-0000-000000000000', 'en', 'Government'),
  ('11111111-0003-0000-0000-000000000000', 'la', 'ລັດຖະບານ'),
  ('11111111-0003-0000-0000-000000000000', 'zh', '政府'),
  -- Healthcare
  ('11111111-0004-0000-0000-000000000000', 'vi', 'Y tế - Bệnh viện'),
  ('11111111-0004-0000-0000-000000000000', 'en', 'Healthcare'),
  ('11111111-0004-0000-0000-000000000000', 'la', 'ສາທາລະນະສຸກ'),
  ('11111111-0004-0000-0000-000000000000', 'zh', '医疗健康'),
  -- Education
  ('11111111-0005-0000-0000-000000000000', 'vi', 'Giáo dục - Trường học'),
  ('11111111-0005-0000-0000-000000000000', 'en', 'Education'),
  ('11111111-0005-0000-0000-000000000000', 'la', 'ການສຶກສາ'),
  ('11111111-0005-0000-0000-000000000000', 'zh', '教育'),
  -- Security
  ('11111111-0006-0000-0000-000000000000', 'vi', 'An ninh - Quốc phòng'),
  ('11111111-0006-0000-0000-000000000000', 'en', 'Security & Defense'),
  ('11111111-0006-0000-0000-000000000000', 'la', 'ຄວາມໝັ້ນຄົງ'),
  ('11111111-0006-0000-0000-000000000000', 'zh', '安全与国防');

-- ─────────────────────────────────────────────
-- Seed Tags
-- ─────────────────────────────────────────────
INSERT INTO tags (name, slug) VALUES
  ('AI Agent',    'ai-agent'),
  ('Chatbot',     'chatbot'),
  ('OCR',         'ocr'),
  ('NLP',         'nlp'),
  ('eKYC',        'ekyc'),
  ('Dashboard',   'dashboard'),
  ('ERP',         'erp'),
  ('Big Data',    'big-data'),
  ('RPA',         'rpa'),
  ('Mobile App',  'mobile-app');

-- ─────────────────────────────────────────────
-- Seed Users
-- ─────────────────────────────────────────────
-- STEP 1: Create auth users via Supabase Dashboard or CLI:
--   Email: admin@fox.ai.vn  Password: Admin@FOXAI2024!  → copy UUID
--   Email: demo@fox.ai.vn   Password: Demo@FOXAI2024!   → copy UUID
--
-- STEP 2: Replace the UUIDs below and uncomment:
--
-- INSERT INTO user_profiles (id, full_name, role, language_pref) VALUES
--   ('<admin-uuid-from-auth>', 'FOXAI Admin', 'admin', 'vi'),
--   ('<demo-uuid-from-auth>',  'Demo User',   'user',  'vi');
