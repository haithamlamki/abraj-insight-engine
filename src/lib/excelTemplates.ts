import * as XLSX from 'xlsx';

export interface TemplateColumn {
  header: string;
  width?: number;
  example?: string;
}

/**
 * Generate Excel template for a specific report type
 */
export function generateTemplate(type: string): Blob {
  const templates: { [key: string]: TemplateColumn[] } = {
    revenue: [
      { header: 'Rig', width: 15, example: 'ADC-225' },
      { header: 'Month', width: 12, example: 'January' },
      { header: 'Year', width: 10, example: '2024' },
      { header: 'Dayrate Actual', width: 15, example: '25000' },
      { header: 'Dayrate Budget', width: 15, example: '24000' },
      { header: 'Working Days', width: 15, example: '28' },
      { header: 'Revenue Actual', width: 18, example: '700000' },
      { header: 'Revenue Budget', width: 18, example: '672000' },
      { header: 'Variance', width: 15, example: '28000' },
      { header: 'Fuel', width: 12, example: '12000' },
      { header: 'NPT Repair', width: 15, example: '5000' },
      { header: 'NPT Zero', width: 12, example: '0' },
      { header: 'Comments', width: 30, example: 'On schedule' },
      { header: 'Client', width: 20, example: 'ADNOC' },
    ],
    billing_npt: [
      { header: 'Rig', width: 15, example: 'ADC-225' },
      { header: 'Date', width: 12, example: '2024-01-15' },
      { header: 'NPT Hours', width: 12, example: '4.5' },
      { header: 'System', width: 20, example: 'Hydraulic System' },
      { header: 'Equipment Failure', width: 25, example: 'Pump failure' },
      { header: 'Root Cause', width: 30, example: 'Seal degradation' },
      { header: 'Corrective Action', width: 35, example: 'Replace seals' },
      { header: 'Notification Number', width: 20, example: 'NOT-2024-001' },
      { header: 'Billable', width: 12, example: 'Yes' },
      { header: 'Comments', width: 30, example: 'Spare ordered' },
    ],
    utilization: [
      { header: 'Rig', width: 15, example: 'ADC-225' },
      { header: 'Month', width: 12, example: 'January' },
      { header: 'Year', width: 10, example: '2024' },
      { header: 'Operating Days', width: 15, example: '28' },
      { header: 'NPT Days', width: 12, example: '2' },
      { header: 'Allowable NPT', width: 15, example: '1.5' },
      { header: 'Working Days', width: 15, example: '26' },
      { header: 'Utilization Rate', width: 18, example: '92.86' },
      { header: 'Client', width: 20, example: 'ADNOC' },
    ],
    fuel: [
      { header: 'Rig', width: 15, example: 'ADC-225' },
      { header: 'Date', width: 12, example: '2024-01-15' },
      { header: 'Fuel Consumed', width: 15, example: '1250' },
      { header: 'Fuel Type', width: 12, example: 'Diesel' },
      { header: 'Unit Price', width: 12, example: '0.85' },
      { header: 'Total Cost', width: 15, example: '1062.50' },
      { header: 'Supplier', width: 20, example: 'ENOC' },
      { header: 'Remarks', width: 30, example: 'Regular supply' },
    ],
    stock: [
      { header: 'Rig', width: 15, example: 'ADC-225' },
      { header: 'Item Name', width: 25, example: 'Drill Bit 12.25"' },
      { header: 'Category', width: 20, example: 'Drilling Tools' },
      { header: 'Current Qty', width: 15, example: '5' },
      { header: 'Target Qty', width: 15, example: '8' },
      { header: 'Unit', width: 10, example: 'pieces' },
      { header: 'Last Reorder Date', width: 18, example: '2024-01-01' },
      { header: 'Status', width: 15, example: 'Below Target' },
    ],
    work_orders: [
      { header: 'Rig', width: 15, example: 'ADC-225' },
      { header: 'Month', width: 12, example: 'January' },
      { header: 'Year', width: 10, example: '2024' },
      { header: 'ELEC Open', width: 12, example: '5' },
      { header: 'ELEC Closed', width: 12, example: '4' },
      { header: 'MECH Open', width: 12, example: '8' },
      { header: 'MECH Closed', width: 12, example: '6' },
      { header: 'OPER Open', width: 12, example: '3' },
      { header: 'OPER Closed', width: 12, example: '3' },
      { header: 'Compliance Rate', width: 18, example: '85.5' },
    ],
    customer_satisfaction: [
      { header: 'Rig', width: 15, example: 'ADC-225' },
      { header: 'Month', width: 12, example: 'January' },
      { header: 'Year', width: 10, example: '2024' },
      { header: 'Satisfaction Score', width: 18, example: '92.5' },
      { header: 'Feedback', width: 40, example: 'Excellent service' },
      { header: 'Client', width: 20, example: 'ADNOC' },
    ],
    rig_moves: [
      { header: 'Rig', width: 15, example: 'ADC-225' },
      { header: 'Move Date', width: 12, example: '2024-01-15' },
      { header: 'From Location', width: 25, example: 'Bab Field' },
      { header: 'To Location', width: 25, example: 'Habshan Field' },
      { header: 'Distance (km)', width: 15, example: '45' },
      { header: 'Budgeted Time (hrs)', width: 20, example: '12' },
      { header: 'Actual Time (hrs)', width: 20, example: '10.5' },
      { header: 'Budgeted Cost', width: 18, example: '25000' },
      { header: 'Actual Cost', width: 18, example: '22000' },
      { header: 'Variance Cost', width: 18, example: '-3000' },
      { header: 'Profit/Loss', width: 15, example: '3000' },
      { header: 'Remarks', width: 30, example: 'Completed ahead of schedule' },
    ],
    well_tracker: [
      { header: 'Rig', width: 15, example: 'ADC-225' },
      { header: 'Well Name', width: 20, example: 'BHD-2024-001' },
      { header: 'Start Date', width: 12, example: '2024-01-05' },
      { header: 'End Date', width: 12, example: '2024-02-15' },
      { header: 'Target Depth', width: 15, example: '3500' },
      { header: 'Actual Depth', width: 15, example: '3245' },
      { header: 'Status', width: 15, example: 'Drilling' },
      { header: 'Operator', width: 20, example: 'ADNOC' },
      { header: 'Location', width: 25, example: 'Bab Field' },
    ],
    ytd: [
      { header: 'Rig', width: 15, example: 'ADC-225' },
      { header: 'Month', width: 12, example: 'January' },
      { header: 'Year', width: 10, example: '2024' },
      { header: 'Dayrate Actual', width: 15, example: '25000' },
      { header: 'Dayrate Budget', width: 15, example: '24000' },
      { header: 'Working Days', width: 15, example: '28' },
      { header: 'Revenue Actual', width: 18, example: '700000' },
      { header: 'Revenue Budget', width: 18, example: '672000' },
      { header: 'Variance', width: 15, example: '28000' },
      { header: 'Fuel', width: 12, example: '12000' },
      { header: 'NPT Repair', width: 15, example: '5000' },
      { header: 'NPT Zero', width: 12, example: '0' },
      { header: 'Comments', width: 30, example: 'On schedule' },
      { header: 'Client', width: 20, example: 'ADNOC' },
    ],
  };

  const columns = templates[type] || [];
  
  // Create worksheet data
  const headers = columns.map(col => col.header);
  const examples = columns.map(col => col.example || '');
  
  const wsData = [headers, examples];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  ws['!cols'] = columns.map(col => ({ wch: col.width || 15 }));
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  
  // Generate buffer
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Download template file
 */
export function downloadTemplate(type: string, filename: string) {
  const blob = generateTemplate(type);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
