import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";

interface NPTHeatmapProps {
  data: Array<{
    rig: string;
    month: string;
    nptPercent: number;
    totalNPT: number;
  }>;
  title: string;
  description?: string;
  onCellClick?: (rig: string, month: string) => void;
}

export const NPTHeatmap = ({ data, title, description, onCellClick }: NPTHeatmapProps) => {
  const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const rigs = useMemo(() => {
    const rigSet = new Set(data.map(d => d.rig));
    return Array.from(rigSet).sort();
  }, [data]);

  const getColor = (nptPercent: number) => {
    if (nptPercent === 0) return 'hsl(var(--muted))';
    if (nptPercent < 5) return 'hsl(142, 76%, 80%)';
    if (nptPercent < 10) return 'hsl(47, 96%, 73%)';
    if (nptPercent < 15) return 'hsl(33, 100%, 70%)';
    if (nptPercent < 20) return 'hsl(0, 84%, 70%)';
    return 'hsl(0, 84%, 50%)';
  };

  const getCellData = (rig: string, month: string) => {
    return data.find(d => d.rig === rig && d.month === month);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-border p-2 bg-muted font-semibold text-left sticky left-0 z-10">Rig</th>
                {monthOrder.map(month => (
                  <th key={month} className="border border-border p-2 bg-muted font-semibold text-center min-w-[60px]">
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rigs.map(rig => (
                <tr key={rig}>
                  <td className="border border-border p-2 font-medium sticky left-0 bg-background z-10">
                    {rig}
                  </td>
                  {monthOrder.map(month => {
                    const cellData = getCellData(rig, month);
                    return (
                      <td
                        key={month}
                        className="border border-border p-2 text-center cursor-pointer transition-all hover:opacity-80"
                        style={{ backgroundColor: cellData ? getColor(cellData.nptPercent) : 'hsl(var(--muted))' }}
                        onClick={() => cellData && onCellClick && onCellClick(rig, month)}
                        title={cellData ? `${cellData.nptPercent}% NPT (${cellData.totalNPT} hrs)` : 'No data'}
                      >
                        {cellData ? (
                          <div className="flex flex-col">
                            <span className="font-semibold">{cellData.nptPercent}%</span>
                            <span className="text-xs text-muted-foreground">{cellData.totalNPT}h</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="font-semibold">NPT % Legend:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 border border-border" style={{ backgroundColor: 'hsl(142, 76%, 80%)' }}></div>
            <span>&lt;5%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 border border-border" style={{ backgroundColor: 'hsl(47, 96%, 73%)' }}></div>
            <span>5-10%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 border border-border" style={{ backgroundColor: 'hsl(33, 100%, 70%)' }}></div>
            <span>10-15%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 border border-border" style={{ backgroundColor: 'hsl(0, 84%, 70%)' }}></div>
            <span>15-20%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 border border-border" style={{ backgroundColor: 'hsl(0, 84%, 50%)' }}></div>
            <span>&gt;20%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
