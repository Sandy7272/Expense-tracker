import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
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

    if (action === 'retrieve') {
      console.log('🔓 Retrieving Google tokens for user:', targetUserId)
      
      // Get vault ID from user settings
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('google_token_vault_id, google_auth_status')
        .eq('user_id', targetUserId)
        .single()

      if (settingsError || !settings?.google_token_vault_id) {
        throw new Error('No Google tokens found for user')
      }

      if (settings.google_auth_status !== 'connected') {
        throw new Error(`Google auth status: ${settings.google_auth_status}`)
      }

      // Retrieve tokens from vault
      const { data: vaultData, error: vaultError } = await supabase
        .from('vault')
        .select('secret')
        .eq('id', settings.google_token_vault_id)
        .single()

      if (vaultError || !vaultData) {
        console.error('Vault retrieval error:', vaultError)
        // Update status to error if vault access fails
        await supabase
          .from('user_settings')
          .update({ google_auth_status: 'error' })
          .eq('user_id', targetUserId)
        
        throw new Error('Failed to retrieve tokens from secure storage')
      }

      const tokens: GoogleTokens = JSON.parse(vaultData.secret)
      
      console.log('✅ Google tokens retrieved successfully for user:', targetUserId)
      
      return new Response(JSON.stringify({ 
        success: true, 
        tokens 
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

    if (action === 'refresh') {
      console.log('🔄 Refreshing Google tokens for user:', user.id)
      
      // First retrieve current tokens
      const retrieveResponse = await fetch(`${req.url}`, {
        method: 'POST',
        headers: req.headers,
        body: JSON.stringify({ action: 'retrieve' })
      })
      
      if (!retrieveResponse.ok) {
        throw new Error('Cannot retrieve current tokens for refresh')
      }
      
      const { tokens: currentTokens } = await retrieveResponse.json()
      
      if (!currentTokens.refresh_token) {
        throw new Error('No refresh token available')
      }

      // Refresh the access token using Google OAuth
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          refresh_token: currentTokens.refresh_token,
          client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
          grant_type: 'refresh_token',
        }),
      })

      const refreshData = await refreshResponse.json()
      
      if (refreshData.error) {
        console.error('Token refresh error:', refreshData.error_description)
        
        // Update status to expired
        await supabase
          .from('user_settings')
          .update({ google_auth_status: 'expired' })
          .eq('user_id', user.id)
        
        throw new Error(`Token refresh failed: ${refreshData.error_description}`)
      }

      // Store refreshed tokens
      const newTokens = {
        access_token: refreshData.access_token,
        refresh_token: refreshData.refresh_token || currentTokens.refresh_token,
        expires_at: new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString()
      }

      // Store the new tokens (this will create a new vault entry)
      const storeResponse = await fetch(`${req.url}`, {
        method: 'POST',
        headers: req.headers,
        body: JSON.stringify({ 
          action: 'store', 
          tokens: newTokens 
        })
      })

      if (!storeResponse.ok) {
        throw new Error('Failed to store refreshed tokens')
      }

      console.log('✅ Google tokens refreshed successfully for user:', user.id)
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Tokens refreshed successfully',
        tokens: newTokens
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })

  } catch (error) {
    console.error('Error in secure-google-tokens function:', error)
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: error.toString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})