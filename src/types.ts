export interface Tenant {
  id: number;
  name: string;
  rent: number;
}

export interface LedgerEntry {
  tenantId: number;
  name: string;
  rent: number;
  prevUnit: number;
  currUnit: string; // string representation in input
  prevDue: number;
  paidAmt: string; // string representation in input
  isManual: boolean;
}

export interface ComputedRow {
  tenantId: number;
  name: string;
  rent: number;
  prevUnit: number;
  currUnit: number | null;
  unitsUsed: number | null;
  elecCharge: number | null;
  waterCharge: number;
  prevDue: number;
  netPayable: number | null;
  paid: number;
  due: number | null;
  isManual: boolean;
  hasInput: boolean;
}

export interface StoredRecordRow {
  tenantId: number;
  name: string;
  rent: number;
  prevUnit: number;
  currUnit: number;
  unitsUsed: number;
  elecCharge: number;
  waterCharge: number;
  prevDue: number;
  netPayable: number;
  paid: number;
  due: number;
}

export interface MonthRecord {
  monthKey: string; // e.g. "2026-09"
  label: string;    // e.g. "September, 2026"
  savedAt: string;
  rows: StoredRecordRow[];
  totalNetPayable: number;
  totalPaid: number;
  totalDue: number;
  totalUnits: number;
  totalElec: number;
}

export interface AppSettings {
  pricePerUnit: number;
  waterCharge: number;
}
