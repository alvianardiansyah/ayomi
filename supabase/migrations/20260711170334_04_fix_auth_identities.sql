/*
# Fix auth identities for pre-seeded users

The manually inserted auth.users records were missing entries in auth.identities
which is required for Supabase email/password authentication to work.

This migration adds the missing identity records for all three pre-seeded accounts.
*/

-- Insert identities for all pre-seeded auth users
INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id)
SELECT 
  gen_random_uuid() as id,
  u.id as user_id,
  jsonb_build_object('sub', u.id::text, 'email', u.email) as identity_data,
  'email' as provider,
  now() as last_sign_in_at,
  now() as created_at,
  now() as updated_at,
  u.email as provider_id
FROM auth.users u
WHERE u.email IN ('admin@ayomipesan.com', 'kasir@ayomipesan.com', 'dapur@ayomipesan.com')
AND NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
);
