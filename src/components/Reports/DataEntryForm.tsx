import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSaveReportData } from "@/hooks/useReportData";

interface FormField {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

interface DataEntryFormProps {
  title: string;
  fields: FormField[];
  frequency: "daily" | "monthly";
  reportType?: string;
  onSubmit?: (data: Record<string, any>) => void;
}

export const DataEntryForm = ({ title, fields, frequency, reportType, onSubmit }: DataEntryFormProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [selectedFrequency, setSelectedFrequency] = useState<"daily" | "monthly">(frequency);
  const saveData = useSaveReportData(reportType || 'default');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const missingFields = fields
      .filter(f => f.required)
      .filter(f => !formData[f.name]);
    
    if (missingFields.length > 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Convert dates to strings if needed
      const processedData = { ...formData };
      Object.keys(processedData).forEach(key => {
        if (processedData[key] instanceof Date) {
          processedData[key] = format(processedData[key], 'yyyy-MM-dd');
        }
      });

      await saveData.mutateAsync(processedData);
      setFormData({});
      if (onSubmit) {
        onSubmit(processedData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Enter data manually for {selectedFrequency} reporting</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="frequency">Report Frequency</Label>
              <Select value={selectedFrequency} onValueChange={(v) => setSelectedFrequency(v as "daily" | "monthly")}>
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </Label>
                
                {field.type === "text" && (
                  <Input
                    id={field.name}
                    type="text"
                    placeholder={field.placeholder}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  />
                )}

                {field.type === "number" && (
                  <Input
                    id={field.name}
                    type="number"
                    placeholder={field.placeholder}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  />
                )}

                {field.type === "date" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData[field.name] && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData[field.name] ? format(formData[field.name], "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData[field.name]}
                        onSelect={(date) => handleFieldChange(field.name, date)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                )}

                {field.type === "select" && field.options && (
                  <Select value={formData[field.name]} onValueChange={(v) => handleFieldChange(field.name, v)}>
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex items-center gap-2" disabled={saveData.isPending}>
              <Save className="h-4 w-4" />
              {saveData.isPending ? 'Saving...' : 'Save Data'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setFormData({})}>
              Clear Form
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
