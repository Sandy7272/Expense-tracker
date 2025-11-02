import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @deno-types="npm:@types/pdf-parse@1.1.4"
import pdfParse from "npm:pdf-parse@1.1.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Handle PDF parsing mode
    if (body.mode === 'parse-pdf') {
      console.log('Parsing PDF file...');
      
      const base64Data = body.pdfFile.split(',')[1]; // Remove data:application/pdf;base64, prefix
      const pdfBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      const data = await pdfParse(pdfBuffer);
      console.log('PDF text extracted, parsing transactions...');
      
      const transactions = extractTransactionsFromText(data.text);
      
      if (transactions.length === 0) {
        return new Response(
          JSON.stringify({ error: "No transactions found in PDF. Please ensure it's a bank statement or try CSV/Excel format." }), 
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Now categorize the extracted transactions
      const categorizations = await categorizeTransactions(transactions, LOVABLE_API_KEY);
      
      const categorizedTransactions = transactions.map((t, i) => ({
        ...t,
        category: categorizations[i]?.category || 'Other',
        confidence: categorizations[i]?.confidence || 0.5
      }));
      
      return new Response(
        JSON.stringify({ transactions: categorizedTransactions }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Standard categorization mode
    const { transactions } = body;
    console.log(`Categorizing ${transactions.length} transactions`);

    const categorizations = await categorizeTransactions(transactions, LOVABLE_API_KEY);

    return new Response(
      JSON.stringify({ categorizations }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in categorize-transactions:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function categorizeTransactions(transactions: any[], apiKey: string) {
  const systemPrompt = `You are a financial transaction categorization expert. Categorize transactions into one of these categories:
- Food (restaurants, groceries, food delivery)
- Travel (fuel, petrol, transport, flights, hotels)
- EMI (loan payments, EMI, installments)
- Rent (house rent, property payments)
- Shopping (retail, online shopping, clothing)
- Salary (income, salary credits)
- Investment (mutual funds, stocks, SIP)
- Entertainment (movies, subscriptions, gaming)
- Bills (electricity, water, phone, internet)
- Healthcare (medical, pharmacy, hospital)
- Education (fees, courses, books)
- Other (anything else)

Return ONLY a JSON array with this exact format:
[{"category": "Food", "confidence": 0.95}, {"category": "Travel", "confidence": 0.88}]

Be precise and return valid JSON only.`;

  const userPrompt = `Categorize these transactions:\n${transactions.map((t: any, i: number) => 
    `${i + 1}. ${t.description} - Amount: ${t.amount}`
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
    console.error("AI gateway error:", response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    if (response.status === 402) {
      throw new Error("Payment required. Please add credits to your Lovable AI workspace.");
    }
    
    throw new Error(`AI gateway error: ${errorText}`);
  }

  const data = await response.json();
  const aiResponse = data.choices[0].message.content;
  
  console.log("AI Response:", aiResponse);

  // Parse the JSON response
  try {
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      return JSON.parse(aiResponse);
    }
  } catch (parseError) {
    console.error("Failed to parse AI response:", parseError);
    return transactions.map(() => ({ category: "Other", confidence: 0.5 }));
  }
}

function extractTransactionsFromText(text: string) {
  const transactions: any[] = [];
  const lines = text.split('\n');
  
  // Multiple patterns for different bank formats
  const patterns = [
    // Pattern 1: DD/MM/YYYY Description Amount (Debit/Credit)
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(.+?)\s+(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)\s*(Dr|Cr|Debit|Credit)?/i,
    // Pattern 2: Date Description Withdrawal Deposit
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(.+?)\s+(?:Withdrawal|Debit)?\s*([\d,]+\.?\d*)?\s+(?:Deposit|Credit)?\s*([\d,]+\.?\d*)?/i,
    // Pattern 3: Compact format with amounts
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(.+?)\s+([\d,]+\.?\d*)/i
  ];
  
  for (const line of lines) {
    if (line.match(/Date|Transaction|Particulars|Description|Balance|Opening|Closing/i)) {
      continue;
    }
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const date = match[1];
        const description = match[2]?.trim();
        
        let amount = 0;
        let type: 'income' | 'expense' = 'expense';
        
        if (match[4] && !match[3]) {
          amount = parseFloat((match[4] || '0').replace(/,/g, ''));
          type = 'income';
        } else if (match[3]) {
          amount = parseFloat((match[3] || '0').replace(/,/g, ''));
          const indicator = match[4]?.toLowerCase();
          type = (indicator === 'cr' || indicator === 'credit') ? 'income' : 'expense';
        }
        
        if (amount > 0 && description && description.length > 3) {
          transactions.push({
            date: normalizeDate(date),
            description: description.substring(0, 200),
            amount,
            type,
            confidence: 0.6
          });
          break;
        }
      }
    }
  }
  
  console.log(`Extracted ${transactions.length} transactions from PDF`);
  return transactions;
}

function normalizeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    const parts = dateStr.split(/[/-]/);
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const fullYear = year.length === 2 ? `20${year}` : year;
      return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return new Date().toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}
