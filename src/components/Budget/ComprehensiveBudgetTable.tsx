import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ComprehensiveBudgetTableProps {
  year?: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function ComprehensiveBudgetTable({ year = new Date().getFullYear() }: ComprehensiveBudgetTableProps) {
  // Fetch rigs
  const { data: rigs, isLoading: rigsLoading } = useQuery({
    queryKey: ["rigs-budget"],
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

  // Fetch all data sources
  const { data: utilizationData } = useQuery({
    queryKey: ["utilization-budget", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("utilization")
        .select("*")
        .eq("year", year);
      if (error) throw error;
      return data;
    },
  });

  const { data: nptData } = useQuery({
    queryKey: ["billing-npt-budget", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billing_npt")
        .select("*")
        .eq("year", year);
      if (error) throw error;
      return data;
    },
  });

  const { data: revenueData } = useQuery({
    queryKey: ["revenue-budget", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revenue")
        .select("*")
        .eq("year", year);
      if (error) throw error;
      return data;
    },
  });

  const { data: fuelData } = useQuery({
    queryKey: ["fuel-budget", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fuel_consumption")
        .select("*")
        .eq("year", year);
      if (error) throw error;
      return data;
    },
  });

  const { data: rigMovesData } = useQuery({
    queryKey: ["rig-moves-budget", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rig_moves")
        .select("*")
        .gte("move_date", `${year}-01-01`)
        .lte("move_date", `${year}-12-31`);
      if (error) throw error;
      return data;
    },
  });

  const { data: wellTrackerData } = useQuery({
    queryKey: ["well-tracker-budget", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("well_tracker")
        .select("*")
        .gte("start_date", `${year}-01-01`)
        .lte("start_date", `${year}-12-31`);
      if (error) throw error;
      return data;
    },
  });

  const { data: stockData } = useQuery({
    queryKey: ["stock-budget", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_levels")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: workOrdersData } = useQuery({
    queryKey: ["work-orders-budget", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .eq("year", year);
      if (error) throw error;
      return data;
    },
  });

  const getMonthData = (rig: string, monthIndex: number) => {
    const monthName = new Date(2000, monthIndex).toLocaleString('default', { month: 'long' });
    
    // Utilization
    const utilRecord = utilizationData?.find(d => d.rig === rig && d.month?.toLowerCase() === monthName.toLowerCase());
    
    // NPT
    const nptRecords = nptData?.filter(d => d.rig === rig && d.month?.toLowerCase() === monthName.toLowerCase()) || [];
    const totalNPT = nptRecords.reduce((sum, r) => sum + (r.npt_hours || 0), 0);
    
    // Revenue
    const revRecord = revenueData?.find(d => d.rig === rig && d.month?.toLowerCase() === monthName.toLowerCase());
    
    // Fuel
    const fuelRecord = fuelData?.find(d => d.rig === rig && d.month?.toLowerCase() === monthName.toLowerCase());
    
    // Rig Moves
    const moveRecords = rigMovesData?.filter(d => {
      if (!d.move_date || d.rig !== rig) return false;
      const moveDate = new Date(d.move_date);
      return moveDate.getMonth() === monthIndex;
    }) || [];
    const movesCount = moveRecords.length;
    
    // Well Tracker
    const wellRecords = wellTrackerData?.filter(d => {
      if (!d.start_date || d.rig !== rig) return false;
      const startDate = new Date(d.start_date);
      return startDate.getMonth() === monthIndex;
    }) || [];
    const wellsCount = wellRecords.length;
    
    // Stock Level (current stock for rig)
    const stockRecords = stockData?.filter(d => d.rig === rig) || [];
    const stockCount = stockRecords.length;
    
    // Work Orders
    const woRecord = workOrdersData?.find(d => d.rig === rig && d.month?.toLowerCase() === monthName.toLowerCase());
    const totalWO = (woRecord?.elec_open || 0) + (woRecord?.mech_open || 0) + (woRecord?.oper_open || 0);
    
    return {
      utilization: utilRecord?.utilization_rate,
      npt: totalNPT,
      revenue: revRecord?.revenue_actual,
      fuel: fuelRecord?.total_consumed,
      material: null, // No material table found
      maintenance: null, // No maintenance table found
      rigMoves: movesCount,
      wellTracker: wellsCount,
      stockLevel: stockCount,
      workOrders: totalWO,
    };
  };

  const formatValue = (value: number | null | undefined, type: string) => {
    if (value === null || value === undefined) return "-";
    
    switch (type) {
      case "utilization":
        return `${value.toFixed(1)}%`;
      case "npt":
        return `${value.toFixed(0)}h`;
      case "revenue":
        return `$${(value / 1000).toFixed(0)}k`;
      case "fuel":
        return `${value.toFixed(0)}L`;
      case "rigMoves":
      case "wellTracker":
      case "stockLevel":
      case "workOrders":
        return value.toString();
      default:
        return value.toFixed(0);
    }
  };

  if (rigsLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Comprehensive Budget View</CardTitle>
            <CardDescription>All metrics for all rigs across all months - {year}</CardDescription>
          </div>
          <Badge variant="outline">{year}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-20 font-bold min-w-[80px]">Rig</TableHead>
                {MONTHS.map(month => (
                  <TableHead key={month} colSpan={10} className="text-center border-l font-bold">
                    {month}
                  </TableHead>
                ))}
              </TableRow>
              <TableRow className="bg-muted/50">
                <TableHead className="sticky left-0 bg-muted/50 z-20"></TableHead>
                {MONTHS.map(month => (
                  <>
                    <TableHead key={`${month}-util`} className="text-center text-xs border-l min-w-[60px]">Util%</TableHead>
                    <TableHead key={`${month}-npt`} className="text-center text-xs min-w-[60px]">NPT</TableHead>
                    <TableHead key={`${month}-rev`} className="text-center text-xs min-w-[70px]">Rev</TableHead>
                    <TableHead key={`${month}-fuel`} className="text-center text-xs min-w-[60px]">Fuel</TableHead>
                    <TableHead key={`${month}-mat`} className="text-center text-xs min-w-[60px]">Mat</TableHead>
                    <TableHead key={`${month}-maint`} className="text-center text-xs min-w-[60px]">Maint</TableHead>
                    <TableHead key={`${month}-moves`} className="text-center text-xs min-w-[60px]">Moves</TableHead>
                    <TableHead key={`${month}-wells`} className="text-center text-xs min-w-[60px]">Wells</TableHead>
                    <TableHead key={`${month}-stock`} className="text-center text-xs min-w-[60px]">Stock</TableHead>
                    <TableHead key={`${month}-wo`} className="text-center text-xs min-w-[60px]">WO</TableHead>
                  </>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rigs?.map((rig) => (
                <TableRow key={rig.rig_code}>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">{rig.rig_code}</TableCell>
                  {MONTHS.map((month, index) => {
                    const data = getMonthData(rig.rig_code, index);
                    return (
                      <>
                        <TableCell key={`${month}-util`} className="text-center text-xs border-l">{formatValue(data.utilization, "utilization")}</TableCell>
                        <TableCell key={`${month}-npt`} className="text-center text-xs">{formatValue(data.npt, "npt")}</TableCell>
                        <TableCell key={`${month}-rev`} className="text-center text-xs">{formatValue(data.revenue, "revenue")}</TableCell>
                        <TableCell key={`${month}-fuel`} className="text-center text-xs">{formatValue(data.fuel, "fuel")}</TableCell>
                        <TableCell key={`${month}-mat`} className="text-center text-xs text-muted-foreground">-</TableCell>
                        <TableCell key={`${month}-maint`} className="text-center text-xs text-muted-foreground">-</TableCell>
                        <TableCell key={`${month}-moves`} className="text-center text-xs">{formatValue(data.rigMoves, "rigMoves")}</TableCell>
                        <TableCell key={`${month}-wells`} className="text-center text-xs">{formatValue(data.wellTracker, "wellTracker")}</TableCell>
                        <TableCell key={`${month}-stock`} className="text-center text-xs">{formatValue(data.stockLevel, "stockLevel")}</TableCell>
                        <TableCell key={`${month}-wo`} className="text-center text-xs">{formatValue(data.workOrders, "workOrders")}</TableCell>
                      </>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
