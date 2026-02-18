import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, transactions, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";

    if (mode === "parse_expense") {
      // Natural language expense parsing
      const userText = messages[0]?.content || "";
      systemPrompt = `You are a smart expense parser for an Indian personal finance app.
Parse the user's natural language input and extract transaction details.
Return ONLY a JSON object with these fields:
- amount: number (in rupees, extract from text)
- category: string (one of: Food, Transport, Shopping, Entertainment, Health, Education, Utilities, EMI, Rent, Investment, Other)
- description: string (brief clean description)
- confidence: number (0-1, how confident you are)
- date: string (YYYY-MM-DD, default to today if not mentioned)

Examples:
"paid 1200 for zomato dinner" → {"amount":1200,"category":"Food","description":"Zomato dinner","confidence":0.95,"date":"today"}
"petrol 800 rupees" → {"amount":800,"category":"Transport","description":"Petrol","confidence":0.9,"date":"today"}
"netflix monthly 649" → {"amount":649,"category":"Entertainment","description":"Netflix subscription","confidence":0.92,"date":"today"}

Today's date is: ${new Date().toISOString().split("T")[0]}
Return ONLY raw JSON, no markdown.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userText }
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`AI gateway error: ${response.status} ${text}`);
      }

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content || "{}";
      // Strip markdown code blocks if present
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      return new Response(JSON.stringify({ result: cleaned }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Financial Assistant Chat mode
    const recentTransactions = (transactions || []).slice(0, 100);
    const txSummary = recentTransactions.map((t: any) =>
      `${t.date}: ${t.type} ₹${t.amount} [${t.category}] ${t.description || ""}`
    ).join("\n");

    const totalIncome = recentTransactions.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
    const totalExpenses = recentTransactions.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);
    const savings = totalIncome - totalExpenses;

    systemPrompt = `You are Finzo — an intelligent AI personal finance assistant for Indian users.
You are friendly, concise, and speak in a mix of professional and relatable tone.
You have access to the user's recent financial data.

USER FINANCIAL SUMMARY:
- Total Income (period): ₹${totalIncome.toLocaleString("en-IN")}
- Total Expenses (period): ₹${totalExpenses.toLocaleString("en-IN")}
- Net Savings: ₹${savings.toLocaleString("en-IN")}
- Savings Rate: ${totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : 0}%

RECENT TRANSACTIONS (max 100):
${txSummary || "No transactions available yet."}

INSTRUCTIONS:
- Answer in 2-4 sentences unless user asks for detail
- Use ₹ for amounts, Indian number format (lakhs, crores)
- Give actionable advice, not generic tips
- If you reference numbers, use the data above
- Be encouraging but honest about financial risks
- Detect category breakdowns from the transaction list when asked
- For questions about affordability, consider savings rate and monthly cashflow`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI quota exceeded. Please upgrade your plan." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      throw new Error(`AI gateway error: ${response.status} ${text}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-finance-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
