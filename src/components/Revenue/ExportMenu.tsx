import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { RevenueRecord } from "@/hooks/useRevenueAnalytics";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface ExportMenuProps {
  data: RevenueRecord[];
  filteredCount: number;
  totalCount: number;
  dashboardRef?: React.RefObject<HTMLElement>;
}

export const ExportMenu = ({
  data,
  filteredCount,
  totalCount,
  dashboardRef,
}: ExportMenuProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    try {
      setIsExporting(true);

      // Prepare data for CSV
      const csvData = data.map((row) => ({
        Year: row.year,
        Month: row.month,
        Rig: row.rig,
        Client: row.client || '',
        'Revenue Actual': row.revenue_actual,
        'Revenue Budget': row.revenue_budget,
        Variance: row.variance,
        'Variance %': row.revenue_budget !== 0 
          ? ((row.variance / row.revenue_budget) * 100).toFixed(2)
          : '0',
        'Dayrate Actual': row.dayrate_actual || 0,
        'Dayrate Budget': row.dayrate_budget || 0,
        'Working Days': row.working_days || 0,
        'Fuel Charge': row.fuel_charge || 0,
        'NPT Repair': row.npt_repair || 0,
        'NPT Zero': row.npt_zero || 0,
        Comments: row.comments || '',
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(csvData);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Revenue Data');

      // Generate file name with timestamp
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `revenue-export-${timestamp}.csv`;

      // Save file
      XLSX.writeFile(wb, fileName);

      toast.success(`Exported ${filteredCount} records to CSV`);
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = () => {
    try {
      setIsExporting(true);

      // Prepare data for Excel with formatting
      const excelData = data.map((row) => ({
        Year: row.year,
        Month: row.month,
        Rig: row.rig,
        Client: row.client || '',
        'Revenue Actual': row.revenue_actual,
        'Revenue Budget': row.revenue_budget,
        Variance: row.variance,
        'Variance %': row.revenue_budget !== 0 
          ? ((row.variance / row.revenue_budget) * 100).toFixed(2)
          : '0',
        'Dayrate Actual': row.dayrate_actual || 0,
        'Dayrate Budget': row.dayrate_budget || 0,
        'Working Days': row.working_days || 0,
        'Fuel Charge': row.fuel_charge || 0,
        'NPT Repair': row.npt_repair || 0,
        'NPT Zero': row.npt_zero || 0,
        Comments: row.comments || '',
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 8 },  // Year
        { wch: 12 }, // Month
        { wch: 12 }, // Rig
        { wch: 15 }, // Client
        { wch: 15 }, // Revenue Actual
        { wch: 15 }, // Revenue Budget
        { wch: 15 }, // Variance
        { wch: 12 }, // Variance %
        { wch: 15 }, // Dayrate Actual
        { wch: 15 }, // Dayrate Budget
        { wch: 12 }, // Working Days
        { wch: 12 }, // Fuel Charge
        { wch: 12 }, // NPT Repair
        { wch: 12 }, // NPT Zero
        { wch: 30 }, // Comments
      ];
      ws['!cols'] = colWidths;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Revenue Data');

      // Generate file name with timestamp
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `revenue-export-${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(wb, fileName);

      toast.success(`Exported ${filteredCount} records to Excel`);
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Failed to export Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    if (!dashboardRef?.current) {
      toast.error('Dashboard reference not available');
      return;
    }

    try {
      setIsExporting(true);
      toast.info('Generating PDF report... This may take a moment.');

      // Capture the dashboard as canvas
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Add title page
      pdf.setFontSize(20);
      pdf.text('Revenue Analysis Report', 105, 20, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
      pdf.text(`Records: ${filteredCount} of ${totalCount}`, 105, 40, { align: 'center' });

      // Add dashboard image
      pdf.addPage();
      const imgData = canvas.toDataURL('image/png');
      
      // If image is taller than page, split into multiple pages
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      // Generate file name with timestamp
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `revenue-report-${timestamp}.pdf`;

      // Save PDF
      pdf.save(fileName);

      toast.success('PDF report generated successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setIsExporting(false);
    }
  };

  const exportChartImage = async (chartId: string, chartName: string) => {
    try {
      setIsExporting(true);

      const chartElement = document.getElementById(chartId);
      if (!chartElement) {
        toast.error('Chart not found');
        return;
      }

      // Capture chart as canvas
      const canvas = await html2canvas(chartElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const timestamp = new Date().toISOString().slice(0, 10);
          link.download = `${chartName}-${timestamp}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          toast.success(`${chartName} exported as image`);
        }
      });
    } catch (error) {
      console.error('Chart export error:', error);
      toast.error('Failed to export chart');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Data</DropdownMenuLabel>
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Export Reports</DropdownMenuLabel>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="w-4 h-4 mr-2" />
          Generate PDF Report
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Export Charts</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => exportChartImage('time-series-chart', 'time-series')}>
          <ImageIcon className="w-4 h-4 mr-2" />
          Time Series Chart
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportChartImage('rig-performance-chart', 'rig-performance')}>
          <ImageIcon className="w-4 h-4 mr-2" />
          Rig Performance Chart
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportChartImage('forecast-chart', 'forecast')}>
          <ImageIcon className="w-4 h-4 mr-2" />
          Forecast Chart
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportChartImage('npt-correlation-chart', 'npt-correlation')}>
          <ImageIcon className="w-4 h-4 mr-2" />
          NPT Correlation Chart
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
