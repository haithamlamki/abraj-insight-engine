import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface DataQualityTrendChartProps {
  tableName: string;
}

const COLORS = [
  'hsl(142, 76%, 36%)',
  'hsl(221, 83%, 53%)',
  'hsl(262, 83%, 58%)',
  'hsl(346, 77%, 50%)',
  'hsl(24, 95%, 53%)',
];

export const DataQualityTrendChart = ({ tableName }: DataQualityTrendChartProps) => {
  const [selectedRigs, setSelectedRigs] = useState<string[]>([]);

  const { data: rigsList } = useQuery({
    queryKey: ['rigs-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dim_rig')
        .select('rig_code, rig_name')
        .eq('active', true)
        .order('rig_name');
      if (error) throw error;
      return data;
    },
  });

  const { data: rigs } = useQuery({
    queryKey: ['rigs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dim_rig')
        .select('rig_code')
        .eq('active', true);
      if (error) throw error;
      return data.length;
    },
  });

  const { data: trendData, isLoading } = useQuery({
    queryKey: ['data-quality-trend', tableName, selectedRigs],
    queryFn: async () => {
      // Get last 12 months of data
      const months = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          year: date.getFullYear(),
          month: date.toLocaleString('default', { month: 'short' }),
          monthNum: date.getMonth() + 1,
          fullDate: date,
        });
      }

      if (selectedRigs.length === 0) {
        // Aggregate view
        const results = [];
        
        for (const monthInfo of months) {
          const { data, error } = await supabase
            .from(tableName as any)
            .select('rig, month, year')
            .eq('year', monthInfo.year)
            .eq('month', monthInfo.month);
          
          if (error) throw error;

          const totalPossible = (rigs || 0) * 1;
          const uploaded = data?.length || 0;
          const completionRate = totalPossible > 0 ? (uploaded / totalPossible) * 100 : 0;

          results.push({
            period: `${monthInfo.month} ${monthInfo.year}`,
            uploaded,
            missing: totalPossible - uploaded,
            completionRate: parseFloat(completionRate.toFixed(1)),
            totalPossible,
          });
        }

        return results;
      } else {
        // Per-rig view
        const results = [];
        
        for (const monthInfo of months) {
          const { data, error } = await supabase
            .from(tableName as any)
            .select('rig, month, year')
            .eq('year', monthInfo.year)
            .eq('month', monthInfo.month)
            .in('rig', selectedRigs);
          
          if (error) throw error;

          const dataPoint: any = {
            period: `${monthInfo.month} ${monthInfo.year}`,
          };

          selectedRigs.forEach(rig => {
            const rigData = data?.filter((d: any) => d.rig === rig) || [];
            const uploaded = rigData.length;
            const completionRate = uploaded > 0 ? 100 : 0;
            dataPoint[`${rig}_rate`] = completionRate;
            dataPoint[`${rig}_uploaded`] = uploaded;
          });

          results.push(dataPoint);
        }

        return results;
      }
    },
    enabled: !!tableName && !!rigs,
  });

  const avgCompletionRate = useMemo(() => {
    if (!trendData || trendData.length === 0 || selectedRigs.length > 0) return 0;
    const sum = trendData.reduce((acc, curr) => acc + (curr.completionRate || 0), 0);
    return (sum / trendData.length).toFixed(1);
  }, [trendData, selectedRigs]);

  const trend = useMemo(() => {
    if (!trendData || trendData.length < 2 || selectedRigs.length > 0) return 'neutral';
    const firstHalf = trendData.slice(0, Math.floor(trendData.length / 2));
    const secondHalf = trendData.slice(Math.floor(trendData.length / 2));
    
    const firstAvg = firstHalf.reduce((acc, curr) => acc + (curr.completionRate || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((acc, curr) => acc + (curr.completionRate || 0), 0) / secondHalf.length;
    
    if (secondAvg > firstAvg + 5) return 'improving';
    if (secondAvg < firstAvg - 5) return 'declining';
    return 'stable';
  }, [trendData, selectedRigs]);

  const toggleRig = (rigCode: string) => {
    setSelectedRigs(prev =>
      prev.includes(rigCode)
        ? prev.filter(r => r !== rigCode)
        : [...prev, rigCode]
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Quality Trend</CardTitle>
          <CardDescription>Loading trend analysis...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!trendData || trendData.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Data Quality Trend (Last 12 Months)</span>
          {selectedRigs.length === 0 && (
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Avg: </span>
                <span className="font-bold">{avgCompletionRate}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Trend: </span>
                <span className={`font-bold ${
                  trend === 'improving' ? 'text-green-600' : 
                  trend === 'declining' ? 'text-red-600' : 
                  'text-yellow-600'
                }`}>
                  {trend === 'improving' ? '↗ Improving' : 
                   trend === 'declining' ? '↘ Declining' : 
                   '→ Stable'}
                </span>
              </div>
            </div>
          )}
        </CardTitle>
        <CardDescription>
          {selectedRigs.length === 0 
            ? 'Track data entry completion rates over time' 
            : `Comparing ${selectedRigs.length} rig${selectedRigs.length > 1 ? 's' : ''}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Rig Filter */}
          <div className="space-y-2">
            <Label>Filter by Rig (select to compare)</Label>
            <div className="flex flex-wrap gap-2">
              {rigsList?.map((rig) => (
                <Badge
                  key={rig.rig_code}
                  variant={selectedRigs.includes(rig.rig_code) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleRig(rig.rig_code)}
                >
                  {rig.rig_name}
                </Badge>
              ))}
            </div>
            {selectedRigs.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedRigs.join(", ")}
              </p>
            )}
          </div>

          {/* Completion Rate Line Chart */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Completion Rate Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Completion %', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: any) => `${value}%`}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
                {selectedRigs.length === 0 ? (
                  <Line 
                    type="monotone" 
                    dataKey="completionRate" 
                    stroke={COLORS[0]}
                    strokeWidth={2}
                    name="Completion Rate"
                    dot={{ fill: COLORS[0], r: 4 }}
                  />
                ) : (
                  selectedRigs.map((rig, index) => (
                    <Line 
                      key={rig}
                      type="monotone" 
                      dataKey={`${rig}_rate`} 
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      name={rig}
                      dot={{ fill: COLORS[index % COLORS.length], r: 4 }}
                    />
                  ))
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Upload vs Missing Area Chart - Only show in aggregate view */}
          {selectedRigs.length === 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Uploaded vs Missing Records</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Records', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="uploaded" 
                    stackId="1"
                    stroke={COLORS[0]}
                    fill="hsl(142, 76%, 80%)"
                    name="Uploaded"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="missing" 
                    stackId="1"
                    stroke="hsl(0, 84%, 60%)" 
                    fill="hsl(0, 84%, 70%)"
                    name="Missing"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
