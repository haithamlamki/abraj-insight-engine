import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface VersionComparisonViewProps {
  reportKey: string;
  year: number;
}

export const VersionComparisonView = ({ reportKey, year }: VersionComparisonViewProps) => {
  const [version1Id, setVersion1Id] = useState<string>("");
  const [version2Id, setVersion2Id] = useState<string>("");

  const { data: versions } = useQuery({
    queryKey: ['budget-versions-comparison'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_version')
        .select('*')
        .eq('fiscal_year', year)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: comparison, isLoading } = useQuery({
    queryKey: ['budget-comparison', version1Id, version2Id, reportKey, year],
    queryFn: async () => {
      if (!version1Id || !version2Id) return null;

      const { data: report } = await supabase
        .from('dim_report')
        .select('id')
        .eq('report_key', reportKey)
        .single();

      if (!report) throw new Error('Report not found');

      const { data: budgets1 } = await supabase
        .from('fact_budget')
        .select(`
          *,
          rig:dim_rig(rig_code),
          metric:dim_metric(metric_key, display_name)
        `)
        .eq('version_id', version1Id)
        .eq('report_id', report.id)
        .eq('year', year);

      const { data: budgets2 } = await supabase
        .from('fact_budget')
        .select(`
          *,
          rig:dim_rig(rig_code),
          metric:dim_metric(metric_key, display_name)
        `)
        .eq('version_id', version2Id)
        .eq('report_id', report.id)
        .eq('year', year);

      // Group and compare
      const comparison = (budgets1 || []).map((b1: any) => {
        const b2 = (budgets2 || []).find((b: any) => 
          b.rig_id === b1.rig_id && 
          b.metric_id === b1.metric_id && 
          b.month === b1.month
        );

        const value1 = b1.budget_value;
        const value2 = b2?.budget_value || 0;
        const diff = value2 - value1;
        const diffPct = value1 !== 0 ? (diff / value1) * 100 : 0;

        return {
          rig: b1.rig.rig_code,
          metric: b1.metric.display_name,
          month: b1.month,
          value1,
          value2,
          diff,
          diffPct,
        };
      });

      return comparison;
    },
    enabled: !!version1Id && !!version2Id,
  });

  const getDiffIcon = (diffPct: number) => {
    if (diffPct > 1) return <TrendingUp className="h-4 w-4 text-success" />;
    if (diffPct < -1) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Version Comparison</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Version 1</label>
              <Select value={version1Id} onValueChange={setVersion1Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {versions?.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.version_name} ({v.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Version 2</label>
              <Select value={version2Id} onValueChange={setVersion2Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {versions?.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.version_name} ({v.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isLoading && (
          <p className="text-center text-muted-foreground">Loading comparison...</p>
        )}

        {comparison && comparison.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rig</TableHead>
                  <TableHead>Metric</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Version 1</TableHead>
                  <TableHead className="text-right">Version 2</TableHead>
                  <TableHead className="text-right">Difference</TableHead>
                  <TableHead className="text-right">Change %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparison.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{row.rig}</TableCell>
                    <TableCell>{row.metric}</TableCell>
                    <TableCell>
                      {new Date(2000, row.month - 1).toLocaleString('default', { month: 'short' })}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.value1.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.value2.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {getDiffIcon(row.diffPct)}
                        {row.diff.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant={Math.abs(row.diffPct) < 5 ? "outline" : "default"}
                        className={
                          row.diffPct > 5 ? "bg-success/10 text-success border-success" :
                          row.diffPct < -5 ? "bg-destructive/10 text-destructive border-destructive" :
                          ""
                        }
                      >
                        {row.diffPct > 0 ? '+' : ''}{row.diffPct.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {comparison && comparison.length === 0 && version1Id && version2Id && (
          <p className="text-center text-muted-foreground">
            No data to compare for selected versions
          </p>
        )}
      </div>
    </Card>
  );
};
