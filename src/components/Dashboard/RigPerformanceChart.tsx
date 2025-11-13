import { useState } from "react";
import { Download, Info, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRigPerformanceData } from "@/hooks/useRigPerformanceData";
import { YearSelector } from "./YearSelector";
import { RigFilterSelect } from "./RigFilterSelect";
import { EnhancedRigPerformanceChart } from "./EnhancedRigPerformanceChart";
import { RigMetricsCard } from "./RigMetricsCard";
import { RigComparisonView } from "./RigComparisonView";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const RigPerformanceChart = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedRigs, setSelectedRigs] = useState<string[]>([]);
  const [metric, setMetric] = useState<"efficiency" | "npt" | "compliance">("efficiency");
  const [comparisonMode, setComparisonMode] = useState(false);
  const [compareRig1, setCompareRig1] = useState<string>("");
  const [compareRig2, setCompareRig2] = useState<string>("");

  const { data, isLoading, error } = useRigPerformanceData(selectedYear, selectedRigs);

  const handleExport = () => {
    if (!data || data.rigs.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      // Prepare data for export
      const exportData: any[] = [];

      data.rigs.forEach((rig) => {
        rig.monthlyData.forEach((month) => {
          exportData.push({
            "Rig": rig.rigName,
            "Year": rig.year,
            "Month": month.monthName,
            "Efficiency %": month.efficiency.toFixed(1),
            "Actual NPT (days)": month.actualNPT.toFixed(1),
            "Allowable NPT (days)": month.allowableNPT.toFixed(1),
            "Compliance Rate %": month.complianceRate.toFixed(1),
            "Operating Days": month.operatingDays,
            "Status": month.status,
          });
        });
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rig Performance");
      XLSX.writeFile(wb, `Rig_Performance_${selectedYear}.xlsx`);

      toast.success("Data exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load performance data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const displayRigs = selectedRigs.length > 0 ? data?.rigs || [] : data?.rigs || [];

  const rig1Data = data?.rigs.find(r => r.rigName === compareRig1);
  const rig2Data = data?.rigs.find(r => r.rigName === compareRig2);
  const canCompare = rig1Data && rig2Data && compareRig1 !== compareRig2;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <YearSelector
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
          />
          {!comparisonMode && data && data.allRigs.length > 0 && (
            <RigFilterSelect
              allRigs={data.allRigs.map(r => r.rigName)}
              selectedRigs={selectedRigs}
              onSelectionChange={setSelectedRigs}
            />
          )}
          <Button
            variant={comparisonMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setComparisonMode(!comparisonMode);
              if (!comparisonMode) {
                setCompareRig1("");
                setCompareRig2("");
              }
            }}
            className="gap-2"
          >
            <GitCompare className="h-4 w-4" />
            Compare
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isLoading || !data || data.rigs.length === 0}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Comparison Mode Controls */}
      {comparisonMode && data && (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
          <p className="text-sm font-medium">Compare:</p>
          <Select value={compareRig1} onValueChange={setCompareRig1}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select first rig" />
            </SelectTrigger>
            <SelectContent>
              {data.allRigs.map((rig) => (
                <SelectItem key={rig.rigId} value={rig.rigName}>
                  {rig.rigName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">vs</p>
          <Select value={compareRig2} onValueChange={setCompareRig2}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select second rig" />
            </SelectTrigger>
            <SelectContent>
              {data.allRigs.map((rig) => (
                <SelectItem 
                  key={rig.rigId} 
                  value={rig.rigName}
                  disabled={rig.rigName === compareRig1}
                >
                  {rig.rigName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Summary Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card border rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Total Rigs</p>
            <p className="text-2xl font-bold">{data.summary.totalRigs}</p>
          </div>
          <div className="bg-card border rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Avg Efficiency</p>
            <p className="text-2xl font-bold">{data.summary.avgEfficiency.toFixed(1)}%</p>
          </div>
          <div className="bg-card border rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Total NPT</p>
            <p className="text-2xl font-bold">{data.summary.totalNPT.toFixed(0)}</p>
          </div>
          <div className="bg-card border rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Operating Days</p>
            <p className="text-2xl font-bold">{data.summary.totalOperatingDays}</p>
          </div>
        </div>
      )}

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          View performance of all rigs across 12 months. You can filter rigs and switch between different metrics.
          Last updated: {new Date().toLocaleDateString('en-US')}
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      {comparisonMode ? (
        // Comparison View
        <div className="mt-4">
          {canCompare ? (
            <RigComparisonView rig1={rig1Data} rig2={rig2Data} />
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Please select two different rigs to compare their performance.
              </AlertDescription>
            </Alert>
          )}
        </div>
      ) : (
        // Tabs for different metrics
        <Tabs value={metric} onValueChange={(v) => setMetric(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
            <TabsTrigger value="npt">NPT</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value={metric} className="mt-4 space-y-4">
            {isLoading ? (
              <Skeleton className="w-full h-[400px]" />
            ) : displayRigs.length > 0 ? (
              <>
                <EnhancedRigPerformanceChart
                  rigs={displayRigs}
                  metric={metric}
                />
                
                {/* Rig Metrics Cards */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Rig Summary</h4>
                  <ScrollArea className="h-[300px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pr-4">
                      {displayRigs.map((rig) => (
                        <RigMetricsCard key={rig.rigId} rig={rig} />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  No data available for year {selectedYear}. Please select another year or add new data.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
