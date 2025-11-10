import { supabase } from "@/integrations/supabase/client";
import { mapExcelToDbFields } from "./excelParser";

/**
 * Generic insert function for any table
 */
export async function insertData(table: string, data: any) {
  const { data: result, error } = await (supabase as any)
    .from(table)
    .insert(data)
    .select();
  
  if (error) throw error;
  return result;
}

/**
 * Generic bulk insert/upsert function for any table
 */
export async function bulkInsertData(table: string, dataArray: any[]) {
  const chunkSize = 500;
  const results: any[] = [];

  // Determine conflict target for upsert if the table has a known unique constraint
  const conflictTargetMap: Record<string, string> = {
    billing_npt_summary: 'year,month,rig',
  };
  const conflictTarget = conflictTargetMap[table];

  for (let i = 0; i < dataArray.length; i += chunkSize) {
    const chunk = dataArray.slice(i, i + chunkSize);

    let resp;
    if (conflictTarget) {
      // Use upsert to update existing rows instead of failing on duplicates
      resp = await (supabase as any)
        .from(table)
        .upsert(chunk, { onConflict: conflictTarget })
        .select();
    } else {
      resp = await (supabase as any)
        .from(table)
        .insert(chunk)
        .select();
    }

    const { data, error } = resp;
    if (error) throw error;
    if (data) results.push(...data);
  }
  return results;
}

/**
 * Generic fetch function for any table with pagination support
 */
export async function fetchData(table: string, limit = 100) {
  const { data, error } = await (supabase as any)
    .from(table)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
}

/**
 * Fetch paginated data for infinite scroll
 */
export async function fetchPaginatedData(
  table: string, 
  offset: number = 0, 
  limit: number = 50
) {
  const { data, error, count } = await (supabase as any)
    .from(table)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) throw error;
  return { data, count };
}

/**
 * Fetch aggregated data for charts
 */
export async function fetchAggregatedData(table: string, groupBy: string) {
  const { data, error } = await (supabase as any)
    .from(table)
    .select('*')
    .order(groupBy);
  
  if (error) throw error;
  return data;
}

/**
 * Save revenue data
 */
export async function saveRevenueData(data: any) {
  return insertData('revenue', {
    rig: data.rig,
    month: data.month,
    year: parseInt(data.year),
    dayrate_actual: parseFloat(data.dayrateActual),
    dayrate_budget: parseFloat(data.dayrateBudget),
    working_days: parseFloat(data.workingDays),
    revenue_actual: parseFloat(data.revenueActual),
    revenue_budget: parseFloat(data.revenueBudget),
    variance: parseFloat(data.variance),
    fuel_charge: data.fuelCharge ? parseFloat(data.fuelCharge) : null,
    npt_repair: data.nptRepair ? parseFloat(data.nptRepair) : null,
    npt_zero: data.nptZero ? parseFloat(data.nptZero) : null,
    comments: data.comments || null,
    client: data.client || null,
  });
}

/**
 * Save billing NPT data
 */
export async function saveBillingNPTData(data: any) {
  return insertData('billing_npt', {
    rig: data.rig,
    year: data.year ? parseInt(data.year) : null,
    month: data.month || null,
    date: data.date,
    npt_hours: data.hours ? parseFloat(data.hours) : null,
    npt_type: data.nptType || null,
    system: data.system,
    parent_equipment_failure: data.parentEquipmentFailure || null,
    part_equipment_failure: data.partEquipmentFailure || null,
    contractual_process: data.contractualProcess || null,
    department_responsibility: data.departmentResponsibility || null,
    immediate_cause: data.immediateCause || null,
    root_cause: data.rootCause,
    corrective_action: data.correctiveAction,
    future_action: data.futureAction || null,
    action_party: data.actionParty || null,
    notification_number: data.notificationNo || null,
    failure_investigation_reports: data.failureInvestigationReports || null,
    comments: data.comments || null,
  });
}

/**
 * Save work orders data
 */
export async function saveWorkOrdersData(data: any) {
  return insertData('work_orders', {
    rig: data.rig,
    month: data.month,
    year: parseInt(data.year || new Date().getFullYear()),
    elec_open: parseInt(data.elecOpen || 0),
    elec_closed: parseInt(data.elecClosed || 0),
    mech_open: parseInt(data.mechOpen || 0),
    mech_closed: parseInt(data.mechClosed || 0),
    oper_open: parseInt(data.operOpen || 0),
    oper_closed: parseInt(data.operClosed || 0),
    compliance_rate: data.complianceRate ? parseFloat(data.complianceRate) : null,
  });
}

/**
 * Save fuel consumption data
 */
export async function saveFuelData(data: any) {
  return insertData('fuel_consumption', {
    rig: data.rig || data.rigNumber,
    date: data.date,
    fuel_consumed: parseFloat(data.fuelConsumed || data.quantity),
    fuel_type: data.fuelType || data.type,
    unit_price: data.unitPrice ? parseFloat(data.unitPrice) : null,
    total_cost: data.totalCost ? parseFloat(data.totalCost) : null,
    supplier: data.supplier || null,
    remarks: data.remarks || data.notes || null,
  });
}

/**
 * Save stock levels data
 */
export async function saveStockData(data: any) {
  return insertData('stock_levels', {
    rig: data.rig || data.rigNumber,
    item_name: data.itemName,
    category: data.category,
    current_qty: parseInt(data.currentStock || data.currentQty),
    target_qty: parseInt(data.minStock || data.targetQty),
    unit: data.unit || 'units',
    last_reorder_date: data.lastReorderDate || data.date || null,
    status: data.status || 'OK',
  });
}

/**
 * Save customer satisfaction data
 */
export async function saveCustomerSatisfactionData(data: any) {
  return insertData('customer_satisfaction', {
    rig: data.rig,
    month: data.month,
    year: parseInt(data.year || new Date().getFullYear()),
    satisfaction_score: parseFloat(data.satisfactionRate || data.satisfactionScore),
    feedback: data.clientFeedback || data.feedback || null,
    client: data.client || null,
  });
}

/**
 * Save rig moves data
 */
export async function saveRigMovesData(data: any) {
  return insertData('rig_moves', {
    rig: data.rig,
    move_date: data.moveDate || data.date,
    from_location: data.fromLocation,
    to_location: data.toLocation,
    distance_km: data.distanceKm ? parseFloat(data.distanceKm) : null,
    budgeted_time_hours: data.budgetedTime ? parseFloat(data.budgetedTime) : null,
    actual_time_hours: data.actualTime ? parseFloat(data.actualTime) : null,
    budgeted_cost: data.budgetedCost ? parseFloat(data.budgetedCost) : null,
    actual_cost: data.actualCost ? parseFloat(data.actualCost) : null,
    variance_cost: data.varianceCost ? parseFloat(data.varianceCost) : null,
    profit_loss: data.profitLoss ? parseFloat(data.profitLoss) : null,
    remarks: data.remarks || data.notes || null,
  });
}

/**
 * Save well tracker data
 */
export async function saveWellTrackerData(data: any) {
  return insertData('well_tracker', {
    rig: data.rig,
    well_name: data.wellName,
    start_date: data.startDate,
    end_date: data.endDate || null,
    target_depth: parseFloat(data.targetDepth),
    actual_depth: parseFloat(data.actualDepth),
    status: data.status,
    operator: data.operator,
    location: data.location || null,
  });
}

/**
 * Validate required fields before inserting data
 */
function validateRequiredFields(data: any, requiredFields: string[], tableName: string): void {
  const missing = requiredFields.filter(field => 
    data[field] === null || data[field] === undefined || data[field] === ''
  );
  if (missing.length > 0) {
    console.error(`[${tableName}] Missing required fields:`, missing, 'Data:', data);
    throw new Error(`Missing required fields for ${tableName}: ${missing.join(', ')}`);
  }
}

/**
 * Save utilization data with client and status extraction
 */
export async function saveUtilizationData(data: any) {
  // Helper function to parse numeric values that might have % or other characters
  const parseNumeric = (value: any) => {
    if (!value) return null;
    const stringValue = String(value).replace(/[%,]/g, '').trim();
    const parsed = parseFloat(stringValue);
    return isNaN(parsed) ? null : parsed;
  };

  // Extract client from comment if not provided
  let client = data.client;
  const comment = data.comment || data.coment || '';
  
  if (!client && comment) {
    // Look for patterns like "Working with [Client]" or "worked with [Client]"
    const workingWithMatch = comment.match(/(?:working|worked)\s+with\s+([^,]+)/i);
    if (workingWithMatch) {
      client = workingWithMatch[1].trim();
    }
  }

  // Derive status from utilization rate if not provided
  const utilizationRate = parseNumeric(data.utilization || data.utilizationRate || data.utilization_rate || data['% utilization']);
  let status = data.status;
  
  if (!status || status === '') {
    // If utilization is 0 or null/undefined, mark as Inactive
    // If comment contains "N/A" or "NA" or "stacked", mark accordingly
    if (comment.toUpperCase().includes('STACKED') || comment.toUpperCase().includes('STACK')) {
      status = 'Stacked';
    } else if (utilizationRate === null || utilizationRate === 0) {
      status = 'Inactive';
    } else if (comment && (comment.toUpperCase().includes('N/A') || comment.toUpperCase().includes('NA'))) {
      status = 'Inactive';
    } else {
      status = 'Active';
    }
  }

  const utilizationData = {
    rig: data.rig,
    month: data.month,
    year: parseInt(data.year || new Date().getFullYear()),
    comment: comment || null,
    client: client || null,
    status: status,
    utilization_rate: utilizationRate,
    allowable_npt: parseNumeric(data.allowableNpt || data.allowableNPT || data.allowable_npt || data['allowable npt']),
    npt_type: data.nptType || data.npt_type || data['npt type'] || null,
    working_days: parseNumeric(data.workingDays || data.totalWorkingDays || data.working_days || data['total working days']),
    monthly_total_days: parseNumeric(data.monthlyTotalDays || data.monthly_total_days || data['monthly total days']),
  };

  // Validate required fields before insertion
  validateRequiredFields(utilizationData, ['rig', 'month', 'year', 'status'], 'utilization');

  return insertData('utilization', utilizationData);
}

/**
 * Save billing NPT summary data (aggregated monthly by rate type)
 */
export async function saveBillingNPTSummaryData(data: any) {
  const parseNumeric = (value: any) => {
    if (!value) return 0;
    const parsed = parseFloat(String(value).replace(/[,]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  return insertData('billing_npt_summary', {
    rig: data.rig,
    month: data.month,
    year: parseInt(data.year || new Date().getFullYear()),
    opr_rate: parseNumeric(data.oprRate || data.opr_rate),
    reduce_rate: parseNumeric(data.reduceRate || data.reduce_rate),
    repair_rate: parseNumeric(data.repairRate || data.repair_rate),
    zero_rate: parseNumeric(data.zeroRate || data.zero_rate),
    special_rate: parseNumeric(data.specialRate || data.special_rate),
    rig_move_reduce: parseNumeric(data.rigMoveReduce || data.rig_move_reduce),
    rig_move: parseNumeric(data.rigMove || data.rig_move),
    a_maint: parseNumeric(data.aMaint || data.a_maint),
    a_maint_zero: parseNumeric(data.aMaintZero || data.a_maint_zero),
    total: parseNumeric(data.total),
    total_npt: parseNumeric(data.totalNpt || data.total_npt),
  });
}

/**
 * Map report type to save function
 */
export function getSaveFunction(reportType: string) {
  const mapping: { [key: string]: (data: any) => Promise<any> } = {
    revenue: saveRevenueData,
    billing_npt: saveBillingNPTData,
    billing_npt_summary: saveBillingNPTSummaryData,
    work_orders: saveWorkOrdersData,
    fuel: saveFuelData,
    stock: saveStockData,
    customer_satisfaction: saveCustomerSatisfactionData,
    rig_moves: saveRigMovesData,
    well_tracker: saveWellTrackerData,
    utilization: saveUtilizationData,
  };
  
  return mapping[reportType];
}

/**
 * Map report type to table name
 */
export function getTableName(reportType: string): string {
  const mapping: { [key: string]: string } = {
    revenue: 'revenue',
    billing_npt: 'billing_npt',
    billing_npt_summary: 'billing_npt_summary',
    work_orders: 'work_orders',
    fuel: 'fuel_consumption',
    stock: 'stock_levels',
    customer_satisfaction: 'customer_satisfaction',
    rig_moves: 'rig_moves',
    well_tracker: 'well_tracker',
    utilization: 'utilization',
    ytd: 'revenue', // YTD uses revenue table
    maintenance: 'fuel_consumption', // Reuse for now
    material: 'fuel_consumption', // Reuse for now
    dr_line: 'stock_levels', // Reuse for now
  };
  
  return mapping[reportType] || reportType;
}
