import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit3, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BulkEditQuickAccessProps {
  reportType?: string;
}

export const BulkEditQuickAccess = ({ reportType }: BulkEditQuickAccessProps) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate('/admin/bulk-data-editor');
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Bulk Edit Records</CardTitle>
          </div>
          <Button onClick={handleNavigate} variant="outline" size="sm">
            Open Bulk Editor
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Need to update multiple records at once? Use the bulk editor to:
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Change client names for all records of a specific rig
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Update year or month for multiple records
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Apply find-and-replace operations across filtered records
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Add or subtract values from numeric fields
          </li>
        </ul>
      </CardContent>
    </Card>
  );
};
