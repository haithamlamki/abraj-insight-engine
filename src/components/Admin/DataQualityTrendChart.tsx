import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface DataQualityTrendChartProps {
  tableName: string;
}

export const DataQualityTrendChart = ({ tableName }: DataQualityTrendChartProps) => {
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
    queryKey: ['data-quality-trend', tableName],
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

      const results = [];
      
      for (const monthInfo of months) {
        const { data, error } = await supabase
          .from(tableName as any)
          .select('rig, month, year')
          .eq('year', monthInfo.year)
          .eq('month', monthInfo.month);
        
        if (error) throw error;

        const totalPossible = (rigs || 0) * 1; // 1 month
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
    },
    enabled: !!tableName && !!rigs,
  });

  const avgCompletionRate = useMemo(() => {
    if (!trendData || trendData.length === 0) return 0;
    const sum = trendData.reduce((acc, curr) => acc + curr.completionRate, 0);
    return (sum / trendData.length).toFixed(1);
  }, [trendData]);

  const trend = useMemo(() => {
    if (!trendData || trendData.length < 2) return 'neutral';
    const firstHalf = trendData.slice(0, Math.floor(trendData.length / 2));
    const secondHalf = trendData.slice(Math.floor(trendData.length / 2));
    
    const firstAvg = firstHalf.reduce((acc, curr) => acc + curr.completionRate, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((acc, curr) => acc + curr.completionRate, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg + 5) return 'improving';
    if (secondAvg < firstAvg - 5) return 'declining';
    return 'stable';
  }, [trendData]);

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
        </CardTitle>
        <CardDescription>Track data entry completion rates over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
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
                <Line 
                  type="monotone" 
                  dataKey="completionRate" 
                  stroke="hsl(142, 76%, 36%)" 
                  strokeWidth={2}
                  name="Completion Rate"
                  dot={{ fill: 'hsl(142, 76%, 36%)', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Upload vs Missing Area Chart */}
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
                  stroke="hsl(142, 76%, 36%)" 
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
        </div>
      </CardContent>
    </Card>
  );
};
