import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { useDashboard, useSaveDashboard, DashboardWidget as WidgetConfig } from "@/hooks/useDashboards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WidgetLibrary } from "@/components/Dashboard/WidgetLibrary";
import { DashboardWidget } from "@/components/Dashboard/DashboardWidget";
import { Save, Plus, Settings, Loader2 } from "lucide-react";
import { toast } from "sonner";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

export default function CustomDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: dashboard, isLoading } = useDashboard(id);
  const saveDashboard = useSaveDashboard();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [layout, setLayout] = useState<WidgetConfig[]>([]);
  const [isEditing, setIsEditing] = useState(!id);

  useEffect(() => {
    if (dashboard) {
      setName(dashboard.name);
      setDescription(dashboard.description || "");
      setLayout(dashboard.layout || []);
    }
  }, [dashboard]);

  const handleSave = async () => {
    await saveDashboard.mutateAsync({
      id,
      name,
      description,
      layout,
      is_public: false,
    });
    setIsEditing(false);
  };

  const handleLayoutChange = (newLayout: any[]) => {
    const updatedWidgets = layout.map((widget) => {
      const layoutItem = newLayout.find((item) => item.i === widget.i);
      if (layoutItem) {
        return {
          ...widget,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h,
        };
      }
      return widget;
    });
    setLayout(updatedWidgets);
  };

  const handleAddWidget = (widget: Partial<WidgetConfig>) => {
    const newWidget: WidgetConfig = {
      i: widget.i || `widget-${Date.now()}`,
      x: widget.x || 0,
      y: widget.y || 0,
      w: widget.w || 3,
      h: widget.h || 2,
      widgetType: widget.widgetType || "kpi",
      config: widget.config || {},
    };
    setLayout([...layout, newWidget]);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2 max-w-2xl">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dashboard Name"
                  className="text-2xl font-bold"
                />
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Dashboard Description"
                  className="text-sm"
                />
              </div>
            ) : (
              <div>
                <h1 className="text-3xl font-bold">{name}</h1>
                {description && <p className="text-muted-foreground mt-1">{description}</p>}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            {isEditing && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Widget
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Widget</DialogTitle>
                  </DialogHeader>
                  <WidgetLibrary onAddWidget={handleAddWidget} />
                </DialogContent>
              </Dialog>
            )}
            
            <Button
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              disabled={saveDashboard.isPending}
            >
              {saveDashboard.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : isEditing ? (
                <Save className="w-4 h-4 mr-2" />
              ) : (
                <Settings className="w-4 h-4 mr-2" />
              )}
              {isEditing ? "Save" : "Edit"}
            </Button>
          </div>
        </div>

        {/* Dashboard Grid */}
        {layout.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No widgets yet. Add some to get started!</p>
            {isEditing && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Widget
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Widget</DialogTitle>
                  </DialogHeader>
                  <WidgetLibrary onAddWidget={handleAddWidget} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        ) : (
          <GridLayout
            className="layout"
            layout={layout}
            cols={12}
            rowHeight={100}
            width={1200}
            isDraggable={isEditing}
            isResizable={isEditing}
            onLayoutChange={handleLayoutChange}
          >
            {layout.map((widget) => (
              <div key={widget.i} className="bg-background">
                <DashboardWidget widget={widget} />
              </div>
            ))}
          </GridLayout>
        )}
      </div>
    </DashboardLayout>
  );
}
