import { z } from 'zod';

/**
 * Validation schema for Rig Moves data
 */
export const rigMovesSchema = z.object({
  rig: z.string().min(1, "اسم الحفارة مطلوب"),
  move_date: z.string().min(1, "تاريخ النقل مطلوب").or(z.date()),
  from_location: z.string().optional().nullable(),
  to_location: z.string().optional().nullable(),
  distance_km: z.number().min(0, "المسافة يجب أن تكون رقم موجب").optional().nullable(),
  budgeted_time_hours: z.number().min(0, "الوقت المخطط يجب أن يكون رقم موجب").optional().nullable(),
  actual_time_hours: z.number().min(0, "الوقت الفعلي يجب أن يكون رقم موجب").optional().nullable(),
  budgeted_cost: z.number().min(0, "التكلفة المخططة يجب أن تكون رقم موجب").optional().nullable(),
  actual_cost: z.number().min(0, "التكلفة الفعلية يجب أن تكون رقم موجب").optional().nullable(),
  variance_cost: z.number().optional().nullable(),
  profit_loss: z.number().optional().nullable(),
  remarks: z.string().optional().nullable(),
}).refine((data) => {
  if (data.actual_time_hours && data.budgeted_time_hours) {
    return data.actual_time_hours <= data.budgeted_time_hours * 2;
  }
  return true;
}, {
  message: "الوقت الفعلي يتجاوز الوقت المخطط بأكثر من 200% - يرجى المراجعة",
  path: ["actual_time_hours"],
}).refine((data) => {
  if (data.actual_cost && data.budgeted_cost) {
    return data.actual_cost <= data.budgeted_cost * 2;
  }
  return true;
}, {
  message: "التكلفة الفعلية تتجاوز التكلفة المخططة بأكثر من 200% - يرجى المراجعة",
  path: ["actual_cost"],
});

/**
 * Validation schema for Fuel Consumption data
 */
export const fuelConsumptionSchema = z.object({
  rig: z.string().min(1, "اسم الحفارة مطلوب"),
  year: z.number().int().min(2000).max(2100, "السنة غير صحيحة"),
  month: z.string().min(1, "الشهر مطلوب"),
  opening_stock: z.number().min(0, "الرصيد الافتتاحي يجب أن يكون رقم موجب").optional().nullable(),
  total_received: z.number().min(0, "المستلم يجب أن يكون رقم موجب").optional().nullable(),
  total_consumed: z.number().min(0, "المستهلك يجب أن يكون رقم موجب").optional().nullable(),
  rig_engine_consumption: z.number().min(0).optional().nullable(),
  camp_engine_consumption: z.number().min(0).optional().nullable(),
  invoice_to_client: z.number().min(0).optional().nullable(),
  other_site_consumers: z.number().min(0).optional().nullable(),
  vehicles_consumption: z.number().min(0).optional().nullable(),
  closing_balance: z.number().optional().nullable(),
  fuel_cost: z.number().min(0, "التكلفة يجب أن تكون رقم موجب").optional().nullable(),
}).refine((data) => {
  if (data.opening_stock !== null && data.opening_stock !== undefined &&
      data.total_received !== null && data.total_received !== undefined &&
      data.total_consumed !== null && data.total_consumed !== undefined &&
      data.closing_balance !== null && data.closing_balance !== undefined) {
    const expected = data.opening_stock + data.total_received - data.total_consumed;
    const tolerance = Math.abs(expected * 0.05); // 5% tolerance
    return Math.abs(data.closing_balance - expected) <= tolerance;
  }
  return true;
}, {
  message: "الرصيد الختامي لا يتطابق مع (الرصيد الافتتاحي + المستلم - المستهلك) - يرجى المراجعة",
  path: ["closing_balance"],
});

/**
 * Validation schema for Revenue data
 */
export const revenueSchema = z.object({
  rig: z.string().min(1, "اسم الحفارة مطلوب"),
  month: z.string().min(1, "الشهر مطلوب"),
  year: z.number().int().min(2000).max(2100, "السنة غير صحيحة"),
  dayrate_actual: z.number().min(0).optional().nullable(),
  dayrate_budget: z.number().min(0).optional().nullable(),
  working_days: z.number().min(0).max(31, "أيام العمل يجب أن تكون بين 0-31").optional().nullable(),
  revenue_actual: z.number().optional().nullable(),
  revenue_budget: z.number().optional().nullable(),
  variance: z.number().optional().nullable(),
  fuel_charge: z.number().optional().nullable(),
  npt_repair: z.number().optional().nullable(),
  npt_zero: z.number().optional().nullable(),
  comments: z.string().optional().nullable(),
  client: z.string().optional().nullable(),
}).refine((data) => {
  if (data.dayrate_actual !== null && data.dayrate_actual !== undefined &&
      data.working_days !== null && data.working_days !== undefined &&
      data.revenue_actual !== null && data.revenue_actual !== undefined) {
    const expected = data.dayrate_actual * data.working_days;
    const tolerance = Math.abs(expected * 0.1); // 10% tolerance
    return Math.abs(data.revenue_actual - expected) <= tolerance;
  }
  return true;
}, {
  message: "الإيراد الفعلي لا يتطابق مع (معدل اليوم × أيام العمل) - يرجى المراجعة",
  path: ["revenue_actual"],
});

/**
 * Validation schema for Utilization data
 */
export const utilizationSchema = z.object({
  rig: z.string().min(1, "Rig name is required"),
  month: z.string().min(1, "Month is required"),
  year: z.number().int().min(2000).max(2100, "Year must be between 2000-2100"),
  operating_days: z.number().min(0).max(31).optional().nullable(),
  npt_days: z.number().min(0).max(31).optional().nullable(),
  allowable_npt: z.number().min(0).optional().nullable(),
  working_days: z.number().min(0).max(31).optional().nullable(),
  utilization_rate: z.number().min(0).max(100, "Utilization rate must be between 0-100").optional().nullable(),
  monthly_total_days: z.number().min(28).max(31).optional().nullable(),
  client: z.string().optional().nullable(),
  npt_type: z.string().optional().nullable(),
  comment: z.string().optional().nullable(),
  status: z.string().optional().default('Active'),
}).refine((data) => {
  if (data.operating_days !== null && data.operating_days !== undefined &&
      data.npt_days !== null && data.npt_days !== undefined &&
      data.monthly_total_days !== null && data.monthly_total_days !== undefined) {
    return (data.operating_days + data.npt_days) <= data.monthly_total_days;
  }
  return true;
}, {
  message: "Total of operating days and NPT days exceeds monthly total days",
  path: ["operating_days"],
}).refine((data) => {
  if (data.npt_days !== null && data.npt_days !== undefined &&
      data.allowable_npt !== null && data.allowable_npt !== undefined) {
    return data.npt_days <= data.allowable_npt * 1.5;
  }
  return true;
}, {
  message: "NPT days exceed allowable NPT by more than 150% - please review",
  path: ["npt_days"],
});

/**
 * Validation schema for Billing NPT data
 * Simplified: Core fields required, others optional
 */
export const billingNPTSchema = z.object({
  rig: z.string().min(1, "اسم الحفارة مطلوب"),
  year: z.number().int().min(2000).max(2100, "السنة غير صحيحة"),
  month: z.string().min(1, "الشهر مطلوب"),
  // Date is optional - will be composed from year/month if not provided
  date: z.string().optional().nullable().or(z.date().optional().nullable()),
  npt_hours: z.number().min(0).optional().nullable(),
  npt_type: z.string().optional().nullable(),
  system: z.string().optional().nullable(),
  equipment_failure: z.string().optional().nullable(),
  parent_equipment_failure: z.string().optional().nullable(),
  part_equipment_failure: z.string().optional().nullable(),
  contractual_process: z.string().optional().nullable(),
  department_responsibility: z.string().optional().nullable(),
  immediate_cause: z.string().optional().nullable(),
  root_cause: z.string().optional().nullable(),
  corrective_action: z.string().optional().nullable(),
  future_action: z.string().optional().nullable(),
  action_party: z.string().optional().nullable(),
  billable: z.boolean().optional().nullable(),
  notification_number: z.string().optional().nullable(),
  failure_investigation_reports: z.string().optional().nullable(),
  comments: z.string().optional().nullable(),
});

/**
 * Validation schema for NPT Root Cause data
 * Simplified: Only rig_number, year, and month are truly required
 * Other fields are optional to allow flexible data import
 */
export const nptRootCauseSchema = z.object({
  // Core required fields only
  rig_number: z.string().min(1, "Rig Number is required"),
  year: z.number().int().min(2000).max(2100, "Year must be between 2000-2100"),
  month: z.string().min(1, "Month is required"),

  // Semi-required fields (with defaults)
  date: z.number().int().min(1).max(31).optional().nullable().default(1),
  hrs: z.number().min(0).optional().nullable().default(0),
  npt_type: z.string().optional().nullable(),
  system: z.string().optional().nullable(),

  // Optional tracking fields (all nullable)
  parent_equipment_failure: z.string().optional().nullable(),
  part_equipment_failure: z.string().optional().nullable(),
  contractual_process: z.string().optional().nullable(),
  department_responsibility: z.string().optional().nullable(),
  immediate_cause_of_failure: z.string().optional().nullable(),
  root_cause: z.string().optional().nullable(),
  immediate_corrective_action: z.string().optional().nullable(),
  future_action_improvement: z.string().optional().nullable(),
  action_party: z.string().optional().nullable(),
  notification_number: z.string().optional().nullable(),
  failure_investigation_reports: z.string().optional().nullable(),
});

/**
 * Validation schema for Stock Levels data
 */
export const stockLevelsSchema = z.object({
  rig: z.string().min(1, "اسم الحفارة مطلوب"),
  item_name: z.string().min(1, "اسم الصنف مطلوب"),
  category: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  current_qty: z.number().int().min(0, "الكمية الحالية يجب أن تكون رقم موجب").optional().nullable(),
  target_qty: z.number().int().min(0, "الكمية المستهدفة يجب أن تكون رقم موجب").optional().nullable(),
  status: z.string().optional().nullable(),
  last_reorder_date: z.string().optional().nullable().or(z.date()),
}).refine((data) => {
  if (data.current_qty !== null && data.current_qty !== undefined &&
      data.target_qty !== null && data.target_qty !== undefined) {
    return data.current_qty <= data.target_qty * 3;
  }
  return true;
}, {
  message: "الكمية الحالية تتجاوز الكمية المستهدفة بأكثر من 300% - يرجى المراجعة",
  path: ["current_qty"],
});

/**
 * Validation schema for Well Tracker data
 */
export const wellTrackerSchema = z.object({
  rig: z.string().min(1, "اسم الحفارة مطلوب"),
  well_name: z.string().min(1, "اسم البئر مطلوب"),
  start_date: z.string().min(1, "تاريخ البداية مطلوب").or(z.date()),
  end_date: z.string().optional().nullable().or(z.date()),
  target_depth: z.number().min(0, "العمق المستهدف يجب أن يكون رقم موجب").optional().nullable(),
  actual_depth: z.number().min(0, "العمق الفعلي يجب أن يكون رقم موجب").optional().nullable(),
  status: z.string().optional().nullable(),
  operator: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
}).refine((data) => {
  if (data.end_date && data.start_date) {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    return end >= start;
  }
  return true;
}, {
  message: "تاريخ الانتهاء يجب أن يكون بعد أو يساوي تاريخ البداية",
  path: ["end_date"],
}).refine((data) => {
  if (data.actual_depth && data.target_depth) {
    return data.actual_depth <= data.target_depth * 1.5;
  }
  return true;
}, {
  message: "العمق الفعلي يتجاوز العمق المستهدف بشكل كبير (أكثر من 150%)",
  path: ["actual_depth"],
});

/**
 * Validation schema for Work Orders data
 */
export const workOrdersSchema = z.object({
  rig: z.string().min(1, "اسم الحفارة مطلوب"),
  year: z.number().int().min(2000).max(2100, "السنة غير صحيحة"),
  month: z.string().min(1, "الشهر مطلوب"),
  elec_open: z.number().int().min(0, "عدد الأوامر المفتوحة يجب أن يكون رقم موجب").optional().nullable(),
  elec_closed: z.number().int().min(0, "عدد الأوامر المغلقة يجب أن يكون رقم موجب").optional().nullable(),
  mech_open: z.number().int().min(0, "عدد الأوامر المفتوحة يجب أن يكون رقم موجب").optional().nullable(),
  mech_closed: z.number().int().min(0, "عدد الأوامر المغلقة يجب أن يكون رقم موجب").optional().nullable(),
  oper_open: z.number().int().min(0, "عدد الأوامر المفتوحة يجب أن يكون رقم موجب").optional().nullable(),
  oper_closed: z.number().int().min(0, "عدد الأوامر المغلقة يجب أن يكون رقم موجب").optional().nullable(),
  compliance_rate: z.number().min(0).max(100, "نسبة الالتزام يجب أن تكون بين 0-100").optional().nullable(),
});

/**
 * Validation schema for Customer Satisfaction data
 */
export const customerSatisfactionSchema = z.object({
  rig: z.string().min(1, "اسم الحفارة مطلوب"),
  year: z.number().int().min(2000).max(2100, "السنة غير صحيحة"),
  month: z.string().min(1, "الشهر مطلوب"),
  satisfaction_score: z.number().min(0).max(10, "درجة الرضا يجب أن تكون بين 0-10").optional().nullable(),
  feedback: z.string().optional().nullable(),
  client: z.string().optional().nullable(),
});

/**
 * Validate an array of records against a schema
 */
export function validateRecords<T>(
  records: any[],
  schema: z.ZodType<T>
): { valid: T[]; invalid: { record: any; errors: string[]; index: number }[] } {
  const valid: T[] = [];
  const invalid: { record: any; errors: string[]; index: number }[] = [];

  records.forEach((record, index) => {
    const result = schema.safeParse(record);
    if (result.success) {
      valid.push(result.data);
    } else {
      const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      invalid.push({ record, errors, index: index + 1 });
    }
  });

  return { valid, invalid };
}

/**
 * Get validation schema by report type
 */
export function getValidationSchema(reportType: string): z.ZodType<any> | null {
  const schemas: { [key: string]: z.ZodType<any> } = {
    rig_moves: rigMovesSchema,
    fuel: fuelConsumptionSchema,
    revenue: revenueSchema,
    utilization: utilizationSchema,
    billing_npt: billingNPTSchema,
    npt_root_cause: nptRootCauseSchema,
    stock: stockLevelsSchema,
    well_tracker: wellTrackerSchema,
    work_orders: workOrdersSchema,
    customer_satisfaction: customerSatisfactionSchema,
  };

  return schemas[reportType] || null;
}
