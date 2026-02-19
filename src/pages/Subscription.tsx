import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Check, Zap, Brain, FileText, BarChart2,
  Shield, Mic, TrendingUp, Star, Crown, Loader2, CheckCircle
} from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
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
  interface Window {
    Razorpay: any;
  }
}

export default function Subscription() {
  const { isPremium, trialDaysLeft, startTrial } = useSubscription();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Payment gateway failed to load. Check your internet connection.");

      // NOTE: Replace 'rzp_test_YOUR_KEY_HERE' with your actual Razorpay key
      // Get your key from: https://dashboard.razorpay.com/app/keys
      const RAZORPAY_KEY = "rzp_test_YOUR_KEY_HERE";

      const options = {
        key: RAZORPAY_KEY,
        amount: 29900, // ₹299 in paise
        currency: "INR",
        name: "Finzo AI",
        description: "Premium Plan — AI Financial Assistant",
        image: "/favicon.ico",
        handler: function (response: any) {
          console.log("Payment success:", response);
          toast({
            title: "🎉 Welcome to Finzo Premium!",
            description: "Your subscription is now active. Enjoy all premium features!",
          });
          startTrial(false); // full premium after payment
        },
        prefill: { name: "", email: "", contact: "" },
        notes: { plan: "premium_monthly" },
        theme: { color: "#7C3AED" },
        modal: { ondismiss: () => setIsLoading(false) },
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

        {/* Trial Banner */}
        {!isPremium && (
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

        {/* Status card if premium or trial */}
        {isPremium && (
          <Card className="kpi-card border-success/30 bg-success/5 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-success/15">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {trialDaysLeft !== null ? `Free Trial Active — ${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} left` : "Premium Active ✨"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {trialDaysLeft !== null
                    ? "Subscribe before trial ends to keep premium access."
                    : "All premium features are unlocked. Thank you for subscribing!"}
                </p>
              </div>
              {trialDaysLeft !== null && (
                <Button
                  size="sm"
                  className="ml-auto bg-primary text-primary-foreground"
                  onClick={handleSubscribe}
                  disabled={isLoading}
                >
                  Subscribe Now
                </Button>
              )}
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
            <Button variant="outline" className="w-full" disabled>
              Current Free Plan
            </Button>
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
                <p className="text-xs text-muted-foreground mt-1">
                  ₹10/day — less than your daily chai ☕
                </p>
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
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing...</>
                ) : (
                  <><Zap className="h-4 w-4 mr-2" />Subscribe Now — ₹299/month</>
                )}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">
                Secure payment via Razorpay · Cancel anytime · 7-day free trial
              </p>
            </Card>
          </motion.div>
        </div>

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
