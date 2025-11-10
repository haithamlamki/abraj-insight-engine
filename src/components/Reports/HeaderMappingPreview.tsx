import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { normalizeHeader } from "@/lib/excelParser";

interface HeaderMappingPreviewProps {
  detectedHeaders: string[];
  reportType: string;
  onMappingConfirmed: (mapping: { [key: string]: string }) => void;
  onCancel: () => void;
}

// Define expected fields for each report type
const reportTypeFields: { [key: string]: { field: string; required: boolean; label: string }[] } = {
  revenue: [
    { field: 'year', required: true, label: 'Year' },
    { field: 'month', required: true, label: 'Month' },
    { field: 'rig', required: true, label: 'Rig' },
    { field: 'actual', required: false, label: 'Actual' },
    { field: 'fuel', required: false, label: 'Fuel' },
    { field: 'total_revenue', required: false, label: 'Total Revenue' },
    { field: 'budgeted_revenue', required: false, label: 'Budgeted Revenue' },
    { field: 'diff', required: false, label: 'Diff' },
    { field: 'npt_repair', required: false, label: 'NPT Repair' },
    { field: 'npt_zero', required: false, label: 'NPT Zero' },
    { field: 'comments', required: false, label: 'Comments' },
  ],
  billing_npt: [
    { field: 'rig', required: true, label: 'Rig' },
    { field: 'date', required: true, label: 'Date' },
    { field: 'hours', required: true, label: 'Hours' },
    { field: 'system', required: false, label: 'System' },
    { field: 'equipment_failure', required: false, label: 'Equipment Failure' },
    { field: 'root_cause', required: false, label: 'Root Cause' },
    { field: 'corrective_action', required: false, label: 'Corrective Action' },
    { field: 'notification_number', required: false, label: 'Notification Number' },
    { field: 'billable', required: false, label: 'Billable' },
    { field: 'comments', required: false, label: 'Comments' },
  ],
  npt_root_cause: [
    { field: 'rig_number', required: true, label: 'Rig Number' },
    { field: 'month', required: true, label: 'Month' },
    { field: 'year', required: true, label: 'Year' },
    { field: 'npt_type', required: false, label: 'NPT Type' },
    { field: 'system', required: false, label: 'System' },
    { field: 'root_cause', required: false, label: 'Root Cause' },
    { field: 'hours', required: false, label: 'Hours' },
  ],
  utilization: [
    { field: 'year', required: true, label: 'Year' },
    { field: 'month', required: true, label: 'Month' },
    { field: 'rig', required: true, label: 'Rig' },
    { field: 'utilization_percentage', required: false, label: 'Utilization %' },
    { field: 'allowable_npt', required: false, label: 'Allowable NPT' },
    { field: 'npt_type', required: false, label: 'NPT Type' },
    { field: 'total_working_days', required: false, label: 'Total Working Days' },
    { field: 'monthly_total_days', required: false, label: 'Monthly Total Days' },
    { field: 'comments', required: false, label: 'Comments' },
  ],
  fuel: [
    { field: 'rig', required: true, label: 'Rig' },
    { field: 'date', required: true, label: 'Date' },
    { field: 'fuel_consumed', required: false, label: 'Fuel Consumed' },
    { field: 'fuel_type', required: false, label: 'Fuel Type' },
    { field: 'unit_price', required: false, label: 'Unit Price' },
    { field: 'total_cost', required: true, label: 'Total Cost' },
    { field: 'supplier', required: false, label: 'Supplier' },
    { field: 'remarks', required: false, label: 'Remarks' },
  ],
  work_orders: [
    { field: 'rig', required: true, label: 'Rig' },
    { field: 'month', required: true, label: 'Month' },
    { field: 'year', required: true, label: 'Year' },
    { field: 'elec_open', required: false, label: 'ELEC Open' },
    { field: 'elec_closed', required: false, label: 'ELEC Closed' },
    { field: 'mech_open', required: false, label: 'MECH Open' },
    { field: 'mech_closed', required: false, label: 'MECH Closed' },
    { field: 'oper_open', required: false, label: 'OPER Open' },
    { field: 'oper_closed', required: false, label: 'OPER Closed' },
    { field: 'compliance_rate', required: false, label: 'Compliance Rate' },
  ],
};

const STORAGE_KEY_PREFIX = 'header_mapping_';

export const HeaderMappingPreview = ({
  detectedHeaders,
  reportType,
  onMappingConfirmed,
  onCancel,
}: HeaderMappingPreviewProps) => {
  const expectedFields = reportTypeFields[reportType] || [];
  
  // Initialize mapping state with auto-detected mappings
  const [mapping, setMapping] = useState<{ [key: string]: string }>(() => {
    // Try to load saved mapping from localStorage
    const savedMapping = localStorage.getItem(`${STORAGE_KEY_PREFIX}${reportType}`);
    if (savedMapping) {
      try {
        const parsed = JSON.parse(savedMapping);
        // Validate that saved headers still exist in detected headers
        const validMapping: { [key: string]: string } = {};
        Object.entries(parsed).forEach(([dbField, excelHeader]) => {
          if (detectedHeaders.includes(excelHeader as string)) {
            validMapping[dbField] = excelHeader as string;
          }
        });
        if (Object.keys(validMapping).length > 0) {
          return validMapping;
        }
      } catch (e) {
        console.warn('Failed to parse saved mapping:', e);
      }
    }

    // Auto-detect mappings
    const autoMapping: { [key: string]: string } = {};
    expectedFields.forEach(({ field }) => {
      const normalizedField = normalizeHeader(field);
      
      // Find best match in detected headers
      const match = detectedHeaders.find(header => {
        const normalizedHeader = normalizeHeader(header);
        return normalizedHeader === normalizedField || 
               normalizedHeader.includes(normalizedField) ||
               normalizedField.includes(normalizedHeader);
      });
      
      if (match) {
        autoMapping[field] = match;
      }
    });
    
    return autoMapping;
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Validate mapping
  useEffect(() => {
    const errors: string[] = [];
    expectedFields.forEach(({ field, required, label }) => {
      if (required && !mapping[field]) {
        errors.push(`Required field "${label}" is not mapped`);
      }
    });
    setValidationErrors(errors);
  }, [mapping, expectedFields]);

  const handleMappingChange = (dbField: string, excelHeader: string) => {
    setMapping(prev => ({
      ...prev,
      [dbField]: excelHeader,
    }));
  };

  const handleResetMapping = () => {
    // Clear saved mapping and auto-detect again
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${reportType}`);
    
    const autoMapping: { [key: string]: string } = {};
    expectedFields.forEach(({ field }) => {
      const normalizedField = normalizeHeader(field);
      
      const match = detectedHeaders.find(header => {
        const normalizedHeader = normalizeHeader(header);
        return normalizedHeader === normalizedField || 
               normalizedHeader.includes(normalizedField) ||
               normalizedField.includes(normalizedHeader);
      });
      
      if (match) {
        autoMapping[field] = match;
      }
    });
    
    setMapping(autoMapping);
  };

  const handleConfirm = () => {
    if (validationErrors.length === 0) {
      // Save mapping to localStorage
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${reportType}`, JSON.stringify(mapping));
      onMappingConfirmed(mapping);
    }
  };

  const mappedCount = Object.values(mapping).filter(Boolean).length;
  const requiredFields = expectedFields.filter(f => f.required);
  const mappedRequiredCount = requiredFields.filter(f => mapping[f.field]).length;

  return (
    <Card className="border-2 border-primary/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Map Excel Headers to Database Fields</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetMapping}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
        </CardTitle>
        <CardDescription>
          We detected {detectedHeaders.length} columns. Map them to the correct database fields below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mapping progress */}
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                {mappedRequiredCount} of {requiredFields.length} required fields mapped
              </span>
              <span className="text-xs text-muted-foreground">
                ({mappedCount} total fields)
              </span>
            </div>
          </AlertDescription>
        </Alert>

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-1">Missing Required Mappings:</div>
              <ul className="list-disc list-inside text-sm space-y-1">
                {validationErrors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Mapping table */}
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {expectedFields.map(({ field, required, label }) => (
            <div key={field} className="grid grid-cols-2 gap-4 items-center p-3 bg-muted/30 rounded-lg">
              <div>
                <Label className="font-medium">
                  {label}
                  {required && <span className="text-destructive ml-1">*</span>}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Database field: <code className="text-xs">{field}</code>
                </p>
              </div>
              <Select
                value={mapping[field] || ""}
                onValueChange={(value) => handleMappingChange(field, value)}
              >
                <SelectTrigger className={!mapping[field] && required ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select Excel column..." />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="">-- Not Mapped --</SelectItem>
                  {detectedHeaders.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {/* Detected but unmapped headers */}
        {detectedHeaders.filter(h => !Object.values(mapping).includes(h)).length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription>
              <div className="font-semibold mb-1 text-yellow-900 dark:text-yellow-100">
                Unmapped Columns ({detectedHeaders.filter(h => !Object.values(mapping).includes(h)).length})
              </div>
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                These columns will be ignored:{" "}
                {detectedHeaders
                  .filter(h => !Object.values(mapping).includes(h))
                  .join(", ")}
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleConfirm}
            disabled={validationErrors.length > 0}
            className="flex-1"
          >
            Confirm Mapping & Parse Data
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
