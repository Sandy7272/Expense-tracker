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
        "fixed bottom-6 right-6 h-12 w-12 rounded-full",
        "bg-primary hover:bg-primary/90 text-primary-foreground",
        "shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105",
        "z-50"
      )}
      size="lg"
    >
      <Plus className="h-5 w-5" />
    </Button>
  );
}
