import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RigPerformance } from "@/hooks/useUtilizationAnalytics";
import { useState, useMemo } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RigPerformanceTableProps {
  data: RigPerformance[];
  onRigClick?: (rig: string) => void;
}

type SortKey = keyof RigPerformance;
type SortOrder = 'asc' | 'desc';

export const RigPerformanceTable = ({ data, onRigClick }: RigPerformanceTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('avgUtilization');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    if (searchTerm) {
      filtered = data.filter(
        (rig) =>
          rig.rig.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rig.client?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue || '');
      const bStr = String(bValue || '');
      return sortOrder === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [data, searchTerm, sortKey, sortOrder]);

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-green-600 bg-green-50';
    if (utilization >= 70) return 'text-blue-600 bg-blue-50';
    if (utilization >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Rig Performance</CardTitle>
            <CardDescription>Individual rig utilization metrics</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rig or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('rig')}
                    className="flex items-center gap-1"
                  >
                    Rig ID
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Client</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('avgUtilization')}
                    className="flex items-center gap-1"
                  >
                    Avg Utilization
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('workingDays')}
                    className="flex items-center gap-1"
                  >
                    Working Days
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedData.map((rig) => (
                  <TableRow
                    key={rig.rig}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onRigClick?.(rig.rig)}
                  >
                    <TableCell className="font-medium">{rig.rig}</TableCell>
                    <TableCell>{rig.client || '-'}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-block px-2 py-1 rounded-md font-semibold ${getUtilizationColor(
                          rig.avgUtilization
                        )}`}
                      >
                        {rig.avgUtilization}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={rig.status === 'Active' ? 'default' : 'secondary'}
                        className={
                          rig.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'
                        }
                      >
                        <span
                          className={`inline-block h-2 w-2 rounded-full mr-1 ${
                            rig.status === 'Active' ? 'bg-white' : 'bg-gray-600'
                          }`}
                        />
                        {rig.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{rig.workingDays}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {rig.lastMonth} {rig.lastYear}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
