import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { parseExcelFile } from "@/lib/excelParser";
import { downloadTemplate } from "@/lib/excelTemplates";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    try {
      const result = await parseExcelFile(file);
      
      if (result.errors.length > 0) {
        setUploadStatus("error");
        setErrorMessage(`Found ${result.errors.length} errors in the file.`);
        toast.error(`Validation failed: ${result.errors.length} errors found`);
      } else {
        setUploadStatus("success");
        const firstSheet = Object.keys(result.data)[0];
        const data = result.data[firstSheet];
        
        if (onDataParsed) {
          onDataParsed(data);
        }
        
        toast.success(`File "${file.name}" uploaded successfully - ${data.length} rows parsed`);
      }
    } catch (error) {
      setUploadStatus("error");
      setErrorMessage('Failed to parse Excel file. Please ensure it matches the template format.');
      toast.error("Failed to parse the Excel file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

          {uploadedFile && uploadStatus === "success" && (
            <div className="space-y-4">
              <div className="p-4 bg-success/10 border border-success rounded-lg">
                <p className="font-medium text-success">File validated successfully</p>
                <p className="text-sm text-muted-foreground mt-1">
                  The uploaded file format is correct and ready to be processed.
                </p>
              </div>
              <Button className="w-full" onClick={() => toast.success("Data imported successfully")}>
                Process & Import Data
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
