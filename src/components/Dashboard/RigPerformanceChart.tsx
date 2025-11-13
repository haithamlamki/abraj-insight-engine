import { useState } from "react";
import { Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRigPerformanceData } from "@/hooks/useRigPerformanceData";
import { YearSelector } from "./YearSelector";
import { RigFilterSelect } from "./RigFilterSelect";
import { EnhancedRigPerformanceChart } from "./EnhancedRigPerformanceChart";
import { RigMetricsCard } from "./RigMetricsCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export const RigPerformanceChart = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedRigs, setSelectedRigs] = useState<string[]>([]);
  const [metric, setMetric] = useState<"efficiency" | "npt" | "compliance">("efficiency");

  const { data, isLoading, error } = useRigPerformanceData(selectedYear, selectedRigs);

  const handleExport = () => {
    if (!data || data.rigs.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }

    try {
      // Prepare data for export
      const exportData: any[] = [];

      data.rigs.forEach((rig) => {
        rig.monthlyData.forEach((month) => {
          exportData.push({
            "الأنبوب": rig.rigName,
            "السنة": rig.year,
            "الشهر": month.monthName,
            "الكفاءة %": month.efficiency.toFixed(1),
            "NPT الفعلي (أيام)": month.actualNPT.toFixed(1),
            "NPT المسموح (أيام)": month.allowableNPT.toFixed(1),
            "نسبة الامتثال %": month.complianceRate.toFixed(1),
            "أيام التشغيل": month.operatingDays,
            "الحالة": month.status,
          });
        });
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rig Performance");
      XLSX.writeFile(wb, `Rig_Performance_${selectedYear}.xlsx`);

      toast.success("تم تصدير البيانات بنجاح");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("فشل تصدير البيانات");
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          فشل تحميل بيانات الأداء. يرجى المحاولة مرة أخرى.
        </AlertDescription>
      </Alert>
    );
  }

  const displayRigs = selectedRigs.length > 0 ? data?.rigs || [] : data?.rigs || [];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <YearSelector
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
          />
          {data && data.allRigs.length > 0 && (
            <RigFilterSelect
              allRigs={data.allRigs.map(r => r.rigName)}
              selectedRigs={selectedRigs}
              onSelectionChange={setSelectedRigs}
            />
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isLoading || !data || data.rigs.length === 0}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          تصدير
        </Button>
      </div>

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
            <p className="text-xs text-muted-foreground mb-1">إجمالي الأنابيب</p>
            <p className="text-2xl font-bold">{data.summary.totalRigs}</p>
          </div>
          <div className="bg-card border rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">متوسط الكفاءة</p>
            <p className="text-2xl font-bold">{data.summary.avgEfficiency.toFixed(1)}%</p>
          </div>
          <div className="bg-card border rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">إجمالي NPT</p>
            <p className="text-2xl font-bold">{data.summary.totalNPT.toFixed(0)}</p>
          </div>
          <div className="bg-card border rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">أيام التشغيل</p>
            <p className="text-2xl font-bold">{data.summary.totalOperatingDays}</p>
          </div>
        </div>
      )}

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          عرض أداء جميع الأنابيب على مدار 12 شهر. يمكنك تصفية الأنابيب والتبديل بين المقاييس المختلفة.
          آخر تحديث: {new Date().toLocaleDateString('ar-SA')}
        </AlertDescription>
      </Alert>

      {/* Tabs for different metrics */}
      <Tabs value={metric} onValueChange={(v) => setMetric(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="efficiency">الكفاءة</TabsTrigger>
          <TabsTrigger value="npt">NPT</TabsTrigger>
          <TabsTrigger value="compliance">الامتثال</TabsTrigger>
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
                <h4 className="text-sm font-medium mb-3">ملخص الأنابيب</h4>
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
                لا توجد بيانات متاحة للسنة {selectedYear}. يرجى اختيار سنة أخرى أو إضافة بيانات جديدة.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
