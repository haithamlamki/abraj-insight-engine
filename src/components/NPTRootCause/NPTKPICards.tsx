import { EnhancedKPICard } from "@/components/Revenue/EnhancedKPICard";
import { Clock, AlertCircle, TrendingDown, TrendingUp, Activity } from "lucide-react";

interface NPTKPICardsProps {
  kpis: {
    totalHours: number;
    eventCount: number;
    avgHoursPerEvent: number;
    yoyChange: number;
    topSystem: {
      name: string;
      hours: number;
      percentage: number;
    } | null;
  };
}

export function NPTKPICards({ kpis }: NPTKPICardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <EnhancedKPICard
        title="Total NPT Hours"
        value={kpis.totalHours.toLocaleString()}
        icon={Clock}
        trend={kpis.yoyChange < 0 ? "up" : kpis.yoyChange > 0 ? "down" : "neutral"}
        subtitle="YTD 2025"
      />
      <EnhancedKPICard
        title="NPT Events"
        value={kpis.eventCount.toLocaleString()}
        icon={AlertCircle}
        trend="neutral"
        subtitle="Total incidents"
      />
      <EnhancedKPICard
        title="Avg Hours/Event"
        value={kpis.avgHoursPerEvent.toFixed(1)}
        icon={Activity}
        trend="neutral"
        subtitle="Per incident"
      />
      <EnhancedKPICard
        title="YoY Change"
        value={`${kpis.yoyChange > 0 ? '+' : ''}${kpis.yoyChange.toFixed(1)}%`}
        icon={kpis.yoyChange < 0 ? TrendingDown : TrendingUp}
        trend={kpis.yoyChange < 0 ? "up" : kpis.yoyChange > 0 ? "down" : "neutral"}
        subtitle="vs previous year"
      />
      {kpis.topSystem && (
        <EnhancedKPICard
          title="Top System"
          value={kpis.topSystem.name}
          icon={AlertCircle}
          trend="neutral"
          subtitle={`${kpis.topSystem.percentage}% of NPT`}
        />
      )}
    </div>
  );
}
