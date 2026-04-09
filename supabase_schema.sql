-- ============================================================
-- INVENTORY SYSTEM — SUPABASE DATABASE SCHEMA
-- Compatible with: Supabase SQL Editor (PostgreSQL)
-- Paste this in: Supabase > SQL Editor > New Query > Run
-- ============================================================


-- ============================================================
-- 1. USERS TABLE
--    Stores registered accounts (email + hashed PIN)
--    Replaces: localStorage key `inv_users`
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  pin         TEXT NOT NULL,           -- store as plain text or hashed (recommended: hash with pgcrypto)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- 2. USER SETTINGS TABLE
--    Per-user preferences: currency, date format, theme, accent
--    Replaces: localStorage key `inv_settings_{email}`
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency     TEXT NOT NULL DEFAULT '₱',
  date_format  TEXT NOT NULL DEFAULT 'MM/DD/yyyy',
  theme        TEXT NOT NULL DEFAULT 'light',
  accent       TEXT NOT NULL DEFAULT 'sage',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_user_settings UNIQUE (user_id)
);


-- ============================================================
-- 3. PRODUCTS TABLE
--    Inventory items per user
--    Replaces: localStorage key `inv_products_{email}`
--
--    Fields based on Products.jsx form:
--      name, category, sellingPrice, costPrice, currentQty
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT '',
  selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cost_price    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  current_qty   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast per-user product lookups
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);


-- ============================================================
-- 4. SALES LOGS TABLE
--    Individual line items from each POS transaction
--    Replaces: localStorage key `inv_sales_logs_{email}`
--
--    Fields based on POS.jsx checkout logic:
--      productId, quantity, price, timestamp
-- ============================================================
CREATE TABLE IF NOT EXISTS sales_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  price       NUMERIC(12, 2) NOT NULL DEFAULT 0,   -- selling price at time of sale
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast per-user sales lookups and product-level reporting
CREATE INDEX IF NOT EXISTS idx_sales_logs_user_id     ON sales_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_logs_product_id  ON sales_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_logs_timestamp   ON sales_logs(timestamp DESC);


-- ============================================================
-- 5. AUTO-UPDATE TRIGGER
--    Keeps `updated_at` columns fresh on row updates
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS)
--    Ensures users can only see/edit their own data.
--    Enable this AFTER you set up Supabase Auth.
-- ============================================================

-- Uncomment the block below once Supabase Auth is integrated:
/*
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_logs     ENABLE ROW LEVEL SECURITY;

-- Users: only see your own row
CREATE POLICY "Own user row" ON users
  FOR ALL USING (auth.uid()::text = id::text);

-- Settings: only your own settings
CREATE POLICY "Own settings" ON user_settings
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth.uid()::text = id::text));

-- Products: only your own products
CREATE POLICY "Own products" ON products
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth.uid()::text = id::text));

-- Sales logs: only your own logs
CREATE POLICY "Own sales logs" ON sales_logs
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth.uid()::text = id::text));
*/


-- ============================================================
-- DONE ✓
-- Tables created:
--   users, user_settings, products, sales_logs
-- ============================================================
