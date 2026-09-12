import React, { useState, useEffect, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Header } from './components/Header';
import { ControlsPanel } from './components/ControlsPanel';
import { LedgerTable } from './components/LedgerTable';
import { HistorySection } from './components/HistorySection';
import { TenantReceiptModal } from './components/TenantReceiptModal';
import { SettingsModal } from './components/SettingsModal';
import { DEFAULT_TENANTS, DEFAULT_SETTINGS } from './data/defaultTenants';
import { Tenant, AppSettings, LedgerEntry, ComputedRow, StoredRecordRow } from './types';
import {
  monthValueToLabel,
  labelToMonthValue,
  labelToSortKey,
  parseWorkbook,
  exportToExcel,
} from './utils/excel';
import { Info } from 'lucide-react';

const STORAGE_KEY_TENANTS = 'rent_calculator_tenants_v1';
const STORAGE_KEY_SETTINGS = 'rent_calculator_settings_v1';
const STORAGE_KEY_RECORDS = 'rent_calculator_history_v1';

export default function App() {
  // 1. Tenants & Settings State
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TENANTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_TENANTS;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SETTINGS;
  });

  // Current Month selection (Default to August)
  const [monthValue, setMonthValue] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear();
    return `${y}-08`;
  });

  const [isFirstMonth, setIsFirstMonth] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [saveStatus, setSaveStatus] = useState<{ text: string; isError?: boolean } | null>(null);

  // Raw workbook instance from SheetJS
  const [rawWorkbook, setRawWorkbook] = useState<XLSX.WorkBook | null>(null);

  // Stored historical records across sheets
  const [recordsBySheet, setRecordsBySheet] = useState<Record<string, StoredRecordRow[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  // Ledger Entries state keyed by tenantId
  const [ledgerEntries, setLedgerEntries] = useState<Record<number, LedgerEntry>>({});

  // Modals
  const [receiptTarget, setReceiptTarget] = useState<{ tenant: Tenant; row: ComputedRow } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Initialize or synchronize ledger entries when tenants change
  useEffect(() => {
    setLedgerEntries((prev) => {
      const next: Record<number, LedgerEntry> = {};
      tenants.forEach((t) => {
        if (prev[t.id]) {
          next[t.id] = { ...prev[t.id], name: t.name, rent: t.rent };
        } else {
          next[t.id] = {
            tenantId: t.id,
            name: t.name,
            rent: t.rent,
            prevUnit: 0,
            currUnit: '',
            prevDue: 0,
            paidAmt: '',
            isManual: false,
          };
        }
      });
      return next;
    });
  }, [tenants]);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TENANTS, JSON.stringify(tenants));
    } catch (e) {
      console.error(e);
    }
  }, [tenants]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(recordsBySheet));
    } catch (e) {
      console.error(e);
    }
  }, [recordsBySheet]);

  const monthLabel = useMemo(() => monthValueToLabel(monthValue), [monthValue]);

  const availableSheets = useMemo(() => {
    const fromWorkbook = rawWorkbook ? rawWorkbook.SheetNames : [];
    const fromStorage = Object.keys(recordsBySheet);
    const combined = Array.from(new Set([...fromWorkbook, ...fromStorage]));
    return combined;
  }, [rawWorkbook, recordsBySheet]);

  // Carry forward logic: find latest sheet strictly prior to selected month
  const tryCarryForward = useCallback(
    (targetLabel: string, sourceSheets: Record<string, StoredRecordRow[]>) => {
      if (isFirstMonth) return;
      const targetKey = labelToSortKey(targetLabel);
      if (targetKey === -1) return;

      let bestSheet: string | null = null;
      let bestKey = -1;

      Object.keys(sourceSheets).forEach((sheetName) => {
        const k = labelToSortKey(sheetName);
        if (k !== -1 && k < targetKey && k > bestKey) {
          bestKey = k;
          bestSheet = sheetName;
        }
      });

      if (!bestSheet) {
        setStatusMessage({
          text: `No prior month found in records before ${targetLabel}. You may use the manual toggle on any tenant row if needed.`,
          isError: false,
        });
        return;
      }

      const prevRows = sourceSheets[bestSheet];
      if (!prevRows || prevRows.length === 0) return;

      setLedgerEntries((prev) => {
        const next = { ...prev };
        tenants.forEach((t) => {
          const matching = prevRows.find((r) => r.name.toLowerCase() === t.name.toLowerCase());
          const currentEntry = prev[t.id] || {
            tenantId: t.id,
            name: t.name,
            rent: t.rent,
            prevUnit: 0,
            currUnit: '',
            prevDue: 0,
            paidAmt: '',
            isManual: false,
          };

          // If entry is marked manual by user, don't overwrite
          if (!currentEntry.isManual) {
            next[t.id] = {
              ...currentEntry,
              prevUnit: matching ? matching.currUnit : 0,
              prevDue: matching ? matching.due : 0,
            };
          }
        });
        return next;
      });

      setStatusMessage({
        text: `Carried forward previous meter readings and due balances from "${bestSheet}".`,
        isError: false,
      });
    },
    [isFirstMonth, tenants]
  );

  // Handle Month Change
  const handleMonthChange = (val: string) => {
    setMonthValue(val);
    const label = monthValueToLabel(val);
    if (label) {
      tryCarryForward(label, recordsBySheet);
    }
  };

  // Handle File Upload
  const handleFileUpload = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseWorkbook(buffer);

      setRawWorkbook(parsed.rawWorkbook);
      setRecordsBySheet((prev) => ({ ...prev, ...parsed.recordsBySheet }));

      setStatusMessage({
        text: `Successfully loaded "${file.name}" with ${parsed.sheetNames.length} month sheet(s).`,
        isError: false,
      });

      // Auto carry forward into currently selected month
      if (monthLabel) {
        tryCarryForward(monthLabel, { ...recordsBySheet, ...parsed.recordsBySheet });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({
        text: 'Failed to read the Excel file. Please ensure it is a valid .xlsx file.',
        isError: true,
      });
    }
  };

  // Handle Table Inputs
  const handleInputChange = (
    tenantId: number,
    field: 'currUnit' | 'paidAmt' | 'prevUnit' | 'prevDue',
    value: string
  ) => {
    setLedgerEntries((prev) => {
      const current = prev[tenantId];
      if (!current) return prev;
      if (field === 'prevUnit' || field === 'prevDue') {
        const num = parseFloat(value) || 0;
        return {
          ...prev,
          [tenantId]: { ...current, [field]: num },
        };
      }
      return {
        ...prev,
        [tenantId]: { ...current, [field]: value },
      };
    });
  };

  const handleToggleManual = (tenantId: number, manual: boolean) => {
    setLedgerEntries((prev) => {
      const current = prev[tenantId];
      if (!current) return prev;
      return {
        ...prev,
        [tenantId]: { ...current, isManual: manual },
      };
    });
  };

  const handlePayFull = (tenantId: number) => {
    const row = computedRows.find((r) => r.tenantId === tenantId);
    if (!row || row.netPayable === null) return;
    setLedgerEntries((prev) => {
      const current = prev[tenantId];
      if (!current) return prev;
      return {
        ...prev,
        [tenantId]: { ...current, paidAmt: String(Math.max(0, row.netPayable!)) },
      };
    });
  };

  // Computed Rows
  const computedRows: ComputedRow[] = useMemo(() => {
    return tenants.map((t) => {
      const entry = ledgerEntries[t.id] || {
        tenantId: t.id,
        name: t.name,
        rent: t.rent,
        prevUnit: 0,
        currUnit: '',
        prevDue: 0,
        paidAmt: '',
        isManual: false,
      };

      const prevUnit = entry.prevUnit;
      const prevDue = entry.prevDue;
      const currUnitRaw = entry.currUnit.trim();
      const hasInput = currUnitRaw !== '';
      const currUnit = hasInput ? parseFloat(currUnitRaw) : null;
      const paid = parseFloat(entry.paidAmt) || 0;

      if (currUnit === null || isNaN(currUnit)) {
        return {
          tenantId: t.id,
          name: t.name,
          rent: t.rent,
          prevUnit,
          currUnit: null,
          unitsUsed: null,
          elecCharge: null,
          waterCharge: settings.waterCharge,
          prevDue,
          netPayable: null,
          paid,
          due: null,
          isManual: entry.isManual,
          hasInput: false,
        };
      }

      const unitsUsed = currUnit - prevUnit;
      const elecCharge = unitsUsed * settings.pricePerUnit;
      const netPayable = elecCharge + t.rent + settings.waterCharge + prevDue;
      const due = netPayable - paid;

      return {
        tenantId: t.id,
        name: t.name,
        rent: t.rent,
        prevUnit,
        currUnit,
        unitsUsed,
        elecCharge,
        waterCharge: settings.waterCharge,
        prevDue,
        netPayable,
        paid,
        due,
        isManual: entry.isManual,
        hasInput: true,
      };
    });
  }, [tenants, ledgerEntries, settings]);

  // Aggregate KPI metrics
  const totalNet = useMemo(
    () => computedRows.reduce((acc, r) => acc + (r.netPayable || 0), 0),
    [computedRows]
  );
  const totalPaid = useMemo(
    () => computedRows.reduce((acc, r) => acc + (r.paid || 0), 0),
    [computedRows]
  );
  const totalDue = useMemo(
    () => computedRows.reduce((acc, r) => acc + (r.due || 0), 0),
    [computedRows]
  );
  const totalUnits = useMemo(
    () => computedRows.reduce((acc, r) => acc + (r.unitsUsed || 0), 0),
    [computedRows]
  );
  const totalElec = useMemo(
    () => computedRows.reduce((acc, r) => acc + (r.elecCharge || 0), 0),
    [computedRows]
  );

  // Readiness to save
  const canSave = useMemo(() => {
    if (!monthValue) return false;
    return computedRows.every((r) => r.currUnit !== null && !isNaN(r.currUnit));
  }, [monthValue, computedRows]);

  // Save Month and Export
  const handleSaveAndDownload = async () => {
    if (!canSave || !monthLabel) {
      setSaveStatus({
        text: 'Please choose a billing month and input current readings for all tenants.',
        isError: true,
      });
      return;
    }

    const storedRows: StoredRecordRow[] = computedRows.map((r) => ({
      tenantId: r.tenantId,
      name: r.name,
      rent: r.rent,
      prevUnit: r.prevUnit,
      currUnit: r.currUnit ?? 0,
      unitsUsed: r.unitsUsed ?? 0,
      elecCharge: r.elecCharge ?? 0,
      waterCharge: r.waterCharge,
      prevDue: r.prevDue,
      netPayable: r.netPayable ?? 0,
      paid: r.paid,
      due: r.due ?? 0,
    }));

    // Update local records
    setRecordsBySheet((prev) => ({
      ...prev,
      [monthLabel]: storedRows,
    }));

    try {
      const blob = await exportToExcel(rawWorkbook, monthLabel, storedRows);
      const suggestedFileName = `Rent-Register-${monthLabel.replace(/\s+/g, '-').replace(/,/g, '')}.xlsx`;

      // Use File System Access API if supported
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: suggestedFileName,
            types: [
              {
                description: 'Excel Spreadsheet (.xlsx)',
                accept: {
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                },
              },
            ],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          setSaveStatus({
            text: `Saved "${monthLabel}" and wrote ${suggestedFileName} successfully. Keep this workbook to load next month!`,
            isError: false,
          });
          return;
        } catch (pickerErr: any) {
          if (pickerErr?.name === 'AbortError') return;
        }
      }

      // Fallback browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = suggestedFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSaveStatus({
        text: `Saved "${monthLabel}" sheet and downloaded ${suggestedFileName}. Re-upload this same workbook next month to carry forward automatically!`,
        isError: false,
      });
    } catch (err) {
      console.error(err);
      setSaveStatus({
        text: 'Error exporting Excel file. Please try again.',
        isError: true,
      });
    }
  };

  // Clear current readings
  const handleClearReadings = () => {
    setLedgerEntries((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((idStr) => {
        const id = Number(idStr);
        next[id] = {
          ...next[id],
          currUnit: '',
          paidAmt: '',
        };
      });
      return next;
    });
    setSaveStatus(null);
  };

  // Load a historical month into editor
  const handleLoadMonthToEditor = (sheetName: string) => {
    const rows = recordsBySheet[sheetName];
    if (!rows || rows.length === 0) return;

    const monthVal = labelToMonthValue(sheetName);
    if (monthVal) {
      setMonthValue(monthVal);
    }

    setLedgerEntries((prev) => {
      const next = { ...prev };
      tenants.forEach((t) => {
        const rec = rows.find((r) => r.name.toLowerCase() === t.name.toLowerCase());
        if (rec) {
          next[t.id] = {
            tenantId: t.id,
            name: t.name,
            rent: rec.rent,
            prevUnit: rec.prevUnit,
            currUnit: String(rec.currUnit),
            prevDue: rec.prevDue,
            paidAmt: String(rec.paid),
            isManual: true, // unlock for correction
          };
        }
      });
      return next;
    });

    setSaveStatus({
      text: `Loaded "${sheetName}" into the active editor. You can make corrections and click "Save this month" to update.`,
      isError: false,
    });
  };

  return (
    <div className="min-h-screen bg-[#F6F4EE] text-[#1B1F1C] relative">
      {/* Decorative Book Spine */}
      <div className="fixed top-0 left-0 bottom-0 w-2.5 bg-gradient-to-b from-[#234D3A] to-[#3C6B54] z-40 hidden sm:block shadow-xs" />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10 sm:pl-10">
        {/* Header with App Logo & KPIs */}
        <Header
          monthLabel={monthLabel}
          totalNet={totalNet}
          totalPaid={totalPaid}
          totalDue={totalDue}
          totalUnits={totalUnits}
          totalElec={totalElec}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Step 1: Controls & Month Selection */}
        <ControlsPanel
          monthValue={monthValue}
          onMonthChange={handleMonthChange}
          onFileUpload={handleFileUpload}
          statusMessage={statusMessage}
          settings={settings}
        />

        {/* Step 2: Main Ledger Table */}
        <LedgerTable
          computedRows={computedRows}
          settings={settings}
          isFirstMonth={isFirstMonth}
          onInputChange={handleInputChange}
          onToggleManual={handleToggleManual}
          onPayFull={handlePayFull}
          onOpenReceipt={(t, r) => setReceiptTarget({ tenant: t, row: r })}
          onSaveAndDownload={handleSaveAndDownload}
          onClearReadings={handleClearReadings}
          saveStatus={saveStatus}
          canSave={canSave}
          monthLabel={monthLabel}
        />

        {/* Step 3: History & Corrections */}
        <HistorySection
          availableSheets={availableSheets}
          recordsBySheet={recordsBySheet}
          onLoadMonthToEditor={handleLoadMonthToEditor}
        />

        {/* Information & Guidelines Card */}
        <section className="mt-8 bg-[#EAF1EB] border border-[#C2DBC7] rounded p-4 text-xs text-[#2E3330] leading-relaxed">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#234D3A] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#1B1F1C] mb-1">
                How Rent Calculator Works:
              </p>
              <p>
                Calculations are configured with <strong>₹{settings.pricePerUnit}/unit electricity</strong> and{' '}
                <strong>₹{settings.waterCharge} water charge</strong> per tenant. Net payable is calculated automatically as{' '}
                <code className="bg-[#DCEADA] px-1 py-0.5 rounded font-mono text-[11px]">
                  Electricity (units × ₹{settings.pricePerUnit}) + Rent + Water (₹{settings.waterCharge}) + Previous Due
                </code>
                . Each month is saved into its own sheet in the workbook (e.g., &ldquo;{monthLabel || 'September, 2026'}&rdquo;). Re-uploading your downloaded file next month automatically carries forward previous meter readings and dues.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Tenant Slip / Receipt Modal */}
      {receiptTarget && (
        <TenantReceiptModal
          tenant={receiptTarget.tenant}
          row={receiptTarget.row}
          monthLabel={monthLabel}
          settings={settings}
          onClose={() => setReceiptTarget(null)}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          tenants={tenants}
          settings={settings}
          onSave={(newTenants, newSettings) => {
            setTenants(newTenants);
            setSettings(newSettings);
            setStatusMessage({
              text: 'Tenant list and billing rates updated successfully.',
              isError: false,
            });
          }}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}
