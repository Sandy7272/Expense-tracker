// @ts-ignore
/// <reference lib="deno.ns" />
// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service role for vault access
    )

    // Get the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid token')
    }

    const { action, tokens, user_id } = await req.json()

    // For OAuth callback, we need to handle user_id parameter
    const targetUserId = user_id || user.id

    if (action === 'store') {
      console.log('🔐 Storing Google tokens securely for user:', targetUserId)
      
      if (!tokens || !tokens.access_token) {
        throw new Error('Missing required tokens')
      }

      // Generate a unique vault key for this user's Google tokens
      const vaultKey = `google_tokens_${targetUserId}_${Date.now()}`
      
      // Store tokens in Supabase Vault (encrypted)
      const { error: vaultError } = await supabase
        .from('vault')
        .insert({
          id: vaultKey,
          secret: JSON.stringify(tokens),
          key_id: `google_auth_${targetUserId}`
        })

      if (vaultError) {
        console.error('Vault storage error:', vaultError)
        throw new Error('Failed to store tokens securely')
      }

      // Update user settings with vault reference and status
      const { error: settingsError } = await supabase
        .from('user_settings')
        .update({
          google_token_vault_id: vaultKey,
          google_auth_status: 'connected',
          google_token_expires_at: tokens.expires_at
        })
        .eq('user_id', targetUserId)

      if (settingsError) {
        console.error('Settings update error:', settingsError)
        // Try to clean up vault entry if settings update fails
        await supabase.from('vault').delete().eq('id', vaultKey)
        throw new Error('Failed to update user settings')
      }

      console.log('✅ Google tokens stored securely with vault ID:', vaultKey)
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Tokens stored securely',
        vault_id: vaultKey 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'revoke') {
      console.log('🗑️ Revoking Google tokens for user:', targetUserId)
      
      // Get vault ID from user settings
      const { data: settings } = await supabase
        .from('user_settings')
        .select('google_token_vault_id')
        .eq('user_id', targetUserId)
        .single()

      // Delete from vault if exists
      if (settings?.google_token_vault_id) {
        await supabase
          .from('vault')
          .delete()
          .eq('id', settings.google_token_vault_id)
      }

      // Update user settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .update({
          google_token_vault_id: null,
          google_auth_status: 'not_connected',
          google_token_expires_at: null
        })
        .eq('user_id', targetUserId)

      if (settingsError) {
        console.error('Settings cleanup error:', settingsError)
        throw new Error('Failed to revoke tokens')
      }

      console.log('✅ Google tokens revoked successfully for user:', targetUserId)
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Tokens revoked successfully' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }


    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })

  } catch (error: unknown) {
    const errorMessage = (error as Error).message || 'Unknown error'
    
    // Log full details server-side
    console.error('secure-google-tokens error:', {
      message: errorMessage,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString()
    })
    
    // Return sanitized error to client
    return new Response(JSON.stringify({
      message: 'Unable to process token request. Please try again.',
      code: 'TOKEN_ERROR'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})