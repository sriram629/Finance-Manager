import { cn } from "../../lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export const GlassCard = ({ children, className }: GlassCardProps) => {
  return (
    <div
      className={cn(
        "relative w-full max-w-md mx-auto p-8 rounded-2xl",
        "bg-card/40 backdrop-blur-xl",
        "border border-white/10",
        "shadow-2xl shadow-primary/5",
        "animate-scale-in",
        className
      )}
    >
      {/* Glass shine effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />

      {children}
    </div>
  );
};
