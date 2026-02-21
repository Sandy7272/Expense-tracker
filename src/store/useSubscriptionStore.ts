import { create } from 'zustand';

const TRIAL_KEY = "finzo_trial_start";
const PREMIUM_KEY = "finzo_premium";
const TRIAL_DAYS = 7;

interface SubscriptionState {
  isPremium: boolean;
  isTrialActive: boolean;
  trialDaysLeft: number | null;
  setPremium: (v: boolean) => void;
  startTrial: (isTrial: boolean) => void;
}

function computeInitialState() {
  if (typeof window === "undefined") return { isPremium: true, isTrialActive: false, trialDaysLeft: null as number | null };

  const premiumStored = localStorage.getItem(PREMIUM_KEY);
  if (premiumStored === "true") return { isPremium: true, isTrialActive: false, trialDaysLeft: null as number | null };

  const trialStart = localStorage.getItem(TRIAL_KEY);
  if (trialStart) {
    const diff = (Date.now() - new Date(trialStart).getTime()) / (1000 * 60 * 60 * 24);
    const daysLeft = TRIAL_DAYS - Math.floor(diff);
    if (diff <= TRIAL_DAYS) {
      return { isPremium: true, isTrialActive: true, trialDaysLeft: daysLeft > 0 ? daysLeft : null };
    }
  }

  // Default true for dev/demo
  return { isPremium: true, isTrialActive: false, trialDaysLeft: null as number | null };
}

export const useSubscriptionStore = create<SubscriptionState>((set) => {
  const initial = computeInitialState();

  return {
    ...initial,
    setPremium: (v) => {
      if (v) localStorage.setItem(PREMIUM_KEY, "true");
      else localStorage.removeItem(PREMIUM_KEY);
      set({ isPremium: v });
    },
    startTrial: (isTrial) => {
      if (isTrial) {
        localStorage.setItem(TRIAL_KEY, new Date().toISOString());
        set({ isPremium: true, isTrialActive: true, trialDaysLeft: TRIAL_DAYS });
      } else {
        localStorage.setItem(PREMIUM_KEY, "true");
        localStorage.removeItem(TRIAL_KEY);
        set({ isPremium: true, isTrialActive: false, trialDaysLeft: null });
      }
    },
  };
});
