import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @deno-types="npm:@types/pdf-parse@1.1.4"
import pdfParse from "npm:pdf-parse@1.1.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Handle PDF parsing mode — AI-powered full extraction
    if (body.mode === 'parse-pdf') {
      console.log('Parsing PDF file with AI...');
      
      const base64Data = body.pdfFile.split(',')[1];
      const pdfBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      const data = await pdfParse(pdfBuffer);
      const pdfText = data.text;
      console.log(`PDF text extracted: ${pdfText.length} chars`);
      
      // Use AI to extract transactions from the raw PDF text
      const transactions = await aiExtractTransactions(pdfText, LOVABLE_API_KEY);
      
      if (transactions.length === 0) {
        return new Response(
          JSON.stringify({ error: "No transactions found in PDF. Please ensure it's a bank statement or try CSV/Excel format." }), 
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ transactions }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Standard categorization mode (CSV/Excel)
    const { transactions } = body;
    console.log(`Categorizing ${transactions.length} transactions`);

    const categorizations = await categorizeTransactions(transactions, LOVABLE_API_KEY);

    return new Response(
      JSON.stringify({ categorizations }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("categorize-transactions error:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    
    return new Response(
      JSON.stringify({ 
        message: "Unable to process transactions. Please try again.",
        code: "PROCESSING_ERROR"
      }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// AI-powered PDF transaction extraction — handles any bank format
async function aiExtractTransactions(pdfText: string, apiKey: string) {
  const today = new Date().toISOString().split('T')[0];
  
  const systemPrompt = `You are an expert bank statement parser for Indian banks (HDFC, SBI, ICICI, Axis, Kotak, YES Bank, etc.).

Extract ALL financial transactions from the provided bank statement text.

Return ONLY a JSON array. Each transaction must have:
- date: "YYYY-MM-DD" format
- description: clean merchant/transaction name (max 100 chars)
- amount: positive number
- type: "expense" | "income" (credit = income, debit = expense)
- category: one of [Food, Transport, Shopping, Entertainment, Health, Education, Bills, Investment, EMI, Rent, Salary, Transfer, Other]
- confidence: 0.0-1.0

Rules:
- ONLY include actual money transactions (not balance, opening/closing entries)
- UPI/NEFT/RTGS to another person = Transfer
- ATM withdrawal = expense, Other category
- Salary credit = income, Salary category
- EMI/loan = expense, EMI category
- Parse ALL date formats: DD/MM/YY, DD-MM-YYYY, MMM DD, etc.
- Default year to current year if not specified
- Remove Dr/Cr suffixes from descriptions
- Today's date: ${today}

Return ONLY the raw JSON array, no markdown, no explanation.`;

  const userPrompt = `Extract all transactions from this bank statement:\n\n${pdfText.substring(0, 12000)}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI extraction error:", response.status, errorText);
    
    if (response.status === 429) throw new Error("Rate limit exceeded. Please try again later.");
    if (response.status === 402) throw new Error("AI quota exceeded.");
    throw new Error(`AI error: ${errorText}`);
  }

  const data = await response.json();
  const aiResponse = data.choices[0].message.content;
  console.log("AI response length:", aiResponse.length);

  try {
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`AI extracted ${parsed.length} transactions`);
      return parsed;
    }
    return JSON.parse(aiResponse);
  } catch (parseError) {
    console.error("Failed to parse AI response:", parseError);
    // Fallback to regex-based extraction
    return extractTransactionsFromTextFallback(pdfText);
  }
}

async function categorizeTransactions(transactions: any[], apiKey: string) {
  const systemPrompt = `You are a financial transaction categorizer for Indian users.
Categorize each transaction into: Food, Transport, EMI, Rent, Shopping, Salary, Investment, Entertainment, Bills, Healthcare, Education, Other.

Return ONLY a JSON array: [{"category": "Food", "confidence": 0.95}, ...]
Return valid JSON only.`;

  const userPrompt = `Categorize:\n${transactions.map((t: any, i: number) => 
    `${i + 1}. ${t.description} - ₹${t.amount}`
  ).join('\n')}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) throw new Error("Rate limit exceeded.");
    if (response.status === 402) throw new Error("AI quota exceeded.");
    throw new Error(`AI gateway error: ${errorText}`);
  }

  const data = await response.json();
  const aiResponse = data.choices[0].message.content;

  try {
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return JSON.parse(aiResponse);
  } catch {
    return transactions.map(() => ({ category: "Other", confidence: 0.5 }));
  }
}

function extractTransactionsFromTextFallback(text: string) {
  const transactions: any[] = [];
  const lines = text.split('\n');
  
  const patterns = [
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(.+?)\s+(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)\s*(Dr|Cr|Debit|Credit)?/i,
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(.+?)\s+([\d,]+\.?\d*)/i
  ];
  
  for (const line of lines) {
    if (line.match(/Date|Transaction|Particulars|Description|Balance|Opening|Closing|Statement/i)) continue;
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const description = match[2]?.trim();
        const amount = parseFloat((match[3] || '0').replace(/,/g, ''));
        const indicator = match[4]?.toLowerCase();
        const type = (indicator === 'cr' || indicator === 'credit') ? 'income' : 'expense';
        
        if (amount > 0 && description && description.length > 3) {
          transactions.push({
            date: normalizeDate(match[1]),
            description: description.substring(0, 100),
            amount,
            type,
            category: "Other",
            confidence: 0.5
          });
          break;
        }
      }
    }
  }
  
  return transactions;
}

function normalizeDate(dateStr: string): string {
  try {
    const parts = dateStr.split(/[/-]/);
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const fullYear = year.length === 2 ? `20${year}` : year;
      return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
    return new Date().toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}
