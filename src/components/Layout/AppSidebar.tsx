import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Fuel,
  TrendingUp,
  Activity,
  ChevronDown,
  DollarSign,
  Calendar,
  Receipt,
  Droplet,
  Package,
  Wrench,
  MapPin,
  Target,
  Users,
  Box,
  ClipboardList,
  Radio,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
  },
  {
    title: "Rig Financials",
    icon: DollarSign,
    items: [
      { title: "Overview", url: "/rig-financials", icon: TrendingUp },
      { title: "Utilization", url: "/rig-financials/utilization", icon: Activity },
      { title: "YTD Summary", url: "/rig-financials/ytd", icon: Calendar },
      { title: "Billing & NPT", url: "/rig-financials/billing-npt", icon: Receipt },
      { title: "Revenue", url: "/rig-financials/revenue", icon: DollarSign },
    ],
  },
  {
    title: "Rig Consumption",
    icon: Fuel,
    items: [
      { title: "Overview", url: "/rig-consumption", icon: BarChart3 },
      { title: "Fuel", url: "/rig-consumption/fuel", icon: Droplet },
      { title: "Material", url: "/rig-consumption/material", icon: Package },
      { title: "Maintenance", url: "/rig-consumption/maintenance", icon: Wrench },
    ],
  },
  {
    title: "Rig Performance",
    icon: TrendingUp,
    items: [
      { title: "Overview", url: "/rig-performance", icon: Activity },
      { title: "Rig Moves", url: "/rig-performance/rig-moves", icon: MapPin },
      { title: "Well Tracker", url: "/rig-performance/well-tracker", icon: Target },
    ],
  },
  {
    title: "Rig Status",
    icon: Activity,
    items: [
      { title: "Overview", url: "/rig-status", icon: BarChart3 },
      { title: "Customer Satisfaction", url: "/rig-status/customer-satisfaction", icon: Users },
      { title: "Stock Level", url: "/rig-status/stock", icon: Box },
      { title: "Work Orders", url: "/rig-status/work-orders", icon: ClipboardList },
      { title: "DR Line", url: "/rig-status/dr-line", icon: Radio },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const hasActiveChild = (items: any[]) => items?.some((item) => isActive(item.url));
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {menuItems.map((item) => (
          <SidebarGroup key={item.title}>
            {!item.items ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive(item.url!)}>
                    <NavLink to={item.url!} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            ) : (
              <Collapsible defaultOpen={hasActiveChild(item.items)} className="group/collapsible">
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    )}
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={isActive(subItem.url)}>
                            <NavLink to={subItem.url} className="flex items-center gap-2">
                              <subItem.icon className="h-4 w-4" />
                              {!isCollapsed && <span>{subItem.title}</span>}
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            )}
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
