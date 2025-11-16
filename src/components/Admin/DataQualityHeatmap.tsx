import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface DataQualityHeatmapProps {
  tableName: string;
  year: number;
}

export const DataQualityHeatmap = ({ tableName, year }: DataQualityHeatmapProps) => {
  const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const { data: rigs } = useQuery({
    queryKey: ['rigs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dim_rig')
        .select('rig_code')
        .eq('active', true)
        .order('rig_code');
      if (error) throw error;
      return data.map(r => r.rig_code);
    },
  });

  const { data: qualityData, isLoading } = useQuery({
    queryKey: ['data-quality', tableName, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName as any)
        .select('rig, month, year')
        .eq('year', year);
      
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!tableName && !!year,
  });

  const { heatmapData, stats } = useMemo(() => {
    if (!rigs || !qualityData) return { heatmapData: {}, stats: { total: 0, uploaded: 0, missing: 0, completionRate: 0 } };

    const dataMap: Record<string, Set<string>> = {};
    
    qualityData.forEach(row => {
      const key = `${row.rig}_${row.month}`;
      if (!dataMap[key]) {
        dataMap[key] = new Set();
      }
      dataMap[key].add(row.month);
    });

    const totalCells = rigs.length * 12;
    const uploadedCells = Object.keys(dataMap).length;
    const missingCells = totalCells - uploadedCells;
    const completionRate = totalCells > 0 ? (uploadedCells / totalCells) * 100 : 0;

    return {
      heatmapData: dataMap,
      stats: {
        total: totalCells,
        uploaded: uploadedCells,
        missing: missingCells,
        completionRate,
      },
    };
  }, [rigs, qualityData]);

  const getStatus = (rig: string, month: string) => {
    const key = `${rig}_${month}`;
    return heatmapData[key] ? 'uploaded' : 'missing';
  };

  const getColor = (status: string) => {
    if (status === 'uploaded') return 'hsl(142, 76%, 80%)';
    if (status === 'missing') return 'hsl(0, 84%, 70%)';
    return 'hsl(47, 96%, 73%)';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Quality Check</CardTitle>
          <CardDescription>Loading quality analysis...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!rigs || !qualityData) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Quality Check - {year}</CardTitle>
        <CardDescription>Upload status by rig and month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-sm text-muted-foreground">Completion Rate</div>
            <div className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-sm text-muted-foreground">Uploaded</div>
            <div className="text-2xl font-bold text-green-600">{stats.uploaded}</div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-sm text-muted-foreground">Missing</div>
            <div className="text-2xl font-bold text-red-600">{stats.missing}</div>
          </div>
        </div>

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
                    const status = getStatus(rig, month);
                    return (
                      <td
                        key={month}
                        className="border border-border p-2 text-center"
                        style={{ backgroundColor: getColor(status) }}
                        title={status === 'uploaded' ? 'Data uploaded' : 'No data'}
                      >
                        <div className="flex items-center justify-center">
                          {status === 'uploaded' ? '✓' : '✗'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="font-semibold">Legend:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 border border-border" style={{ backgroundColor: 'hsl(142, 76%, 80%)' }}></div>
            <span>Uploaded</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 border border-border" style={{ backgroundColor: 'hsl(0, 84%, 70%)' }}></div>
            <span>Missing</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
