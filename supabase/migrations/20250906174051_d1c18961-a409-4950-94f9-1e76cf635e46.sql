-- Remove plaintext Google token columns from user_settings table
ALTER TABLE public.user_settings 
DROP COLUMN IF EXISTS google_access_token,
DROP COLUMN IF EXISTS google_refresh_token;

-- Add a token_vault_id column to reference encrypted tokens
ALTER TABLE public.user_settings
ADD COLUMN google_token_vault_id TEXT,
ADD COLUMN google_auth_status TEXT DEFAULT 'not_connected';

-- Add a comment explaining the security improvement
COMMENT ON COLUMN public.user_settings.google_token_vault_id IS 'Reference to encrypted Google tokens stored in Supabase Vault';
COMMENT ON COLUMN public.user_settings.google_auth_status IS 'Google authentication status: not_connected, connected, expired, error';