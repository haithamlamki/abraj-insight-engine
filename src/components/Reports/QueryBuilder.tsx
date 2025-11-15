import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wand2 } from "lucide-react";

interface QueryBuilderProps {
  onGenerateQuery: (query: string) => void;
  reportType: string;
}

export const QueryBuilder = ({ onGenerateQuery, reportType }: QueryBuilderProps) => {
  const [timePeriod, setTimePeriod] = useState("");
  const [performance, setPerformance] = useState("");
  const [comparison, setComparison] = useState(">");
  const [value, setValue] = useState("");

  const generateQuery = () => {
    const parts: string[] = [];
    
    if (timePeriod) parts.push(timePeriod);
    if (performance) parts.push(performance);
    if (comparison && value) {
      parts.push(`where value ${comparison} ${value}`);
    }

    const query = parts.join(" ");
    onGenerateQuery(query);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Wand2 className="h-4 w-4" />
          Query Builder Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Time Period</Label>
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger>
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last month">Last month</SelectItem>
              <SelectItem value="last quarter">Last quarter</SelectItem>
              <SelectItem value="this year">This year</SelectItem>
              <SelectItem value="last 6 months">Last 6 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Performance Level</Label>
          <Select value={performance} onValueChange={setPerformance}>
            <SelectTrigger>
              <SelectValue placeholder="Select performance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high performers">High performers</SelectItem>
              <SelectItem value="low utilization">Low utilization</SelectItem>
              <SelectItem value="above average">Above average</SelectItem>
              <SelectItem value="below target">Below target</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label>Operator</Label>
            <Select value={comparison} onValueChange={setComparison}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=">">Greater than</SelectItem>
                <SelectItem value="<">Less than</SelectItem>
                <SelectItem value="=">Equal to</SelectItem>
                <SelectItem value=">=">Greater or equal</SelectItem>
                <SelectItem value="<=">Less or equal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Value</Label>
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter value"
            />
          </div>
        </div>

        <Button onClick={generateQuery} className="w-full">
          Generate Query
        </Button>
      </CardContent>
    </Card>
  );
};
