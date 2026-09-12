import React from 'react';
import { Download, RotateCcw, FileText, CheckCheck, Printer } from 'lucide-react';
import { ComputedRow, Tenant, AppSettings } from '../types';
import { formatCurrencyINR, formatINR } from '../utils/excel';

interface LedgerTableProps {
  computedRows: ComputedRow[];
  settings: AppSettings;
  isFirstMonth: boolean;
  onInputChange: (
    tenantId: number,
    field: 'currUnit' | 'paidAmt' | 'prevUnit' | 'prevDue',
    value: string
  ) => void;
  onToggleManual: (tenantId: number, isManual: boolean) => void;
  onPayFull: (tenantId: number) => void;
  onOpenReceipt: (tenant: Tenant, row: ComputedRow) => void;
  onSaveAndDownload: () => void;
  onClearReadings: () => void;
  saveStatus: { text: string; isError?: boolean } | null;
  canSave: boolean;
  monthLabel: string;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({
  computedRows,
  settings,
  isFirstMonth,
  onInputChange,
  onToggleManual,
  onPayFull,
  onOpenReceipt,
  onSaveAndDownload,
  onClearReadings,
  saveStatus,
  canSave,
  monthLabel,
}) => {
  // Compute footer totals
  const totalRent = computedRows.reduce((acc, r) => acc + r.rent, 0);
  const totalUnits = computedRows.reduce((acc, r) => acc + (r.unitsUsed || 0), 0);
  const totalElec = computedRows.reduce((acc, r) => acc + (r.elecCharge || 0), 0);
  const totalWater = computedRows.reduce((acc, r) => acc + r.waterCharge, 0);
  const totalPrevDue = computedRows.reduce((acc, r) => acc + r.prevDue, 0);
  const totalNet = computedRows.reduce((acc, r) => acc + (r.netPayable || 0), 0);
  const totalPaid = computedRows.reduce((acc, r) => acc + r.paid, 0);
  const totalDue = computedRows.reduce((acc, r) => acc + (r.due || 0), 0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Jump to next row's same field
      const nextRow = rowIndex + 1;
      const targetId = `input-${field}-${nextRow}`;
      const nextInput = document.getElementById(targetId) as HTMLInputElement | null;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-[#DCD5C3]">
        <h2 className="font-serif-heading font-semibold text-xl text-[#1B1F1C]">
          2. Enter this month's readings
        </h2>
        <span className="text-xs text-[#5B5F58]">
          Tip: Press <kbd className="px-1.5 py-0.5 bg-[#FAF9F5] border border-[#DCD5C3] rounded text-[11px] font-mono">Enter</kbd> to quickly jump down rows
        </span>
      </div>

      <div className="bg-white border border-[#DCD5C3] rounded p-4 md:p-5 shadow-xs">
        <div className="overflow-x-auto border border-[#DCD5C3] rounded">
          <table className="w-full border-collapse bg-white text-xs md:text-sm text-right">
            <thead>
              <tr className="border-b-2 border-[#1B1F1C] bg-[#FAF9F5] text-[#5B5F58] font-medium text-[11px] md:text-xs">
                <th className="p-3 text-left sticky left-0 bg-[#FAF9F5] z-10 min-w-[130px]">
                  Tenant
                </th>
                <th className="p-3 min-w-[110px]">Current unit</th>
                <th className="p-3 min-w-[110px]">Previous unit</th>
                <th className="p-3">Units used</th>
                <th className="p-3">Electricity (₹)</th>
                <th className="p-3">Rent (₹)</th>
                <th className="p-3">Water (₹)</th>
                <th className="p-3 min-w-[100px]">Previous due (₹)</th>
                <th className="p-3 font-semibold text-[#1B1F1C]">Net payable (₹)</th>
                <th className="p-3 min-w-[120px]">Paid (₹)</th>
                <th className="p-3 font-semibold text-[#1B1F1C]">Due (₹)</th>
                <th className="p-3 text-center">Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCD5C3]">
              {computedRows.map((row, idx) => {
                const isManualActive = isFirstMonth || row.isManual;
                const isNegativeUnits = row.unitsUsed !== null && row.unitsUsed < 0;

                return (
                  <tr
                    key={row.tenantId}
                    className="hover:bg-[#FAF9F5] transition-colors group"
                  >
                    {/* Tenant Name */}
                    <td className="p-3 text-left font-medium text-[#1B1F1C] sticky left-0 bg-white group-hover:bg-[#FAF9F5] z-10 border-r border-[#EFECE3] md:border-r-0">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#EAE6DB] text-[#234D3A] font-mono-nums text-[11px] font-semibold flex items-center justify-center shrink-0">
                          {row.tenantId}
                        </span>
                        <span className="whitespace-nowrap font-medium">{row.name}</span>
                      </div>
                    </td>

                    {/* Current Unit Input */}
                    <td className="p-2">
                      <input
                        id={`input-currUnit-${idx}`}
                        type="number"
                        step="any"
                        placeholder="reading"
                        value={row.currUnit !== null ? row.currUnit : ''}
                        onChange={(e) =>
                          onInputChange(row.tenantId, 'currUnit', e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, idx, 'currUnit')}
                        className={`w-22 px-2 py-1 border text-right font-mono-nums text-xs rounded transition-all ${
                          row.hasInput
                            ? 'bg-white border-[#234D3A] ring-1 ring-[#234D3A]/20'
                            : 'bg-white border-[#DCD5C3] hover:border-[#A9863F]'
                        }`}
                      />
                    </td>

                    {/* Previous Unit */}
                    <td className="p-2">
                      <div className="flex flex-col items-end">
                        <input
                          id={`input-prevUnit-${idx}`}
                          type="number"
                          step="any"
                          value={row.prevUnit}
                          disabled={!isManualActive}
                          onChange={(e) =>
                            onInputChange(row.tenantId, 'prevUnit', e.target.value)
                          }
                          onKeyDown={(e) => handleKeyDown(e, idx, 'prevUnit')}
                          className={`w-20 px-2 py-1 border text-right font-mono-nums text-xs rounded ${
                            !isManualActive
                              ? 'bg-[#F2EFE6] border-[#DCD5C3] text-[#5B5F58] cursor-not-allowed'
                              : 'bg-white border-[#234D3A] text-[#1B1F1C]'
                          }`}
                        />
                        {!isFirstMonth && (
                          <label className="flex items-center gap-1 mt-1 text-[10px] text-[#5B5F58] cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={row.isManual}
                              onChange={(e) =>
                                onToggleManual(row.tenantId, e.target.checked)
                              }
                              className="w-3 h-3 text-[#234D3A] rounded border-[#DCD5C3]"
                            />
                            <span>manual</span>
                          </label>
                        )}
                      </div>
                    </td>

                    {/* Units Used */}
                    <td
                      className={`p-3 font-mono-nums ${
                        isNegativeUnits
                          ? 'text-[#8C3A32] font-semibold'
                          : 'text-[#1B1F1C]'
                      }`}
                    >
                      {row.unitsUsed !== null ? (
                        <span>
                          {formatINR(row.unitsUsed)}
                          {isNegativeUnits && (
                            <span className="text-[10px] block text-[#8C3A32]">
                              (check reading)
                            </span>
                          )}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Electricity Charge */}
                    <td className="p-3 font-mono-nums text-[#1B1F1C]">
                      {row.elecCharge !== null ? formatINR(row.elecCharge) : '—'}
                    </td>

                    {/* Rent */}
                    <td className="p-3 font-mono-nums text-[#1B1F1C]">
                      {formatINR(row.rent)}
                    </td>

                    {/* Water Charge */}
                    <td className="p-3 font-mono-nums text-[#5B5F58]">
                      {formatINR(row.waterCharge)}
                    </td>

                    {/* Previous Due */}
                    <td className="p-2">
                      <input
                        id={`input-prevDue-${idx}`}
                        type="number"
                        step="any"
                        value={row.prevDue}
                        disabled={!isManualActive}
                        onChange={(e) =>
                          onInputChange(row.tenantId, 'prevDue', e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, idx, 'prevDue')}
                        className={`w-20 px-2 py-1 border text-right font-mono-nums text-xs rounded ${
                          !isManualActive
                            ? 'bg-[#F2EFE6] border-[#DCD5C3] text-[#5B5F58] cursor-not-allowed'
                            : 'bg-white border-[#234D3A] text-[#1B1F1C]'
                        }`}
                      />
                    </td>

                    {/* Net Payable */}
                    <td className="p-3 font-mono-nums font-semibold text-[#1B1F1C]">
                      {row.netPayable !== null ? formatCurrencyINR(row.netPayable) : '—'}
                    </td>

                    {/* Paid Input */}
                    <td className="p-2">
                      <div className="flex items-center justify-end gap-1">
                        <input
                          id={`input-paidAmt-${idx}`}
                          type="number"
                          step="any"
                          placeholder="0"
                          value={row.paid || ''}
                          onChange={(e) =>
                            onInputChange(row.tenantId, 'paidAmt', e.target.value)
                          }
                          onKeyDown={(e) => handleKeyDown(e, idx, 'paidAmt')}
                          className="w-20 px-2 py-1 border border-[#DCD5C3] text-right font-mono-nums text-xs rounded focus:border-[#234D3A]"
                        />
                        {row.netPayable !== null && row.netPayable > 0 && row.paid !== row.netPayable && (
                          <button
                            type="button"
                            onClick={() => onPayFull(row.tenantId)}
                            title="Mark full payment"
                            className="p-1 hover:bg-[#EAE6DB] rounded text-[#234D3A] transition-colors"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Due Amount */}
                    <td className="p-3 font-mono-nums font-semibold">
                      {row.due !== null ? (
                        <span
                          className={
                            row.due > 0
                              ? 'text-[#8C3A32] bg-[#F7E9E6] px-1.5 py-0.5 rounded'
                              : row.due < 0
                              ? 'text-[#234D3A] bg-[#EAF1EB] px-1.5 py-0.5 rounded'
                              : 'text-[#234D3A]'
                          }
                        >
                          {formatCurrencyINR(row.due)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Slip Generator */}
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenReceipt(
                            { id: row.tenantId, name: row.name, rent: row.rent },
                            row
                          )
                        }
                        className="p-1.5 rounded hover:bg-[#EAE6DB] text-[#5B5F58] hover:text-[#1B1F1C] transition-colors"
                        title="Generate Bill Slip / WhatsApp"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Totals Footer */}
            <tfoot>
              <tr className="border-t-2 border-[#1B1F1C] bg-[#FAF9F5] font-semibold text-[#1B1F1C] text-xs md:text-sm">
                <td className="p-3 text-left sticky left-0 bg-[#FAF9F5] z-10">
                  TOTALS
                </td>
                <td className="p-3"></td>
                <td className="p-3"></td>
                <td className="p-3 font-mono-nums">{formatINR(totalUnits)}</td>
                <td className="p-3 font-mono-nums">{formatINR(totalElec)}</td>
                <td className="p-3 font-mono-nums">{formatINR(totalRent)}</td>
                <td className="p-3 font-mono-nums">{formatINR(totalWater)}</td>
                <td className="p-3 font-mono-nums">{formatINR(totalPrevDue)}</td>
                <td className="p-3 font-mono-nums text-[#1B1F1C]">
                  {formatCurrencyINR(totalNet)}
                </td>
                <td className="p-3 font-mono-nums text-[#234D3A]">
                  {formatCurrencyINR(totalPaid)}
                </td>
                <td className="p-3 font-mono-nums text-[#8C3A32]">
                  {formatCurrencyINR(totalDue)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-[#F2EFE6]">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!canSave}
              onClick={onSaveAndDownload}
              className={`flex items-center gap-2 px-5 py-2.5 rounded font-medium text-sm transition-all shadow-xs ${
                canSave
                  ? 'bg-[#1B1F1C] text-white hover:bg-[#2E3330] cursor-pointer'
                  : 'bg-[#DCD5C3] text-[#5B5F58] cursor-not-allowed opacity-60'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Save this month &amp; download file (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={onClearReadings}
              className="flex items-center gap-2 px-4 py-2.5 rounded font-medium text-sm border border-[#DCD5C3] bg-white hover:bg-[#FAF9F5] text-[#1B1F1C] transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-[#5B5F58]" />
              <span>Clear entered readings</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-2.5 rounded text-sm text-[#5B5F58] hover:text-[#1B1F1C] transition-colors"
              title="Print Ledger"
            >
              <Printer className="w-4 h-4" />
              <span>Print Ledger</span>
            </button>
          </div>

          {!canSave && (
            <p className="text-xs text-[#8C3A32] italic">
              * Choose a billing month &amp; enter readings for all tenants to save.
            </p>
          )}
        </div>

        {/* Save Status Notification */}
        {saveStatus && (
          <div
            className={`mt-3 p-2.5 rounded text-xs border ${
              saveStatus.isError
                ? 'bg-[#F7E9E6] border-[#E8C5BE] text-[#8C3A32]'
                : 'bg-[#EAF1EB] border-[#C2DBC7] text-[#234D3A]'
            }`}
          >
            {saveStatus.text}
          </div>
        )}
      </div>
    </section>
  );
};
