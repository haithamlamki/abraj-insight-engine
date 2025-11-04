import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/Dashboard/KPICard";
import { TrendingUp, DollarSign, Clock, Percent } from "lucide-react";
import { Link } from "react-router-dom";

const RigFinancials = () => {
  const subSections = [
    {
      title: "Rig Utilization",
      description: "Track rig utilization rates and efficiency metrics",
      path: "/rig-financials/utilization",
      icon: Percent,
      value: "87.5%",
      trend: "+2.3%"
    },
    {
      title: "Billing NPT Summary",
      description: "Interactive NPT & operational analysis with AI insights",
      path: "/rig-financials/billing-npt-summary",
      icon: TrendingUp,
      value: "0 hrs",
      trend: "0%"
    },
    {
      title: "Billing NPT",
      description: "Non-productive time billing analysis",
      path: "/rig-financials/billing-npt",
      icon: Clock,
      value: "344 hrs",
      trend: "+25.4%"
    },
    {
      title: "Revenue",
      description: "Detailed revenue breakdown and analysis",
      path: "/rig-financials/revenue",
      icon: DollarSign,
      value: "$1.85M",
      trend: "+8.7%"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Rig Financials</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive financial reporting and analysis for rig operations
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Total Revenue" value="$1.85M" trend="up" trendValue="+8.7%" status="success" />
          <KPICard title="Utilization Rate" value="87.5%" trend="up" trendValue="+2.3%" status="success" />
          <KPICard title="NPT Hours" value="0 hrs" trend="neutral" trendValue="0%" status="neutral" />
          <KPICard title="Billing NPT" value="344 hrs" trend="down" trendValue="+25.4%" status="warning" />
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Financial Reports</h2>
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
                      <span className={`text-sm font-medium ${section.trend.startsWith('+') ? 'text-success' : 'text-destructive'}`}>
                        {section.trend}
                      </span>
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

export default RigFinancials;
