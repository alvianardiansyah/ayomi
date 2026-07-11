/*
# Create default admin account

Creates the first admin user with:
- Email: admin@ayomipesan.com
- Password: admin123456

The auth user is created first, then linked to the users table.
This allows immediate login to the system.
*/

-- Create admin auth user
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if admin already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@ayomipesan.com';

  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud
    )
    VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'admin@ayomipesan.com',
      crypt('admin123456', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      'authenticated',
      'authenticated'
    )
    RETURNING id INTO v_user_id;
  END IF;

  -- Create or update users record
  INSERT INTO users (auth_user_id, full_name, email, role, is_active)
  VALUES (v_user_id, 'Administrator', 'admin@ayomipesan.com', 'admin', true)
  ON CONFLICT (email) DO UPDATE SET auth_user_id = v_user_id, is_active = true;

END $$;

-- Also create a sample kasir and dapur account
DO $$
DECLARE
  v_kasir_id uuid;
  v_dapur_id uuid;
BEGIN
  -- Kasir
  SELECT id INTO v_kasir_id FROM auth.users WHERE email = 'kasir@ayomipesan.com';
  IF v_kasir_id IS NULL THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud
    ) VALUES (
      gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
      'kasir@ayomipesan.com', crypt('kasir123456', gen_salt('bf')),
      now(), now(), now(), '{"provider":"email","providers":["email"]}',
      '{}', false, 'authenticated', 'authenticated'
    ) RETURNING id INTO v_kasir_id;
  END IF;
  INSERT INTO users (auth_user_id, full_name, email, role, is_active)
  VALUES (v_kasir_id, 'Kasir Utama', 'kasir@ayomipesan.com', 'kasir', true)
  ON CONFLICT (email) DO UPDATE SET auth_user_id = v_kasir_id;

  -- Dapur
  SELECT id INTO v_dapur_id FROM auth.users WHERE email = 'dapur@ayomipesan.com';
  IF v_dapur_id IS NULL THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud
    ) VALUES (
      gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
      'dapur@ayomipesan.com', crypt('dapur123456', gen_salt('bf')),
      now(), now(), now(), '{"provider":"email","providers":["email"]}',
      '{}', false, 'authenticated', 'authenticated'
    ) RETURNING id INTO v_dapur_id;
  END IF;
  INSERT INTO users (auth_user_id, full_name, email, role, is_active)
  VALUES (v_dapur_id, 'Tim Dapur', 'dapur@ayomipesan.com', 'dapur', true)
  ON CONFLICT (email) DO UPDATE SET auth_user_id = v_dapur_id;

END $$;

-- Also add sample tables
INSERT INTO tables (table_number, is_active, notes)
SELECT * FROM (VALUES
  (1, true, 'Dekat pintu masuk'),
  (2, true, 'Tengah ruangan'),
  (3, true, 'Dekat jendela'),
  (4, true, 'VIP'),
  (5, true, NULL),
  (6, true, NULL),
  (7, true, NULL),
  (8, true, 'Outdoor'),
  (9, true, 'Outdoor'),
  (10, true, NULL)
) AS v(table_number, is_active, notes)
WHERE NOT EXISTS (SELECT 1 FROM tables LIMIT 1);

-- Also add sample menus
DO $$
DECLARE
  v_cat_makanan uuid;
  v_cat_minuman uuid;
  v_cat_snack uuid;
BEGIN
  SELECT id INTO v_cat_makanan FROM categories WHERE name = 'Makanan' LIMIT 1;
  SELECT id INTO v_cat_minuman FROM categories WHERE name = 'Minuman' LIMIT 1;
  SELECT id INTO v_cat_snack FROM categories WHERE name = 'Snack' LIMIT 1;

  IF v_cat_makanan IS NOT NULL AND NOT EXISTS (SELECT 1 FROM menus LIMIT 1) THEN
    INSERT INTO menus (category_id, name, description, price, stock, is_available, is_best_seller)
    VALUES
      (v_cat_makanan, 'Nasi Goreng Spesial', 'Nasi goreng dengan telur dan ayam suwir', 35000, 50, true, true),
      (v_cat_makanan, 'Mie Goreng Ayam', 'Mie goreng dengan ayam dan sayuran segar', 30000, 50, true, false),
      (v_cat_makanan, 'Ayam Bakar', 'Ayam bakar bumbu kecap dengan nasi', 45000, 30, true, true),
      (v_cat_makanan, 'Soto Ayam', 'Soto ayam kuah bening dengan nasi', 28000, 40, true, false),
      (v_cat_makanan, 'Nasi Uduk', 'Nasi uduk dengan ayam goreng dan sambel', 32000, 40, true, false);

    IF v_cat_minuman IS NOT NULL THEN
      INSERT INTO menus (category_id, name, description, price, stock, is_available, is_best_seller)
      VALUES
        (v_cat_minuman, 'Es Teh Manis', 'Teh manis segar dengan es batu', 8000, 100, true, true),
        (v_cat_minuman, 'Jus Alpukat', 'Jus alpukat segar dengan susu dan coklat', 20000, 50, true, false),
        (v_cat_minuman, 'Es Jeruk', 'Jeruk peras segar dengan es', 12000, 80, true, false),
        (v_cat_minuman, 'Air Mineral', 'Air mineral botol 600ml', 5000, 100, true, false);
    END IF;

    IF v_cat_snack IS NOT NULL THEN
      INSERT INTO menus (category_id, name, description, price, stock, is_available, is_best_seller)
      VALUES
        (v_cat_snack, 'Kentang Goreng', 'Kentang goreng crispy dengan saus', 20000, 60, true, true),
        (v_cat_snack, 'Pisang Goreng', 'Pisang goreng dengan susu dan coklat', 15000, 40, true, false);
    END IF;
  END IF;
END $$;
