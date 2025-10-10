import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { parseExcelFile, mapExcelToDbFields, validateBillingNptData, validateRevenueData, validateWorkOrdersData, ValidationError } from "@/lib/excelParser";
import { downloadTemplate } from "@/lib/excelTemplates";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBulkSaveReportData } from "@/hooks/useReportData";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ExcelUploadZoneProps {
  title: string;
  templateName: string;
  reportType: string;
  onDataParsed?: (data: any[]) => void;
}

export const ExcelUploadZone = ({ 
  title, 
  templateName, 
  reportType,
  onDataParsed 
}: ExcelUploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [autoCorrect, setAutoCorrect] = useState(true);
  const [autoCorrections, setAutoCorrections] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkSave = useBulkSaveReportData(reportType);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const excelFile = files.find(f => 
      f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
    );

    if (excelFile) {
      handleFileUpload(excelFile);
    } else {
      toast.error("Please upload an Excel file (.xlsx or .xls)");
      setUploadStatus("error");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setUploading(true);
    setUploadStatus("idle");
    setErrorMessage('');
    setParsedData([]);
    setValidationErrors([]);
    setAutoCorrections([]);

    try {
      const result = await parseExcelFile(file, autoCorrect);
      
      // Collect data from ALL sheets
      const sheetNames = Object.keys(result.data);
      const allRows = sheetNames.reduce((acc: any[], name) => acc.concat(result.data[name] || []), [] as any[]);

      // Validate data based on report type
      let validationErrors: ValidationError[] = [];
      if (reportType === 'billing_npt') {
        validationErrors = validateBillingNptData(allRows);
      } else if (reportType === 'revenue') {
        validationErrors = validateRevenueData(allRows);
      } else if (reportType === 'work_orders') {
        validationErrors = validateWorkOrdersData(allRows);
      }

      // Separate errors by severity
      const actualErrors = validationErrors.filter(e => e.severity === 'error' || !e.severity);
      const warnings = validationErrors.filter(e => e.severity === 'warning');
      const infos = validationErrors.filter(e => e.severity === 'info');
      
      setValidationErrors(validationErrors);

      if (actualErrors.length > 0) {
        setUploadStatus("error");
        const errorDetails = actualErrors.slice(0, 3).map(e => 
          `Row ${e.row}, ${e.column}: ${e.message}`
        ).join('\n');
        setErrorMessage(`Found ${actualErrors.length} error(s). First errors:\n${errorDetails}`);
        toast.error(`Validation failed: ${actualErrors.length} errors found`);
      } else {
        setUploadStatus("success");
        // Map Excel data to database format
        const mappedDataRaw = allRows.map(row => mapExcelToDbFields(row, reportType));
        
        // Debug first row mapping
        if (allRows.length > 0) {
          console.log('[ExcelUploadZone] First row original:', allRows[0]);
          console.log('[ExcelUploadZone] First row mapped:', mappedDataRaw[0]);
        }
        
        // Filter out rows missing required fields or with null dates
        let mappedData;
        if (reportType === 'billing_npt') {
          mappedData = mappedDataRaw.filter((row: any) => 
            row && row.rig && row.date !== null && row.date !== undefined
          );
        } else {
          mappedData = mappedDataRaw.filter((row: any) => 
            row && row.rig && row.month && (row.year !== null && row.year !== undefined && row.year !== '')
          );
        }
        
        console.log(`[ExcelUploadZone] Sheets: ${sheetNames.length}, Rows found: ${allRows.length}, Rows valid: ${mappedData.length}`);
        setParsedData(mappedData);

        // Track auto-corrections
        if (autoCorrect && (warnings.length > 0 || infos.length > 0)) {
          const corrections: string[] = [];
          infos.forEach(info => {
            if (info.autoFixable && info.suggestedFix) {
              corrections.push(`Row ${info.row}: ${info.suggestedFix}`);
            }
          });
          setAutoCorrections(corrections);
        }

        if (onDataParsed) {
          onDataParsed(allRows);
        }

        const correctionMsg = autoCorrect && infos.length > 0 
          ? ` (${infos.length} auto-corrections applied)` 
          : '';
        toast.success(`Parsed ${mappedData.length} valid records from ${allRows.length} rows${correctionMsg}`);
      }
    } catch (error) {
      setUploadStatus("error");
      setErrorMessage('Failed to parse Excel file. Please ensure it matches the template format.');
      toast.error("Failed to parse the Excel file");
    } finally {
      setUploading(false);
    }
  };

  const handleImportData = async () => {
    if (parsedData.length === 0) {
      toast.error("No data to import");
      return;
    }

    try {
      await bulkSave.mutateAsync(parsedData);
      setParsedData([]);
      setUploadedFile(null);
      setUploadStatus("idle");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import error:', error);
    }
  };

  const handleDownloadTemplate = () => {
    downloadTemplate(reportType, templateName);
    toast.success("Template downloaded successfully");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Upload Excel files or download the template to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-correction toggle */}
          <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg border">
            <Switch 
              id="auto-correct" 
              checked={autoCorrect}
              onCheckedChange={setAutoCorrect}
            />
            <Label htmlFor="auto-correct" className="cursor-pointer">
              Auto-correct month names and compose dates from Year/Month/Day columns
            </Label>
          </div>

          {uploadStatus === 'success' && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                File uploaded and parsed successfully!
                {autoCorrections.length > 0 && (
                  <span className="block mt-1 text-sm text-muted-foreground">
                    {autoCorrections.length} auto-corrections applied
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {uploadStatus === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Enhanced error display */}
          {validationErrors.length > 0 && (
            <div className="space-y-4">
              {validationErrors.filter(e => e.severity === 'error' || !e.severity).length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">
                      {validationErrors.filter(e => e.severity === 'error' || !e.severity).length} Error(s) - Must Fix
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Row</TableHead>
                          <TableHead className="w-32">Column</TableHead>
                          <TableHead>Issue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validationErrors
                          .filter(e => e.severity === 'error' || !e.severity)
                          .slice(0, 10)
                          .map((err, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{err.row}</TableCell>
                              <TableCell className="font-mono text-xs">{err.column}</TableCell>
                              <TableCell>{err.message}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </AlertDescription>
                </Alert>
              )}

              {validationErrors.filter(e => e.severity === 'info').length > 0 && (
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription>
                    <div className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                      {validationErrors.filter(e => e.severity === 'info').length} Auto-Correction(s) {autoCorrect ? 'Applied' : 'Available'}
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Row</TableHead>
                          <TableHead className="w-32">Column</TableHead>
                          <TableHead>Correction</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validationErrors
                          .filter(e => e.severity === 'info')
                          .slice(0, 10)
                          .map((err, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{err.row}</TableCell>
                              <TableCell className="font-mono text-xs">{err.column}</TableCell>
                              <TableCell className="text-sm">
                                {err.suggestedFix || err.message}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              uploadStatus === "success" && "border-success bg-success/5",
              uploadStatus === "error" && "border-destructive bg-destructive/5"
            )}
          >
            <div className="flex flex-col items-center gap-4">
              {uploadStatus === "idle" && <Upload className="h-12 w-12 text-muted-foreground" />}
              {uploadStatus === "success" && <CheckCircle2 className="h-12 w-12 text-success" />}
              {uploadStatus === "error" && <AlertCircle className="h-12 w-12 text-destructive" />}
              
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {uploadedFile ? uploadedFile.name : "Drag and drop your Excel file here"}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse files (.xlsx, .xls)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label htmlFor="file-upload">
                <Button asChild variant="outline" disabled={uploading}>
                  <span className="cursor-pointer flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    {uploading ? 'Processing...' : 'Browse Files'}
                  </span>
                </Button>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Download Excel Template</p>
                <p className="text-sm text-muted-foreground">
                  Use this template to ensure proper data format
                </p>
              </div>
            </div>
            <Button onClick={handleDownloadTemplate} variant="secondary">
              Download
            </Button>
          </div>

          {uploadedFile && uploadStatus === "success" && parsedData.length > 0 && (
            <div className="space-y-4">
              <div className="p-4 bg-success/10 border border-success rounded-lg">
                <p className="font-medium text-success">File validated successfully</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {parsedData.length} records ready to import to database
                </p>
              </div>
              <Button 
                className="w-full" 
                onClick={handleImportData}
                disabled={bulkSave.isPending}
              >
                {bulkSave.isPending ? 'Importing...' : 'Process & Import Data'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
