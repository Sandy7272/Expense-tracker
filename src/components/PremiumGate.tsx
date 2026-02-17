import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface PremiumGateProps {
  children: ReactNode;
  feature: string;
}

export function PremiumGate({ children, feature }: PremiumGateProps) {
  const { isPremium } = useSubscription();

  if (isPremium) return <>{children}</>;

  return (
    <Card className="kpi-card p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-full bg-primary/10">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">
          {feature} is a Premium Feature
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Upgrade to FinTrack Pro for $10/month to unlock {feature.toLowerCase()}, 
          advanced insights, PDF exports, and more.
        </p>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2">
          <Sparkles className="h-4 w-4 mr-2" />
          Upgrade to Pro — $10/mo
        </Button>
      </div>
    </Card>
  );
}
