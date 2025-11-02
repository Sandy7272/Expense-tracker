-- Create secure function to retrieve Google OAuth tokens
CREATE OR REPLACE FUNCTION get_google_tokens(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _vault_id text;
  _tokens jsonb;
BEGIN
  -- Get vault ID from user settings
  SELECT google_token_vault_id INTO _vault_id
  FROM user_settings
  WHERE user_id = _user_id;
  
  IF _vault_id IS NULL THEN
    RAISE EXCEPTION 'No Google authentication configured for this user';
  END IF;
  
  -- Retrieve from vault with strict access control
  SELECT decrypted_secret::jsonb INTO _tokens
  FROM vault.decrypted_secrets
  WHERE id = _vault_id;
  
  IF _tokens IS NULL THEN
    RAISE EXCEPTION 'Failed to retrieve authentication tokens';
  END IF;
  
  RETURN _tokens;
END;
$$;

-- Grant execute only to authenticated users
GRANT EXECUTE ON FUNCTION get_google_tokens(uuid) TO authenticated;

-- Add comment to categories table to document admin-only intent
COMMENT ON TABLE categories IS 'Admin-managed predefined categories. Users have read-only access via RLS SELECT policy. Modifications should be done via migrations or SQL Editor with service role.';