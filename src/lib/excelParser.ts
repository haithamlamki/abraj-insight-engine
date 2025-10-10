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
 * Helper function to parse numeric values that might have % or other characters
 */
function parseNumeric(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const stringValue = String(value).replace(/[%,]/g, '').trim();
  const parsed = parseFloat(stringValue);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Normalize header names to avoid mismatches due to spaces/case/punctuation
 */
function normalizeHeader(str: any): string {
  return String(str || '')
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width chars
    .replace(/[()%.,]/g, '') // common punctuation
    .replace(/\s+/g, ' ') // collapse spaces
    .trim();
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
      'Rig Numb': 'rig',
      'Rig': 'rig',
      'Year': 'year',
      'Month': 'month',
      'Mont': 'month',
      'Date': 'date',
      'Hrs.': 'npt_hours',
      'Hrs': 'npt_hours',
      'NPT Hours': 'npt_hours',
      'NPT type': 'npt_type',
      'NPT typ': 'npt_type',
      'SYSTEM': 'system',
      'System': 'system',
      'Parent Equipment Failure': 'parent_equipment_failure',
      'Parent Equipment Fail': 'parent_equipment_failure',
      'Part Equipment Failure': 'part_equipment_failure',
      'Part Equipment Fail': 'part_equipment_failure',
      'Contractual Process': 'contractual_process',
      'Contractual Proces': 'contractual_process',
      'Department Responsibility': 'department_responsibility',
      'Department Responsibil': 'department_responsibility',
      'Immediate Cause of Failure': 'immediate_cause',
      'Root Cause': 'root_cause',
      'Immediate Corrective action': 'corrective_action',
      'Immediate Corrective Action': 'corrective_action',
      'Immediate Corrective act': 'corrective_action',
      'Corrective Action': 'corrective_action',
      'Future Action & Improvement': 'future_action',
      'Future Action and Improvement': 'future_action',
      'Action Party': 'action_party',
      'Notification Number (N2)': 'notification_number',
      'Notification Number': 'notification_number',
      'Failure investigation reports': 'failure_investigation_reports',
      'Failure investigation report': 'failure_investigation_reports',
      'Equipment Failure': 'equipment_failure',
      'Billable': 'billable',
      'Comments': 'comments',
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
  
  const sourceMapping = mappings[type] || {};
  // Build a normalized mapping for robust matching
  const mappingNormalized: { [key: string]: string } = Object.keys(sourceMapping).reduce((acc, key) => {
    acc[normalizeHeader(key)] = sourceMapping[key];
    return acc;
  }, {} as { [key: string]: string });

  const mapped: any = {};
  
  // Only map columns that are explicitly defined in the mapping (normalized)
  Object.keys(data).forEach((key) => {
    const dbField = mappingNormalized[normalizeHeader(key)];
    if (!dbField) return;

    let value = data[key];

    // Parse numeric/typed fields based on type
    if (type === 'utilization') {
      if (
        dbField === 'utilization_rate' ||
        dbField === 'allowable_npt' ||
        dbField === 'working_days' ||
        dbField === 'monthly_total_days'
      ) {
        value = parseNumeric(value);
      } else if (dbField === 'year') {
        value = value !== null && value !== undefined && String(value).trim() !== '' ? parseInt(String(value).trim()) : null;
      } else if (dbField === 'rig') {
        value = value !== null && value !== undefined ? String(value).trim() : '';
      } else if (dbField === 'npt_type' || dbField === 'comment' || dbField === 'month') {
        value = value !== null && value !== undefined ? String(value).trim() : null;
      }
    } else if (type === 'billing_npt') {
      if (dbField === 'npt_hours') {
        value = parseNumeric(value);
      } else if (dbField === 'year') {
        value = value !== null && value !== undefined && String(value).trim() !== '' ? parseInt(String(value).trim()) : null;
      } else if (dbField === 'billable') {
        const s = String(value || '').toLowerCase();
        value = s === 'yes' || s === 'y' || s === 'true' || s === '1' || s === 'billable';
      } else if ([
        'rig','month','npt_type','system','parent_equipment_failure','part_equipment_failure','contractual_process','department_responsibility','immediate_cause','root_cause','corrective_action','future_action','action_party','notification_number','failure_investigation_reports','comments','equipment_failure'
      ].includes(dbField)) {
        value = value !== null && value !== undefined ? String(value).trim() : null;
      }
    }

    mapped[dbField] = value;
  });
  
  // If no columns were mapped, log warning
  if (Object.keys(mapped).length === 0) {
    console.warn(`No columns matched for type "${type}". Available columns:`, Object.keys(data));
  }
  
  return mapped;
}
