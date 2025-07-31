import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingAddButtonProps {
  onClick: () => void;
}

export function FloatingAddButton({ onClick }: FloatingAddButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-8 right-8 h-14 w-14 rounded-full",
        "glass-card glow-primary hover:glow-accent",
        "border-2 border-primary/30 hover:border-accent/50",
        "transition-all duration-300 hover:scale-110",
        "shadow-lg hover:shadow-2xl",
        "z-50"
      )}
      size="lg"
    >
      <Plus className="h-6 w-6 text-primary" />
    </Button>
  );
}