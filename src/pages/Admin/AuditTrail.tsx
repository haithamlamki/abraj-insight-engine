import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, Filter, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const TABLE_NAMES = [
  "revenue",
  "utilization",
  "billing_npt",
  "billing_npt_summary",
  "work_orders",
  "stock_levels",
  "customer_satisfaction",
  "rig_moves",
  "well_tracker",
  "fuel_consumption",
  "npt_root_cause",
];

const ACTIONS = ["INSERT", "UPDATE", "DELETE"];

export default function AuditTrail() {
  const [tableName, setTableName] = useState<string>();
  const [action, setAction] = useState<string>();
  const [userEmail, setUserEmail] = useState<string>();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const { data: logs, isLoading, refetch } = useAuditLogs({
    tableName,
    action,
    userEmail,
    startDate,
    endDate,
    limit: 200,
  });

  const handleReset = () => {
    setTableName(undefined);
    setAction(undefined);
    setUserEmail(undefined);
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleExport = () => {
    if (!logs) return;
    
    const csv = [
      ["Timestamp", "Table", "Action", "User", "Record ID", "Changed Fields"],
      ...logs.map(log => [
        format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
        log.table_name,
        log.action,
        log.user_email || "System",
        log.record_id,
        log.changed_fields?.join(", ") || "N/A",
      ]),
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-trail-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      INSERT: "default",
      UPDATE: "secondary",
      DELETE: "destructive",
    };
    return <Badge variant={variants[action] || "default"}>{action}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Audit Trail</h1>
            <p className="text-muted-foreground mt-2">
              Track all data changes across the system
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={!logs?.length}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
            <CardDescription>Filter audit logs by table, action, user, or date range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Table Name</Label>
                <Select value={tableName} onValueChange={setTableName}>
                  <SelectTrigger>
                    <SelectValue placeholder="All tables" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tables</SelectItem>
                    {TABLE_NAMES.map(name => (
                      <SelectItem key={name} value={name}>
                        {name.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Action</Label>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    {ACTIONS.map(act => (
                      <SelectItem key={act} value={act}>
                        {act}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>User Email</Label>
                <Input
                  placeholder="Search by email..."
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="ghost" onClick={handleReset}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>
              {logs?.length || 0} records found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading audit logs...</div>
            ) : !logs?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                No audit logs found matching your filters
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Record ID</TableHead>
                      <TableHead>Changed Fields</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(new Date(log.created_at), "MMM dd, yyyy HH:mm:ss")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.table_name.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell className="text-sm">{log.user_email || "System"}</TableCell>
                        <TableCell className="text-xs font-mono">{log.record_id.slice(0, 8)}...</TableCell>
                        <TableCell className="text-sm">
                          {log.changed_fields?.length ? (
                            <span className="text-muted-foreground">
                              {log.changed_fields.length} field{log.changed_fields.length > 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">View</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Audit Log Details</DialogTitle>
                                <DialogDescription>
                                  {log.action} on {log.table_name} at {format(new Date(log.created_at), "PPP HH:mm:ss")}
                                </DialogDescription>
                              </DialogHeader>
                              <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Changed Fields:</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {log.changed_fields?.map(field => (
                                        <Badge key={field} variant="outline">{field}</Badge>
                                      ))}
                                    </div>
                                  </div>

                                  {log.old_values && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Old Values:</h4>
                                      <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                                        {JSON.stringify(log.old_values, null, 2)}
                                      </pre>
                                    </div>
                                  )}

                                  {log.new_values && (
                                    <div>
                                      <h4 className="font-semibold mb-2">New Values:</h4>
                                      <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                                        {JSON.stringify(log.new_values, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
