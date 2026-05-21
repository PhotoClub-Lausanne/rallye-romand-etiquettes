import XLSX from 'xlsx';

// Create a simple workbook
const wb = XLSX.utils.book_new();

// Create sample data
const data = [
  { firstName: 'Alice', lastName: 'Johnson', menu: 'Menu A' },
  { firstName: 'Bob', lastName: 'Smith', menu: 'Menu B' },
  { firstName: 'Charlie', lastName: 'Brown', menu: 'Menu A' },
  { firstName: 'Diana', lastName: 'Wilson', menu: 'Menu C' },
  { firstName: 'Eve', lastName: 'Davis', menu: 'Menu B' },
  { firstName: 'Frank', lastName: 'Miller', menu: 'Menu A' },
  { firstName: 'Grace', lastName: 'Taylor', menu: 'Menu C' },
  { firstName: 'Henry', lastName: 'Anderson', menu: 'Menu B' },
  { firstName: 'Ivy', lastName: 'Thomas', menu: 'Menu A' },
  { firstName: 'Jack', lastName: 'Jackson', menu: 'Menu C' },
];

const ws = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, 'Participants');

XLSX.writeFile(wb, './sample.xlsx');
console.log('Sample file created: sample.xlsx');
