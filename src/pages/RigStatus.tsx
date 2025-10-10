import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/Dashboard/KPICard";
import { SmilePlus, Package2, ClipboardList, Activity } from "lucide-react";
import { Link } from "react-router-dom";

const RigStatus = () => {
  const subSections = [
    { title: "Customer Satisfaction", description: "Track client feedback and satisfaction scores", path: "/rig-status/customer-satisfaction", icon: SmilePlus, value: "4.7/5.0", trend: "+0.3" },
    { title: "Stock Levels", description: "Monitor inventory and stock management", path: "/rig-status/stock", icon: Package2, value: "92%", trend: "+5%" },
    { title: "Work Orders", description: "Manage and track work order status", path: "/rig-status/work-orders", icon: ClipboardList, value: "38 active", trend: "+12" },
    { title: "DR Line Status", description: "Daily rig line operational status", path: "/rig-status/dr-line", icon: Activity, value: "23/25", trend: "operational" }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Rig Status</h1>
          <p className="text-muted-foreground mt-2">Real-time status monitoring and operational insights</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Customer Satisfaction" value="4.7/5.0" trend="up" trendValue="+6%" status="success" />
          <KPICard title="Stock Level" value="92%" trend="up" trendValue="+5%" status="success" />
          <KPICard title="Active WOs" value="38" trend="up" trendValue="+31.6%" status="neutral" />
          <KPICard title="Operational Rigs" value="23/25" trend="neutral" status="success" />
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Status Reports</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {subSections.map((section) => (
              <Link key={section.path} to={section.path}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <section.icon className="h-5 w-5 text-primary" />
                      {section.title}
                    </CardTitle>
                    <CardDescription className="mt-2">{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-foreground">{section.value}</span>
                      {section.trend !== "operational" && (
                        <span className={`text-sm font-medium ${section.trend.startsWith('+') ? 'text-success' : 'text-destructive'}`}>{section.trend}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RigStatus;
