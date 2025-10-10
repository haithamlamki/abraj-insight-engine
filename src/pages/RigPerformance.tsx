import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/Dashboard/KPICard";
import { Truck, Target } from "lucide-react";
import { Link } from "react-router-dom";

const RigPerformance = () => {
  const subSections = [
    { title: "Rig Moves", description: "Track rig relocations, distances, and costs", path: "/rig-performance/rig-moves", icon: Truck, value: "20 moves", trend: "+15%" },
    { title: "Well Tracker", description: "Monitor well drilling progress and metrics", path: "/rig-performance/well-tracker", icon: Target, value: "14 wells", trend: "+8%" }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Rig Performance</h1>
          <p className="text-muted-foreground mt-2">Monitor operational performance and efficiency metrics</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          <KPICard title="Rig Moves" value="20 moves" trend="up" trendValue="+15%" status="success" />
          <KPICard title="Wells Completed" value="14 wells" trend="up" trendValue="+8%" status="success" />
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Performance Reports</h2>
          <div className="grid gap-6 md:grid-cols-2">
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
                      <span className="text-sm font-medium text-success">{section.trend}</span>
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

export default RigPerformance;
