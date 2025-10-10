import * as XLSX from 'xlsx';

export interface ParsedData {
  [key: string]: any[];
}

export interface ValidationError {
  row: number;
  column: string;
  message: string;
  value: any;
}

export interface ParseResult {
  data: ParsedData;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Parse Excel file and return structured data
 */
export async function parseExcelFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const parsedData: ParsedData = {};
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];
        
        // Parse all sheets
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            raw: false,
            defval: null 
          });
          
          parsedData[sheetName] = jsonData;
        });
        
        resolve({ data: parsedData, errors, warnings });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Validate revenue data
 */
export function validateRevenueData(data: any[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  data.forEach((row, index) => {
    if (!row.Rig) {
      errors.push({
        row: index + 2,
        column: 'Rig',
        message: 'Rig name is required',
        value: row.Rig
      });
    }
    
    if (row.DayrateActual && isNaN(parseFloat(row.DayrateActual))) {
      errors.push({
        row: index + 2,
        column: 'DayrateActual',
        message: 'Dayrate Actual must be a number',
        value: row.DayrateActual
      });
    }
    
    if (row.RevenueActual && row.RevenueActual < 0) {
      errors.push({
        row: index + 2,
        column: 'RevenueActual',
        message: 'Revenue Actual cannot be negative',
        value: row.RevenueActual
      });
    }
  });
  
  return errors;
}

/**
 * Validate work orders data
 */
export function validateWorkOrdersData(data: any[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  data.forEach((row, index) => {
    if (!row.Rig) {
      errors.push({
        row: index + 2,
        column: 'Rig',
        message: 'Rig name is required',
        value: row.Rig
      });
    }
    
    const numberFields = ['ELECOpen', 'ELECClosed', 'MECHOpen', 'MECHClosed', 'OPEROpen', 'OPERClosed'];
    numberFields.forEach(field => {
      if (row[field] !== null && row[field] !== undefined && isNaN(parseInt(row[field]))) {
        errors.push({
          row: index + 2,
          column: field,
          message: `${field} must be a number`,
          value: row[field]
        });
      }
    });
  });
  
  return errors;
}

/**
 * Map Excel column names to database field names
 */
export function mapExcelToDbFields(data: any, type: string): any {
  const mappings: { [key: string]: { [key: string]: string } } = {
    revenue: {
      'Rig': 'rig',
      'Month': 'month',
      'Year': 'year',
      'Dayrate Actual': 'dayrate_actual',
      'Dayrate Budget': 'dayrate_budget',
      'Working Days': 'working_days',
      'Revenue Actual': 'revenue_actual',
      'Revenue Budget': 'revenue_budget',
      'Variance': 'variance',
      'Fuel': 'fuel_charge',
      'NPT Repair': 'npt_repair',
      'NPT Zero': 'npt_zero',
      'Comments': 'comments',
      'Client': 'client',
    },
    work_orders: {
      'Rig': 'rig',
      'Month': 'month',
      'Year': 'year',
      'ELEC Open': 'elec_open',
      'ELEC Closed': 'elec_closed',
      'MECH Open': 'mech_open',
      'MECH Closed': 'mech_closed',
      'OPER Open': 'oper_open',
      'OPER Closed': 'oper_closed',
      'Compliance Rate': 'compliance_rate',
    },
    billing_npt: {
      'Rig Number': 'rig',
      'Date': 'date',
      'SYSTEM': 'system',
      'Part Equipment Failure': 'equipment_failure',
      'Root Cause': 'root_cause',
      'Hrs.': 'npt_hours',
      'NPT type': 'billable',
      'Immediate Corrective action': 'corrective_action',
      'Future Action & Improvement': 'comments',
      'Notification Number (N2)': 'notification_number',
    },
    fuel: {
      'Rig': 'rig',
      'Date': 'date',
      'Fuel Consumed': 'fuel_consumed',
      'Fuel Type': 'fuel_type',
      'Unit Price': 'unit_price',
      'Total Cost': 'total_cost',
      'Supplier': 'supplier',
      'Remarks': 'remarks',
    },
    stock: {
      'Rig': 'rig',
      'Item Name': 'item_name',
      'Category': 'category',
      'Current Qty': 'current_qty',
      'Target Qty': 'target_qty',
      'Unit': 'unit',
      'Last Reorder Date': 'last_reorder_date',
      'Status': 'status',
    },
    rig_moves: {
      'Rig': 'rig',
      'Move Date': 'move_date',
      'From Location': 'from_location',
      'To Location': 'to_location',
      'Distance (km)': 'distance_km',
      'Budgeted Time (hrs)': 'budgeted_time_hours',
      'Actual Time (hrs)': 'actual_time_hours',
      'Budgeted Cost': 'budgeted_cost',
      'Actual Cost': 'actual_cost',
      'Variance Cost': 'variance_cost',
      'Profit/Loss': 'profit_loss',
      'Remarks': 'remarks',
    },
    utilization: {
      'Year': 'year',
      'month': 'month',
      'Rig': 'rig',
      'Coment': 'comment',
      '% Utilization': 'utilization_rate',
      'Allowable NPT': 'allowable_npt',
      'NPT Type': 'npt_type',
      'Total working Days': 'working_days',
      'Monthly Total Days': 'monthly_total_days',
    },
    customer_satisfaction: {
      'Rig': 'rig',
      'Month': 'month',
      'Year': 'year',
      'Client': 'client',
      'Satisfaction Score': 'satisfaction_score',
      'Feedback': 'feedback',
    },
    well_tracker: {
      'Rig': 'rig',
      'Well Name': 'well_name',
      'Start Date': 'start_date',
      'End Date': 'end_date',
      'Target Depth': 'target_depth',
      'Actual Depth': 'actual_depth',
      'Status': 'status',
      'Operator': 'operator',
      'Location': 'location',
    },
    ytd: {
      'Rig': 'rig',
      'Month': 'month',
      'Year': 'year',
      'Dayrate Actual': 'dayrate_actual',
      'Dayrate Budget': 'dayrate_budget',
      'Working Days': 'working_days',
      'Revenue Actual': 'revenue_actual',
      'Revenue Budget': 'revenue_budget',
      'Variance': 'variance',
      'Fuel': 'fuel_charge',
      'NPT Repair': 'npt_repair',
      'NPT Zero': 'npt_zero',
      'Comments': 'comments',
      'Client': 'client',
    },
  };
  
  const mapping = mappings[type] || {};
  const mapped: any = {};
  
  // Only map columns that are explicitly defined in the mapping
  Object.keys(data).forEach(key => {
    if (mapping[key]) {
      // Only include mapped columns
      mapped[mapping[key]] = data[key];
    }
  });
  
  // If no columns were mapped, log warning
  if (Object.keys(mapped).length === 0) {
    console.warn(`No columns matched for type "${type}". Available columns:`, Object.keys(data));
  }
  
  return mapped;
}
