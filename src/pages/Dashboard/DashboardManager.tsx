import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { useDashboards, useDeleteDashboard, useShareDashboard } from "@/hooks/useDashboards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Eye, Trash2, Share2, Copy, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

export default function DashboardManager() {
  const navigate = useNavigate();
  const { data: dashboards, isLoading } = useDashboards();
  const deleteDashboard = useDeleteDashboard();
  const shareDashboard = useShareDashboard();
  
  const [shareEmail, setShareEmail] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState<string>("");

  const myDashboards = dashboards?.filter(d => !d.is_template) || [];
  const templates = dashboards?.filter(d => d.is_template) || [];

  const handleCreateFromTemplate = (templateId: string) => {
    navigate(`/dashboard/new?template=${templateId}`);
  };

  const handleShare = async () => {
    if (!shareEmail || !selectedDashboard) return;
    
    await shareDashboard.mutateAsync({
      dashboardId: selectedDashboard,
      userEmail: shareEmail,
      canEdit,
    });
    
    setShareEmail("");
    setCanEdit(false);
    setSelectedDashboard("");
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
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Dashboards</h1>
            <p className="text-muted-foreground mt-1">Create and manage your custom dashboards</p>
          </div>
          <Button onClick={() => navigate("/dashboard/new")}>
            <Plus className="w-4 h-4 mr-2" />
            New Dashboard
          </Button>
        </div>

        {/* My Dashboards */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">My Dashboards</h2>
          {myDashboards.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No custom dashboards yet. Create one to get started!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myDashboards.map((dashboard) => (
                <Card key={dashboard.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{dashboard.name}</CardTitle>
                    {dashboard.description && (
                      <CardDescription>{dashboard.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/dashboard/${dashboard.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDashboard(dashboard.id)}
                          >
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Share Dashboard</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>User Email</Label>
                              <Input
                                type="email"
                                placeholder="user@example.com"
                                value={shareEmail}
                                onChange={(e) => setShareEmail(e.target.value)}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label>Allow Editing</Label>
                              <Switch
                                checked={canEdit}
                                onCheckedChange={setCanEdit}
                              />
                            </div>
                            <Button onClick={handleShare} className="w-full">
                              Share
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteDashboard.mutate(dashboard.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Templates */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Dashboard Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  {template.description && (
                    <CardDescription>{template.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dashboard/${template.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleCreateFromTemplate(template.id)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
