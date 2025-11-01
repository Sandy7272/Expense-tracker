import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactions } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Processing ${transactions.length} transactions for categorization`);

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
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log("AI Response:", aiResponse);

    // Parse the JSON response
    let categorizations;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        categorizations = JSON.parse(jsonMatch[0]);
      } else {
        categorizations = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback: return "Other" for all
      categorizations = transactions.map(() => ({ category: "Other", confidence: 0.5 }));
    }

    console.log("Successfully categorized transactions");

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
