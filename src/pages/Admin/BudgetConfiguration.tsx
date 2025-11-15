import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SmartBudgetSettings } from "@/components/Budget/SmartBudgetSettings";
import { BudgetAlertsPanel } from "@/components/Budget/BudgetAlertsPanel";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  Bell, 
  FileText, 
  Download, 
  Upload,
  Info
} from "lucide-react";
import { generateBudgetTemplate } from "@/lib/budgetExcel";
import { toast } from "sonner";

const BudgetConfiguration = () => {
  const [alertsPanelOpen, setAlertsPanelOpen] = useState(false);
  const [smartSettingsOpen, setSmartSettingsOpen] = useState(false);

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

  const { data: metrics } = useQuery({
    queryKey: ['dim-metric'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dim_metric')
        .select('*')
        .eq('active', true);
      if (error) throw error;
      return data;
    },
  });

  const handleDownloadTemplate = async (reportType: string) => {
    try {
      if (!rigs || !metrics) {
        toast.error('Loading data, please try again');
        return;
      }
      
      const reportMetrics = metrics.filter(m => 
        m.metric_key.toLowerCase().includes(reportType.toLowerCase())
      );
      
      generateBudgetTemplate(rigs, reportMetrics.length > 0 ? reportMetrics : metrics, new Date().getFullYear());
      toast.success(`${reportType} budget template downloaded`);
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Budget Configuration</h1>
            <p className="text-muted-foreground">
              Configure budget settings, alerts, and templates for your organization
            </p>
          </div>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Smart Budget Settings
                </CardTitle>
                <CardDescription>
                  Configure automatic budget calculations and variance thresholds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setSmartSettingsOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Configuration Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Variance Threshold</h4>
                  <p className="text-sm text-muted-foreground">
                    Set the percentage threshold that triggers budget variance warnings. 
                    Lower thresholds provide earlier warnings but may generate more notifications.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Budget Growth</h4>
                  <p className="text-sm text-muted-foreground">
                    Annual budget growth percentage used for automatic budget calculations 
                    based on historical trends and projections.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Auto-Approve</h4>
                  <p className="text-sm text-muted-foreground">
                    When enabled, budget updates within variance thresholds are automatically 
                    approved without manual review.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Budget Variance Alerts
                </CardTitle>
                <CardDescription>
                  Manage alerts for budget variances across different report types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Configure automated alerts to notify you when actual values exceed budget 
                    thresholds. Alerts can be sent via email or displayed in-app.
                  </p>
                  <Button onClick={() => setAlertsPanelOpen(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Alerts
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Alert Configuration Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Report Types</h4>
                  <p className="text-sm text-muted-foreground">
                    Choose which report types trigger alerts: Revenue, Utilization, Billing NPT, or Fuel consumption.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Threshold Percentage</h4>
                  <p className="text-sm text-muted-foreground">
                    Set how much variance from budget triggers an alert. Lower percentages 
                    provide earlier warnings but may create more notifications.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Alert Methods</h4>
                  <p className="text-sm text-muted-foreground">
                    Choose to receive alerts via email, in-app notifications, or both. 
                    Email alerts require a verified email address.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Budget Templates
                </CardTitle>
                <CardDescription>
                  Download Excel templates for budget data entry and import
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Revenue Budget</CardTitle>
                      <CardDescription>
                        Template for revenue and day rate budgets
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleDownloadTemplate('revenue')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Utilization Budget</CardTitle>
                      <CardDescription>
                        Template for utilization and operating days budgets
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleDownloadTemplate('utilization')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Billing NPT Budget</CardTitle>
                      <CardDescription>
                        Template for non-productive time budgets
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleDownloadTemplate('billing_npt')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Fuel Budget</CardTitle>
                      <CardDescription>
                        Template for fuel consumption budgets
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleDownloadTemplate('fuel')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Template Usage Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    1. Download Template
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Download the appropriate Excel template for your report type. 
                    Each template includes the correct column headers and format.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    2. Fill in Budget Data
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Enter your budget values in the template. Include rig codes, 
                    months, years, and metric values as specified in the headers.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    3. Import to System
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Upload your completed template in Budget Management. The system 
                    will validate and import your budget data automatically.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BudgetAlertsPanel 
        open={alertsPanelOpen} 
        onOpenChange={setAlertsPanelOpen} 
      />
      
      <SmartBudgetSettings 
        open={smartSettingsOpen} 
        onOpenChange={setSmartSettingsOpen} 
      />
    </DashboardLayout>
  );
};

export default BudgetConfiguration;
