import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

interface BudgetRecord {
  version_id: string;
  report_id: string;
  rig_id: string;
  metric_id: string;
  year: number;
  month: number;
  budget_value: number;
  currency?: string;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_MAP: Record<string, number> = {
  'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
  'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
};

const NPT_HOURS_BY_MONTH = [8.184, 7.392, 8.184, 7.92, 8.184, 7.92, 8.184, 8.184, 7.92, 8.184, 7.92, 8.184];

const STOCK_TARGETS: Record<string, number> = {
  '103': 450000, '104': 450000, '105': 450000,
  '201': 550000, '202': 550000, '203': 550000, '204': 550000,
  '106': 650000, '107': 650000, '108': 650000, '109': 650000, '110': 650000, '111': 650000,
  '205': 650000, '206': 650000, '207': 650000, '208': 650000, '209': 650000, '210': 650000,
  '302': 650000, '303': 650000, '304': 650000, '306': 650000
};

export async function populate2025Budget(
  fuelFile: File,
  materialFile: File,
  repairFile: File
): Promise<{ success: boolean; recordsInserted: number; error?: string }> {
  try {
    console.log('Starting 2025 budget population...');

    // Get version ID
    const { data: version, error: versionError } = await supabase
      .from('budget_version')
      .select('id')
      .eq('version_code', '2025-V1')
      .single();

    if (versionError || !version) {
      throw new Error('2025 budget version not found. Please ensure it was created in the database.');
    }

    const versionId = version.id;
    console.log('Version ID:', versionId);

    // Get reference data
    const { data: reports } = await supabase.from('dim_report').select('id, report_key');
    const { data: metrics } = await supabase.from('dim_metric').select('id, metric_key');
    const { data: rigs } = await supabase.from('dim_rig').select('id, rig_code').eq('active', true);

    if (!reports || !metrics || !rigs) {
      throw new Error('Failed to fetch reference data');
    }

    const reportMap = Object.fromEntries(reports.map(r => [r.report_key, r.id]));
    const metricMap = Object.fromEntries(metrics.map(m => [m.metric_key, m.id]));
    const rigMap = Object.fromEntries(rigs.map(r => [r.rig_code, r.id]));

    console.log('Loaded references:', { reports: reports.length, metrics: metrics.length, rigs: rigs.length });

    const budgetRecords: BudgetRecord[] = [];

    // Helper to parse Excel file
    const parseExcelFile = async (file: File): Promise<any[]> => {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json(sheet);
    };

    // 1. Fuel Budget
    console.log('Processing Fuel budget...');
    const fuelData = await parseExcelFile(fuelFile);
    
    for (const row of fuelData) {
      const rigCode = String(row.Rig || row.rig || '').trim();
      const year = Number(row.Year || row.year || 2023);
      
      if (year !== 2023 || !rigMap[rigCode]) continue;

      for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
        const monthName = MONTH_NAMES[monthIdx];
        const value = Number(row[monthName] || 0);
        
        if (value > 0 && reportMap['fuel'] && metricMap['fuel_cost_usd']) {
          budgetRecords.push({
            version_id: versionId,
            report_id: reportMap['fuel'],
            rig_id: rigMap[rigCode],
            metric_id: metricMap['fuel_cost_usd'],
            year: 2025,
            month: monthIdx + 1,
            budget_value: value,
            currency: 'USD'
          });
        }
      }
    }

    // 2. Material Budget
    console.log('Processing Material budget...');
    const materialData = await parseExcelFile(materialFile);
    
    for (const row of materialData) {
      const rigCode = String(row.Rig || row.rig || '').trim();
      const year = Number(row.Year || row.year || 2023);
      
      if (year !== 2023 || !rigMap[rigCode]) continue;

      for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
        const monthName = MONTH_NAMES[monthIdx];
        const value = Number(row[monthName] || 0);
        
        if (value > 0 && reportMap['material'] && metricMap['material_cost_usd']) {
          budgetRecords.push({
            version_id: versionId,
            report_id: reportMap['material'],
            rig_id: rigMap[rigCode],
            metric_id: metricMap['material_cost_usd'],
            year: 2025,
            month: monthIdx + 1,
            budget_value: value,
            currency: 'USD'
          });
        }
      }
    }

    // 3. Repair Budget
    console.log('Processing Repair budget...');
    const repairData = await parseExcelFile(repairFile);
    
    for (const row of repairData) {
      const rigCode = String(row.Rig || row.rig || '').trim();
      const year = Number(row.Year || row.year || 2023);
      
      if (year !== 2023 || !rigMap[rigCode]) continue;

      for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
        const monthName = MONTH_NAMES[monthIdx];
        const value = Number(row[monthName] || 0);
        
        if (value > 0 && reportMap['maintenance'] && metricMap['repair_cost_usd']) {
          budgetRecords.push({
            version_id: versionId,
            report_id: reportMap['maintenance'],
            rig_id: rigMap[rigCode],
            metric_id: metricMap['repair_cost_usd'],
            year: 2025,
            month: monthIdx + 1,
            budget_value: value,
            currency: 'USD'
          });
        }
      }
    }

    // 4. Stock Level Budget
    console.log('Processing Stock Level budget...');
    if (reportMap['stock'] && metricMap['max_stock_value_usd']) {
      for (const [rigCode, targetValue] of Object.entries(STOCK_TARGETS)) {
        if (!rigMap[rigCode]) continue;
        
        for (let month = 1; month <= 12; month++) {
          budgetRecords.push({
            version_id: versionId,
            report_id: reportMap['stock'],
            rig_id: rigMap[rigCode],
            metric_id: metricMap['max_stock_value_usd'],
            year: 2025,
            month,
            budget_value: targetValue,
            currency: 'USD'
          });
        }
      }
    }

    // 5. Revenue Budget from database
    console.log('Processing Revenue budget from database...');
    const { data: revenueData } = await supabase
      .from('revenue')
      .select('rig, month, revenue_budget')
      .eq('year', 2023)
      .not('revenue_budget', 'is', null);

    if (revenueData && reportMap['revenue'] && metricMap['revenue_usd']) {
      for (const row of revenueData) {
        const rigCode = String(row.rig).trim();
        const monthNum = MONTH_MAP[row.month] || 0;
        
        if (rigMap[rigCode] && monthNum > 0 && row.revenue_budget) {
          budgetRecords.push({
            version_id: versionId,
            report_id: reportMap['revenue'],
            rig_id: rigMap[rigCode],
            metric_id: metricMap['revenue_usd'],
            year: 2025,
            month: monthNum,
            budget_value: row.revenue_budget,
            currency: 'USD'
          });
        }
      }
    }

    // 6. Rig Moves Budget from revenue comments
    console.log('Processing Rig Moves budget from database...');
    const { data: rigMovesData } = await supabase
      .from('revenue')
      .select('rig, month, comments')
      .eq('year', 2023)
      .not('comments', 'is', null);

    if (rigMovesData && reportMap['rig_moves'] && metricMap['rig_moves_count']) {
      const rigMoveRegex = /Budget Move\s+(\d+\.?\d*)/i;
      
      for (const row of rigMovesData) {
        const rigCode = String(row.rig).trim();
        const monthNum = MONTH_MAP[row.month] || 0;
        const match = row.comments?.match(rigMoveRegex);
        
        if (rigMap[rigCode] && monthNum > 0 && match) {
          const moves = parseFloat(match[1]);
          budgetRecords.push({
            version_id: versionId,
            report_id: reportMap['rig_moves'],
            rig_id: rigMap[rigCode],
            metric_id: metricMap['rig_moves_count'],
            year: 2025,
            month: monthNum,
            budget_value: moves
          });
        }
      }
    }

    // 7. Fixed targets for all rigs
    console.log('Processing fixed targets...');
    for (const rigCode of Object.keys(rigMap)) {
      for (let month = 1; month <= 12; month++) {
        // Work Orders: 0%
        if (reportMap['work_orders'] && metricMap['max_open_wo_oper']) {
          budgetRecords.push({
            version_id: versionId,
            report_id: reportMap['work_orders'],
            rig_id: rigMap[rigCode],
            metric_id: metricMap['max_open_wo_oper'],
            year: 2025,
            month,
            budget_value: 0
          });
        }

        // Utilization: 100%
        if (reportMap['utilization'] && metricMap['utilization_pct']) {
          budgetRecords.push({
            version_id: versionId,
            report_id: reportMap['utilization'],
            rig_id: rigMap[rigCode],
            metric_id: metricMap['utilization_pct'],
            year: 2025,
            month,
            budget_value: 100
          });
        }

        // NPT Hours: 1.1% of monthly hours
        if (reportMap['billing_npt'] && metricMap['npt_hours']) {
          budgetRecords.push({
            version_id: versionId,
            report_id: reportMap['billing_npt'],
            rig_id: rigMap[rigCode],
            metric_id: metricMap['npt_hours'],
            year: 2025,
            month,
            budget_value: NPT_HOURS_BY_MONTH[month - 1]
          });
        }

        // Customer Satisfaction: 100%
        if (reportMap['customer_satisfaction'] && metricMap['csat_score']) {
          budgetRecords.push({
            version_id: versionId,
            report_id: reportMap['customer_satisfaction'],
            rig_id: rigMap[rigCode],
            metric_id: metricMap['csat_score'],
            year: 2025,
            month,
            budget_value: 100
          });
        }

        // Well Tracker: 3 wells per month
        if (reportMap['well_tracker'] && metricMap['wells_completed_count']) {
          budgetRecords.push({
            version_id: versionId,
            report_id: reportMap['well_tracker'],
            rig_id: rigMap[rigCode],
            metric_id: metricMap['wells_completed_count'],
            year: 2025,
            month,
            budget_value: 3
          });
        }
      }
    }

    // Insert all budget records in batches
    console.log(`Inserting ${budgetRecords.length} budget records...`);
    const batchSize = 1000;
    let inserted = 0;

    for (let i = 0; i < budgetRecords.length; i += batchSize) {
      const batch = budgetRecords.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('fact_budget')
        .insert(batch);

      if (insertError) {
        console.error('Batch insert error:', insertError);
        throw insertError;
      }
      
      inserted += batch.length;
      console.log(`Inserted ${inserted}/${budgetRecords.length} records`);
    }

    console.log('2025 budget population completed successfully!');

    return {
      success: true,
      recordsInserted: budgetRecords.length
    };

  } catch (error: any) {
    console.error('Error populating budget:', error);
    return {
      success: false,
      recordsInserted: 0,
      error: error.message || 'Unknown error'
    };
  }
}
