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
  LogOut,
  User,
  Settings,
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
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  const { user, isAdmin, signOut } = useAuth();

  const isActive = (path: string) => currentPath === path;
  const hasActiveChild = (items: any[]) => items?.some((item) => isActive(item.url));
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    await signOut();
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

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

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-medium truncate">{user?.email}</span>
                      <span className="text-xs text-muted-foreground">
                        {isAdmin ? 'Admin' : 'Viewer'}
                      </span>
                    </div>
                  )}
                  <ChevronDown className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Admin Settings</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
