import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 items-center gap-2 border-b px-4 sticky top-0 bg-background z-10">
            <SidebarTrigger className="-ml-1" />
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold">ADC Rig Management Dashboard</h1>
              <p className="text-sm text-muted-foreground">Real-time operational metrics and KPIs</p>
            </div>
          </header>
          <main className="flex-1 container mx-auto py-6 px-4">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
