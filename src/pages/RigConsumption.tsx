import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/Dashboard/KPICard";
import { Fuel, Package, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

const RigConsumption = () => {
  const subSections = [
    { title: "Fuel Consumption", description: "Monitor fuel usage patterns and efficiency", path: "/rig-consumption/fuel", icon: Fuel, value: "45,230 L", trend: "-3.2%" },
    { title: "Material Tracking", description: "Track material usage and inventory levels", path: "/rig-consumption/material", icon: Package, value: "$285K", trend: "+5.1%" },
    { title: "Repair & Maintenance", description: "Maintenance costs and schedule tracking", path: "/rig-consumption/maintenance", icon: Wrench, value: "$127K", trend: "+12.3%" }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Rig Consumption</h1>
          <p className="text-muted-foreground mt-2">Track and analyze resource consumption across all rig operations</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <KPICard title="Fuel Consumption" value="45,230 L" trend="up" trendValue="-3.2%" status="success" />
          <KPICard title="Material Cost" value="$285K" trend="down" trendValue="+5.1%" status="warning" />
          <KPICard title="Maintenance Cost" value="$127K" trend="down" trendValue="+12.3%" status="warning" />
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Consumption Reports</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                      <span className={`text-sm font-medium ${section.trend.startsWith('-') ? 'text-success' : 'text-destructive'}`}>{section.trend}</span>
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

export default RigConsumption;
