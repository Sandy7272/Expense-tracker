import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ArrowRight, Wallet, CreditCard, Receipt, Sparkles } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface OnboardingFlowProps {
  onComplete: () => void;
}

const STEPS = [
  { id: 1, icon: Wallet, title: "What's your monthly income?", desc: "We'll use this to calculate your savings rate and financial health." },
  { id: 2, icon: CreditCard, title: "Any monthly EMIs?", desc: "Add your biggest recurring loan/EMI payments." },
  { id: 3, icon: Receipt, title: "Add your first expense", desc: "Log one recent transaction to get started." },
  { id: 4, icon: Sparkles, title: "You're all set! 🎉", desc: "Your AI financial assistant is ready to help." },
];

const EMI_CATEGORIES = ["Home Loan EMI", "Car Loan EMI", "Personal Loan EMI", "Education Loan EMI", "Credit Card EMI"];
const EXPENSE_CATEGORIES = ["Food", "Transport", "Shopping", "Entertainment", "Health", "Utilities", "Other"];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState("");
  const [emiAmount, setEmiAmount] = useState("");
  const [emiCategory, setEmiCategory] = useState("Home Loan EMI");
  const [skipEmi, setSkipEmi] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Food");
  const [expenseNote, setExpenseNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { createTransaction } = useTransactions();
  const { toast } = useToast();

  const today = format(new Date(), "yyyy-MM-dd");
  const progress = ((step + 1) / STEPS.length) * 100;

  const handleStep = async () => {
    setIsLoading(true);
    try {
      if (step === 0 && income) {
        await createTransaction.mutateAsync({ type: "income", amount: Number(income), category: "Salary", description: "Monthly salary/income", date: today, status: "completed" });
      }
      if (step === 1 && !skipEmi && emiAmount) {
        await createTransaction.mutateAsync({ type: "expense", amount: Number(emiAmount), category: "EMI", description: emiCategory, date: today, status: "completed" });
      }
      if (step === 2 && expenseAmount) {
        await createTransaction.mutateAsync({ type: "expense", amount: Number(expenseAmount), category: expenseCategory, description: expenseNote || expenseCategory, date: today, status: "completed" });
      }
      if (step < STEPS.length - 1) setStep(s => s + 1);
      else onComplete();
    } catch {
      toast({ title: "Error saving", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return !!income && !isNaN(Number(income));
    if (step === 1) return skipEmi || (!!emiAmount && !isNaN(Number(emiAmount)));
    if (step === 2) return !!expenseAmount && !isNaN(Number(expenseAmount));
    return true;
  };

  const currentStep = STEPS[step];
  const Icon = currentStep.icon;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
            <p className="text-xs text-primary font-medium">{Math.round(progress)}% complete</p>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary/20 border-2 border-primary text-primary" : "bg-secondary text-muted-foreground"}`}>
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{currentStep.title}</h2>
                  <p className="text-sm text-muted-foreground">{currentStep.desc}</p>
                </div>
              </div>

              {step === 0 && (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                  <Input
                    value={income}
                    onChange={e => setIncome(e.target.value)}
                    placeholder="50000"
                    className="pl-8 h-12 text-lg font-bold"
                    type="number"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-1">Monthly salary, freelance income, etc.</p>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-3">
                  <Select value={emiCategory} onValueChange={setEmiCategory} disabled={skipEmi}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMI_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                    <Input
                      value={emiAmount}
                      onChange={e => setEmiAmount(e.target.value)}
                      placeholder="0"
                      className="pl-8 h-11"
                      type="number"
                      disabled={skipEmi}
                    />
                  </div>
                  <button
                    onClick={() => setSkipEmi(!skipEmi)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                  >
                    {skipEmi ? "I do have EMIs, let me add them" : "No EMIs currently, skip this"}
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                    <Input
                      value={expenseAmount}
                      onChange={e => setExpenseAmount(e.target.value)}
                      placeholder="500"
                      className="pl-8 h-11"
                      type="number"
                      autoFocus
                    />
                  </div>
                  <Input
                    value={expenseNote}
                    onChange={e => setExpenseNote(e.target.value)}
                    placeholder="Brief description (e.g. Swiggy dinner)"
                    className="h-10"
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3 py-2">
                  {[
                    "✅ Income recorded",
                    skipEmi ? "⏭️ No EMIs to track" : "✅ EMI payment tracked",
                    "✅ First expense logged",
                    "🤖 Finzo AI is ready to assist you",
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15 }}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      {item}
                    </motion.div>
                  ))}
                </div>
              )}

              <Button
                className="w-full h-11 bg-primary text-primary-foreground font-medium"
                onClick={handleStep}
                disabled={!canProceed() || isLoading}
              >
                {isLoading ? "Saving..." : step === STEPS.length - 1 ? "Start Using FinTrack 🚀" : (
                  <span className="flex items-center gap-2">Continue <ArrowRight className="h-4 w-4" /></span>
                )}
              </Button>
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Your data is private and secure 🔒
        </p>
      </motion.div>
    </div>
  );
}
