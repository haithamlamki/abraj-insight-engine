import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { parseExcelFile, mapExcelToDbFields } from "@/lib/excelParser";
import { downloadTemplate } from "@/lib/excelTemplates";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBulkSaveReportData } from "@/hooks/useReportData";

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

    try {
      const result = await parseExcelFile(file);
      
      if (result.errors.length > 0) {
        setUploadStatus("error");
        setErrorMessage(`Found ${result.errors.length} errors in the file.`);
        toast.error(`Validation failed: ${result.errors.length} errors found`);
      } else {
        setUploadStatus("success");
        // Collect data from ALL sheets instead of only the first
        const sheetNames = Object.keys(result.data);
        const allRows = sheetNames.reduce((acc: any[], name) => acc.concat(result.data[name] || []), [] as any[]);

        // Map Excel data to database format
        const mappedDataRaw = allRows.map(row => mapExcelToDbFields(row, reportType));
        // Debug first row mapping
        if (allRows.length > 0) {
          console.log('[ExcelUploadZone] First row original:', allRows[0]);
          console.log('[ExcelUploadZone] First row mapped:', mappedDataRaw[0]);
        }
        // Filter out rows missing required fields (rig, month, year)
        const mappedData = mappedDataRaw.filter((row: any) => row && row.rig && row.month && (row.year !== null && row.year !== undefined && row.year !== ''));
        console.log(`[ExcelUploadZone] Sheets: ${sheetNames.length}, Rows found: ${allRows.length}, Rows valid: ${mappedData.length}`);
        setParsedData(mappedData);

        if (onDataParsed) {
          onDataParsed(allRows);
        }

        toast.success(`Parsed ${mappedData.length} valid records from ${allRows.length} rows across ${sheetNames.length} sheet(s)`);
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
          {uploadStatus === 'success' && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                File uploaded and parsed successfully!
              </AlertDescription>
            </Alert>
          )}
          
          {uploadStatus === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
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
