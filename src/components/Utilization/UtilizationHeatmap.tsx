import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HeatmapCell } from "@/hooks/useUtilizationAnalytics";
import { useMemo } from "react";

interface UtilizationHeatmapProps {
  data: HeatmapCell[];
  onCellClick?: (rig: string, month: string) => void;
}

export const UtilizationHeatmap = ({ data, onCellClick }: UtilizationHeatmapProps) => {
  const { rigs, months, heatmapMatrix } = useMemo(() => {
    const rigsSet = new Set<string>();
    const monthsSet = new Set<string>();
    const matrix = new Map<string, HeatmapCell>();

    data.forEach(cell => {
      rigsSet.add(cell.rig);
      monthsSet.add(cell.month);
      matrix.set(`${cell.rig}-${cell.month}`, cell);
    });

    const sortedRigs = Array.from(rigsSet).sort();
    const sortedMonths = Array.from(monthsSet).sort().slice(-12); // Last 12 months

    return {
      rigs: sortedRigs,
      months: sortedMonths,
      heatmapMatrix: matrix,
    };
  }, [data]);

  const getColor = (utilization: number | null, status: string) => {
    if (status === 'Stacked' || utilization === null) return 'bg-gray-300';
    if (utilization >= 81) return 'bg-green-500';
    if (utilization >= 61) return 'bg-green-300';
    if (utilization >= 41) return 'bg-yellow-400';
    if (utilization >= 21) return 'bg-orange-400';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Utilization Heatmap</CardTitle>
        <CardDescription>Rig utilization by month (last 12 months)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="grid gap-1" style={{ gridTemplateColumns: `120px repeat(${months.length}, 60px)` }}>
              {/* Header */}
              <div className="sticky left-0 bg-background z-10 font-semibold text-sm p-2">
                Rig
              </div>
              {months.map(month => (
                <div key={month} className="text-xs font-medium p-2 text-center">
                  {month.substring(5)}
                </div>
              ))}

              {/* Rows */}
              {rigs.map(rig => (
                <>
                  <div key={`${rig}-label`} className="sticky left-0 bg-background z-10 font-medium text-sm p-2 border-r">
                    {rig}
                  </div>
                  {months.map(month => {
                    const cell = heatmapMatrix.get(`${rig}-${month}`);
                    const utilization = cell?.utilization;
                    const status = cell?.status || 'Active';
                    
                    return (
                      <div
                        key={`${rig}-${month}`}
                        className={`h-12 rounded cursor-pointer transition-all hover:ring-2 hover:ring-primary flex items-center justify-center text-xs font-semibold ${getColor(
                          utilization,
                          status
                        )}`}
                        onClick={() => onCellClick?.(rig, month)}
                        title={`${rig} - ${month}\nUtilization: ${utilization !== null ? `${utilization}%` : 'N/A'}\nStatus: ${status}${cell?.client ? `\nClient: ${cell.client}` : ''}`}
                      >
                        {utilization !== null ? `${Math.round(utilization)}` : '-'}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-6 flex-wrap">
          <span className="text-sm font-medium">Legend:</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-red-500" />
            <span className="text-xs">0-20%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-orange-400" />
            <span className="text-xs">21-40%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-yellow-400" />
            <span className="text-xs">41-60%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-green-300" />
            <span className="text-xs">61-80%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-green-500" />
            <span className="text-xs">81-100%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gray-300" />
            <span className="text-xs">Stacked/N/A</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
