import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Lock, 
  Archive, 
  Edit,
  Copy,
  Download,
  Upload,
  Sparkles,
  Play,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { generateBudgetTemplate, parseBudgetExcel, exportBudgetToExcel } from "@/lib/budgetExcel";
import { BudgetEditor } from "@/components/Budget/BudgetEditor";
import { SmartBudgetSettings } from "@/components/Budget/SmartBudgetSettings";
import { useBudgetPopulation } from "@/hooks/useBudgetPopulation";
import { useImportActuals } from "@/hooks/useImportActuals";
import { ManualBudgetInput } from "@/components/Budget/ManualBudgetInput";
import { ActualsBudgetComparison } from "@/components/Budget/ActualsBudgetComparison";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BudgetManagement = () => {
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<string>('utilization');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [smartSettingsOpen, setSmartSettingsOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const { isPopulating, uploadDialogOpen: budgetUploadOpen, setUploadDialogOpen: setBudgetUploadOpen, handlePopulate } = useBudgetPopulation();
  const { importActuals, isImporting } = useImportActuals();
  const [fuelFile, setFuelFile] = useState<File | null>(null);
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [repairFile, setRepairFile] = useState<File | null>(null);

  const { data: versions, isLoading } = useQuery({
    queryKey: ['budget-versions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_version')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: rigs } = useQuery({
    queryKey: ['dim-rig'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dim_rig')
        .select('*')
        .eq('active', true);
      if (error) throw error;
      return data;
    },
  });

  const { data: reports } = useQuery({
    queryKey: ['dim-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dim_report')
        .select('*')
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: metrics } = useQuery({
    queryKey: ['dim-metric', selectedReport],
    queryFn: async () => {
      const { data: report } = await supabase
        .from('dim_report')
        .select('id')
        .eq('report_key', selectedReport)
        .single();

      if (!report) return [];

      const { data, error } = await supabase
        .from('dim_metric')
        .select('*')
        .eq('report_id', report.id)
        .eq('active', true);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedReport,
  });

  const importMutation = useMutation({
    mutationFn: async ({ file, versionId }: { file: File; versionId: string }) => {
      if (!rigs || !metrics) throw new Error('Missing reference data');

      const importData = await parseBudgetExcel(file, rigs, metrics);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const { data: report } = await supabase
        .from('dim_report')
        .select('id')
        .eq('report_key', selectedReport)
        .single();

      if (!report) throw new Error('Report not found');

      const budgetRecords = importData.map(row => {
        const rig = rigs.find(r => r.rig_code === row.rig_code);
        const metric = metrics.find(m => m.metric_key === row.metric_key);

        return {
          version_id: versionId,
          report_id: report.id,
          rig_id: rig!.id,
          metric_id: metric!.id,
          year: row.year,
          month: row.month,
          budget_value: row.budget_value,
          currency: row.currency || 'OMR',
          notes: row.notes,
          created_by: user.id,
        };
      });

      const { error } = await supabase
        .from('fact_budget')
        .upsert(budgetRecords);

      if (error) throw error;
      return budgetRecords.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['budget-editor'] });
      toast.success(`Successfully imported ${count} budget entries`);
      setUploadDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Import failed: ${error.message}`);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'submitted': return 'default';
      case 'approved': return 'success';
      case 'locked': return 'outline';
      case 'archived': return 'destructive';
      default: return 'default';
    }
  };

  const handleDownloadTemplate = () => {
    if (!rigs || !metrics) {
      toast.error('Missing data for template generation');
      return;
    }
    generateBudgetTemplate(rigs, metrics, selectedYear);
    toast.success('Template downloaded');
  };

  const handleExport = async (versionId: string) => {
    try {
      const { data: report } = await supabase
        .from('dim_report')
        .select('id')
        .eq('report_key', selectedReport)
        .single();

      if (!report) throw new Error('Report not found');

      const { data: budgets, error } = await supabase
        .from('fact_budget')
        .select(`
          *,
          rig:dim_rig(rig_code),
          metric:dim_metric(metric_key)
        `)
        .eq('version_id', versionId)
        .eq('report_id', report.id)
        .eq('year', selectedYear);

      if (error) throw error;

      const exportData = (budgets || []).map((b: any) => ({
        rig_code: b.rig.rig_code,
        metric_key: b.metric.metric_key,
        year: b.year,
        month: b.month,
        budget_value: b.budget_value,
        currency: b.currency,
      }));

      exportBudgetToExcel(exportData, selectedYear);
      toast.success('Budget exported successfully');
    } catch (error: any) {
      toast.error(`Export failed: ${error.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedVersion) return;

    importMutation.mutate({ file, versionId: selectedVersion });
  };

  return (
    <>
      <DashboardLayout>
        <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Budget Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage budget versions and approval workflow
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setBudgetUploadOpen(true)}
              disabled={isPopulating}
              variant="secondary"
            >
              <Play className="h-4 w-4 mr-2" />
              Populate 2025 Budget
            </Button>
            <Button 
              onClick={() => {
                if (!versions?.[0]?.id) {
                  toast.error("No budget version found");
                  return;
                }
                importActuals(versions[0].id);
              }}
              disabled={isImporting || !versions?.[0]?.id}
              variant="secondary"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? "Importing..." : "Import 2024 Actuals"}
            </Button>
            <Button 
              onClick={() => setComparisonOpen(true)}
              disabled={!versions?.[0]?.id}
              variant="secondary"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Compare Actuals vs Budget
            </Button>
            <Button 
              onClick={() => setSmartSettingsOpen(true)}
              variant="default"
              className="bg-primary"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Smart Budget
            </Button>
            <Select value={selectedReport} onValueChange={setSelectedReport}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reports?.map(r => (
                  <SelectItem key={r.id} value={r.report_key}>
                    {r.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleDownloadTemplate} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Template
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Loading budget versions...</p>
          </Card>
        ) : !versions || versions.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No budget versions yet</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {versions.map((version) => (
              <Card key={version.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-semibold">{version.version_name}</h3>
                      <Badge variant={getStatusColor(version.status) as any}>
                        {version.status}
                      </Badge>
                      {version.is_baseline && (
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          Baseline
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      FY {version.fiscal_year} • {version.version_code}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedVersion(version.id);
                        setEditorOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedVersion(version.id);
                        setUploadDialogOpen(true);
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport(version.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Effective Period</p>
                    <p className="font-medium">
                      {new Date(version.effective_start).toLocaleDateString()} - {new Date(version.effective_end).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">{new Date(version.created_at).toLocaleDateString()}</p>
                  </div>
                  {version.approved_at && (
                    <div>
                      <p className="text-muted-foreground">Approved</p>
                      <p className="font-medium">{new Date(version.approved_at).toLocaleDateString()}</p>
                    </div>
                  )}
                  {version.frozen_at && (
                    <div>
                      <p className="text-muted-foreground">Locked</p>
                      <p className="font-medium">{new Date(version.frozen_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Budget Editor</DialogTitle>
              <DialogDescription>
                Edit budget values for {selectedReport} - {selectedYear}
              </DialogDescription>
            </DialogHeader>
            {selectedVersion && (
              <BudgetEditor
                versionId={selectedVersion}
                reportKey={selectedReport}
                year={selectedYear}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Budget from Excel</DialogTitle>
              <DialogDescription>
                Upload an Excel file with budget data. Use the template for correct format.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={importMutation.isPending}
              />
              {importMutation.isPending && (
                <p className="text-sm text-muted-foreground">Importing...</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={budgetUploadOpen} onOpenChange={setBudgetUploadOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Populate 2025 Budget</DialogTitle>
              <DialogDescription>
                Choose how to populate the 2025 budget data.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="excel" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="excel">Excel Upload</TabsTrigger>
                <TabsTrigger value="manual">Manual Input</TabsTrigger>
              </TabsList>
              <TabsContent value="excel" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Fuel Budget (2023)</label>
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setFuelFile(e.target.files?.[0] || null)}
                      disabled={isPopulating}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Material Budget (2023)</label>
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setMaterialFile(e.target.files?.[0] || null)}
                      disabled={isPopulating}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Repair Budget (2023)</label>
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setRepairFile(e.target.files?.[0] || null)}
                      disabled={isPopulating}
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      if (!fuelFile || !materialFile || !repairFile) {
                        toast.error('Please upload all three Excel files');
                        return;
                      }
                      const success = await handlePopulate(fuelFile, materialFile, repairFile);
                      if (success) {
                        queryClient.invalidateQueries({ queryKey: ['budget-versions'] });
                        queryClient.invalidateQueries({ queryKey: ['budgets'] });
                      }
                    }}
                    disabled={isPopulating || !fuelFile || !materialFile || !repairFile}
                    className="w-full"
                  >
                    {isPopulating ? 'Populating Budget...' : 'Populate Budget'}
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="manual" className="overflow-y-auto max-h-[60vh]">
                <ManualBudgetInput
                  versionId={versions?.[0]?.id || ""}
                  year={2025}
                  onComplete={() => {
                    setBudgetUploadOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['budget-versions'] });
                    queryClient.invalidateQueries({ queryKey: ['budgets'] });
                  }}
                />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        <Dialog open={comparisonOpen} onOpenChange={setComparisonOpen}>
          <DialogContent className="max-w-7xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>2024 Actuals vs 2025 Budget Comparison</DialogTitle>
              <DialogDescription>
                Compare actual values from 2024 with the 2025 budget targets. Green badges indicate budget above actuals, red indicates below actuals.
              </DialogDescription>
            </DialogHeader>
            {versions?.[0]?.id && (
              <ActualsBudgetComparison versionId={versions[0].id} />
            )}
          </DialogContent>
        </Dialog>
        </div>
      </DashboardLayout>

      <SmartBudgetSettings 
        open={smartSettingsOpen}
        onOpenChange={setSmartSettingsOpen}
        reportType={selectedReport}
      />
    </>
  );
};

export default BudgetManagement;
