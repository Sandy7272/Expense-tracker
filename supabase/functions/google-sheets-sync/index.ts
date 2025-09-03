import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
  person?: string
  source: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
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
      const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')
      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-sheets-sync`
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${googleClientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/spreadsheets.readonly')}&` +
        `response_type=code&` +
        `state=${user.id}&` +
        `access_type=offline&` +
        `prompt=consent`

      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'sync') {
      console.log('🔄 Starting Google Sheets sync for user:', user.id)

      // Get user's Google access token from settings
      const { data: settings } = await supabase
        .from('user_settings')
        .select('google_access_token, google_refresh_token, google_token_expires_at, sheet_url')
        .eq('user_id', user.id)
        .single()

      if (!settings?.google_access_token) {
        throw new Error('No Google access token found. Please authenticate first.')
      }

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
      let accessToken = settings.google_access_token
      if (settings.google_token_expires_at && new Date() > new Date(settings.google_token_expires_at)) {
        console.log('🔄 Refreshing Google access token')
        // Refresh token logic would go here
        // For now, we'll use the existing token
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
          console.error('Error parsing row:', row, error)
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
        const isDuplicate = existingTransactions?.some(existingTx => 
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
      const state = url.searchParams.get('state') // This is the user ID
      
      if (!code || !state) {
        throw new Error('Missing OAuth parameters')
      }

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
          redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-sheets-sync`,
          grant_type: 'authorization_code',
        }),
      })

      const tokens = await tokenResponse.json()
      
      if (tokens.error) {
        throw new Error(`OAuth error: ${tokens.error_description}`)
      }

      // Store tokens in user settings
      const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000))
      
      await supabase
        .from('user_settings')
        .update({
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token,
          google_token_expires_at: expiresAt.toISOString()
        })
        .eq('user_id', state)

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

  } catch (error) {
    console.error('Error in google-sheets-sync function:', error)
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: error.toString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})