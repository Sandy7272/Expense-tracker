import { Card } from "@/components/ui/card";
import { Calendar, TrendingUp } from "lucide-react";

interface WelcomeCardProps {
  userName?: string;
  lastUpdated?: string;
}

export function WelcomeCard({ userName = "Sandy", lastUpdated }: WelcomeCardProps) {
  const currentTime = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10 border-primary/20 shadow-card hover:shadow-hover transition-all duration-300">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-4 right-4 w-32 h-32 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-4 left-4 w-24 h-24 bg-accent rounded-full blur-2xl" />
      </div>
      
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold text-foreground mb-2">
              Hi {userName}! 👋
            </h1>
            <p className="text-muted-foreground text-base lg:text-lg mb-4">
              Here's your current expense snapshot
            </p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{currentTime}</span>
              </div>
              {lastUpdated && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span>Last sync: {lastUpdated}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="hidden lg:block">
            <div className="text-right">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-xs text-muted-foreground font-medium">
                Live Dashboard
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}