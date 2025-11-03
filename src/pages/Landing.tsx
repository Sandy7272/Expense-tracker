import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
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

const SectionWrapper = ({ children, delay = 0.1 }: { children: React.ReactNode; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
};

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
        <SectionWrapper>
          <div className="text-center space-y-8 animate-fade-in">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-block"
            >
              <div className="px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 border border-primary/30 text-sm font-medium mb-6">
                <Sparkles className="inline h-4 w-4 mr-2" />
                100% Free Forever • No Credit Card Required
              </div>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight"
            >
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                Take Control of
              </span>
              <br />
              <span className="bg-gradient-to-r from-income via-lending to-investment bg-clip-text text-transparent">
                Your Finances
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            >
              Track expenses, manage loans, monitor investments, and gain powerful insights into your financial life.
              All in one beautiful, intuitive platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
            >
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground"
            >
              {['No Setup Fee', 'No Monthly Cost', 'Cancel Anytime'].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  {item}
                </div>
              ))}
            </motion.div>
          </div>
        </SectionWrapper>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-b from-transparent via-card/30 to-transparent">
        <SectionWrapper>
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

          <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
            {features.map((feature, index) => {
              // Bento grid column spans
              const columnSpan = 
                index === 0 ? 'lg:col-span-3' :
                index === 1 ? 'lg:col-span-3' :
                index === 2 ? 'lg:col-span-2' :
                index === 3 ? 'lg:col-span-2' :
                index === 4 ? 'lg:col-span-2' :
                'lg:col-span-6';
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={columnSpan}
                >
                  <Card
                    className="glass-card hover-lift border-border/50 overflow-hidden group h-full"
                  >
                    <CardContent className="p-6">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} bg-opacity-10 w-fit mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className="h-6 w-6 text-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </SectionWrapper>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <SectionWrapper>
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
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
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
              </motion.div>
            ))}
          </div>
        </SectionWrapper>
      </section>

      {/* Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-b from-transparent via-accent/5 to-transparent">
        <SectionWrapper>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="glass-card border-border/50 hover-lift text-center">
                  <CardContent className="p-6 space-y-3">
                    <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg">{benefit.label}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </SectionWrapper>
      </section>

      {/* Testimonials Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <SectionWrapper>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                What Our Users Say
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of satisfied users managing their finances smarter
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "This tracker is a game-changer. I finally feel in control of my money and can see exactly where it's going.",
                name: "Alex R."
              },
              {
                quote: "The best financial tool I've ever used. Clean interface, powerful features, and completely free!",
                name: "Priya S."
              },
              {
                quote: "Managing multiple loans and investments has never been easier. This app saves me hours every month.",
                name: "Marcus T."
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="glass-card hover-lift border-border/50 h-full">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Sparkles key={i} className="h-4 w-4 text-warning fill-warning" />
                      ))}
                    </div>
                    <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </SectionWrapper>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <SectionWrapper>
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
        </SectionWrapper>
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