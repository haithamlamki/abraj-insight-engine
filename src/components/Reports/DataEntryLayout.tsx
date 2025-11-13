import { ReactNode } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface DataEntryLayoutProps {
  title: string;
  description: string;
  breadcrumbs: { label: string; href?: string }[];
  viewContent: ReactNode;
  entryContent: ReactNode;
  uploadContent: ReactNode;
  pasteContent?: ReactNode;
}

export const DataEntryLayout = ({
  title,
  description,
  breadcrumbs,
  viewContent,
  entryContent,
  uploadContent,
  pasteContent
}: DataEntryLayoutProps) => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="contents">
                <BreadcrumbItem>
                  {crumb.href ? (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-4xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-2">{description}</p>
        </div>

        <Tabs defaultValue="view" className="w-full">
          <TabsList className={cn("grid w-full max-w-2xl", pasteContent ? "grid-cols-4" : "grid-cols-3")}>
            <TabsTrigger value="view">View Report</TabsTrigger>
            <TabsTrigger value="entry">Manual Entry</TabsTrigger>
            <TabsTrigger value="upload">Upload Excel</TabsTrigger>
            {pasteContent && <TabsTrigger value="paste">Copy/Paste</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="view" className="space-y-6 mt-6">
            {viewContent}
          </TabsContent>
          
          <TabsContent value="entry" className="space-y-6 mt-6">
            {entryContent}
          </TabsContent>
          
          <TabsContent value="upload" className="space-y-6 mt-6">
            {uploadContent}
          </TabsContent>
          
          {pasteContent && (
            <TabsContent value="paste" className="space-y-6 mt-6">
              {pasteContent}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};
