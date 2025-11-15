import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBudgetAlerts } from "@/hooks/useBudgetAlerts";
import { 
  Bell, 
  Mail, 
  Plus, 
  Trash2, 
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetAlertsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BudgetAlertsPanel({ open, onOpenChange }: BudgetAlertsPanelProps) {
  const { alerts, createAlert, updateAlert, deleteAlert, triggerCheck, isTriggering } = useBudgetAlerts();
  const [isCreating, setIsCreating] = useState(false);
  const [newAlert, setNewAlert] = useState({
    report_type: "revenue",
    threshold_percentage: 10,
    alert_type: "both" as "email" | "in_app" | "both",
    is_active: true,
  });

  const handleCreate = () => {
    createAlert(newAlert);
    setIsCreating(false);
    setNewAlert({
      report_type: "revenue",
      threshold_percentage: 10,
      alert_type: "both",
      is_active: true,
    });
  };

  const handleToggle = (alert: any) => {
    const { id, report_type, threshold_percentage, alert_type, is_active } = alert;
    updateAlert({ 
      id, 
      report_type, 
      threshold_percentage, 
      alert_type, 
      is_active: !is_active 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            <DialogTitle>Budget Variance Alerts</DialogTitle>
          </div>
          <DialogDescription>
            Get notified when actual values exceed budget thresholds
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Active Alerts</p>
              <p className="text-sm text-muted-foreground">
                {alerts.filter(a => a.is_active).length} of {alerts.length} alerts enabled
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => triggerCheck()}
                disabled={isTriggering}
                variant="outline"
                size="sm"
              >
                {isTriggering ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Check Now
              </Button>
              <Button onClick={() => setIsCreating(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Alert
              </Button>
            </div>
          </div>

          {isCreating && (
            <Card className="p-4 border-primary/50">
              <div className="space-y-4">
                <h4 className="font-semibold">Create New Alert</h4>
                
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select
                    value={newAlert.report_type}
                    onValueChange={(value) => setNewAlert({ ...newAlert, report_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="utilization">Utilization</SelectItem>
                      <SelectItem value="billing_npt">Billing NPT</SelectItem>
                      <SelectItem value="fuel">Fuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Threshold (%)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[newAlert.threshold_percentage]}
                      onValueChange={([value]) => setNewAlert({ ...newAlert, threshold_percentage: value })}
                      max={50}
                      min={1}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12">{newAlert.threshold_percentage}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Alert when variance exceeds this percentage
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Alert Method</Label>
                  <Select
                    value={newAlert.alert_type}
                    onValueChange={(value: any) => setNewAlert({ ...newAlert, alert_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email Only</SelectItem>
                      <SelectItem value="in_app">In-App Only</SelectItem>
                      <SelectItem value="both">Email & In-App</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate}>
                    Create Alert
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <Card className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No alerts configured yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first alert to get notified about budget variances
                </p>
              </Card>
            ) : (
              alerts.map((alert) => (
                <Card key={alert.id} className={cn(
                  "p-4 transition-colors",
                  !alert.is_active && "opacity-60"
                )}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold capitalize">
                          {alert.report_type.replace('_', ' ')} Alert
                        </h4>
                        <Badge variant={alert.is_active ? "default" : "secondary"}>
                          {alert.is_active ? "Active" : "Disabled"}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {alert.alert_type === "email" && <Mail className="h-3 w-3" />}
                          {alert.alert_type === "in_app" && <Bell className="h-3 w-3" />}
                          {alert.alert_type === "both" && (
                            <>
                              <Mail className="h-3 w-3" />
                              <Bell className="h-3 w-3" />
                            </>
                          )}
                          {alert.alert_type === "both" ? "Email & In-App" : 
                           alert.alert_type === "email" ? "Email" : "In-App"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Alert when variance exceeds <strong>{alert.threshold_percentage}%</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alert.is_active}
                        onCheckedChange={() => handleToggle(alert)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAlert(alert.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
