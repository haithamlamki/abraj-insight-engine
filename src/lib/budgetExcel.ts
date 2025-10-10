import * as XLSX from 'xlsx';

export interface BudgetImportRow {
  rig_code: string;
  metric_key: string;
  year: number;
  month: number;
  budget_value: number;
  currency?: string;
  notes?: string;
}

export const generateBudgetTemplate = (
  rigs: Array<{ rig_code: string }>,
  metrics: Array<{ metric_key: string; display_name: string }>,
  year: number
): void => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const worksheetData: any[][] = [
    ['Budget Template', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Year:', year, '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Rig Code', 'Metric', ...months, 'Currency', 'Notes']
  ];

  rigs.forEach(rig => {
    metrics.forEach(metric => {
      const row = [
        rig.rig_code,
        metric.metric_key,
        ...Array(12).fill(0),
        'OMR',
        ''
      ];
      worksheetData.push(row);
    });
  });

  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 12 },
    { wch: 20 },
    ...Array(12).fill({ wch: 10 }),
    { wch: 10 },
    { wch: 30 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Budget');
  
  XLSX.writeFile(wb, `budget_template_${year}.xlsx`);
};

export const parseBudgetExcel = async (
  file: File,
  rigs: Array<{ id: string; rig_code: string }>,
  metrics: Array<{ id: string; metric_key: string }>
): Promise<BudgetImportRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        // Find header row (should contain "Rig Code")
        let headerRowIndex = jsonData.findIndex(row => 
          row.some(cell => String(cell).toLowerCase().includes('rig code'))
        );
        
        if (headerRowIndex === -1) {
          throw new Error('Invalid template: Could not find header row');
        }

        // Extract year from template
        const yearRow = jsonData.find(row => 
          row[0] && String(row[0]).toLowerCase().includes('year')
        );
        const year = yearRow ? parseInt(yearRow[1]) : new Date().getFullYear();

        const results: BudgetImportRow[] = [];
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

        // Process data rows
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row[0] || !row[1]) continue;

          const rigCode = String(row[0]).trim();
          const metricKey = String(row[1]).trim();
          const currency = row[14] || 'OMR';
          const notes = row[15] || '';

          const rig = rigs.find(r => r.rig_code === rigCode);
          const metric = metrics.find(m => m.metric_key === metricKey);

          if (!rig || !metric) {
            console.warn(`Skipping row: Rig ${rigCode} or Metric ${metricKey} not found`);
            continue;
          }

          // Process each month
          for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
            const value = parseFloat(row[2 + monthIdx]) || 0;
            
            results.push({
              rig_code: rigCode,
              metric_key: metricKey,
              year,
              month: monthIdx + 1,
              budget_value: value,
              currency,
              notes
            });
          }
        }

        resolve(results);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

export const exportBudgetToExcel = (
  budgets: Array<{
    rig_code: string;
    metric_key: string;
    year: number;
    month: number;
    budget_value: number;
    currency: string;
  }>,
  year: number
): void => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Group by rig and metric
  const grouped = budgets.reduce((acc, budget) => {
    const key = `${budget.rig_code}-${budget.metric_key}`;
    if (!acc[key]) {
      acc[key] = {
        rig_code: budget.rig_code,
        metric_key: budget.metric_key,
        currency: budget.currency,
        values: Array(12).fill(0)
      };
    }
    acc[key].values[budget.month - 1] = budget.budget_value;
    return acc;
  }, {} as Record<string, any>);

  const worksheetData = [
    ['Budget Export', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Year:', year, '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Rig Code', 'Metric', ...months, 'Currency', 'Total']
  ];

  Object.values(grouped).forEach((item: any) => {
    const total = item.values.reduce((sum: number, val: number) => sum + val, 0);
    worksheetData.push([
      item.rig_code,
      item.metric_key,
      ...item.values,
      item.currency,
      total
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  ws['!cols'] = [
    { wch: 12 },
    { wch: 20 },
    ...Array(12).fill({ wch: 10 }),
    { wch: 10 },
    { wch: 12 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Budget');
  
  XLSX.writeFile(wb, `budget_export_${year}.xlsx`);
};
