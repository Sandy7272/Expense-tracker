import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Check, Zap, Brain, FileText, BarChart2,
  Shield, Mic, TrendingUp, Star, Crown, Loader2, CheckCircle, AlertCircle
} from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const FREE_FEATURES = [
  "Basic expense tracking",
  "Monthly summary",
  "Basic charts",
  "Up to 100 transactions/month",
  "EMI & Loan tracking",
];

const PREMIUM_FEATURES = [
  { icon: Brain, label: "Finzo AI Assistant (unlimited)" },
  { icon: Mic, label: "Voice expense entry" },
  { icon: Sparkles, label: "Smart insights engine" },
  { icon: Zap, label: "Auto AI categorization" },
  { icon: TrendingUp, label: "Investment tracking" },
  { icon: BarChart2, label: "Advanced analytics & P&L" },
  { icon: FileText, label: "PDF monthly reports" },
  { icon: Shield, label: "AI Budget suggestions" },
  { icon: Star, label: "Google Sheets sync" },
  { icon: Crown, label: "Priority support" },
];

declare global {
  interface Window { Razorpay: any; }
}

export default function Subscription() {
  const { isPremium, trialDaysLeft, startTrial } = useSubscription();
  const { subscription, isPremiumFromDB, isLoading: subLoading, refetch } = useSubscriptionStatus();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // If DB shows premium, sync local context
  useEffect(() => {
    if (isPremiumFromDB && !isPremium) {
      startTrial(false); // activate in local context too
    }
  }, [isPremiumFromDB]);

  const loadRazorpay = (): Promise<boolean> => {
    return new Promise(resolve => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast({ title: "Please log in first", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Load Razorpay SDK
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Payment gateway failed to load. Check your internet connection.");

      // Step 2: Create order via edge function (server-side, secure)
      const { data: orderData, error: orderError } = await supabase.functions.invoke("razorpay-create-order", {
        body: { amount: 29900, currency: "INR" },
      });

      if (orderError || !orderData?.order_id) {
        // Fallback: if edge function not configured yet, show setup message
        if (orderError?.message?.includes("not configured")) {
          toast({
            title: "Razorpay Setup Needed",
            description: "Please add your Razorpay API keys to complete setup. See instructions below.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        throw new Error(orderError?.message || "Failed to create payment order");
      }

      // Step 3: Open Razorpay checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.order_id,
        name: "Finzo AI",
        description: "Premium Plan — AI Financial Assistant",
        image: "/favicon.ico",
        handler: async function (response: any) {
          console.log("Payment success:", response);
          // Payment succeeded — wait for webhook to confirm, but also optimistically update
          toast({
            title: "🎉 Payment Successful!",
            description: "Activating your premium account... This may take a moment.",
          });
          // Optimistically activate locally
          startTrial(false);
          // Refetch subscription status from DB after a short delay
          setTimeout(() => refetch(), 3000);
          setIsLoading(false);
        },
        prefill: {
          name: user.user_metadata?.display_name || "",
          email: user.email || "",
          contact: "",
        },
        notes: {
          user_id: user.id,
          plan: "premium_monthly",
        },
        theme: { color: "#7C3AED" },
        modal: {
          ondismiss: () => setIsLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        console.error("Payment failed:", response.error);
        toast({
          title: "Payment Failed",
          description: response.error?.description || "Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      });
      rzp.open();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
      setIsLoading(false);
    }
  };

  const handleStartTrial = () => {
    startTrial(true);
    toast({
      title: "🎉 7-day free trial started!",
      description: "All premium features unlocked. No payment required for 7 days.",
    });
  };

  const activePremium = isPremiumFromDB || isPremium;
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        {/* Header */}
        <div className="text-center space-y-3 pt-4">
          <Badge className="bg-primary/15 text-primary border-primary/30 text-xs px-3 py-1">
            <Sparkles className="h-3 w-3 mr-1.5" />
            AI-Powered Personal Finance
          </Badge>
          <h1 className="text-3xl font-bold text-foreground">
            Upgrade to <span className="text-primary">Finzo Premium</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            Get your personal AI financial assistant, smart insights, and advanced analytics.
            Designed for Indian professionals.
          </p>
        </div>

        {/* Subscription Status Card */}
        {activePremium ? (
          <Card className="kpi-card border-income/30 bg-income/5 p-5">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="p-2.5 rounded-xl bg-income/15">
                <CheckCircle className="h-5 w-5 text-income" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  {trialDaysLeft !== null
                    ? `🎁 Free Trial Active — ${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} left`
                    : "✨ Premium Active"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {trialDaysLeft !== null
                    ? "Subscribe before trial ends to keep premium access."
                    : periodEnd
                      ? `Next billing date: ${periodEnd}`
                      : "All premium features are unlocked. Thank you!"}
                </p>
              </div>
              {trialDaysLeft !== null && (
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground"
                  onClick={handleSubscribe}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe — ₹299/mo"}
                </Button>
              )}
            </div>
          </Card>
        ) : (
          /* Trial CTA */
          <Card className="kpi-card border-primary/30 bg-gradient-to-r from-primary/10 to-transparent p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/15">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Start your 7-day free trial</p>
                  <p className="text-xs text-muted-foreground">No credit card required. Cancel anytime.</p>
                </div>
              </div>
              <Button className="bg-primary text-primary-foreground" onClick={handleStartTrial}>
                <Zap className="h-4 w-4 mr-2" />
                Start Free Trial
              </Button>
            </div>
          </Card>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <Card className="kpi-card p-6 space-y-5">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Free</p>
              <div className="flex items-end gap-1.5">
                <span className="text-3xl font-bold text-foreground">₹0</span>
                <span className="text-muted-foreground text-sm mb-1">/month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Forever free, core features</p>
            </div>
            <div className="space-y-2.5">
              {FREE_FEATURES.map(f => (
                <div key={f} className="flex items-center gap-2.5 text-sm text-foreground/70">
                  <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 text-muted-foreground" />
                  </div>
                  {f}
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full" disabled>Current Free Plan</Button>
          </Card>

          {/* Premium Plan */}
          <motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
            <Card className={cn(
              "kpi-card p-6 space-y-5 border-primary/40 relative overflow-hidden h-full",
              "bg-gradient-to-b from-primary/5 to-transparent"
            )}>
              <div className="absolute top-3 right-3">
                <Badge className="bg-primary text-primary-foreground text-[10px]">
                  <Star className="h-2.5 w-2.5 mr-1" />
                  Most Popular
                </Badge>
              </div>
              <div>
                <p className="text-xs text-primary uppercase tracking-wider font-semibold mb-1">Premium</p>
                <div className="flex items-end gap-1.5">
                  <span className="text-3xl font-bold text-foreground">₹299</span>
                  <span className="text-muted-foreground text-sm mb-1">/month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">₹10/day — less than your daily chai ☕</p>
              </div>
              <div className="space-y-2.5">
                {PREMIUM_FEATURES.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2.5 text-sm text-foreground">
                    <div className="h-4 w-4 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <Icon className="h-2.5 w-2.5 text-primary" />
                    </div>
                    {label}
                  </div>
                ))}
              </div>
              <Button
                className="w-full bg-primary text-primary-foreground h-11 font-semibold"
                onClick={handleSubscribe}
                disabled={isLoading}
              >
                {isLoading
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing...</>
                  : <><Zap className="h-4 w-4 mr-2" />Subscribe Now — ₹299/month</>
                }
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">
                Secure payment via Razorpay · Cancel anytime · 7-day free trial available
              </p>
            </Card>
          </motion.div>
        </div>

        {/* Razorpay Setup Guide */}
        <Card className="kpi-card p-5 border-warning/30 bg-warning/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="space-y-3">
              <p className="font-semibold text-foreground text-sm">⚙️ Razorpay Setup Required</p>
              <p className="text-xs text-muted-foreground">
                To enable real payments, add your Razorpay API keys to Supabase secrets. Follow these steps:
              </p>
              <ol className="text-xs text-muted-foreground space-y-2 list-none">
                {[
                  { step: "1", text: 'Go to razorpay.com → Settings → API Keys → Generate Test Key' },
                  { step: "2", text: 'Add RAZORPAY_KEY_ID (starts with "rzp_test_...") to Supabase Secrets' },
                  { step: "3", text: 'Add RAZORPAY_KEY_SECRET to Supabase Secrets' },
                  { step: "4", text: 'Add RAZORPAY_WEBHOOK_SECRET to Supabase Secrets (from Razorpay Webhooks dashboard)' },
                  { step: "5", text: `Set webhook URL in Razorpay dashboard → Webhooks → Add New:\nhttps://hiypurwywcvlrwlmopdf.supabase.co/functions/v1/razorpay-webhook` },
                  { step: "6", text: 'Enable webhook events: payment.captured, payment.failed, subscription.charged, subscription.cancelled' },
                ].map(({ step, text }) => (
                  <li key={step} className="flex gap-2">
                    <span className="h-4 w-4 rounded-full bg-warning/20 text-warning flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{step}</span>
                    <span className="whitespace-pre-line">{text}</span>
                  </li>
                ))}
              </ol>
              <div className="bg-card rounded-lg p-2.5 border border-border/40 mt-2">
                <p className="text-[10px] text-muted-foreground font-mono">
                  Webhook URL: https://hiypurwywcvlrwlmopdf.supabase.co/functions/v1/razorpay-webhook
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Value Props */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Brain, title: "AI That Knows You", desc: "Finzo AI analyzes your spending and gives personalized advice — not generic tips." },
            { icon: Shield, title: "100% Secure", desc: "Bank-level encryption. Your data stays private. No sharing with third parties." },
            { icon: TrendingUp, title: "Grow Wealthier", desc: "Users who track spending save 23% more on average within 3 months." },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="kpi-card p-4 space-y-2">
              <Icon className="h-5 w-5 text-primary" />
              <p className="font-semibold text-sm text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
