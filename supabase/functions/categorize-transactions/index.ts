import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @deno-types="npm:@types/pdf-parse@1.1.4"
import pdfParse from "npm:pdf-parse@1.1.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CATEGORIES = [
  "Food", "Transport", "Shopping", "Entertainment", "Health", "Education",
  "Bills", "Investment", "EMI", "Rent", "Salary", "Transfer", "Groceries",
  "Subscriptions", "Insurance", "Recharge", "Fuel", "Other"
];

const AI_SYSTEM_PROMPT = `You are an expert financial transaction parser and categorizer for Indian users.

You will receive raw text from a bank statement or CSV/Excel export. Your job:
1. Extract ALL financial transactions from the text
2. Intelligently categorize each one based on the description/merchant name

Return ONLY a JSON array. Each transaction must have:
- date: "YYYY-MM-DD" format (parse any date format: DD/MM/YY, DD-MM-YYYY, MMM DD, etc.)
- description: clean merchant/transaction name (max 100 chars)
- amount: positive number (remove commas, currency symbols)
- type: "expense" | "income"
- category: one of [${CATEGORIES.join(", ")}]
- confidence: 0.0-1.0 (how confident you are in the categorization)

Smart categorization rules:
- Zomato, Swiggy, Dominos, Pizza Hut, McDonalds, restaurant names → Food
- Uber, Ola, Rapido, Metro, IRCTC, petrol, fuel → Transport
- Amazon, Flipkart, Myntra, Ajio → Shopping
- Netflix, Hotstar, Spotify, PVR, cinema → Entertainment / Subscriptions
- Apollo, Pharmeasy, 1mg, hospital, doctor → Health
- Salary, wages, freelance payment received → Salary (income)
- Mutual fund, SIP, stocks, Zerodha, Groww, Coin → Investment (expense)
- EMI, loan, HDFC loan, Bajaj Finance → EMI
- Rent, house rent, PG → Rent
- Electricity, water, gas, Jio, Airtel, BSNL → Bills / Recharge
- UPI/NEFT/RTGS to a person → Transfer
- Insurance premium, LIC, HDFC Life → Insurance
- BigBasket, Blinkit, DMart, grocery → Groceries
- ATM withdrawal → Other (expense)
- Interest credit, dividend → Income
- Cashback, refund → Income

Rules:
- ONLY include actual money transactions (skip headers, totals, balances, opening/closing entries)
- Default year to current year if not specified
- Clean up descriptions: remove reference numbers, transaction IDs, extra whitespace
- For CSV data: intelligently identify which columns are date, description, amount, debit/credit
- Return ONLY the raw JSON array, no markdown, no code fences, no explanation`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const today = new Date().toISOString().split('T')[0];

    // Mode: parse-pdf (PDF file → AI extraction)
    if (body.mode === 'parse-pdf') {
      console.log('Parsing PDF file with AI...');
      const base64Data = body.pdfFile.split(',')[1];
      const pdfBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const data = await pdfParse(pdfBuffer);
      const pdfText = data.text;
      console.log(`PDF text extracted: ${pdfText.length} chars`);
      
      const transactions = await aiSmartParse(pdfText, LOVABLE_API_KEY, today);
      
      if (transactions.length === 0) {
        return new Response(
          JSON.stringify({ error: "No transactions found in PDF. Please try CSV/Excel format." }), 
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ transactions }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mode: parse-csv-ai (Raw CSV/Excel text → AI extraction + categorization in one shot)
    if (body.mode === 'parse-csv-ai') {
      console.log('AI smart parsing CSV/Excel text...');
      const rawText = body.rawText;
      
      if (!rawText || rawText.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "No data found in the file." }), 
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const transactions = await aiSmartParse(rawText, LOVABLE_API_KEY, today);
      
      if (transactions.length === 0) {
        return new Response(
          JSON.stringify({ error: "No transactions found. Please check the file format." }), 
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ transactions }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Legacy mode: categorize pre-parsed transactions
    const { transactions } = body;
    if (transactions && transactions.length > 0) {
      console.log(`Categorizing ${transactions.length} transactions`);
      const categorized = await aiSmartParse(
        transactions.map((t: any, i: number) => 
          `${i + 1}. Date: ${t.date}, Description: ${t.description}, Amount: ${t.amount}, Type: ${t.type}`
        ).join('\n'),
        LOVABLE_API_KEY,
        today
      );

      return new Response(
        JSON.stringify({ transactions: categorized.length > 0 ? categorized : transactions }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "No valid mode or data provided." }), 
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("categorize-transactions error:", error instanceof Error ? error.message : error);
    
    const message = error instanceof Error ? error.message : "Unable to process transactions.";
    const status = message.includes("Rate limit") ? 429 : message.includes("quota") ? 402 : 500;
    
    return new Response(
      JSON.stringify({ error: message }), 
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function aiSmartParse(rawText: string, apiKey: string, today: string): Promise<any[]> {
  // Truncate to ~15k chars to stay within token limits
  const truncatedText = rawText.substring(0, 15000);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: AI_SYSTEM_PROMPT + `\nToday's date: ${today}` },
        { role: "user", content: `Extract and categorize all transactions from this data:\n\n${truncatedText}` }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI error:", response.status, errorText);
    if (response.status === 429) throw new Error("Rate limit exceeded. Please try again in a moment.");
    if (response.status === 402) throw new Error("AI quota exceeded. Please add credits.");
    throw new Error("AI processing failed. Please try again.");
  }

  const data = await response.json();
  const aiResponse = data.choices?.[0]?.message?.content || "";
  console.log("AI response length:", aiResponse.length);

  try {
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Validate and clean each transaction
      return parsed
        .filter((t: any) => t.date && t.amount && t.description)
        .map((t: any) => ({
          date: t.date,
          description: String(t.description).trim().substring(0, 100),
          amount: Math.abs(parseFloat(String(t.amount).replace(/,/g, '')) || 0),
          type: t.type === 'income' ? 'income' : 'expense',
          category: CATEGORIES.includes(t.category) ? t.category : 'Other',
          confidence: Math.min(1, Math.max(0, parseFloat(t.confidence) || 0.7)),
        }))
        .filter((t: any) => t.amount > 0);
    }
    return JSON.parse(aiResponse);
  } catch (parseError) {
    console.error("Failed to parse AI response:", parseError);
    return extractTransactionsFromTextFallback(rawText);
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
