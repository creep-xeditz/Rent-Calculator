import * as XLSX from 'xlsx';
import { MONTH_NAMES } from '../data/defaultTenants';
import { StoredRecordRow, MonthRecord } from '../types';

export function monthValueToLabel(monthVal: string): string {
  if (!monthVal) return '';
  const [y, m] = monthVal.split('-');
  const mIndex = parseInt(m, 10) - 1;
  const monthName = MONTH_NAMES[mIndex] || '';
  return `${monthName}, ${y}`;
}

export function labelToMonthValue(label: string): string | null {
  const parts = label.split(',');
  if (parts.length !== 2) return null;
  const monName = parts[0].trim();
  const year = parts[1].trim();
  const idx = MONTH_NAMES.indexOf(monName);
  if (idx === -1 || isNaN(parseInt(year, 10))) return null;
  const mm = String(idx + 1).padStart(2, '0');
  return `${year}-${mm}`;
}

export function labelToSortKey(label: string): number {
  const parts = label.split(',');
  if (parts.length !== 2) return -1;
  const monName = parts[0].trim();
  const year = parseInt(parts[1].trim(), 10);
  const idx = MONTH_NAMES.indexOf(monName);
  if (idx === -1 || isNaN(year)) return -1;
  return year * 12 + idx;
}

export function formatINR(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return Number(val).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

export function formatCurrencyINR(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return '₹' + formatINR(val);
}

export interface ParsedWorkbookResult {
  sheetNames: string[];
  recordsBySheet: Record<string, StoredRecordRow[]>;
  rawWorkbook: XLSX.WorkBook;
}

export function parseWorkbook(arrayBuffer: ArrayBuffer): ParsedWorkbookResult {
  const data = new Uint8Array(arrayBuffer);
  const rawWorkbook = XLSX.read(data, { type: 'array' });
  const recordsBySheet: Record<string, StoredRecordRow[]> = {};

  rawWorkbook.SheetNames.forEach((name) => {
    const ws = rawWorkbook.Sheets[name];
    const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
    const rows: StoredRecordRow[] = json.map((item, idx) => ({
      tenantId: item['ID'] || item['tenantId'] || idx + 1,
      name: String(item['Tenant'] || item['tenant'] || item['Name'] || `Tenant ${idx + 1}`),
      rent: Number(item['Rent'] ?? 0),
      prevUnit: Number(item['Previous Unit'] ?? item['Previous unit'] ?? 0),
      currUnit: Number(item['Current Unit'] ?? item['Current unit'] ?? 0),
      unitsUsed: Number(item['Units Used'] ?? item['Units used'] ?? 0),
      elecCharge: Number(item['Electricity Charge'] ?? item['Electricity (₹)'] ?? 0),
      waterCharge: Number(item['Water Charge'] ?? item['Water (₹)'] ?? 200),
      prevDue: Number(item['Previous Due'] ?? item['Previous due'] ?? 0),
      netPayable: Number(item['Net Payable'] ?? item['Net payable'] ?? 0),
      paid: Number(item['Paid Amount'] ?? item['Paid (₹)'] ?? 0),
      due: Number(item['Due Amount'] ?? item['Due (₹)'] ?? 0),
    }));
    recordsBySheet[name] = rows;
  });

  return {
    sheetNames: rawWorkbook.SheetNames,
    recordsBySheet,
    rawWorkbook,
  };
}

export async function exportToExcel(
  existingWorkbook: XLSX.WorkBook | null,
  monthLabel: string,
  rows: StoredRecordRow[]
): Promise<Blob> {
  const wb = existingWorkbook ? XLSX.utils.book_new() : XLSX.utils.book_new();

  // If existing workbook has other sheets, preserve them
  if (existingWorkbook) {
    existingWorkbook.SheetNames.forEach((sheetName) => {
      if (sheetName !== monthLabel) {
        wb.SheetNames.push(sheetName);
        wb.Sheets[sheetName] = existingWorkbook.Sheets[sheetName];
      }
    });
  }

  // Header row
  const header = [
    'Tenant',
    'Current Unit',
    'Previous Unit',
    'Units Used',
    'Electricity Charge',
    'Rent',
    'Water Charge',
    'Previous Due',
    'Net Payable',
    'Paid Amount',
    'Due Amount',
  ];

  const dataRows = rows.map((r) => [
    r.name,
    r.currUnit,
    r.prevUnit,
    r.unitsUsed,
    r.elecCharge,
    r.rent,
    r.waterCharge,
    r.prevDue,
    r.netPayable,
    r.paid,
    r.due,
  ]);

  // Totals row at the bottom
  const totalRent = rows.reduce((acc, r) => acc + r.rent, 0);
  const totalUnits = rows.reduce((acc, r) => acc + r.unitsUsed, 0);
  const totalElec = rows.reduce((acc, r) => acc + r.elecCharge, 0);
  const totalWater = rows.reduce((acc, r) => acc + r.waterCharge, 0);
  const totalPrevDue = rows.reduce((acc, r) => acc + r.prevDue, 0);
  const totalNet = rows.reduce((acc, r) => acc + r.netPayable, 0);
  const totalPaid = rows.reduce((acc, r) => acc + r.paid, 0);
  const totalDue = rows.reduce((acc, r) => acc + r.due, 0);

  const totalsRow = [
    'TOTALS',
    '',
    '',
    totalUnits,
    totalElec,
    totalRent,
    totalWater,
    totalPrevDue,
    totalNet,
    totalPaid,
    totalDue,
  ];

  const wsData = [header, ...dataRows, totalsRow];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths for polished layout
  ws['!cols'] = [
    { wch: 16 }, // Tenant
    { wch: 14 }, // Curr Unit
    { wch: 14 }, // Prev Unit
    { wch: 12 }, // Units Used
    { wch: 16 }, // Elec Charge
    { wch: 10 }, // Rent
    { wch: 12 }, // Water Charge
    { wch: 14 }, // Prev Due
    { wch: 14 }, // Net Payable
    { wch: 12 }, // Paid
    { wch: 12 }, // Due
  ];

  XLSX.utils.book_append_sheet(wb, ws, monthLabel);

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function generateTenantSlipText(
  tenantName: string,
  monthLabel: string,
  rent: number,
  prevUnit: number,
  currUnit: number,
  unitsUsed: number,
  pricePerUnit: number,
  elecCharge: number,
  waterCharge: number,
  prevDue: number,
  netPayable: number,
  paid: number,
  due: number
): string {
  return `📋 *RENT & UTILITY BILL — ${monthLabel.toUpperCase()}*
Tenant: *${tenantName}*

🏠 Monthly Rent: ₹${formatINR(rent)}
⚡ Electricity: ₹${formatINR(elecCharge)} (${unitsUsed} units @ ₹${pricePerUnit}/unit)
   - Current Reading: ${currUnit}
   - Previous Reading: ${prevUnit}
💧 Water Charges: ₹${formatINR(waterCharge)}
⏳ Previous Dues: ₹${formatINR(prevDue)}
--------------------------------
💰 *Net Payable: ₹${formatINR(netPayable)}*
✅ Paid Amount: ₹${formatINR(paid)}
${due > 0 ? `⚠️ *Remaining Balance Due: ₹${formatINR(due)}*` : `✨ *Status: Fully Paid (₹0 Due)*`}

_Generated Via Rent Generator {Developed By Harsh}_`;
}
