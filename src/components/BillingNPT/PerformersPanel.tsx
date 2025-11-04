import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Award } from "lucide-react";

interface PerformersPanelProps {
  topPerformers: Array<{
    rig: string;
    operationalRate: number;
    totalNPT: number;
  }>;
  bottomPerformers: Array<{
    rig: string;
    operationalRate: number;
    totalNPT: number;
  }>;
  onRigClick?: (rig: string) => void;
}

export const PerformersPanel = ({ topPerformers, bottomPerformers, onRigClick }: PerformersPanelProps) => {
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Performance Rankings</h3>
      
      <Tabs defaultValue="top" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="top" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top Performers
          </TabsTrigger>
          <TabsTrigger value="bottom" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Problem Rigs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="top" className="space-y-3 mt-4">
          {topPerformers.slice(0, 5).map((performer, index) => (
            <div
              key={performer.rig}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
              onClick={() => onRigClick?.(performer.rig)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{medals[index] || <Award className="h-5 w-5" />}</span>
                <div>
                  <div className="font-semibold">Rig {performer.rig}</div>
                  <div className="text-xs text-muted-foreground">
                    {performer.totalNPT} hrs NPT
                  </div>
                </div>
              </div>
              <Badge variant="default" className="bg-chart-1">
                {performer.operationalRate}%
              </Badge>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="bottom" className="space-y-3 mt-4">
          {bottomPerformers.slice(0, 5).map((performer) => (
            <div
              key={performer.rig}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
              onClick={() => onRigClick?.(performer.rig)}
            >
              <div className="flex items-center gap-3">
                <TrendingDown className="h-5 w-5 text-destructive" />
                <div>
                  <div className="font-semibold">Rig {performer.rig}</div>
                  <div className="text-xs text-muted-foreground">
                    {performer.totalNPT} hrs NPT
                  </div>
                </div>
              </div>
              <Badge variant="destructive">
                {performer.operationalRate}%
              </Badge>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </Card>
  );
};
