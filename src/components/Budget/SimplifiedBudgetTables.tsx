import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface SimplifiedBudgetTablesProps {
  year?: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function SimplifiedBudgetTables({ year = new Date().getFullYear() }: SimplifiedBudgetTablesProps) {
  // Fetch rigs
  const { data: rigs, isLoading: rigsLoading } = useQuery({
    queryKey: ["rigs-simple"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dim_rig")
        .select("*")
        .eq("active", true)
        .order("rig_code");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch utilization data
  const { data: utilizationData, isLoading: utilizationLoading } = useQuery({
    queryKey: ["utilization-table", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("utilization")
        .select("*")
        .eq("year", year)
        .order("rig");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch revenue data
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["revenue-table", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revenue")
        .select("*")
        .eq("year", year)
        .order("rig");
      
      if (error) throw error;
      return data;
    },
  });

  // Process utilization data into rig x month matrix
  const utilizationMatrix = rigs?.map(rig => {
    const rigData = utilizationData?.filter(d => d.rig === rig.rig_code) || [];
    const monthlyData: { [key: string]: number | null } = {};
    
    MONTHS.forEach((month, index) => {
      const monthName = new Date(2000, index).toLocaleString('default', { month: 'long' });
      const record = rigData.find(d => d.month?.toLowerCase() === monthName.toLowerCase());
      monthlyData[month] = record?.utilization_rate || null;
    });
    
    return {
      rig: rig.rig_code,
      ...monthlyData
    };
  }) || [];

  // Calculate YTD (cumulative) utilization
  const ytdMatrix = rigs?.map(rig => {
    const rigData = utilizationData?.filter(d => d.rig === rig.rig_code) || [];
    const monthlyData: { [key: string]: number | null } = {};
    let cumulativeSum = 0;
    let cumulativeCount = 0;
    
    MONTHS.forEach((month, index) => {
      const monthName = new Date(2000, index).toLocaleString('default', { month: 'long' });
      const record = rigData.find(d => d.month?.toLowerCase() === monthName.toLowerCase());
      
      if (record?.utilization_rate != null) {
        cumulativeSum += record.utilization_rate;
        cumulativeCount++;
      }
      
      monthlyData[month] = cumulativeCount > 0 ? cumulativeSum / cumulativeCount : null;
    });
    
    return {
      rig: rig.rig_code,
      ...monthlyData
    };
  }) || [];

  // Process revenue data - annual total per rig
  const revenueMatrix = rigs?.map(rig => {
    const rigData = revenueData?.filter(d => d.rig === rig.rig_code) || [];
    const totalRevenue = rigData.reduce((sum, record) => sum + (record.revenue_actual || 0), 0);
    
    return {
      rig: rig.rig_code,
      total: totalRevenue,
      count: rigData.length
    };
  }) || [];

  const formatPercent = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return `${value.toFixed(1)}%`;
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getCellColor = (value: number | null) => {
    if (value === null || value === undefined) return "text-muted-foreground";
    if (value >= 90) return "text-green-600 dark:text-green-400 font-semibold";
    if (value >= 70) return "text-primary font-medium";
    if (value >= 50) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  if (rigsLoading || utilizationLoading || revenueLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Utilization % Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Monthly Utilization %</CardTitle>
              <CardDescription>Utilization rate for all rigs across {year}</CardDescription>
            </div>
            <Badge variant="outline">{year}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold sticky left-0 bg-background z-10">Rig</TableHead>
                  {MONTHS.map(month => (
                    <TableHead key={month} className="text-center min-w-[70px]">{month}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {utilizationMatrix.map((row) => (
                  <TableRow key={row.rig}>
                    <TableCell className="font-medium sticky left-0 bg-background z-10">{row.rig}</TableCell>
                    {MONTHS.map(month => (
                      <TableCell key={month} className={`text-center ${getCellColor(row[month] as number | null)}`}>
                        {formatPercent(row[month] as number | null)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* YTD % Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>YTD Utilization % (Cumulative Average)</CardTitle>
              <CardDescription>Year-to-date cumulative utilization percentage for {year}</CardDescription>
            </div>
            <Badge variant="outline">{year}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold sticky left-0 bg-background z-10">Rig</TableHead>
                  {MONTHS.map(month => (
                    <TableHead key={month} className="text-center min-w-[70px]">{month}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ytdMatrix.map((row) => (
                  <TableRow key={row.rig}>
                    <TableCell className="font-medium sticky left-0 bg-background z-10">{row.rig}</TableCell>
                    {MONTHS.map(month => (
                      <TableCell key={month} className={`text-center ${getCellColor(row[month] as number | null)}`}>
                        {formatPercent(row[month] as number | null)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Annual Revenue Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Annual Revenue by Rig</CardTitle>
              <CardDescription>Total revenue per rig for {year}</CardDescription>
            </div>
            <Badge variant="outline">{year}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Rig</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead className="text-center">Months Reported</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueMatrix.map((row) => (
                  <TableRow key={row.rig}>
                    <TableCell className="font-medium">{row.rig}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {row.total > 0 ? formatCurrency(row.total) : "-"}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {row.count > 0 ? `${row.count}/12` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right text-lg">
                    {formatCurrency(revenueMatrix.reduce((sum, row) => sum + row.total, 0))}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
