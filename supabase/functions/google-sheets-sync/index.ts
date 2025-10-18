// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import { create, verify } from 'https://deno.land/x/djwt@v2.2/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GoogleSheetsResponse {
  values: string[][]
}

interface Transaction {
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
  person?: string | null
  source: string
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Set the auth header for Supabase client
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid token')
    }

    const { action, sheetUrl } = await req.json()

    if (action === 'authenticate') {
      // OAuth flow initiation
      // @ts-ignore
      const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')
      // @ts-ignore
      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-sheets-sync?action=oauth_callback`
      // @ts-ignore
      const jwtSecret = Deno.env.get('JWT_SECRET')
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not set in environment variables')
      }
      
      const state = await create({ alg: 'HS256', typ: 'JWT' }, { user_id: user.id, exp: Math.floor(Date.now() / 1000) + (60 * 10) }, jwtSecret) // 10 minute expiry
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${googleClientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/spreadsheets.readonly')}&` +
        `response_type=code&` +
        `state=${state}&` +
        `access_type=offline&` +
        `prompt=consent`

      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'sync') {
      console.log('🔄 Starting Google Sheets sync for user:', user.id)

      // Get sheet URL and vault ID from settings
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('sheet_url, google_auth_status, google_token_vault_id')
        .eq('user_id', user.id)
        .single()

      if (settingsError || !settings) {
        throw new Error('Could not retrieve user settings')
      }
      
      if (settings.google_auth_status !== 'connected' || !settings.google_token_vault_id) {
        throw new Error(`Google authentication required. Status: ${settings.google_auth_status || 'unknown'}`)
      }

      // Retrieve tokens from vault
      const { data: vaultData, error: vaultError } = await supabase
        .from('vault.decrypted_secrets')
        .select('decrypted_secret')
        .eq('id', settings.google_token_vault_id)
        .single()

      if (vaultError || !vaultData) {
        throw new Error('Failed to retrieve tokens from secure storage')
      }

      let tokens: GoogleTokens = JSON.parse(vaultData.decrypted_secret)

      const actualSheetUrl = sheetUrl || settings.sheet_url
      if (!actualSheetUrl) {
        throw new Error('No sheet URL provided')
      }

      // Extract sheet ID from URL
      const sheetIdMatch = actualSheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
      if (!sheetIdMatch) {
        throw new Error('Invalid Google Sheets URL')
      }
      const sheetId = sheetIdMatch[1]

      // Check if token needs refresh
      let accessToken = tokens.access_token
      if (tokens.expires_at && new Date() > new Date(tokens.expires_at)) {
        console.log('🔄 Refreshing Google access token for user:', user.id)
        
        if (!tokens.refresh_token) {
          throw new Error('No refresh token available. Please re-authenticate.')
        }

        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            refresh_token: tokens.refresh_token,
            // @ts-ignore
            client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
            // @ts-ignore
            client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
            grant_type: 'refresh_token',
          }),
        })

        const refreshData = await refreshResponse.json()

        if (refreshData.error) {
          await supabase.from('user_settings').update({ google_auth_status: 'expired' }).eq('user_id', user.id)
          throw new Error(`Token refresh failed: ${refreshData.error_description}`)
        }

        const newTokens: GoogleTokens = {
          access_token: refreshData.access_token,
          refresh_token: refreshData.refresh_token || tokens.refresh_token,
          expires_at: new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString(),
        }

        // Update the vault with the new tokens
        await supabase.functions.invoke('secure-google-tokens', {
          body: {
            action: 'store',
            tokens: newTokens,
            user_id: user.id
          }
        })

        accessToken = newTokens.access_token
        tokens = newTokens
      }

      // Fetch data from Google Sheets
      const range = 'Transactions!A:H' // Assuming columns A-H contain transaction data
      const sheetsResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!sheetsResponse.ok) {
        throw new Error(`Google Sheets API error: ${sheetsResponse.statusText}`)
      }

      const sheetsData: GoogleSheetsResponse = await sheetsResponse.json()
      
      if (!sheetsData.values || sheetsData.values.length < 2) {
        console.log('ℹ️ No data found in Google Sheets')
        return new Response(JSON.stringify({ 
          imported: 0, 
          duplicates: 0, 
          message: 'No data found in Google Sheets' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      // Parse sheet data (skip header row)
      const [headers, ...rows] = sheetsData.values
      console.log('📊 Found headers:', headers)
      console.log(`📊 Processing ${rows.length} rows from Google Sheets`)

      const transactions: Transaction[] = []
      
      for (const row of rows) {
        if (row.length < 4) continue // Skip incomplete rows
        
        try {
          const transaction: Transaction = {
            date: row[0] || new Date().toISOString().split('T')[0],
            type: (row[1]?.toLowerCase() === 'income' ? 'income' : 'expense') as 'income' | 'expense',
            category: row[2] || 'Other',
            description: row[3] || '',
            amount: parseFloat(row[4]) || 0,
            person: row[5] || null,
            source: 'google_sheets'
          }

          // Validate required fields
          if (transaction.amount > 0) {
            transactions.push(transaction)
          }
        } catch (error) {
          console.error('Error parsing row:', row, error as Error)
        }
      }

      console.log(`📈 Parsed ${transactions.length} valid transactions`)

      // Get existing transactions to check for duplicates
      const { data: existingTransactions } = await supabase
        .from('transactions')
        .select('date, amount, category, description')
        .eq('user_id', user.id)

      // Smart duplicate detection
      const newTransactions = transactions.filter(newTx => {
        const isDuplicate = existingTransactions?.some((existingTx: { date: string; amount: number; category: string; description: string | null }) =>
          existingTx.date === newTx.date &&
          Math.abs(existingTx.amount - newTx.amount) < 0.01 &&
          existingTx.category === newTx.category &&
          (existingTx.description === newTx.description ||
           (!existingTx.description && !newTx.description))
        )
        return !isDuplicate
      })

      console.log(`🔍 Found ${transactions.length - newTransactions.length} duplicates`)
      console.log(`✨ Importing ${newTransactions.length} new transactions`)

      // Insert new transactions
      if (newTransactions.length > 0) {
        const { error: insertError } = await supabase
          .from('transactions')
          .insert(
            newTransactions.map(tx => ({
              ...tx,
              user_id: user.id,
              status: 'completed'
            }))
          )

        if (insertError) {
          throw insertError
        }
      }

      // Update sync status
      await supabase
        .from('user_settings')
        .update({
          last_synced: new Date().toISOString(),
          sync_status: 'success',
          sync_errors: null
        })
        .eq('user_id', user.id)

      return new Response(JSON.stringify({
        imported: newTransactions.length,
        duplicates: transactions.length - newTransactions.length,
        total: transactions.length,
        message: `Successfully imported ${newTransactions.length} new transactions`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'oauth_callback') {
      // Handle OAuth callback
      const url = new URL(req.url)
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      
      if (!code || !state) {
        throw new Error('Missing OAuth parameters')
      }

      // Verify the state parameter (JWT)
      // @ts-ignore
      const jwtSecret = Deno.env.get('JWT_SECRET')
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not set in environment variables')
      }
      
      let payload
      try {
        payload = await verify(state, jwtSecret, 'HS256')
      } catch (error) {
        throw new Error('Invalid or expired state token')
      }

      const userId = payload.user_id as string

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          // @ts-ignore
          client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
          // @ts-ignore
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
          // @ts-ignore
          redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-sheets-sync?action=oauth_callback`,
          grant_type: 'authorization_code',
        }),
      })

      const tokens = await tokenResponse.json()
      
      if (tokens.error) {
        throw new Error(`OAuth error: ${tokens.error_description}`)
      }

      // Store tokens securely in vault
      const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000))
      
      const storeResponse = await supabase.functions.invoke('secure-google-tokens', {
        body: { 
          action: 'store',
          tokens: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: expiresAt.toISOString()
          },
         user_id: userId
       }
     })

      if (storeResponse.error) {
        console.error('Failed to store tokens securely:', storeResponse.error)
        throw new Error('Failed to store authentication tokens securely')
      }

      // Redirect to frontend settings page with success message
      const frontendUrl = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:3000'
      
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${frontendUrl}/settings?auth=success`,
        },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })

  } catch (error: unknown) {
    console.error('Error in google-sheets-sync function:', error)
    
    return new Response(JSON.stringify({
      error: (error as Error).message || 'Internal server error',
      details: (error as Error).toString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})