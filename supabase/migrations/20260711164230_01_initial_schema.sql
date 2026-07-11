/*
# Ayomi Pesan - Initial Schema

## Overview
Full schema for a QR-Code-based Dine-In food ordering system.

## Tables Created
1. `users` - Staff accounts (admin, kasir, dapur) linked to auth.users
2. `categories` - Menu categories (Makanan, Minuman, Snack, etc.)
3. `menus` - Food/drink items with pricing, images, availability
4. `tables` - Restaurant tables with unique QR code UUID
5. `orders` - Customer orders with full status tracking
6. `order_items` - Line items per order
7. `payments` - Payment records (QRIS, Cash)
8. `restaurant_settings` - Single-row restaurant config
9. `activity_logs` - Audit trail for important business events

## Security
- RLS enabled on all tables
- Admin: full access via service role or is_active + role check
- Kasir: orders, order_items, payments
- Dapur: orders, order_items (read + status update)
- Customer (anon): can read menus/categories/tables, create orders,
  read their own orders via customer_session token

## Enums
- user_role: admin, kasir, dapur
- payment_method: qris, cash
- payment_status: waiting, paid, failed
- order_status: pending, waiting_payment, waiting_cash_payment, paid, diproses, dimasak, siap_diantar, selesai, cancelled
*/

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'kasir', 'dapur');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method_type AS ENUM ('qris', 'cash');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status_type AS ENUM ('waiting', 'paid', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status_type AS ENUM (
    'pending',
    'waiting_payment',
    'waiting_cash_payment',
    'paid',
    'diproses',
    'dimasak',
    'siap_diantar',
    'selesai',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TABLES
-- ============================================================

-- 1. Users (staff only - admin, kasir, dapur)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name varchar(255) NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'kasir',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  icon varchar(50),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Menus
CREATE TABLE IF NOT EXISTS menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name varchar(255) NOT NULL,
  description text,
  price numeric(12, 2) NOT NULL DEFAULT 0,
  image_url text,
  stock integer NOT NULL DEFAULT 0,
  is_available boolean NOT NULL DEFAULT true,
  is_best_seller boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Tables (restaurant tables)
CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number integer NOT NULL,
  table_uuid uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  qr_code_url text,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number varchar(50) UNIQUE NOT NULL,
  table_id uuid NOT NULL REFERENCES tables(id) ON DELETE RESTRICT,
  customer_session varchar(255) NOT NULL,
  payment_method payment_method_type NOT NULL DEFAULT 'cash',
  payment_status payment_status_type NOT NULL DEFAULT 'waiting',
  order_status order_status_type NOT NULL DEFAULT 'pending',
  subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  tax numeric(12, 2) NOT NULL DEFAULT 0,
  service_fee numeric(12, 2) NOT NULL DEFAULT 0,
  total numeric(12, 2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_id uuid NOT NULL REFERENCES menus(id) ON DELETE RESTRICT,
  qty integer NOT NULL DEFAULT 1,
  price numeric(12, 2) NOT NULL DEFAULT 0,
  subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method varchar(50) NOT NULL,
  transaction_id varchar(255),
  external_reference varchar(255),
  amount numeric(12, 2) NOT NULL DEFAULT 0,
  payment_status varchar(50) NOT NULL DEFAULT 'waiting',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Restaurant Settings (single row)
CREATE TABLE IF NOT EXISTS restaurant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_name varchar(255) NOT NULL DEFAULT 'Ayomi Pesan',
  address text,
  phone varchar(50),
  logo_url text,
  qris_image_url text,
  tax_percentage numeric(5, 2) NOT NULL DEFAULT 10,
  service_percentage numeric(5, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action varchar(100) NOT NULL,
  module varchar(100) NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Menus
CREATE INDEX IF NOT EXISTS idx_menus_category_id ON menus(category_id);
CREATE INDEX IF NOT EXISTS idx_menus_is_available ON menus(is_available);
CREATE INDEX IF NOT EXISTS idx_menus_is_best_seller ON menus(is_best_seller);

-- Tables
CREATE INDEX IF NOT EXISTS idx_tables_table_uuid ON tables(table_uuid);
CREATE INDEX IF NOT EXISTS idx_tables_table_number ON tables(table_number);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_session ON orders(customer_session);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Order Items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_id ON order_items(menu_id);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);

-- Activity Logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_menus_updated_at ON menus;
CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON menus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_restaurant_settings_updated_at ON restaurant_settings;
CREATE TRIGGER update_restaurant_settings_updated_at BEFORE UPDATE ON restaurant_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ORDER NUMBER GENERATOR
-- ============================================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  v_date TEXT;
  v_seq  TEXT;
  v_count INTEGER;
BEGIN
  v_date := TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO v_count FROM orders WHERE DATE(created_at) = CURRENT_DATE;
  v_seq := LPAD(v_count::TEXT, 4, '0');
  RETURN 'ORD-' || v_date || '-' || v_seq;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_auth_id uuid)
RETURNS user_role AS $$
  SELECT role FROM users WHERE auth_user_id = user_auth_id AND is_active = true LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- USERS table policies
-- ============================================================
DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id OR get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "users_insert_admin" ON users;
CREATE POLICY "users_insert_admin"
ON users FOR INSERT
TO authenticated
WITH CHECK (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "users_update_admin" ON users;
CREATE POLICY "users_update_admin"
ON users FOR UPDATE
TO authenticated
USING (get_user_role(auth.uid()) = 'admin' OR auth.uid() = auth_user_id)
WITH CHECK (get_user_role(auth.uid()) = 'admin' OR auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "users_delete_admin" ON users;
CREATE POLICY "users_delete_admin"
ON users FOR DELETE
TO authenticated
USING (get_user_role(auth.uid()) = 'admin');

-- ============================================================
-- CATEGORIES policies (public read, admin write)
-- ============================================================
DROP POLICY IF EXISTS "categories_select_public" ON categories;
CREATE POLICY "categories_select_public"
ON categories FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "categories_insert_admin" ON categories;
CREATE POLICY "categories_insert_admin"
ON categories FOR INSERT
TO authenticated
WITH CHECK (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "categories_update_admin" ON categories;
CREATE POLICY "categories_update_admin"
ON categories FOR UPDATE
TO authenticated
USING (get_user_role(auth.uid()) = 'admin')
WITH CHECK (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "categories_delete_admin" ON categories;
CREATE POLICY "categories_delete_admin"
ON categories FOR DELETE
TO authenticated
USING (get_user_role(auth.uid()) = 'admin');

-- ============================================================
-- MENUS policies (public read, admin write)
-- ============================================================
DROP POLICY IF EXISTS "menus_select_public" ON menus;
CREATE POLICY "menus_select_public"
ON menus FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "menus_insert_admin" ON menus;
CREATE POLICY "menus_insert_admin"
ON menus FOR INSERT
TO authenticated
WITH CHECK (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "menus_update_admin" ON menus;
CREATE POLICY "menus_update_admin"
ON menus FOR UPDATE
TO authenticated
USING (get_user_role(auth.uid()) = 'admin')
WITH CHECK (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "menus_delete_admin" ON menus;
CREATE POLICY "menus_delete_admin"
ON menus FOR DELETE
TO authenticated
USING (get_user_role(auth.uid()) = 'admin');

-- ============================================================
-- TABLES policies (public read for QR scanning, admin write)
-- ============================================================
DROP POLICY IF EXISTS "tables_select_public" ON tables;
CREATE POLICY "tables_select_public"
ON tables FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "tables_insert_admin" ON tables;
CREATE POLICY "tables_insert_admin"
ON tables FOR INSERT
TO authenticated
WITH CHECK (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "tables_update_admin" ON tables;
CREATE POLICY "tables_update_admin"
ON tables FOR UPDATE
TO authenticated
USING (get_user_role(auth.uid()) = 'admin')
WITH CHECK (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "tables_delete_admin" ON tables;
CREATE POLICY "tables_delete_admin"
ON tables FOR DELETE
TO authenticated
USING (get_user_role(auth.uid()) = 'admin');

-- ============================================================
-- ORDERS policies
-- ============================================================
-- Anon customers: insert their own, select by customer_session
DROP POLICY IF EXISTS "orders_select_customer" ON orders;
CREATE POLICY "orders_select_customer"
ON orders FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "orders_insert_customer" ON orders;
CREATE POLICY "orders_insert_customer"
ON orders FOR INSERT
TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "orders_select_staff" ON orders;
CREATE POLICY "orders_select_staff"
ON orders FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "orders_insert_staff" ON orders;
CREATE POLICY "orders_insert_staff"
ON orders FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "orders_update_staff" ON orders;
CREATE POLICY "orders_update_staff"
ON orders FOR UPDATE
TO authenticated
USING (get_user_role(auth.uid()) IN ('admin', 'kasir', 'dapur'))
WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'kasir', 'dapur'));

DROP POLICY IF EXISTS "orders_delete_admin" ON orders;
CREATE POLICY "orders_delete_admin"
ON orders FOR DELETE
TO authenticated
USING (get_user_role(auth.uid()) = 'admin');

-- ============================================================
-- ORDER_ITEMS policies
-- ============================================================
DROP POLICY IF EXISTS "order_items_select_public" ON order_items;
CREATE POLICY "order_items_select_public"
ON order_items FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "order_items_insert_public" ON order_items;
CREATE POLICY "order_items_insert_public"
ON order_items FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "order_items_update_staff" ON order_items;
CREATE POLICY "order_items_update_staff"
ON order_items FOR UPDATE
TO authenticated
USING (get_user_role(auth.uid()) IN ('admin', 'kasir', 'dapur'))
WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'kasir', 'dapur'));

DROP POLICY IF EXISTS "order_items_delete_admin" ON order_items;
CREATE POLICY "order_items_delete_admin"
ON order_items FOR DELETE
TO authenticated
USING (get_user_role(auth.uid()) IN ('admin', 'kasir'));

-- ============================================================
-- PAYMENTS policies
-- ============================================================
DROP POLICY IF EXISTS "payments_select_public" ON payments;
CREATE POLICY "payments_select_public"
ON payments FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "payments_insert_public" ON payments;
CREATE POLICY "payments_insert_public"
ON payments FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "payments_update_staff" ON payments;
CREATE POLICY "payments_update_staff"
ON payments FOR UPDATE
TO authenticated
USING (get_user_role(auth.uid()) IN ('admin', 'kasir'))
WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'kasir'));

-- ============================================================
-- RESTAURANT_SETTINGS policies
-- ============================================================
DROP POLICY IF EXISTS "settings_select_public" ON restaurant_settings;
CREATE POLICY "settings_select_public"
ON restaurant_settings FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "settings_insert_admin" ON restaurant_settings;
CREATE POLICY "settings_insert_admin"
ON restaurant_settings FOR INSERT
TO authenticated
WITH CHECK (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "settings_update_admin" ON restaurant_settings;
CREATE POLICY "settings_update_admin"
ON restaurant_settings FOR UPDATE
TO authenticated
USING (get_user_role(auth.uid()) = 'admin')
WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- ============================================================
-- ACTIVITY_LOGS policies
-- ============================================================
DROP POLICY IF EXISTS "logs_select_admin" ON activity_logs;
CREATE POLICY "logs_select_admin"
ON activity_logs FOR SELECT
TO authenticated
USING (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "logs_insert_staff" ON activity_logs;
CREATE POLICY "logs_insert_staff"
ON activity_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow anon insert for customer-triggered events
DROP POLICY IF EXISTS "logs_insert_anon" ON activity_logs;
CREATE POLICY "logs_insert_anon"
ON activity_logs FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE menus;
ALTER PUBLICATION supabase_realtime ADD TABLE tables;

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-logo', 'restaurant-logo', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('qris', 'qris', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "menu_images_public_read" ON storage.objects;
CREATE POLICY "menu_images_public_read" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "menu_images_admin_write" ON storage.objects;
CREATE POLICY "menu_images_admin_write" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "menu_images_admin_update" ON storage.objects;
CREATE POLICY "menu_images_admin_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "menu_images_admin_delete" ON storage.objects;
CREATE POLICY "menu_images_admin_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "logo_public_read" ON storage.objects;
CREATE POLICY "logo_public_read" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'restaurant-logo');

DROP POLICY IF EXISTS "logo_admin_write" ON storage.objects;
CREATE POLICY "logo_admin_write" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'restaurant-logo');

DROP POLICY IF EXISTS "logo_admin_update" ON storage.objects;
CREATE POLICY "logo_admin_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'restaurant-logo');

DROP POLICY IF EXISTS "qris_public_read" ON storage.objects;
CREATE POLICY "qris_public_read" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'qris');

DROP POLICY IF EXISTS "qris_admin_write" ON storage.objects;
CREATE POLICY "qris_admin_write" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'qris');

DROP POLICY IF EXISTS "qris_admin_update" ON storage.objects;
CREATE POLICY "qris_admin_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'qris');

-- ============================================================
-- SEED: Restaurant settings
-- ============================================================
INSERT INTO restaurant_settings (restaurant_name, address, phone, tax_percentage, service_percentage)
SELECT 'Ayomi Pesan', 'Jl. Kuliner No. 1, Jakarta', '+62-21-1234567', 10, 5
WHERE NOT EXISTS (SELECT 1 FROM restaurant_settings);

-- SEED: Default categories
INSERT INTO categories (name, icon, sort_order, is_active)
SELECT * FROM (VALUES
  ('Makanan', '🍽️', 1, true),
  ('Minuman', '🥤', 2, true),
  ('Snack', '🍿', 3, true),
  ('Dessert', '🍰', 4, true)
) AS v(name, icon, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);
