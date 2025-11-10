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
 * Only validates essential fields - other fields are optional
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

    // Robust header detection - only check essential fields
    const rig = row['Rig Number'] ?? row.Rig ?? row.rig ?? getByNormalized(row, 'rignumber') ?? getByNormalized(row, 'rig');
    const year = row.Year ?? row.year ?? getByNormalized(row, 'year');
    const monthRaw = row.Month ?? row.month ?? row.Mont ?? row.Mounth ?? getByNormalized(row, 'month');
    const date = row.Date ?? row.date ?? row.Day ?? getByNormalized(row, 'date');
    const hrs = row['Hrs.'] ?? row.Hrs ?? row.Hours ?? getByNormalized(row, 'hrs');
    const nptType = row['NPT type'] ?? row['NPT Type'] ?? row.npt_type ?? getByNormalized(row, 'npttype');
    
    if (index === 0) {
      console.log(`[validateNPTRootCauseData] Row 0 - rig:`, rig, ', year:', year, ', month:', monthRaw, ', hrs:', hrs);
    }

    // Only validate essential fields - system, root cause, etc. are optional
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
    
    if (!date && date !== 0) {
      errors.push({
        row: index + 2,
        column: 'Date',
        message: 'Date is required',
        value: date,
        severity: 'error',
      });
    }
    
    if (hrs === null || hrs === undefined || hrs === '') {
      errors.push({
        row: index + 2,
        column: 'Hrs.',
        message: 'Hours is required',
        value: hrs,
        severity: 'error',
      });
    }
    
    if (!nptType) {
      errors.push({
        row: index + 2,
        column: 'NPT type',
        message: 'NPT type is required',
        value: nptType,
        severity: 'error',
      });
    }
    
    // System, root cause, equipment fields are optional (especially for Contractual types)
    // No validation errors for missing optional fields
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
    .replace(/[()%.,]/g, '') // Remove common punctuation
    .trim();
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
 * Map Excel column names to database field names
 */
export function mapExcelToDbFields(data: any, type: string, customMapping?: { [dbField: string]: string }): any {
  // If custom mapping is provided, use it directly
  if (customMapping && Object.keys(customMapping).length > 0) {
    const mapped: any = {};
    Object.entries(customMapping).forEach(([dbField, excelHeader]) => {
      if (data[excelHeader] !== undefined) {
        mapped[dbField] = data[excelHeader];
      }
    });
    return mapped;
  }

  // Otherwise use default mapping logic
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
      'Client/Coment': 'comment',
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
    if (type === 'revenue' || type === 'ytd') {
      // Parse numeric fields for revenue
      if ([
        'dayrate_actual', 'dayrate_budget', 'working_days', 
        'revenue_actual', 'revenue_budget', 'variance',
        'fuel_charge', 'npt_repair', 'npt_zero'
      ].includes(dbField)) {
        value = parseNumeric(value);
      } else if (dbField === 'year') {
        value = value !== null && value !== undefined && String(value).trim() !== '' ? parseInt(String(value).trim()) : null;
      } else if (dbField === 'rig') {
        value = value !== null && value !== undefined ? String(value).trim() : '';
      } else if (['month', 'comments', 'client'].includes(dbField)) {
        value = value !== null && value !== undefined ? String(value).trim() : null;
      }
    } else if (type === 'utilization') {
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
      } else if (dbField === 'npt_type' || dbField === 'comment' || dbField === 'month' || dbField === 'client' || dbField === 'status') {
        value = value !== null && value !== undefined ? String(value).trim() : null;
      }
    } else if (type === 'billing_npt') {
      if (dbField === 'npt_hours') {
        value = parseNumeric(value);
      } else if (dbField === 'year') {
        value = value !== null && value !== undefined && String(value).trim() !== '' ? parseInt(String(value).trim()) : null;
      } else if (dbField === 'date') {
        // Don't parse Date field directly - it will be composed from Y+M+D later
        value = null;
      } else if (dbField === 'billable') {
        const s = String(value || '').toLowerCase();
        value = s === 'yes' || s === 'y' || s === 'true' || s === '1' || s === 'billable';
      } else if ([
        'rig','month','npt_type','system','parent_equipment_failure','part_equipment_failure','contractual_process','department_responsibility','immediate_cause','root_cause','corrective_action','future_action','action_party','notification_number','failure_investigation_reports','comments','equipment_failure'
      ].includes(dbField)) {
        value = value !== null && value !== undefined ? String(value).trim() : null;
      }
    } else if (type === 'fuel') {
      if (dbField === 'total_cost' || dbField === 'fuel_consumed' || dbField === 'unit_price') {
        value = parseNumeric(value);
      } else if (dbField === 'date') {
        value = parseDate(value);
      } else if (dbField === 'rig') {
        // Extract rig number from WBS Element format (e.g., "R.R201.01.04.02" -> "R201")
        const wbsMatch = String(value || '').match(/R\.R(\d+)\./);
        value = wbsMatch ? `ADC-${wbsMatch[1]}` : String(value || '').trim();
      } else {
        value = value !== null && value !== undefined ? String(value).trim() : null;
      }
    } else if (type === 'billing_npt_summary') {
      if ([
        'opr_rate', 'reduce_rate', 'repair_rate', 'zero_rate', 
        'special_rate', 'rig_move', 'rig_move_reduce', 'a_maint', 'a_maint_zero', 'total', 'total_npt'
      ].includes(dbField)) {
        value = parseNumeric(value);
      } else if (dbField === 'year') {
        value = value !== null && value !== undefined && String(value).trim() !== '' ? parseInt(String(value).trim()) : null;
      } else if (dbField === 'rig') {
        value = value !== null && value !== undefined ? String(value).trim() : '';
      } else if (dbField === 'month') {
        value = value !== null && value !== undefined ? String(value).trim() : null;
      }
    } else if (type === 'npt_root_cause') {
      if (dbField === 'hrs') {
        value = parseNumeric(value);
      } else if (dbField === 'year') {
        value = value !== null && value !== undefined && String(value).trim() !== '' ? parseInt(String(value).trim()) : null;
      } else if (dbField === 'date') {
        value = value !== null && value !== undefined && String(value).trim() !== '' ? parseInt(String(value).trim()) : null;
      } else if ([
        'rig_number', 'month', 'npt_type', 'system', 'parent_equipment_failure',
        'part_equipment_failure', 'contractual_process', 'department_responsibility',
        'immediate_cause_of_failure', 'root_cause', 'immediate_corrective_action',
        'future_action_improvement', 'action_party', 'notification_number',
        'failure_investigation_reports'
      ].includes(dbField)) {
        value = value !== null && value !== undefined ? String(value).trim() : null;
      }
    } else if (type === 'fuel' || type === 'rig_moves' || type === 'well_tracker' || type === 'stock' || type === 'ytd') {
      // Don't parse date fields directly - they will be composed from Y+M+D later
      if (dbField === 'date' || dbField === 'move_date' || dbField === 'start_date' || dbField === 'end_date' || dbField === 'last_reorder_date') {
        value = null;
      }
    }

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
