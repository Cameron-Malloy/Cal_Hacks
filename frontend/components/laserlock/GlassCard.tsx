import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

export function GlassCard({ children, className = "", glow = false }: GlassCardProps) {
  return (
    <div
      className={`
        backdrop-blur-xl bg-card/60 border border-primary/20 rounded-2xl p-6
        ${glow ? "shadow-[0_0_30px_rgba(167,139,250,0.3)]" : "shadow-lg"}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
