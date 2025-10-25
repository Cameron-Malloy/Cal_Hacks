import { LucideIcon } from "lucide-react";
import { GlassCard } from "./GlassCard";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  color?: string;
}

export function StatCard({ icon: Icon, label, value, trend, color = "text-primary" }: StatCardProps) {
  return (
    <GlassCard className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Icon className={`w-5 h-5 ${color}`} />
        {trend && <span className="text-xs text-secondary">{trend}</span>}
      </div>
      <div>
        <p className="text-muted-foreground text-xs mb-1">{label}</p>
        <p className={`text-2xl ${color}`}>{value}</p>
      </div>
    </GlassCard>
  );
}
