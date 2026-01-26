import * as XLSX from 'xlsx';

export interface ParsedData {
  [key: string]: any[];
}

export interface ValidationError {
  row: number;
  column: string;
  message: string;
  value: any;
  autoFixable?: boolean;
  suggestedFix?: string;
  severity?: 'error' | 'warning' | 'info';
}

export interface ParseResult {
  data: ParsedData;
  errors: ValidationError[];
  warnings: ValidationError[];
  autoCorrections?: string[];
}

export interface DateCompositionResult {
  date: string | null;
  autoConverted: boolean;
  suggestions: string[];
}

/**
 * Convert month name to number (1-12)
 * Handles: Jan, January, jan, JANUARY, Sept, Sep, September, etc.
 */
export function convertMonthToNumber(monthInput: any): { month: number | null; converted: boolean } {
  if (monthInput === null || monthInput === undefined) {
    return { month: null, converted: false };
  }
  
  const str = String(monthInput).trim().toLowerCase();
  
  // Month name map
  const monthMap: { [key: string]: number } = {
    jan: 1, january: 1,
    feb: 2, february: 2,
    mar: 3, march: 3,
    apr: 4, april: 4,
    may: 5,
    jun: 6, june: 6,
    jul: 7, july: 7,
    aug: 8, august: 8,
    sep: 9, sept: 9, september: 9,
    oct: 10, october: 10,
    nov: 11, november: 11,
    dec: 12, december: 12
  };
  
  // Check if it's a month name
  if (monthMap[str]) {
    return { month: monthMap[str], converted: true };
  }
  
  // Try parsing as number
  const num = parseInt(str);
  if (!isNaN(num) && num >= 1 && num <= 12) {
    return { month: num, converted: false };
  }
  
  return { month: null, converted: false };
}

/**
 * Extract day number from various formats
 * Handles: 24, "24", "1/24/1900" (Excel date format), etc.
 */
function extractDayNumber(dayVal: any): number | null {
  if (dayVal === null || dayVal === undefined || String(dayVal).trim() === '') {
    return null;
  }
  
  const str = String(dayVal).trim();
  
  // If it looks like a date string (contains /), extract the day portion
  // Excel might format day "24" as "1/24/1900" when the cell is formatted as date
  if (str.includes('/')) {
    const parts = str.split('/');
    // Format could be M/D/YYYY or D/M/YYYY
    // Since we're composing with Year and Month separately, we just need the day
    // Try the second part first (most common: M/D/YYYY)
    const dayCandidate = parseInt(parts[1]);
    if (!isNaN(dayCandidate) && dayCandidate >= 1 && dayCandidate <= 31) {
      return dayCandidate;
    }
    // Try first part as fallback
    const dayCandidate2 = parseInt(parts[0]);
    if (!isNaN(dayCandidate2) && dayCandidate2 >= 1 && dayCandidate2 <= 31) {
      return dayCandidate2;
    }
  }
  
  // Otherwise try parsing as number directly
  const num = parseInt(str);
  if (!isNaN(num) && num >= 1 && num <= 31) {
    return num;
  }
  
  return null;
}

/**
 * Compose date from Year, Month, Date columns
 * Returns date string (YYYY-MM-DD) and metadata about conversions
 */
export function composeDateFromYMD(
  yearVal: any,
  monthVal: any,
  dayVal: any
): DateCompositionResult {
  const suggestions: string[] = [];
  let autoConverted = false;
  
  // Parse year
  const year = yearVal ? parseInt(String(yearVal).trim()) : NaN;
  if (isNaN(year) || year < 1900 || year > 2100) {
    return { date: null, autoConverted: false, suggestions: ['Invalid year'] };
  }
  
  // Parse month (with name conversion)
  const monthResult = convertMonthToNumber(monthVal);
  if (!monthResult.month) {
    return { date: null, autoConverted: false, suggestions: ['Invalid month'] };
  }
  if (monthResult.converted) {
    suggestions.push(`Month "${monthVal}" → ${monthResult.month}`);
    autoConverted = true;
  }
  
  // Parse day using enhanced extraction
  const day = extractDayNumber(dayVal);
  if (!day) {
    return { date: null, autoConverted, suggestions: [`Invalid day: "${dayVal}"`] };
  }
  
  // If day was extracted from Excel date format, note it
  if (String(dayVal).includes('/')) {
    suggestions.push(`Day extracted from Excel date format: "${dayVal}" → ${day}`);
    autoConverted = true;
  }
  
  // Compose date
  const dateObj = new Date(Date.UTC(year, monthResult.month - 1, day));
  if (isNaN(dateObj.getTime())) {
    return { date: null, autoConverted, suggestions: ['Invalid date combination'] };
  }
  
  // Check if date is valid (e.g., not Feb 30)
  if (dateObj.getUTCDate() !== day) {
    return { date: null, autoConverted, suggestions: ['Invalid date (e.g., Feb 30)'] };
  }
  
  const dateStr = dateObj.toISOString().split('T')[0];
  if (suggestions.length === 0) {
    suggestions.push(`Composed from Year(${year}) + Month(${monthResult.month}) + Day(${day})`);
  }
  
  return { date: dateStr, autoConverted, suggestions };
}

/**
 * Extract client name and status from comment field
 * Handles patterns like "Working with PDO", "worked with OXY", "Stacked", etc.
 */
export function extractClientAndStatus(comment: string): { client: string | null; status: string } {
  if (!comment || typeof comment !== 'string') {
    return { client: null, status: 'Active' };
  }
  
  const commentUpper = comment.toUpperCase().trim();
  
  // Check for stacked status first
  if (commentUpper.includes('STACKED') || commentUpper.includes('STACK')) {
    return { client: null, status: 'Stacked' };
  }
  
  // Check for inactive indicators
  if (commentUpper === 'N/A' || commentUpper === 'NA' || commentUpper.includes('INACTIVE')) {
    return { client: null, status: 'Inactive' };
  }
  
  let extractedClient: string | null = null;
  
  // First try to extract from "Working with [Client]" or "worked with [Client]" patterns
  const workingWithMatch = comment.match(/(?:working|worked)\s+with\s+([a-zA-Z0-9.\s]+?)(?:\s*[,.]|$)/i);
  if (workingWithMatch) {
    extractedClient = workingWithMatch[1].trim().toUpperCase();
  }
  
  // If no "working with" pattern, try direct client name matching
  if (!extractedClient) {
    // Client patterns (order matters - check longer names first)
    const clientPatterns: { [key: string]: RegExp } = {
      'PETROGAS': /PETROGAS/i,
      'OMAN OIL': /OMAN\s+OIL/i,
      'TETHYS': /TETHYS/i,
      'K.S.C': /K\.?S\.?C/i,
      'MEDCO': /MEDCO/i,
      'CCED': /CCED/i,
      'PDO': /\bPDO\b/i,
      'OXY': /\bOXY\b/i,
      'OQ': /\bOQ\b/i,
      'BP': /\bBP\b/i,
    };
    
    // Try to match client patterns
    for (const [clientName, pattern] of Object.entries(clientPatterns)) {
      if (pattern.test(comment)) {
        extractedClient = clientName;
        break;
      }
    }
  }
  
  // Determine status: Active if client found, otherwise Active by default
  const status = extractedClient ? 'Active' : 'Active';
  
  return { client: extractedClient, status };
}

/**
 * Check if a row should be skipped (all required fields are empty)
 * @param row - Mapped data row
 * @param reportType - Report type identifier
 * @returns true if row should be skipped, false otherwise
 */
export function shouldSkipEmptyRow(row: any, reportType: string): boolean {
  if (!row) return true;
  
  // Define required fields for each report type
  const requiredFieldsByType: { [key: string]: string[] } = {
    npt_root_cause: ['rig_number', 'year', 'month', 'date', 'hrs', 'npt_type', 'system'],
    billing_npt: ['rig', 'date', 'year', 'month'],
    billing_npt_summary: ['rig', 'year', 'month'],
    revenue: ['rig', 'year', 'month'],
    utilization: ['rig', 'year', 'month'],
    fuel: ['rig', 'year', 'month', 'fuel_cost'],
    rig_moves: ['rig', 'move_date'],
    work_orders: ['rig', 'work_order_number'],
    stock: ['item_name', 'rig'],
    well_tracker: ['well_name', 'rig'],
    customer_satisfaction: ['rig', 'year', 'month'],
  };
  
  const requiredFields = requiredFieldsByType[reportType];
  if (!requiredFields) return false; // Unknown report type, don't skip
  
  // Check if ALL required fields are empty/null/undefined
  const allFieldsEmpty = requiredFields.every(field => {
    const value = row[field];
    return value === null || value === undefined || value === '' || 
           (typeof value === 'string' && value.trim() === '');
  });
  
  return allFieldsEmpty;
}

/**
 * Filter out empty template rows from data array
 * @param data - Array of mapped data rows
 * @param reportType - Report type identifier
 * @returns Filtered data and count of skipped rows
 */
export function filterEmptyRows(data: any[], reportType: string): { 
  filteredData: any[]; 
  skippedCount: number; 
} {
  const filteredData = data.filter(row => !shouldSkipEmptyRow(row, reportType));
  const skippedCount = data.length - filteredData.length;
  
  return { filteredData, skippedCount };
}

/**
 * Validate utilization data with enhanced checks
 */
export function validateUtilizationData(data: any[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  data.forEach((row, index) => {
    if (isBlankRow(row)) return;
    
    // Required fields
    if (!row.Rig && !row.rig) {
      errors.push({
        row: index + 2,
        column: 'Rig',
        message: 'Rig is required',
        value: null,
        severity: 'error'
      });
    }
    
    if (!row.Year && !row.year) {
      errors.push({
        row: index + 2,
        column: 'Year',
        message: 'Year is required',
        value: null,
        severity: 'error'
      });
    }
    
    // Check month
    const monthVal = row.Month ?? row.month ?? row.Mounth;
    if (!monthVal) {
      errors.push({
        row: index + 2,
        column: 'Month',
        message: 'Month is required',
        value: null,
        severity: 'error'
      });
    }
    
    // Validate utilization percentage
    const utilizationVal = row['% Utilization'] ?? row['%Utilization'] ?? row.Utilization;
    if (utilizationVal) {
      const utilization = parseNumeric(utilizationVal);
      if (utilization !== null && (utilization < 0 || utilization > 100)) {
        errors.push({
          row: index + 2,
          column: '% Utilization',
          message: 'Utilization must be between 0 and 100',
          value: utilizationVal,
          severity: 'warning'
        });
      }
    }
    
    // Validate working days vs monthly total days
    const workingDays = parseNumeric(row['Total working Days'] ?? row['Total Working Days']);
    const monthlyTotal = parseNumeric(row['Monthly Total Days']);
    if (workingDays !== null && monthlyTotal !== null && workingDays > monthlyTotal) {
      errors.push({
        row: index + 2,
        column: 'Total working Days',
        message: 'Working days cannot exceed monthly total days',
        value: `${workingDays} > ${monthlyTotal}`,
        severity: 'warning'
      });
    }
  });
  
  return errors;
}

/**
 * Check if a row is completely blank
 */
export function isBlankRow(row: any): boolean {
  if (!row || typeof row !== 'object') return true;
  
  const values = Object.values(row);
  return values.every(val => 
    val === null || 
    val === undefined || 
    String(val).trim() === ''
  );
}

/**
 * Check if a row looks like a title/header row (merged cell pattern)
 */
export function isTitleRow(row: any): boolean {
  if (!row || typeof row !== 'object') return false;
  
  const values = Object.values(row);
  const nonEmpty = values.filter(val => 
    val !== null && 
    val !== undefined && 
    String(val).trim() !== ''
  );
  
  // Title rows typically have 1-2 non-empty cells out of many
  return nonEmpty.length > 0 && nonEmpty.length <= 2 && values.length > 5;
}

/**
 * Check if a row looks like a header row with column names
 */
export function isHeaderRow(row: any): boolean {
  if (!row || typeof row !== 'object') return false;
  
  // Common header keywords (lowercase for comparison)
  const headerKeywords = [
    'year', 'years', 'month', 'months', 'mounth', 'rig', 'rigs', 'rig number',
    'actual', 'budget', 'budgeted', 'fuel', 'total', 'diff', 'difference',
    'npt', 'repair', 'zero', 'comments', 'comment', 'status', 'client',
    'revenue', 'cost', 'hours', 'hrs', 'date', 'days', 'rate'
  ];
  
  const values = Object.values(row);
  const textValues = values
    .filter(val => val !== null && val !== undefined && String(val).trim() !== '')
    .map(val => String(val).toLowerCase().trim());
  
  // If more than 50% of non-empty values are header keywords, it's likely a header row
  if (textValues.length < 3) return false;
  
  const matchingKeywords = textValues.filter(val => 
    headerKeywords.some(keyword => val === keyword || val.includes(keyword))
  );
  
  return matchingKeywords.length >= Math.max(3, textValues.length * 0.5);
}

/**
 * Parse Excel file and return structured data
 */
export async function parseExcelFile(file: File, autoCorrect: boolean = false): Promise<ParseResult> {
  try {
    // Basic guardrails and clearer errors
    if (!file) throw new Error('No file provided');
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('File too large (>20MB). Please split the workbook.');
    }

    let workbook: XLSX.WorkBook;

    // Use robust arrayBuffer-only approach with fallback
    try {
      const buf = await file.arrayBuffer();
      console.info('[parseExcelFile] File size:', buf.byteLength, 'bytes');
      
      // Try primary read with optimal settings
      try {
        workbook = XLSX.read(buf, { 
          type: 'array', 
          cellDates: true, 
          raw: true, 
          codepage: 65001 // UTF-8
        });
        console.info('[parseExcelFile] Successfully parsed with primary method');
      } catch (e1) {
        console.warn('[parseExcelFile] Primary read failed, trying Uint8Array fallback', e1);
        // Fallback: try with Uint8Array
        const u8 = new Uint8Array(buf);
        workbook = XLSX.read(u8, { 
          type: 'array', 
          raw: true 
        });
        console.info('[parseExcelFile] Successfully parsed with Uint8Array fallback');
      }
    } catch (e) {
      const originalError = e instanceof Error ? e.message : String(e);
      console.error('[parseExcelFile] Failed to read Excel file:', originalError);
      throw new Error(
        `Unable to read Excel file: ${originalError}. ` +
        `Try re-saving the file as .xlsx (not .xls), remove macros/password protection, and re-upload.`
      );
    }

    const parsedData: ParsedData = {};
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const autoCorrections: string[] = [];

    // Parse all sheets
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      let jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
        raw: true,
        defval: null,
      });

      console.log(`[parseExcelFile] Sheet: ${sheetName}, Rows: ${jsonData.length}`);
      if (jsonData.length > 0) {
        console.log(`[parseExcelFile] First row keys:`, Object.keys(jsonData[0]));
        console.log(`[parseExcelFile] First row:`, jsonData[0]);
      }

      // Header repair when keys look like __EMPTY or numeric
      const hasEmptyOrNumericKeys = jsonData[0] && Object.keys(jsonData[0]).some(k => k.startsWith('__EMPTY') || /^\d+(_\d+)?$/.test(k));
      const firstVals = jsonData[0] ? Object.values(jsonData[0]).map(v => String(v ?? '').trim().toLowerCase()) : [];
      const headerRowLikely = firstVals.includes('year') && firstVals.includes('rig') && (firstVals.includes('month') || firstVals.includes('mounth') || firstVals.includes('mont'));

      if (hasEmptyOrNumericKeys || headerRowLikely) {
        const rowsAoA: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: null });
        const headerIdx = (() => {
          for (let i = 0; i < Math.min(rowsAoA.length, 20); i++) {
            const vals = (rowsAoA[i] || []).map(c => String(c ?? '').trim().toLowerCase());
            if (vals.includes('year') && vals.includes('rig') && (vals.includes('month') || vals.includes('mounth') || vals.includes('mont'))) {
              return i;
            }
          }
          return -1;
        })();

        if (headerIdx >= 0) {
          const headersRaw = rowsAoA[headerIdx] as any[];
          const headers = headersRaw.map((h, idx) => String(h ?? `col_${idx}`).trim());
          const rebuilt: any[] = [];
          for (let r = headerIdx + 1; r < rowsAoA.length; r++) {
            const row = rowsAoA[r] || [];
            const obj: any = {};
            headers.forEach((h, cIdx) => {
              obj[h] = row[cIdx] ?? null;
            });
            rebuilt.push(obj);
          }
          jsonData = rebuilt;
          console.log(`[parseExcelFile] Rebuilt using detected header row at index ${headerIdx}. New rows: ${jsonData.length}`);
          if (jsonData.length > 0) {
            console.log(`[parseExcelFile] Rebuilt first row keys:`, Object.keys(jsonData[0]));
            console.log(`[parseExcelFile] Rebuilt first row:`, jsonData[0]);
          }
        }
      }

      // Filter out blank and title rows
      const filteredData = jsonData.filter((row: any) => {
        if (isBlankRow(row)) return false;
        if (isTitleRow(row)) return false;
        if (isHeaderRow(row)) return false;
        return true;
      });

      console.log(`[parseExcelFile] Filtered to ${filteredData.length} rows`);
      
      // Check for zero data rows
      if (filteredData.length === 0 && jsonData.length > 0) {
        console.warn(`[parseExcelFile] Sheet "${sheetName}" has no data rows after filtering. All rows were blank or title rows.`);
      }
      
      parsedData[sheetName] = filteredData;
    });

    // Final check: ensure we have at least some data
    const totalRows = Object.values(parsedData).reduce((sum, rows) => sum + rows.length, 0);
    if (totalRows === 0) {
      throw new Error(
        'No data rows detected in the Excel file. ' +
        'Ensure your header row is not merged and is in row 1, or we can detect it within the first 20 rows. ' +
        'Make sure there are data rows below the headers.'
      );
    }

    return { data: parsedData, errors, warnings, autoCorrections };
  } catch (error) {
    console.error('[parseExcelFile] Error:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Validate revenue data
 */
export function validateRevenueData(data: any[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  data.forEach((row, index) => {
    // Skip blank rows
    if (isBlankRow(row)) return;
    
    // Check for required Rig field using normalized matching
    const rigVal = row.Rig ?? row.rig ?? getByNormalized(row, 'rig');
    if (!rigVal) {
      errors.push({
        row: index + 2,
        column: 'Rig',
        message: 'Rig is required',
        value: null,
        severity: 'error'
      });
    }
    
    // Check month format - recognize both "Month" and "Months" via normalized keys
    const monthVal = row.Months ?? row.Month ?? row.month ?? row.Mont ?? getByNormalized(row, 'months') ?? getByNormalized(row, 'month');
    if (monthVal) {
      const monthResult = convertMonthToNumber(monthVal);
      if (!monthResult.month) {
        errors.push({
          row: index + 2,
          column: 'Month',
          message: 'Invalid month format',
          value: monthVal,
          severity: 'error'
        });
      } else if (monthResult.converted) {
        errors.push({
          row: index + 2,
          column: 'Month',
          message: `Month name detected: "${monthVal}" → ${monthResult.month}`,
          value: monthVal,
          autoFixable: true,
          suggestedFix: `Auto-convert to ${monthResult.month}`,
          severity: 'info'
        });
      }
    }
    
    // Validate numeric fields - include both old and new names
    const numericFields = [
      'Dayrate Actual', 'Dayrate Budget', 'Working Days', 
      'Revenue Actual', 'Revenue Budget', 'Variance',
      'Actual', 'Total Rev', 'Budgeted Rev', 'Diff', 'Fuel', 'NPT Repair', 'NPT Zero'
    ];
    
    numericFields.forEach(field => {
      const value = row[field];
      if (value !== null && value !== undefined && value !== '') {
        const numValue = parseNumeric(value);
        if (numValue === null) {
          errors.push({
            row: index + 2,
            column: field,
            message: 'Must be a valid number',
            value,
            severity: 'error'
          });
        }
      }
    });
  });
  
  return errors;
}

/**
 * Validate billing NPT summary data (aggregated monthly format)
 */
export function validateBillingNPTSummaryData(data: any[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  console.log(`[validateBillingNPTSummaryData] Validating ${data.length} rows`);
  if (data.length > 0) {
    console.log(`[validateBillingNPTSummaryData] First row keys:`, Object.keys(data[0]));
    console.log(`[validateBillingNPTSummaryData] First row:`, data[0]);
  }
  
  data.forEach((row, index) => {
    // Skip blank rows
    if (isBlankRow(row)) return;

    // Robust header detection (handles Mounth/Mont, Rig No, etc.)
    const rig = row.Rig ?? row.rig ?? row['Rig Number'] ?? row['Rig No'] ?? getByNormalized(row, 'rig') ?? getByNormalized(row, 'rignumber') ?? getByNormalized(row, 'rigno');
    const year = row.Year ?? row.year ?? getByNormalized(row, 'year');
    const monthRaw = row.Month ?? row.month ?? row.Mont ?? row.Mounth ?? getByNormalized(row, 'month') ?? getByNormalized(row, 'months') ?? getByNormalized(row, 'mont') ?? getByNormalized(row, 'mounth');
    
    if (index === 0) {
      console.log(`[validateBillingNPTSummaryData] Row 0 - rig:`, rig, ', year:', year, ', month:', monthRaw);
    }

    if (!rig) {
      errors.push({
        row: index + 2,
        column: 'Rig',
        message: 'Rig number is required',
        value: rig,
        severity: 'error',
      });
    }
    
    if (!year) {
      errors.push({
        row: index + 2,
        column: 'Year',
        message: 'Year is required',
        value: year,
        severity: 'error',
      });
    }
    
    if (!monthRaw) {
      errors.push({
        row: index + 2,
        column: 'Month',
        message: 'Month is required',
        value: monthRaw,
        severity: 'error',
      });
    } else {
      // Validate recognizable month value and surface auto-conversion as info
      const monthCheck = convertMonthToNumber(monthRaw);
      if (!monthCheck.month) {
        errors.push({
          row: index + 2,
          column: 'Month',
          message: 'Invalid month format',
          value: monthRaw,
          severity: 'error',
        });
      } else if (monthCheck.converted) {
        errors.push({
          row: index + 2,
          column: 'Month',
          message: `Month name detected: "${monthRaw}" → ${monthCheck.month}`,
          value: monthRaw,
          autoFixable: true,
          suggestedFix: `Auto-convert to ${monthCheck.month}`,
          severity: 'info',
        });
      }
    }
  });
  
  return errors;
}

/**
 * Validate NPT root cause data
 * Simplified: Only validates core required fields (rig, year, month)
 * Other fields are optional to allow flexible data import
 */
export function validateNPTRootCauseData(data: any[]): ValidationError[] {
  const errors: ValidationError[] = [];

  console.log(`[validateNPTRootCauseData] Validating ${data.length} rows`);
  if (data.length > 0) {
    console.log(`[validateNPTRootCauseData] First row keys:`, Object.keys(data[0]));
    console.log(`[validateNPTRootCauseData] First row:`, data[0]);
  }

  data.forEach((row, index) => {
    // Skip blank rows
    if (isBlankRow(row)) return;

    // Robust header detection
    const rig = row['Rig Number'] ?? row.Rig ?? row.rig ?? getByNormalized(row, 'rignumber') ?? getByNormalized(row, 'rig');
    const year = row.Year ?? row.year ?? getByNormalized(row, 'year');
    const monthRaw = row.Month ?? row.month ?? row.Mont ?? row.Mounth ?? getByNormalized(row, 'month');
    const date = row.Date ?? row.date ?? row.Day ?? getByNormalized(row, 'date');
    const hrs = row['Hrs.'] ?? row.Hrs ?? row.Hours ?? getByNormalized(row, 'hrs');

    if (index === 0) {
      console.log(`[validateNPTRootCauseData] Row 0 - rig:`, rig, ', year:', year, ', month:', monthRaw, ', hrs:', hrs);
    }

    // Only validate core required fields: rig, year, month
    if (!rig) {
      errors.push({
        row: index + 2,
        column: 'Rig Number',
        message: 'Rig number is required',
        value: rig,
        severity: 'error',
      });
    }

    if (!year) {
      errors.push({
        row: index + 2,
        column: 'Year',
        message: 'Year is required',
        value: year,
        severity: 'error',
      });
    }

    if (!monthRaw) {
      errors.push({
        row: index + 2,
        column: 'Month',
        message: 'Month is required',
        value: monthRaw,
        severity: 'error',
      });
    }

    // INFO messages for optional fields - won't block import
    if (!date && date !== 0) {
      errors.push({
        row: index + 2,
        column: 'Date',
        message: 'Date missing – will default to day 1',
        value: date,
        severity: 'info',
        autoFixable: true,
        suggestedFix: 'Set Date to 1'
      });
    }

    if (hrs === null || hrs === undefined || hrs === '') {
      errors.push({
        row: index + 2,
        column: 'Hrs.',
        message: 'Hours missing – will default to 0',
        value: hrs,
        severity: 'info',
        autoFixable: true,
        suggestedFix: 'Set Hours to 0'
      });
    }

    // NPT type and System are now optional - no validation errors
  });

  return errors;
}

/**
 * Validate work orders data
 */
export function validateWorkOrdersData(data: any[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  data.forEach((row, index) => {
    // Skip blank rows
    if (isBlankRow(row)) return;
    
    if (!row.Rig && !row.rig) {
      errors.push({
        row: index + 2,
        column: 'Rig',
        message: 'Rig is required',
        value: null,
        severity: 'error'
      });
    }
    
    // Check month format
    const monthVal = row.Month ?? row.month ?? row.Mont;
    if (monthVal) {
      const monthResult = convertMonthToNumber(monthVal);
      if (!monthResult.month) {
        errors.push({
          row: index + 2,
          column: 'Month',
          message: 'Invalid month format',
          value: monthVal,
          severity: 'error'
        });
      } else if (monthResult.converted) {
        errors.push({
          row: index + 2,
          column: 'Month',
          message: `Month name detected: "${monthVal}" → ${monthResult.month}`,
          value: monthVal,
          autoFixable: true,
          suggestedFix: `Auto-convert to ${monthResult.month}`,
          severity: 'info'
        });
      }
    }
    
    // Validate numeric fields
    const numericFields = ['ELEC Open', 'ELEC Closed', 'MECH Open', 'MECH Closed'];
    numericFields.forEach(field => {
      const value = row[field];
      if (value !== null && value !== undefined && value !== '') {
        const numValue = parseNumeric(value);
        if (numValue === null || numValue < 0) {
          errors.push({
            row: index + 2,
            column: field,
            message: 'Must be a non-negative number',
            value,
            severity: 'error'
          });
        }
      }
    });
  });
  
  return errors;
}


/**
 * Validate billing NPT data (skips blank/non-record rows)
 */
export function validateBillingNptData(data: any[]): ValidationError[] {
  const errors: ValidationError[] = [];

  const isEmpty = (v: any) => v === null || v === undefined || String(v).trim() === '';

  data.forEach((row, index) => {
    // Normalize common fields used to determine if a row is a real record
    const rigVal = row.Rig || row['Rig Number'] || row['Rig Numb'] || row['Rig number'] || row['Rig numb'];
    const dateVal = row.Date;
    const hrsVal = row['Hrs.'] ?? row['Hrs'] ?? row['NPT Hours'];
    const systemVal = row.SYSTEM ?? row.System;
    const nptTypeVal = row['NPT type'] ?? row['NPT Type'];

    // If the row has none of the relevant fields filled, skip (treat as blank/summary row)
    const hasRelevant = !(isEmpty(rigVal) && isEmpty(dateVal) && isEmpty(hrsVal) && isEmpty(systemVal) && isEmpty(nptTypeVal));
    if (!hasRelevant) {
      return; // skip validation for this row
    }

    // Now validate required fields for real records
    if (isEmpty(rigVal)) {
      errors.push({
        row: index + 2,
        column: 'Rig',
        message: 'Rig number is required',
        value: rigVal
      });
    }

    // Skip blank rows
    if (isBlankRow(row)) return;

    // Always compose date from Year+Month+Date columns (don't parse Date field directly)
    const yearVal = row.Year ?? row['year'];
    const monthVal = row.Month ?? row['month'] ?? row.Mont;
    const dayVal = row.Date;
    const composed = composeDateFromYMD(yearVal, monthVal, dayVal);

    if (!composed.date) {
      errors.push({
        row: index + 2,
        column: 'Date',
        message: `Cannot compose date: ${composed.suggestions.join(', ')}`,
        value: dayVal,
        severity: 'error'
      });
    } else if (composed.autoConverted) {
      // Date was composed with auto-conversions
      errors.push({
        row: index + 2,
        column: 'Date',
        message: `Date composed: ${composed.suggestions.join(', ')}`,
        value: dayVal,
        autoFixable: true,
        suggestedFix: composed.date,
        severity: 'info'
      });
    }

    if (!isEmpty(hrsVal)) {
      const hours = parseNumeric(hrsVal);
      if (hours === null) {
        errors.push({
          row: index + 2,
          column: 'Hrs.',
          message: 'Hours must be a valid number',
          value: hrsVal
        });
      }
    }
  });

  return errors;
}

/**
 * Validate billing NPT aggregated data (rate-based format)
 */
export function validateBillingNPTAggregated(data: any[]): ValidationError[] {
  const errors: ValidationError[] = [];

  data.forEach((row, index) => {
    if (isBlankRow(row)) return;

    // Required fields
    if (!row.Rig && !row.rig) {
      errors.push({
        row: index + 2,
        column: 'Rig',
        message: 'Rig is required',
        value: null,
        severity: 'error'
      });
    }

    if (!row.Year && !row.year) {
      errors.push({
        row: index + 2,
        column: 'Year',
        message: 'Year is required',
        value: null,
        severity: 'error'
      });
    }

    // Check month - handle "Mounth" typo
    const monthVal = row.Month ?? row.Mounth ?? row.month;
    if (!monthVal) {
      errors.push({
        row: index + 2,
        column: 'Month',
        message: 'Month is required',
        value: null,
        severity: 'error'
      });
    }

    // Validate numeric rate fields
    const rateFields = [
      'Opr. Rate', 'Reduce Rate', 'Repair Rate', 'Zero Rate', 
      'Special Rate', 'Rig Move', 'A.Maint', 'Total', 'Total NPT'
    ];

    rateFields.forEach(field => {
      const value = row[field];
      if (value !== null && value !== undefined && value !== '') {
        const numValue = parseNumeric(value);
        if (numValue === null) {
          errors.push({
            row: index + 2,
            column: field,
            message: 'Must be a valid number',
            value,
            severity: 'warning'
          });
        }
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
 * Helper function to parse date values safely
 */
function parseDate(value: any): string | null {
  if (value === null || value === undefined || value === '') return null;
  
  const stringValue = String(value).trim();
  
  // If it's just a single letter or clearly not a date, return null
  if (stringValue.length <= 2 && /^[a-z]+$/i.test(stringValue)) return null;
  
  try {
    // Try to parse as Excel serial date
    if (!isNaN(parseFloat(stringValue))) {
      const excelDate = parseFloat(stringValue);
      // Excel dates are days since 1900-01-01
      const date = new Date((excelDate - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    // Try to parse as regular date string
    const date = new Date(stringValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return null;
  } catch (error) {
    console.warn(`Could not parse date: ${stringValue}`);
    return null;
  }
}

/**
 * Normalize header names to avoid mismatches due to spaces/case/punctuation
 */
export function normalizeHeader(str: any): string {
  return String(str || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
    .replace(/[\s\u00A0]+/g, '') // Remove ALL whitespace including NBSP
    .replace(/[()%.,*]/g, '') // Remove common punctuation including asterisks
    .replace(/s$/i, '') // Remove trailing 's' for plural handling
    .trim();
}

/**
 * Enhanced field matching with support for common variations and abbreviations
 */
export function matchHeaderToField(excelHeader: string, dbField: string): boolean {
  const normalizedHeader = normalizeHeader(excelHeader);
  const normalizedField = normalizeHeader(dbField);
  
  // Direct match after normalization
  if (normalizedHeader === normalizedField) {
    return true;
  }
  
  // Common field variations and abbreviations
  const fieldVariations: { [key: string]: string[] } = {
    'month': ['month', 'mnth', 'mon'],
    'year': ['year', 'yr'],
    'rig': ['rig', 'rignumber', 'rigno', 'rignum'],
    'dayrateactual': ['actual', 'dayrateactual', 'dayrateact', 'dayrate'],
    'dayratebudget': ['dayratebudget', 'budgetdayrate', 'dayratebudg'],
    'workingday': ['workingday', 'workday', 'day'],
    'revenueactual': ['totalrev', 'revenueactual', 'actualrev', 'revenue', 'actual'],
    'revenuebudget': ['budgetedrev', 'revenuebudget', 'budgetrev', 'budget'],
    'variance': ['diff', 'difference', 'variance', 'var'],
    'fuelcharge': ['fuel', 'fuelcharge', 'fuelcost'],
    'nptrepair': ['nptrepair', 'repairnpt', 'repair'],
    'nptzero': ['nptzero', 'zeronpt', 'zero'],
    'client': ['client', 'customer', 'company'],
    'comment': ['comment', 'remark', 'note'],
    'utilizationpercentage': ['utilization', 'utilizationrate', 'util'],
  };
  
  // Check if normalized header matches any variation of the field
  const variations = fieldVariations[normalizedField] || [normalizedField];
  if (variations.some(v => normalizedHeader === v || normalizedHeader.includes(v) || v.includes(normalizedHeader))) {
    return true;
  }
  
  // Fallback: substring matching
  if (normalizedHeader.includes(normalizedField) || normalizedField.includes(normalizedHeader)) {
    return true;
  }
  
  return false;
}

/**
 * Helper to get value from row by normalized key
 */
function getByNormalized(row: any, normalizedKey: string): any {
  for (const k of Object.keys(row)) {
    if (normalizeHeader(k) === normalizedKey) {
      return row[k];
    }
  }
  return undefined;
}

/**
 * Apply type conversion to a single value based on field name and report type
 */
function applyTypeConversion(value: any, dbField: string, type: string): any {
  // Parse numeric/typed fields based on type
  if (type === 'revenue' || type === 'ytd') {
    if ([
      'dayrate_actual', 'dayrate_budget', 'working_days', 
      'revenue_actual', 'revenue_budget', 'variance',
      'fuel_charge', 'npt_repair', 'npt_zero'
    ].includes(dbField)) {
      return parseNumeric(value);
    } else if (dbField === 'year') {
      return value !== null && value !== undefined && String(value).trim() !== '' ? parseInt(String(value).trim()) : null;
    } else if (dbField === 'rig') {
      return value !== null && value !== undefined ? String(value).trim() : '';
    } else if (['month', 'comments', 'client'].includes(dbField)) {
      return value !== null && value !== undefined ? String(value).trim() : null;
    }
  } else if (type === 'utilization') {
    if ([
      'utilization_rate', 'allowable_npt', 'working_days', 'monthly_total_days'
    ].includes(dbField)) {
      return parseNumeric(value);
    } else if (dbField === 'year') {
      return value !== null && value !== undefined && String(value).trim() !== '' ? parseInt(String(value).trim()) : null;
    } else if (dbField === 'rig') {
      return value !== null && value !== undefined ? String(value).trim() : '';
    } else if (['npt_type', 'comment', 'month', 'client', 'status'].includes(dbField)) {
      return value !== null && value !== undefined ? String(value).trim() : null;
    }
  } else if (type === 'billing_npt') {
    if (dbField === 'npt_hours') {
      return parseNumeric(value);
    } else if (dbField === 'year') {
      return value !== null && value !== undefined && String(value).trim() !== '' ? parseInt(String(value).trim()) : null;
    } else if (dbField === 'date') {
      return null; // Will be composed from Y+M+D later
    } else if (dbField === 'billable') {
      const s = String(value || '').toLowerCase();
      return s === 'yes' || s === 'y' || s === 'true' || s === '1' || s === 'billable';
    } else if ([
      'rig','month','npt_type','system','parent_equipment_failure','part_equipment_failure','contractual_process','department_responsibility','immediate_cause','root_cause','corrective_action','future_action','action_party','notification_number','failure_investigation_reports','comments','equipment_failure'
    ].includes(dbField)) {
      return value !== null && value !== undefined ? String(value).trim() : null;
    }
  } else if (type === 'npt_root_cause') {
    // CRITICAL: Always convert rig_number to string explicitly
    if (dbField === 'rig_number') {
      return value !== null && value !== undefined && value !== '' ? String(value).trim() : null;
    } else if (dbField === 'hrs') {
      return parseNumeric(value);
    } else if (dbField === 'year') {
      return value !== null && value !== undefined && String(value).trim() !== '' ? parseInt(String(value).trim()) : null;
    } else if (dbField === 'date') {
      return value !== null && value !== undefined && String(value).trim() !== '' ? parseInt(String(value).trim()) : null;
    } else if ([
      'month', 'npt_type', 'system', 'parent_equipment_failure',
      'part_equipment_failure', 'contractual_process', 'department_responsibility',
      'immediate_cause_of_failure', 'root_cause', 'immediate_corrective_action',
      'future_action_improvement', 'action_party', 'notification_number',
      'failure_investigation_reports'
    ].includes(dbField)) {
      return value !== null && value !== undefined ? String(value).trim() : null;
    }
  } else if (type === 'fuel' || type === 'rig_moves' || type === 'well_tracker' || type === 'stock' || type === 'ytd') {
    // Don't parse date fields directly - they will be composed from Y+M+D later
    if (dbField === 'date' || dbField === 'move_date' || dbField === 'start_date' || dbField === 'end_date' || dbField === 'last_reorder_date') {
      return null;
    }
  }
  
  // Return value as-is if no specific conversion applies
  return value;
}

/**
 * Apply post-mapping transformations like date composition and month conversion
 */
function applyPostMappingTransformations(mapped: any, type: string, originalData: any): any {
  // Universal date composition for ALL types with Year+Month+Date columns
  const dateCompositionTypes = ['billing_npt', 'fuel', 'rig_moves', 'well_tracker', 'stock', 'ytd'];
  if (dateCompositionTypes.includes(type)) {
    const yearVal = mapped.year ?? (originalData['Year'] ?? originalData['year']);
    const monthVal = originalData['Month'] ?? originalData['month'] ?? originalData['Mont'];
    const dayVal = originalData['Date'] ?? originalData['date'] ?? originalData['Day'];
    
    const composed = composeDateFromYMD(yearVal, monthVal, dayVal);
    if (composed.date) {
      mapped.date = composed.date;
      // Extract year and month from the composed date if not already set
      if (!mapped.year && composed.date) {
        mapped.year = parseInt(composed.date.substring(0, 4));
      }
      if (!mapped.month && composed.date) {
        mapped.month = composed.date.substring(5, 7);
      }
    }
  }
  
  // Convert month name to number if needed (for specific types)
  const typesWithMonthField = ['revenue', 'work_orders', 'customer_satisfaction', 'utilization', 'ytd', 'billing_npt_summary', 'npt_root_cause'];
  if (typesWithMonthField.includes(type) && mapped.month) {
    const monthResult = convertMonthToNumber(mapped.month);
    if (monthResult.month) {
      mapped.month = String(monthResult.month);
    }
  }
  
  // Ensure required fields for npt_root_cause
  if (type === 'npt_root_cause') {
    // Default missing day to 1 to satisfy NOT NULL integer requirement
    if (mapped.date === null || mapped.date === undefined || mapped.date === '') {
      mapped.date = 1;
    }
    // Default missing hours to 0
    if (mapped.hrs === null || mapped.hrs === undefined || mapped.hrs === '') {
      mapped.hrs = 0;
    }
    // Ensure npt_type has a default value if empty
    if (!mapped.npt_type || mapped.npt_type === '') {
      mapped.npt_type = 'Unknown';
    }
    // Ensure system has a default value if empty
    if (!mapped.system || mapped.system === '') {
      mapped.system = 'Unknown';
    }
  }

  // Extract client and status from comment for utilization data
  if (type === 'utilization') {
    if (mapped.comment) {
      const extracted = extractClientAndStatus(mapped.comment);
      if (!mapped.client && extracted.client) {
        mapped.client = extracted.client;
      }
      if (extracted.status) {
        mapped.status = extracted.status;
      }
    }
  }
  
  // Revenue-specific: prefer 'Total Rev' for revenue_actual if both exist
  if (type === 'revenue') {
    if (originalData['Total Rev'] !== null && originalData['Total Rev'] !== undefined && originalData['Total Rev'] !== '') {
      mapped.revenue_actual = parseNumeric(originalData['Total Rev']);
    } else if (originalData['Actual'] !== null && originalData['Actual'] !== undefined && originalData['Actual'] !== '' && !mapped.revenue_actual) {
      mapped.revenue_actual = parseNumeric(originalData['Actual']);
    }
  }
  
  return mapped;
}

/**
 * Map Excel column names to database field names
 */
export function mapExcelToDbFields(data: any, type: string, customMapping?: { [dbField: string]: string }): any {
  // Define all mappings first
  const mappings: { [key: string]: { [key: string]: string } } = {
    revenue: {
      'Rig': 'rig',
      'Month': 'month',
      'Months': 'month',
      'Year': 'year',
      'Dayrate Actual': 'dayrate_actual',
      'Dayrate Budget': 'dayrate_budget',
      'Working Days': 'working_days',
      'Revenue Actual': 'revenue_actual',
      'Revenue Budget': 'revenue_budget',
      'Variance': 'variance',
      'Actual': 'revenue_actual',
      'Total Rev': 'revenue_actual',
      'Budgeted Rev': 'revenue_budget',
      'Diff': 'variance',
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
      // SAP cost report format
      'WBS Element': 'rig',
      'Cost element descr.': 'fuel_type',
      'Val.in rep.cur.': 'total_cost',
      'Purchase order text': 'remarks',
      'Name': 'supplier',
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
      'Date': 'move_date',
      'From Location': 'from_location',
      'To Location': 'to_location',
      'Distance (km)': 'distance_km',
      'Rig Move Distance (KM)': 'distance_km',
      'Budgeted Time (hrs)': 'budgeted_time_hours',
      'Budgeted rig move time, Hrs': 'budgeted_time_hours',
      'Actual Time (hrs)': 'actual_time_hours',
      'Actual Rig move time/Hrs': 'actual_time_hours',
      'Budgeted Cost': 'budgeted_cost',
      'Rig move budgeted cost $': 'budgeted_cost',
      'Actual Cost': 'actual_cost',
      'Rig move Total  cost US$': 'actual_cost',
      'Rig move Total cost US$': 'actual_cost',
      'Variance Cost': 'variance_cost',
      'Varinace': 'variance_cost',
      'Profit/Loss': 'profit_loss',
      'Actual Profit/loss': 'profit_loss',
      "Comment's": 'remarks',
      'Remarks': 'remarks',
      'Rig Mover Company': 'remarks',
    },
    utilization: {
      'Year': 'year',
      'Month': 'month',
      'month': 'month',
      'Rig': 'rig',
      'Coment': 'comment',
      'Comment': 'comment',
      'Comments': 'comment',
      'Client/Coment': 'comment',
      '% Utilization': 'utilization_rate',
      'Utilization': 'utilization_rate',
      'Utilization %': 'utilization_rate',
      'Allowable NPT': 'allowable_npt',
      'NPT Type': 'npt_type',
      'Total working Days': 'working_days',
      'Total Working Days': 'working_days',
      'Working Days': 'working_days',
      'Monthly Total Days': 'monthly_total_days',
      'Status': 'status',
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
      'Months': 'month',
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
    billing_npt_summary: {
      'Year': 'year',
      'Month': 'month',
      'Months': 'month',
      'Mont': 'month',
      'Mounth': 'month',
      'Rig': 'rig',
      'Rig Number': 'rig',
      'Rig No': 'rig',
      'Rig No.': 'rig',
      'Opr. Rate': 'opr_rate',
      'Opr Rate': 'opr_rate',
      'Reduce Rate': 'reduce_rate',
      'Repair Rate': 'repair_rate',
      'Zero Rate': 'zero_rate',
      'Special Rate': 'special_rate',
      'Rig Move(Reduce)': 'rig_move_reduce',
      'Rig Move (Reduce)': 'rig_move_reduce',
      'Rig Move': 'rig_move',
      'A.Maint': 'a_maint',
      'A Maint': 'a_maint',
      'A.Maint Zero': 'a_maint_zero',
      'A Maint Zero': 'a_maint_zero',
      'Total': 'total',
      'Total NPT': 'total_npt',
    },
    npt_root_cause: {
      'Rig Number': 'rig_number',
      'Rig': 'rig_number',
      'Year': 'year',
      'Month': 'month',
      'Months': 'month',
      'Date': 'date',
      'Day': 'date',
      'Hrs.': 'hrs',
      'Hrs': 'hrs',
      'Hours': 'hrs',
      'NPT type': 'npt_type',
      'NPT Type': 'npt_type',
      'SYSTEM': 'system',
      'System': 'system',
      'Parent Equipment Failure': 'parent_equipment_failure',
      'Part Equipment Failure': 'part_equipment_failure',
      'Contractual Process': 'contractual_process',
      'Department Responsibility': 'department_responsibility',
      'Immediate Cause of Failure': 'immediate_cause_of_failure',
      'Immediate Cause': 'immediate_cause_of_failure',
      'Root Cause': 'root_cause',
      'Immediate Corrective action': 'immediate_corrective_action',
      'Immediate Corrective Action': 'immediate_corrective_action',
      'Future Action & Improvement': 'future_action_improvement',
      'Future Action': 'future_action_improvement',
      'Action Party': 'action_party',
      'Notification Number (N2)': 'notification_number',
      'Notification Number': 'notification_number',
      'N2': 'notification_number',
      'Failure investigation reports': 'failure_investigation_reports',
      'Failure Investigation Reports': 'failure_investigation_reports',
      'Investigation Reports': 'failure_investigation_reports',
    },
  };
  
  // If custom mapping is provided, map the fields but still apply type conversion
  if (customMapping && Object.keys(customMapping).length > 0) {
    const mapped: any = {};
    Object.entries(customMapping).forEach(([dbField, excelHeader]) => {
      if (data[excelHeader] !== undefined) {
        let value = data[excelHeader];
        
        // Apply type conversion based on field name and type
        value = applyTypeConversion(value, dbField, type);
        
        mapped[dbField] = value;
      }
    });
    
    // Apply post-mapping transformations
    return applyPostMappingTransformations(mapped, type, data);
  }

  // Use default mapping logic
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
    
    // Apply type conversion
    value = applyTypeConversion(value, dbField, type);

    mapped[dbField] = value;
  });
  
  // If no columns were mapped, log warning
  if (Object.keys(mapped).length === 0) {
    console.warn(`No columns matched for type "${type}". Available columns:`, Object.keys(data));
  }
  
  // Revenue-specific: prefer 'Total Rev' for revenue_actual if both exist
  if (type === 'revenue') {
    if (data['Total Rev'] !== null && data['Total Rev'] !== undefined && data['Total Rev'] !== '') {
      mapped.revenue_actual = parseNumeric(data['Total Rev']);
    } else if (data['Actual'] !== null && data['Actual'] !== undefined && data['Actual'] !== '' && !mapped.revenue_actual) {
      mapped.revenue_actual = parseNumeric(data['Actual']);
    }
  }
  
  // Universal date composition for ALL types with Year+Month+Date columns
  const dateCompositionTypes = ['billing_npt', 'fuel', 'rig_moves', 'well_tracker', 'stock', 'ytd'];
  if (dateCompositionTypes.includes(type)) {
    const yearVal = mapped.year ?? (data['Year'] ?? data['year']);
    const monthVal = data['Month'] ?? data['month'] ?? data['Mont'];
    const dayVal = data['Date'] ?? data['date'] ?? data['Day'];
    
    const composed = composeDateFromYMD(yearVal, monthVal, dayVal);
    if (composed.date) {
      // Determine the correct date field name based on type
      const dateField = type === 'rig_moves' ? 'move_date' 
                      : type === 'well_tracker' ? 'start_date'
                      : type === 'stock' ? 'last_reorder_date'
                      : 'date'; // billing_npt, fuel, ytd
      mapped[dateField] = composed.date;
    }
  }
  
  // For types with separate month fields, convert month names to numbers
  const typesWithMonthField = ['revenue', 'work_orders', 'customer_satisfaction', 'utilization', 'ytd', 'billing_npt_summary', 'npt_root_cause'];
  if (typesWithMonthField.includes(type) && mapped.month) {
    const monthResult = convertMonthToNumber(mapped.month);
    if (monthResult.month) {
      mapped.month = String(monthResult.month);
    }
  }
  
  // Ensure required fields for npt_root_cause
  if (type === 'npt_root_cause') {
    // Default missing day to 1 to satisfy NOT NULL integer requirement
    if (mapped.date === null || mapped.date === undefined || mapped.date === '') {
      mapped.date = 1;
    }
    // Default missing hours to 0
    if (mapped.hrs === null || mapped.hrs === undefined || mapped.hrs === '') {
      mapped.hrs = 0;
    }
    // Ensure npt_type has a default value if empty
    if (!mapped.npt_type || mapped.npt_type === '') {
      mapped.npt_type = 'Unknown';
    }
    // Ensure system has a default value if empty
    if (!mapped.system || mapped.system === '') {
      mapped.system = 'Unknown';
    }
  }
  // Extract client and status from comment for utilization data
  if (type === 'utilization') {
    // Extract from comment if available
    if (mapped.comment) {
      const { client, status } = extractClientAndStatus(mapped.comment);
      if (client && !mapped.client) mapped.client = client;
      if (status && !mapped.status) mapped.status = status;
    }
    
    // Ensure status has a fallback value based on utilization_rate
    if (!mapped.status || mapped.status === null || mapped.status === '') {
      const utilRate = mapped.utilization_rate;
      if (utilRate === null || utilRate === 0) {
        mapped.status = 'Inactive';
      } else {
        mapped.status = 'Active';
      }
    }
    
    // Ensure status is never null
    if (!mapped.status) {
      mapped.status = 'Active';
    }
  }
  
  return mapped;
}

/**
 * Export validation errors to Excel file for easy review and correction
 */
export function exportValidationErrorsToExcel(
  warnings: Array<{ record: any; errors: string[]; index: number; severity: 'warning' | 'info' }>,
  reportType: string,
  fileName: string = 'validation_errors'
) {
  // Create worksheet data with headers
  const wsData = [
    [
      'Row Number',
      'Error Type',
      'Error Messages',
      'Rig Number',
      'Year',
      'Month',
      'Date',
      'Hours',
      'NPT Type',
      'System',
      'Current Values (JSON)'
    ]
  ];

  // Add each error as a row
  warnings.forEach(warning => {
    wsData.push([
      warning.index,
      warning.severity === 'warning' ? 'WARNING' : 'INFO',
      warning.errors.join(' | '),
      warning.record?.rig_number || warning.record?.rig || '',
      warning.record?.year || '',
      warning.record?.month || '',
      warning.record?.date || '',
      warning.record?.hrs || warning.record?.hours || '',
      warning.record?.npt_type || '',
      warning.record?.system || '',
      JSON.stringify(warning.record)
    ]);
  });

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths for better readability
  ws['!cols'] = [
    { wch: 12 },  // Row Number
    { wch: 12 },  // Error Type
    { wch: 50 },  // Error Messages
    { wch: 12 },  // Rig Number
    { wch: 8 },   // Year
    { wch: 10 },  // Month
    { wch: 8 },   // Date
    { wch: 10 },  // Hours
    { wch: 15 },  // NPT Type
    { wch: 20 },  // System
    { wch: 40 }   // Current Values
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Validation Errors');

  // Add instructions sheet
  const instructionsData = [
    ['Validation Error Report - Instructions'],
    [''],
    ['This report contains all validation errors found in your uploaded file.'],
    [''],
    ['How to fix the errors:'],
    ['1. Review the "Error Messages" column to understand what needs to be fixed'],
    ['2. Check the row number in your original Excel file'],
    ['3. Fix the missing or invalid values in your original file'],
    ['4. Re-upload the corrected file'],
    [''],
    ['Common Issues:'],
    ['• Missing Required Fields: Ensure Rig Number, Year, Month, and Hours are filled'],
    ['• Invalid Year: Must be between 2000-2100'],
    ['• Invalid Month: Use month names (Jan, Feb, etc.) or numbers (1-12)'],
    ['• Invalid Hours: Must be a positive number, typically ≤24 per event'],
    ['• Invalid Date: Must be between 1-31'],
    [''],
    ['For detailed help, contact support or check the documentation.']
  ];

  const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
  instructionsWs['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');

  // Generate and download file
  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${fileName}_${timestamp}.xlsx`);
}
