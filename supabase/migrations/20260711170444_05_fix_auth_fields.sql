/*
# Fix auth.users tokens - no phone update

Supabase auth requires confirmation_token, recovery_token, and 
email_change_token_new to be empty strings (not NULL) for email/password auth.
*/

UPDATE auth.users 
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, '')
WHERE email IN ('admin@ayomipesan.com', 'kasir@ayomipesan.com', 'dapur@ayomipesan.com');
