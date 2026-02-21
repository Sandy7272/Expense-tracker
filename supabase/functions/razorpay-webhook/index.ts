import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};

// Verify Razorpay webhook signature using HMAC SHA256
async function verifyWebhookSignature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const computedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    return computedSignature === signature;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const RAZORPAY_WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!RAZORPAY_WEBHOOK_SECRET) {
      console.error("RAZORPAY_WEBHOOK_SECRET not set");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    // Verify webhook authenticity
    const isValid = await verifyWebhookSignature(body, signature, RAZORPAY_WEBHOOK_SECRET);
    if (!isValid) {
      console.error("Invalid Razorpay webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(body);
    console.log("Razorpay webhook event:", event.event);

    // Use service role to bypass RLS for webhook operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const eventType = event.event;
    const payment = event.payload?.payment?.entity;
    const subscription = event.payload?.subscription?.entity;

    if (eventType === "payment.captured" && payment) {
      // One-time payment captured — grant premium
      const userId = payment.notes?.user_id;
      const paymentId = payment.id;
      const orderId = payment.order_id;

      if (!userId) {
        console.error("No user_id in payment notes");
        return new Response(JSON.stringify({ error: "No user_id in payment" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      // Upsert subscription record
      const { error } = await supabase
        .from("subscriptions")
        .upsert({
          user_id: userId,
          razorpay_payment_id: paymentId,
          razorpay_order_id: orderId,
          plan: "premium",
          status: "active",
          amount: payment.amount,
          currency: payment.currency || "INR",
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
        }, { onConflict: "user_id" });

      if (error) {
        console.error("Error upserting subscription:", error);
        throw error;
      }

      console.log(`✅ Premium activated for user: ${userId}`);
    }

    if (eventType === "subscription.charged" && subscription) {
      // Recurring subscription charged
      const userId = subscription.notes?.user_id;
      if (userId) {
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        await supabase
          .from("subscriptions")
          .upsert({
            user_id: userId,
            razorpay_subscription_id: subscription.id,
            plan: "premium",
            status: "active",
            amount: 29900,
            currency: "INR",
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
          }, { onConflict: "user_id" });

        console.log(`✅ Subscription renewed for user: ${userId}`);
      }
    }

    if (eventType === "subscription.cancelled" || eventType === "payment.failed") {
      const userId = payment?.notes?.user_id || subscription?.notes?.user_id;
      if (userId) {
        await supabase
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("user_id", userId);
        console.log(`❌ Subscription cancelled for user: ${userId}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", {
      message: e instanceof Error ? e.message : "Unknown error",
      stack: e instanceof Error ? e.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return new Response(JSON.stringify({ error: "Webhook processing failed", code: "INTERNAL_ERROR" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
