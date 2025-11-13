import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Clipboard, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { mapExcelToDbFields, ValidationError, exportValidationErrorsToExcel, filterEmptyRows } from "@/lib/excelParser";
import { validateRecords, getValidationSchema } from '@/lib/validationSchemas';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBulkSaveReportData } from "@/hooks/useReportData";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HeaderMappingPreview } from "./HeaderMappingPreview";
import { ValidationWarningsDialog } from "./ValidationWarningsDialog";

interface PasteDataZoneProps {
  title: string;
  reportType: string;
  onDataParsed?: (data: any[]) => void;
}

export const PasteDataZone = ({ 
  title, 
  reportType,
  onDataParsed 
}: PasteDataZoneProps) => {
  const [pastedText, setPastedText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [autoCorrect, setAutoCorrect] = useState(true);
  const [autoCorrections, setAutoCorrections] = useState<string[]>([]);
  const [showHeaderMapping, setShowHeaderMapping] = useState(false);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [rawParsedData, setRawParsedData] = useState<any[]>([]);
  const [showWarningsDialog, setShowWarningsDialog] = useState(false);
  const [pendingValidData, setPendingValidData] = useState<any[]>([]);
  const [pendingWarnings, setPendingWarnings] = useState<any[]>([]);
  const bulkSave = useBulkSaveReportData(reportType);

  const detectDelimiter = (text: string): string => {
    const firstLine = text.split('\n')[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    
    if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
    if (commaCount > semicolonCount) return ',';
    return ';';
  };

  const parsePastedData = (text: string) => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('No data found in pasted content');
    }

    const delimiter = detectDelimiter(text);
    const rows = lines.map(line => {
      // Handle quoted fields
      const fields: string[] = [];
      let currentField = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          fields.push(currentField.trim());
          currentField = '';
        } else {
          currentField += char;
        }
      }
      fields.push(currentField.trim());
      return fields;
    });

    // Find header row (first non-empty row)
    const headers = rows[0].map(h => h.replace(/"/g, '').trim());
    
    // Convert to objects
    const data = rows.slice(1).map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        const value = row[index]?.replace(/"/g, '').trim() || '';
        obj[header] = value;
      });
      return obj;
    });

    return { headers, data };
  };

  const handlePaste = async () => {
    if (!pastedText.trim()) {
      toast.error("Please paste data first");
      return;
    }

    setProcessing(true);
    setUploadStatus("idle");
    setErrorMessage('');
    setParsedData([]);
    setAutoCorrections([]);
    setShowHeaderMapping(false);

    try {
      const { headers, data } = parsePastedData(pastedText);
      
      if (data.length === 0) {
        throw new Error('No data rows found. Please ensure your data has headers and at least one data row.');
      }

      console.log(`📋 Pasted data detected: ${data.length} rows, ${headers.length} columns`);
      console.log('Detected headers:', headers);

      setDetectedHeaders(headers);
      setRawParsedData(data);
      setShowHeaderMapping(true);
      setUploadStatus("success");
      toast.success(`Detected ${data.length} rows. Please confirm header mapping.`);

    } catch (error: any) {
      console.error('Paste parsing error:', error);
      setErrorMessage(error.message || 'Failed to parse pasted data');
      setUploadStatus("error");
      toast.error(`Parse error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleMappingConfirmed = async (headerMapping: Record<string, string>) => {
    console.log('📌 Header mapping confirmed:', headerMapping);
    setShowHeaderMapping(false);
    
    try {
      // Map each row using the confirmed header mapping
      const mappedDataRaw = rawParsedData.map(row => 
        mapExcelToDbFields(row, reportType, headerMapping)
      );
      
      // Automatically filter out empty template rows
      const { filteredData: mappedData, skippedCount } = filterEmptyRows(mappedDataRaw, reportType);
      
      // Notify user about skipped rows
      if (skippedCount > 0) {
        console.log(`[PasteDataZone] Automatically skipped ${skippedCount} empty template rows`);
        toast.info(`Skipped ${skippedCount} empty template row${skippedCount > 1 ? 's' : ''}`);
      }
      
      if (mappedData.length === 0) {
        throw new Error('No valid data after mapping headers');
      }

      console.log(`✅ Mapped ${mappedData.length} records`);

      const validationSchema = getValidationSchema(reportType);
      
      if (!validationSchema) {
        console.warn(`No validation schema found for ${reportType}, proceeding without validation`);
        setParsedData(mappedData);
        setUploadStatus("success");
        toast.success(`Successfully processed ${mappedData.length} records. Ready to import.`);
        return;
      }

      const { valid, invalid } = validateRecords(mappedData, validationSchema);

      if (invalid.length > 0) {
        console.warn(`⚠️ Found ${invalid.length} validation errors`);
        setErrorMessage(`Found ${invalid.length} validation errors. Please fix the data and try again.`);
        setUploadStatus("error");
        
        const errorSummary = invalid.slice(0, 5).map(item => 
          `Row ${item.index}: ${item.errors.join(', ')}`
        ).join('\n');
        toast.error(`Validation failed:\n${errorSummary}${invalid.length > 5 ? `\n...and ${invalid.length - 5} more errors` : ''}`);
        return;
      }

      await completeSaveProcess(valid, []);

    } catch (error: any) {
      console.error('Mapping error:', error);
      setErrorMessage(error.message);
      setUploadStatus("error");
      toast.error(`Mapping failed: ${error.message}`);
    }
  };

  const completeSaveProcess = async (validRecords: any[], warnings: any[]) => {
    try {
      if (autoCorrect && warnings.length > 0) {
        const corrections = warnings.map(w => `Row ${w.row}: ${w.field} - ${w.message}`);
        setAutoCorrections(corrections);
      }

      setParsedData(validRecords);
      setUploadStatus("success");
      toast.success(`Successfully validated ${validRecords.length} records. Ready to import.`);
      
      if (onDataParsed) {
        onDataParsed(validRecords);
      }
    } catch (error: any) {
      console.error('Save process error:', error);
      setErrorMessage(error.message);
      setUploadStatus("error");
    }
  };

  const handleWarningsContinue = async () => {
    setShowWarningsDialog(false);
    await completeSaveProcess(pendingValidData, pendingWarnings);
  };

  const handleWarningsCancel = () => {
    setShowWarningsDialog(false);
    setPendingValidData([]);
    setPendingWarnings([]);
    setParsedData([]);
    setUploadStatus("idle");
  };

  const handleImportData = async () => {
    if (parsedData.length === 0) {
      toast.error("No data to import");
      return;
    }

    try {
      await bulkSave.mutateAsync(parsedData);
      setParsedData([]);
      setPastedText("");
      setUploadStatus("idle");
      setAutoCorrections([]);
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(`Import failed: ${error.message}`);
    }
  };

  const handleMappingCancelled = () => {
    setShowHeaderMapping(false);
    setUploadStatus("idle");
    setRawParsedData([]);
    setDetectedHeaders([]);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clipboard className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          Copy data from Excel or Google Sheets and paste it here
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ValidationWarningsDialog
          open={showWarningsDialog}
          warnings={pendingWarnings}
          totalRecords={rawParsedData.length}
          validRecords={pendingValidData.length}
          onContinue={handleWarningsContinue}
          onCancel={handleWarningsCancel}
          reportType={reportType}
        />

        {showHeaderMapping && (
          <HeaderMappingPreview
            detectedHeaders={detectedHeaders}
            reportType={reportType}
            onMappingConfirmed={handleMappingConfirmed}
            onCancel={handleMappingCancelled}
          />
        )}

        {!showHeaderMapping && (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paste-area">Paste Your Data</Label>
                <Textarea
                  id="paste-area"
                  placeholder="Paste your data here (from Excel, Google Sheets, or CSV)..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Supports tab-separated (TSV), comma-separated (CSV), and semicolon-separated formats
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Button 
                  onClick={handlePaste}
                  disabled={processing || !pastedText.trim()}
                  className="gap-2"
                >
                  {processing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Clipboard className="h-4 w-4" />
                      Process Data
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-2">
                  <Switch
                    id="auto-correct"
                    checked={autoCorrect}
                    onCheckedChange={setAutoCorrect}
                  />
                  <Label htmlFor="auto-correct" className="text-sm cursor-pointer">
                    Auto-correct data
                  </Label>
                </div>
              </div>
            </div>

            {uploadStatus === "success" && parsedData.length > 0 && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  Successfully validated {parsedData.length} records
                </AlertDescription>
              </Alert>
            )}

            {uploadStatus === "error" && errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {autoCorrections.length > 0 && (
              <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <div className="font-medium mb-2">Auto-corrections applied:</div>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {autoCorrections.slice(0, 5).map((correction, idx) => (
                      <li key={idx}>{correction}</li>
                    ))}
                    {autoCorrections.length > 5 && (
                      <li>...and {autoCorrections.length - 5} more corrections</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {parsedData.length > 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Preview ({parsedData.length} records)</h3>
                  <div className="border rounded-lg overflow-auto max-h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(parsedData[0]).slice(0, 6).map((key) => (
                            <TableHead key={key} className="whitespace-nowrap">
                              {key}
                            </TableHead>
                          ))}
                          {Object.keys(parsedData[0]).length > 6 && (
                            <TableHead>...</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedData.slice(0, 10).map((row, idx) => (
                          <TableRow key={idx}>
                            {Object.values(row).slice(0, 6).map((value: any, cellIdx) => (
                              <TableCell key={cellIdx} className="whitespace-nowrap">
                                {String(value || '')}
                              </TableCell>
                            ))}
                            {Object.keys(row).length > 6 && (
                              <TableCell>...</TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {parsedData.length > 10 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Showing first 10 of {parsedData.length} records
                    </p>
                  )}
                </div>

                <Button 
                  onClick={handleImportData}
                  disabled={bulkSave.isPending}
                  size="lg"
                  className="w-full"
                >
                  {bulkSave.isPending ? "Importing..." : `Process & Import ${parsedData.length} Records`}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
