import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  PieChart, 
  CreditCard, 
  BarChart3, 
  Shield,
  Zap,
  Globe,
  Lock,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: DollarSign,
      title: "Smart Transaction Tracking",
      description: "Track every income and expense with intelligent categorization",
      gradient: "from-income to-success"
    },
    {
      icon: CreditCard,
      title: "Loan & EMI Management",
      description: "Monitor all your loans and EMIs with automatic payment tracking",
      gradient: "from-expense to-destructive"
    },
    {
      icon: TrendingUp,
      title: "Lending & Borrowing",
      description: "Keep track of money you've lent or borrowed with detailed person-wise records",
      gradient: "from-lending to-warning"
    },
    {
      icon: PieChart,
      title: "Investment Monitoring",
      description: "Track mutual funds, stocks, insurance, and all investment types",
      gradient: "from-investment to-primary"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Visualize spending patterns with interactive charts and insights",
      gradient: "from-primary to-accent"
    },
    {
      icon: Globe,
      title: "Multi-Currency Support",
      description: "Handle transactions in multiple currencies with real-time conversion",
      gradient: "from-accent to-secondary"
    }
  ];

  const benefits = [
    { icon: Zap, label: "100% Free", description: "No hidden costs, ever" },
    { icon: Lock, label: "Secure & Private", description: "Your data is encrypted" },
    { icon: Shield, label: "Cloud Backup", description: "Never lose your data" },
    { icon: Sparkles, label: "Real-time Insights", description: "Instant analytics" }
  ];

  const steps = [
    { number: "01", title: "Sign Up Free", description: "Create your account in seconds - no credit card required" },
    { number: "02", title: "Add Transactions", description: "Start tracking your income, expenses, and investments" },
    { number: "03", title: "Get Insights", description: "Visualize your financial health with beautiful charts" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Expense Tracker
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="hover:bg-accent/50"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-semibold shadow-lg"
            >
              Try Now Free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="inline-block">
            <div className="px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 border border-primary/30 text-sm font-medium mb-6">
              <Sparkles className="inline h-4 w-4 mr-2" />
              100% Free Forever • No Credit Card Required
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              Take Control of
            </span>
            <br />
            <span className="bg-gradient-to-r from-income via-lending to-investment bg-clip-text text-transparent">
              Your Finances
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Track expenses, manage loans, monitor investments, and gain powerful insights into your financial life. 
            All in one beautiful, intuitive platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-bold shadow-2xl hover:scale-105 transition-all duration-300 group"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-lg px-8 py-6 border-2 border-primary/30 hover:bg-accent/20"
            >
              Explore Features
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
            {['No Setup Fee', 'No Monthly Cost', 'Cancel Anytime'].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-b from-transparent via-card/30 to-transparent">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Everything You Need
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to give you complete control over your finances
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="glass-card hover-lift border-border/50 overflow-hidden group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} bg-opacity-10 w-fit mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-6 w-6 text-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-income to-investment bg-clip-text text-transparent">
              Get Started in 3 Easy Steps
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Start your financial journey in minutes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="text-6xl font-bold bg-gradient-to-br from-primary/20 to-accent/20 bg-clip-text text-transparent">
                    {step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                  )}
                </div>
                <h3 className="text-2xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground max-w-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-b from-transparent via-accent/5 to-transparent">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <Card key={index} className="glass-card border-border/50 hover-lift text-center">
              <CardContent className="p-6 space-y-3">
                <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg">{benefit.label}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="glass-card border-primary/30 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-investment/10" />
          <CardContent className="p-12 relative z-10">
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Ready to Transform Your Financial Life?
                </span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Join thousands of users who are already in control of their finances. 
                Start tracking today - completely free, forever.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg"
                  onClick={() => navigate('/auth')}
                  className="text-lg px-10 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-bold shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  Start Free Now
                  <Sparkles className="ml-2 h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                No credit card required • 100% free forever • Set up in 2 minutes
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Expense Tracker</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Expense Tracker. Take control of your finances.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
