import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle, Info, Calendar } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { parseExcelFile, mapExcelToDbFields, validateBillingNptData, validateBillingNPTSummaryData, validateNPTRootCauseData, validateRevenueData, validateWorkOrdersData, ValidationError, filterEmptyRows } from "@/lib/excelParser";
import { downloadTemplate } from "@/lib/excelTemplates";
import { validateRecords, getValidationSchema } from '@/lib/validationSchemas';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBulkSaveReportData } from "@/hooks/useReportData";
import { logImportStatistics } from "@/lib/importLogger";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { HeaderMappingPreview } from "./HeaderMappingPreview";
import { ValidationWarningsDialog } from "./ValidationWarningsDialog";
import { DuplicateWarningDialog } from "./DuplicateWarningDialog";
import { ZodError } from "zod";
import { checkDuplicates } from "@/lib/supabaseQueries";
import { getTableName } from "@/lib/supabaseQueries";

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
  const [reportingDate, setReportingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showHeaderMapping, setShowHeaderMapping] = useState(false);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [rawParsedData, setRawParsedData] = useState<any[]>([]);
  const [showWarningsDialog, setShowWarningsDialog] = useState(false);
  const [pendingValidData, setPendingValidData] = useState<any[]>([]);
  const [pendingWarnings, setPendingWarnings] = useState<any[]>([]);
  const [importStartTime, setImportStartTime] = useState<number>(0);
  const [totalRowsBeforeFilter, setTotalRowsBeforeFilter] = useState<number>(0);
  const [showDuplicatesDialog, setShowDuplicatesDialog] = useState(false);
  const [duplicateRecords, setDuplicateRecords] = useState<any[]>([]);
  const [pendingDataForDuplicates, setPendingDataForDuplicates] = useState<any[]>([]);
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
    setImportStartTime(Date.now());
    setUploadedFile(file);
    setUploading(true);
    setUploadStatus("idle");
    setErrorMessage('');
    setParsedData([]);
    setValidationErrors([]);
    setAutoCorrections([]);
    setShowHeaderMapping(false);

    try {
      const result = await parseExcelFile(file, autoCorrect);
      
      // Collect data from ALL sheets
      const sheetNames = Object.keys(result.data);
      const allRows = sheetNames.reduce((acc: any[], name) => acc.concat(result.data[name] || []), [] as any[]);
      setTotalRowsBeforeFilter(allRows.length);

      // Extract headers from first row
      if (allRows.length > 0) {
        const firstRow = allRows[0];
        const headers = Object.keys(firstRow).filter(key => !key.startsWith('__'));
        setDetectedHeaders(headers);
        setRawParsedData(allRows);
        
        // Show header mapping UI
        setShowHeaderMapping(true);
        setUploading(false);
        return;
      }

    } catch (error) {
      setUploadStatus("error");
      console.error('Excel parse error:', error);
      const msg = error instanceof Error ? error.message : String(error);
      
      // Provide actionable error message
      const userFriendlyMsg = msg.includes('Unable to read') 
        ? msg 
        : `Failed to parse Excel file: ${msg}. Try re-saving as .xlsx without macros or password protection.`;
      
      setErrorMessage(userFriendlyMsg);
      toast.error(userFriendlyMsg);
      console.info('[ExcelUploadZone] Parsing failed. File:', uploadedFile?.name, 'Size:', uploadedFile?.size);
    } finally {
      setUploading(false);
    }
  };

  const handleMappingConfirmed = async (customMapping: { [key: string]: string }) => {
    setShowHeaderMapping(false);
    setUploading(true);

    try {
      // Validate data based on report type
      let validationErrors: ValidationError[] = [];
      if (reportType === 'billing_npt') {
        validationErrors = validateBillingNptData(rawParsedData);
      } else if (reportType === 'billing_npt_summary') {
        validationErrors = validateBillingNPTSummaryData(rawParsedData);
      } else if (reportType === 'npt_root_cause') {
        validationErrors = validateNPTRootCauseData(rawParsedData);
      } else if (reportType === 'revenue') {
        validationErrors = validateRevenueData(rawParsedData);
      } else if (reportType === 'work_orders') {
        validationErrors = validateWorkOrdersData(rawParsedData);
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
        // Map Excel data to database format with custom mapping
        const mappedDataRaw = rawParsedData.map(row => mapExcelToDbFields(row, reportType, customMapping));
        
        // Debug first row mapping
        if (rawParsedData.length > 0) {
          console.log('[ExcelUploadZone] First row original:', rawParsedData[0]);
          console.log('[ExcelUploadZone] First row mapped:', mappedDataRaw[0]);
          console.log('[ExcelUploadZone] Custom mapping:', customMapping);
        }
        
        // Automatically filter out empty template rows
        const { filteredData: mappedData, skippedCount } = filterEmptyRows(mappedDataRaw, reportType);
        
        // Notify user about skipped rows
        if (skippedCount > 0) {
          console.log(`[ExcelUploadZone] Automatically skipped ${skippedCount} empty template rows`);
          toast.info(`Skipped ${skippedCount} empty template row${skippedCount > 1 ? 's' : ''}`);
        }
        
        console.log(`[ExcelUploadZone] Rows found: ${rawParsedData.length}, Rows valid: ${mappedData.length}, Rows skipped: ${skippedCount}`);
        
        // Validate data using Zod schema if available
        const schema = getValidationSchema(reportType);
        let finalValidData = mappedData;
        let criticalErrors: { record: any; errors: string[]; index: number }[] = [];
        let warnings: { record: any; errors: string[]; index: number; severity: 'warning' | 'info' }[] = [];
        
        if (schema) {
          const { valid, invalid } = validateRecords(mappedData, schema);
          
          // Separate critical errors from warnings
          // Critical errors: missing required fields (rig, year, month)
          // Warnings: missing optional fields, validation warnings
          invalid.forEach(item => {
            const isCritical = item.errors.some(err =>
              (err.includes('required') || err.includes('مطلوب')) &&
              (err.includes('rig') || err.includes('Rig') ||
               err.includes('year') || err.includes('Year') ||
               err.includes('month') || err.includes('Month'))
            );

            if (isCritical) {
              criticalErrors.push(item);
            } else {
              // All other errors are treated as warnings/info - won't block import
              warnings.push({
                ...item,
                severity: 'info'
              });
            }
          });
          
          // Only keep valid records for now
          finalValidData = valid;
          
          // Show critical errors
          if (criticalErrors.length > 0) {
            console.error(`[ExcelUploadZone] Critical validation errors: ${criticalErrors.length}`, criticalErrors);
            const errorSummary = criticalErrors.slice(0, 3).map(err => 
              `الصف ${err.index}: ${err.errors.join(', ')}`
            ).join('\n');
            toast.error(
              `${criticalErrors.length} سجل يحتوي على أخطاء حرجة:\n${errorSummary}`,
              { duration: 8000 }
            );
            setUploadStatus("error");
            setErrorMessage(`تم العثور على ${criticalErrors.length} خطأ حرج في البيانات`);
            setUploading(false);
            return;
          }
          
          // Show warnings dialog if there are warnings
          if (warnings.length > 0) {
            console.warn(`[ExcelUploadZone] Validation warnings: ${warnings.length}`, warnings);
            setPendingValidData(finalValidData);
            setPendingWarnings(warnings);
            setShowWarningsDialog(true);
            setUploading(false);
            return;
          }
        }
        
        // If no warnings, proceed directly
        completeSaveProcess(finalValidData, []);

      }
    } catch (error) {
      setUploadStatus("error");
      console.error('Data validation error:', error);
      const msg = error instanceof Error ? error.message : String(error);
      setErrorMessage(`Failed to process data: ${msg}`);
      toast.error(`Data processing failed: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const completeSaveProcess = async (finalValidData: any[], schemaValidationErrors: any[] = []) => {
    // Check for duplicates before saving
    try {
      const tableName = getTableName(reportType);
      const duplicates = await checkDuplicates(tableName, finalValidData);
      
      if (duplicates.length > 0) {
        setPendingDataForDuplicates(finalValidData);
        setDuplicateRecords(duplicates);
        setShowDuplicatesDialog(true);
        return;
      }
      
      // No duplicates, proceed with save
      await performSave(finalValidData, schemaValidationErrors, false);
    } catch (error) {
      console.error('Error checking duplicates:', error);
      toast.error('Failed to check for duplicates');
      setUploading(false);
    }
  };

  const performSave = async (finalValidData: any[], schemaValidationErrors: any[] = [], overwrite: boolean = false) => {
    setParsedData(finalValidData);

    // Track auto-corrections
    const infos = validationErrors.filter(e => e.severity === 'info');
    if (autoCorrect && infos.length > 0) {
      const corrections: string[] = [];
      infos.forEach(info => {
        if (info.autoFixable && info.suggestedFix) {
          corrections.push(`Row ${info.row}: ${info.suggestedFix}`);
        }
      });
      setAutoCorrections(corrections);
    }

    if (onDataParsed) {
      onDataParsed(finalValidData);
    }

    const correctionMsg = autoCorrect && infos.length > 0 
      ? ` (${infos.length} تصحيح تلقائي)` 
      : '';
    const validationMsg = schemaValidationErrors.length > 0 
      ? ` (${schemaValidationErrors.length} سجل مستبعد)` 
      : '';
    toast.success(`تم معالجة ${finalValidData.length} سجل صحيح من ${rawParsedData.length} صف${correctionMsg}${validationMsg}`);
    setUploadStatus("success");
    setUploading(false);
  };

  const handleWarningsContinue = () => {
    setShowWarningsDialog(false);
    completeSaveProcess(pendingValidData, []);
    setPendingValidData([]);
    setPendingWarnings([]);
  };

  const handleWarningsCancel = () => {
    setShowWarningsDialog(false);
    setUploadStatus("idle");
    setParsedData([]);
    setPendingValidData([]);
    setPendingWarnings([]);
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info("تم إلغاء الاستيراد. يرجى مراجعة البيانات وإعادة المحاولة.");
  };

  const handleDuplicatesSkip = async () => {
    setShowDuplicatesDialog(false);
    const tableName = getTableName(reportType);
    
    // Filter out duplicates
    const nonDuplicates = pendingDataForDuplicates.filter(record => {
      return !duplicateRecords.some(dup => 
        dup.rig === record.rig && 
        dup.year === record.year && 
        dup.month === record.month
      );
    });
    
    if (nonDuplicates.length === 0) {
      toast.info('All records were duplicates. No data imported.');
      setUploadStatus("idle");
      setUploading(false);
      return;
    }
    
    try {
      await bulkSave.mutateAsync({ dataArray: nonDuplicates, overwrite: false });
      await performSave(nonDuplicates, [], false);
      toast.success(`Imported ${nonDuplicates.length} new records, skipped ${pendingDataForDuplicates.length - nonDuplicates.length} duplicates`);
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('Failed to save data');
    } finally {
      setPendingDataForDuplicates([]);
      setDuplicateRecords([]);
    }
  };

  const handleDuplicatesOverwrite = async () => {
    setShowDuplicatesDialog(false);
    
    try {
      await bulkSave.mutateAsync({ dataArray: pendingDataForDuplicates, overwrite: true });
      await performSave(pendingDataForDuplicates, [], true);
      toast.success(`Overwritten ${pendingDataForDuplicates.length} records`);
    } catch (error) {
      console.error('Error overwriting data:', error);
      toast.error('Failed to overwrite data');
    } finally {
      setPendingDataForDuplicates([]);
      setDuplicateRecords([]);
    }
  };

  const handleDuplicatesCancel = () => {
    setShowDuplicatesDialog(false);
    setUploadStatus("idle");
    setPendingDataForDuplicates([]);
    setDuplicateRecords([]);
    setUploading(false);
  };

  const handleImportData = async () => {
    if (parsedData.length === 0) {
      toast.error("No data to import");
      return;
    }

    try {
      await bulkSave.mutateAsync({ dataArray: parsedData, overwrite: false });
      
      // Log successful import statistics
      await logImportStatistics({
        reportType,
        importMethod: 'excel',
        totalRows: totalRowsBeforeFilter,
        validRows: parsedData.length,
        errorRows: validationErrors.filter(e => e.severity === 'error' || !e.severity).length,
        warningRows: validationErrors.filter(e => e.severity === 'warning').length,
        skippedRows: totalRowsBeforeFilter - parsedData.length,
        validationErrors: validationErrors,
        fileName: uploadedFile?.name,
        success: true,
        durationMs: Date.now() - importStartTime,
      });
      
      setParsedData([]);
      setUploadedFile(null);
      setUploadStatus("idle");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import error:', error);
      
      // Log failed import statistics
      await logImportStatistics({
        reportType,
        importMethod: 'excel',
        totalRows: totalRowsBeforeFilter,
        validRows: 0,
        errorRows: validationErrors.length,
        warningRows: 0,
        skippedRows: 0,
        validationErrors: validationErrors,
        fileName: uploadedFile?.name,
        success: false,
        durationMs: Date.now() - importStartTime,
      });
    }
  };

  const handleDownloadTemplate = () => {
    downloadTemplate(reportType, templateName);
    toast.success("Template downloaded successfully");
  };

  const handleMappingCancelled = () => {
    setShowHeaderMapping(false);
    setUploadedFile(null);
    setRawParsedData([]);
    setDetectedHeaders([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Warnings Dialog */}
      <ValidationWarningsDialog
        open={showWarningsDialog}
        warnings={pendingWarnings}
        onContinue={handleWarningsContinue}
        onCancel={handleWarningsCancel}
        totalRecords={rawParsedData.length}
        validRecords={pendingValidData.length}
        reportType={reportType}
      />

      {/* Header Mapping Step */}
      {showHeaderMapping && (
        <HeaderMappingPreview
          detectedHeaders={detectedHeaders}
          reportType={reportType}
          onMappingConfirmed={handleMappingConfirmed}
          onCancel={handleMappingCancelled}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Upload Excel files or download the template to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date picker for fuel reports */}
          {reportType === 'fuel' && (
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <Label htmlFor="reporting-date" className="text-sm font-medium">
                  Reporting Date
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  This date will be applied to all fuel records in the uploaded file
                </p>
              </div>
              <Input
                id="reporting-date"
                type="date"
                value={reportingDate}
                onChange={(e) => setReportingDate(e.target.value)}
                className="w-48"
              />
            </div>
          )}
          
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
              {/* Validation Preview */}
              <div className="p-4 bg-success/10 border border-success rounded-lg space-y-3">
                <div>
                  <p className="font-medium text-success">File validated successfully</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {parsedData.length} records ready to import to database
                  </p>
                </div>
                
                {/* Preview of first 3 rows with key fields */}
                {reportType === 'utilization' && parsedData.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Preview (first 3 rows):</p>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="text-xs">
                            <TableHead className="h-8">Rig</TableHead>
                            <TableHead className="h-8">Month</TableHead>
                            <TableHead className="h-8">Year</TableHead>
                            <TableHead className="h-8">Client</TableHead>
                            <TableHead className="h-8">Status</TableHead>
                            <TableHead className="h-8">Util %</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedData.slice(0, 3).map((row, idx) => (
                            <TableRow key={idx} className="text-xs">
                              <TableCell className="py-2">{row.rig}</TableCell>
                              <TableCell className="py-2">{row.month}</TableCell>
                              <TableCell className="py-2">{row.year}</TableCell>
                              <TableCell className="py-2">{row.client || '-'}</TableCell>
                              <TableCell className="py-2">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-xs",
                                  row.status === 'Active' && "bg-green-100 text-green-700",
                                  row.status === 'Inactive' && "bg-gray-100 text-gray-700",
                                  row.status === 'Stacked' && "bg-yellow-100 text-yellow-700"
                                )}>
                                  {row.status}
                                </span>
                              </TableCell>
                              <TableCell className="py-2">{row.utilization_rate ?? '-'}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
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

      {/* Validation Warnings Dialog */}
      <ValidationWarningsDialog
        open={showWarningsDialog}
        warnings={pendingWarnings}
        totalRecords={rawParsedData.length}
        validRecords={pendingValidData.length}
        onContinue={handleWarningsContinue}
        onCancel={handleWarningsCancel}
      />

      {/* Duplicate Records Dialog */}
      <DuplicateWarningDialog
        open={showDuplicatesDialog}
        duplicates={duplicateRecords}
        onSkip={handleDuplicatesSkip}
        onOverwrite={handleDuplicatesOverwrite}
        onCancel={handleDuplicatesCancel}
      />
    </div>
  );
};
