import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle } from "lucide-react";
import { RigPerformanceData } from "@/hooks/useRigPerformanceData";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RigMetricsCardProps {
  rig: RigPerformanceData;
}

export function RigMetricsCard({ rig }: RigMetricsCardProps) {
  const { rigName, annualStats, trend } = rig;

  const getTrendIcon = () => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "declining":
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendText = () => {
    switch (trend) {
      case "improving":
        return "تحسن";
      case "declining":
        return "تدهور";
      default:
        return "مستقر";
    }
  };

  const getComplianceStatus = () => {
    if (annualStats.complianceRate >= 90) {
      return { icon: CheckCircle, color: "text-success", text: "ممتاز" };
    }
    if (annualStats.complianceRate >= 70) {
      return { icon: AlertCircle, color: "text-warning", text: "جيد" };
    }
    return { icon: AlertCircle, color: "text-destructive", text: "يحتاج تحسين" };
  };

  const complianceStatus = getComplianceStatus();
  const ComplianceIcon = complianceStatus.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm">{rigName}</h4>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-xs gap-1">
                      {getTrendIcon()}
                      {getTrendText()}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>اتجاه الأداء على مدار العام</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className={`flex items-center gap-1 ${complianceStatus.color}`}>
            <ComplianceIcon className="h-4 w-4" />
            <span className="text-xs font-medium">{complianceStatus.text}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">الكفاءة</p>
            <p className="font-semibold text-lg">
              {annualStats.avgEfficiency.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">نسبة الامتثال</p>
            <p className="font-semibold text-lg">
              {annualStats.complianceRate.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t space-y-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="w-full">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">إجمالي NPT</span>
                  <span className="font-medium">
                    {annualStats.totalNPT.toFixed(1)} يوم
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>من أصل {annualStats.totalAllowableNPT.toFixed(1)} يوم مسموح</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">أيام التشغيل</span>
            <span className="font-medium">
              {annualStats.totalOperatingDays} يوم
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
