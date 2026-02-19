import { useState, createContext, useContext, ReactNode, useEffect } from "react";

interface SubscriptionContextType {
  isPremium: boolean;
  isTrialActive: boolean;
  trialDaysLeft: number | null;
  setPremium: (v: boolean) => void;
  startTrial: (isTrial: boolean) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPremium: false,
  isTrialActive: false,
  trialDaysLeft: null,
  setPremium: () => {},
  startTrial: () => {},
});

const TRIAL_KEY = "finzo_trial_start";
const PREMIUM_KEY = "finzo_premium";
const TRIAL_DAYS = 7;

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isPremium, setPremiumState] = useState(() => {
    if (typeof window === "undefined") return true;
    // Check stored premium or trial status
    const premiumStored = localStorage.getItem(PREMIUM_KEY);
    if (premiumStored === "true") return true;
    const trialStart = localStorage.getItem(TRIAL_KEY);
    if (trialStart) {
      const start = new Date(trialStart);
      const now = new Date();
      const diff = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= TRIAL_DAYS;
    }
    // Default to true for development/demo — change to false for production gating
    return true;
  });

  const [isTrialActive, setIsTrialActive] = useState(() => {
    if (typeof window === "undefined") return false;
    const trialStart = localStorage.getItem(TRIAL_KEY);
    const premiumStored = localStorage.getItem(PREMIUM_KEY);
    if (premiumStored === "true") return false;
    if (trialStart) {
      const start = new Date(trialStart);
      const now = new Date();
      const diff = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= TRIAL_DAYS;
    }
    return false;
  });

  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const trialStart = localStorage.getItem(TRIAL_KEY);
    const premiumStored = localStorage.getItem(PREMIUM_KEY);
    if (premiumStored === "true" || !trialStart) return null;
    const start = new Date(trialStart);
    const now = new Date();
    const diff = TRIAL_DAYS - Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
  });

  const setPremium = (v: boolean) => {
    setPremiumState(v);
    if (v) {
      localStorage.setItem(PREMIUM_KEY, "true");
    } else {
      localStorage.removeItem(PREMIUM_KEY);
    }
  };

  const startTrial = (isTrial: boolean) => {
    if (isTrial) {
      const now = new Date().toISOString();
      localStorage.setItem(TRIAL_KEY, now);
      setIsTrialActive(true);
      setTrialDaysLeft(TRIAL_DAYS);
      setPremiumState(true);
    } else {
      // Full premium (post-payment)
      localStorage.setItem(PREMIUM_KEY, "true");
      localStorage.removeItem(TRIAL_KEY);
      setIsTrialActive(false);
      setTrialDaysLeft(null);
      setPremiumState(true);
    }
  };

  return (
    <SubscriptionContext.Provider value={{ isPremium, isTrialActive, trialDaysLeft, setPremium, startTrial }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
