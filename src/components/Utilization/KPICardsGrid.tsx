import { Card, CardContent } from "@/components/ui/card";
import { Percent, Activity, AlertTriangle, Calendar, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UtilizationKPIs } from "@/hooks/useUtilizationAnalytics";

interface KPICardsGridProps {
  kpis: UtilizationKPIs;
  onFilterClick?: (filterType: string) => void;
}

export const KPICardsGrid = ({ kpis, onFilterClick }: KPICardsGridProps) => {
  const cards = [
    {
      title: "Fleet Utilization",
      value: `${kpis.avgUtilization}%`,
      icon: Percent,
      color: "text-primary",
      bgColor: "bg-primary/10",
      clickable: false,
    },
    {
      title: "Active vs Stacked",
      value: `${kpis.totalActiveRigs} / ${kpis.totalStackedRigs}`,
      subtitle: "Active / Stacked",
      icon: Activity,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
      clickable: true,
      filterType: "active_only",
    },
    {
      title: "Low Utilization",
      value: kpis.lowUtilizationCount,
      subtitle: "Rigs below 50%",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-500/10",
      clickable: true,
      filterType: "low_utilization",
      badge: kpis.lowUtilizationCount > 0 ? "warning" : null,
    },
    {
      title: "Total NPT",
      value: kpis.totalAllowableNPT.toLocaleString(),
      subtitle: "Allowable Hours",
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      clickable: false,
    },
    {
      title: "Top Client",
      value: kpis.topClient || "N/A",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
      clickable: false,
    },
    {
      title: "Total Records",
      value: kpis.totalRecords.toLocaleString(),
      icon: Users,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      clickable: false,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card
            key={index}
            className={`relative overflow-hidden transition-all ${
              card.clickable ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''
            }`}
            onClick={() => card.clickable && card.filterType && onFilterClick?.(card.filterType)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold">{card.value}</p>
                  {card.subtitle && (
                    <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                  )}
                </div>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
              {card.badge && (
                <Badge variant="outline" className="mt-2 border-orange-500 text-orange-600">
                  Alert
                </Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
