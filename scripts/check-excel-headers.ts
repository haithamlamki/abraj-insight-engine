import * as XLSX from 'xlsx';
import * as fs from 'fs';

// Read the Excel file
const fileBuffer = fs.readFileSync('user-uploads://Revenue-5.xlsx');
const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });

// Get the first sheet
const firstSheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[firstSheetName];

// Convert to JSON to see headers
const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

if (data.length > 0) {
  console.log('Excel Column Headers:');
  console.log(Object.keys(data[0]));
  console.log('\nFirst row data:');
  console.log(data[0]);
}
