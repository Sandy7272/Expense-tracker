import { useState, createContext, useContext, ReactNode } from "react";

interface SubscriptionContextType {
  isPremium: boolean;
  setPremium: (v: boolean) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPremium: false,
  setPremium: () => {},
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  // For now, default to true (all features unlocked) until Stripe is integrated
  const [isPremium, setPremium] = useState(true);

  return (
    <SubscriptionContext.Provider value={{ isPremium, setPremium }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
