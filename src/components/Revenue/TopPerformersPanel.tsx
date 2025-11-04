import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Award, Calendar } from "lucide-react";
import { RigPerformance, TopMonth } from "@/hooks/useRevenueAnalytics";

interface TopPerformersPanelProps {
  topRigs: RigPerformance[];
  bottomRigs: RigPerformance[];
  topMonths: TopMonth[];
  onRigClick?: (rig: string) => void;
  onMonthClick?: (month: string, year: number) => void;
}

export const TopPerformersPanel = ({
  topRigs,
  bottomRigs,
  topMonths,
  onRigClick,
  onMonthClick
}: TopPerformersPanelProps) => {
  const [activeTab, setActiveTab] = useState("top-rigs");

  const formatValue = (value: number) => {
    return `$${(value / 1000000).toFixed(2)}M`;
  };

  const getRankBadge = (index: number) => {
    const rank = index + 1;
    if (rank === 1) return <Badge className="bg-yellow-500 text-white">🥇 1st</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400 text-white">🥈 2nd</Badge>;
    if (rank === 3) return <Badge className="bg-amber-700 text-white">🥉 3rd</Badge>;
    return <Badge variant="secondary">{rank}th</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          Performance Leaders
        </CardTitle>
        <CardDescription>Top and bottom performers by variance</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="top-rigs">Top Rigs</TabsTrigger>
            <TabsTrigger value="bottom-rigs">Bottom Rigs</TabsTrigger>
            <TabsTrigger value="top-months">Top Months</TabsTrigger>
          </TabsList>

          <TabsContent value="top-rigs" className="space-y-3 mt-4">
            {topRigs.slice(0, 5).map((rig, index) => (
              <div
                key={rig.rig}
                className={`flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors ${
                  onRigClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onRigClick && onRigClick(rig.rig)}
              >
                <div className="flex items-center gap-3">
                  {getRankBadge(index)}
                  <div>
                    <p className="font-semibold">Rig {rig.rig}</p>
                    <p className="text-xs text-muted-foreground">{rig.count} records</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-success">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-semibold">{formatValue(rig.variance)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">+{rig.variancePct.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="bottom-rigs" className="space-y-3 mt-4">
            {bottomRigs.slice(0, 5).map((rig, index) => (
              <div
                key={rig.rig}
                className={`flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors ${
                  onRigClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onRigClick && onRigClick(rig.rig)}
              >
                <div className="flex items-center gap-3">
                  <Badge variant="destructive">{index + 1}</Badge>
                  <div>
                    <p className="font-semibold">Rig {rig.rig}</p>
                    <p className="text-xs text-muted-foreground">{rig.count} records</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-destructive">
                    <TrendingDown className="w-4 h-4" />
                    <span className="font-semibold">{formatValue(rig.variance)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{rig.variancePct.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="top-months" className="space-y-3 mt-4">
            {topMonths.slice(0, 5).map((month, index) => (
              <div
                key={`${month.month}-${month.year}`}
                className={`flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors ${
                  onMonthClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onMonthClick && onMonthClick(month.month, month.year)}
              >
                <div className="flex items-center gap-3">
                  {getRankBadge(index)}
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {month.month} {month.year}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Variance: {formatValue(month.variance)} ({month.variancePct >= 0 ? '+' : ''}{month.variancePct.toFixed(1)}%)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">{formatValue(month.revenue)}</p>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
