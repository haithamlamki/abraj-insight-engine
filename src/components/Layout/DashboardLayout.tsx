import { ReactNode } from "react";
import { LayoutDashboard, TrendingUp, Activity, BarChart3, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigation = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/" },
    { name: "Rig Financials", icon: TrendingUp, href: "/rig-financials" },
    { name: "Rig Consumption", icon: Activity, href: "/rig-consumption" },
    { name: "Rig Performance", icon: BarChart3, href: "/rig-performance" },
    { name: "Rig Status", icon: Settings, href: "/rig-status" },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-2xl font-bold text-sidebar-foreground">Abraj MIS</h1>
          <p className="text-sm text-sidebar-foreground/70 mt-1">Reporting Dashboard</p>
        </div>
        
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {navigation.map((item) => (
              <a key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Button>
              </a>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3 px-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-semibold">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">Admin User</p>
              <p className="text-xs text-sidebar-foreground/70 truncate">admin@abraj.com</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="border-b border-border bg-card px-8 py-4">
          <h2 className="text-2xl font-semibold text-foreground">Operations Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Real-time operational metrics and KPIs</p>
        </div>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
