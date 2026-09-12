import React, { useState } from 'react';
import { Eye, Edit3, Trash2, Calendar, FileSpreadsheet } from 'lucide-react';
import { StoredRecordRow } from '../types';
import { formatCurrencyINR, formatINR, labelToSortKey } from '../utils/excel';

interface HistorySectionProps {
  availableSheets: string[];
  recordsBySheet: Record<string, StoredRecordRow[]>;
  onLoadMonthToEditor: (sheetName: string) => void;
  onDeleteSheet?: (sheetName: string) => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({
  availableSheets,
  recordsBySheet,
  onLoadMonthToEditor,
  onDeleteSheet,
}) => {
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [viewedSheet, setViewedSheet] = useState<string | null>(null);

  // Sort sheets in reverse chronological order
  const sortedSheets = [...availableSheets].sort(
    (a, b) => labelToSortKey(b) - labelToSortKey(a)
  );

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSheet(e.target.value);
  };

  const handleView = () => {
    if (selectedSheet) {
      setViewedSheet(selectedSheet);
    }
  };

  const handleLoadToEdit = () => {
    if (selectedSheet) {
      onLoadMonthToEditor(selectedSheet);
    }
  };

  const viewedRows = viewedSheet ? recordsBySheet[viewedSheet] || [] : [];
  const totalNet = viewedRows.reduce((sum, r) => sum + r.netPayable, 0);
  const totalPaid = viewedRows.reduce((sum, r) => sum + r.paid, 0);
  const totalDue = viewedRows.reduce((sum, r) => sum + r.due, 0);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-[#DCD5C3]">
        <h2 className="font-serif-heading font-semibold text-xl text-[#1B1F1C]">
          3. View or correct a previous month
        </h2>
        {availableSheets.length > 0 && (
          <span className="text-xs text-[#5B5F58]">
            {availableSheets.length} saved month(s) available
          </span>
        )}
      </div>

      <div className="bg-white border border-[#DCD5C3] rounded p-4 md:p-5 shadow-xs">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select
            value={selectedSheet}
            onChange={handleSelectChange}
            className="px-3 py-2 border border-[#DCD5C3] rounded text-sm bg-white min-w-[240px] focus:outline-hidden focus:ring-1 focus:ring-[#234D3A]"
          >
            <option value="">
              {sortedSheets.length === 0
                ? 'No saved months yet'
                : '-- Select a previous month --'}
            </option>
            {sortedSheets.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={!selectedSheet}
            onClick={handleView}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-[#DCD5C3] rounded text-sm text-[#1B1F1C] bg-[#FAF9F5] hover:bg-[#F2EFE6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Eye className="w-4 h-4 text-[#5B5F58]" />
            <span>View Ledger</span>
          </button>

          <button
            type="button"
            disabled={!selectedSheet}
            onClick={handleLoadToEdit}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-[#234D3A] rounded text-sm text-[#234D3A] bg-[#EAF1EB] hover:bg-[#D8E6DA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Edit3 className="w-4 h-4" />
            <span>Load into editor to correct</span>
          </button>
        </div>

        {/* Display Area */}
        {viewedSheet && viewedRows.length > 0 ? (
          <div className="mt-4 border-t border-[#DCD5C3] pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif-heading font-semibold text-base text-[#1B1F1C] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#A9863F]" />
                Viewing Record: {viewedSheet}
              </h3>
              <div className="text-xs text-[#5B5F58] flex gap-4">
                <span>Net: <strong>{formatCurrencyINR(totalNet)}</strong></span>
                <span>Collected: <strong>{formatCurrencyINR(totalPaid)}</strong></span>
                <span className={totalDue > 0 ? 'text-[#8C3A32] font-semibold' : ''}>
                  Due: <strong>{formatCurrencyINR(totalDue)}</strong>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border border-[#DCD5C3] rounded">
              <table className="w-full border-collapse bg-white text-xs text-right">
                <thead>
                  <tr className="border-b border-[#1B1F1C] bg-[#FAF9F5] text-[#5B5F58] font-medium">
                    <th className="p-2.5 text-left sticky left-0 bg-[#FAF9F5]">Tenant</th>
                    <th className="p-2.5">Curr Unit</th>
                    <th className="p-2.5">Prev Unit</th>
                    <th className="p-2.5">Units Used</th>
                    <th className="p-2.5">Elec (₹)</th>
                    <th className="p-2.5">Rent</th>
                    <th className="p-2.5">Water (₹)</th>
                    <th className="p-2.5">Prev Due</th>
                    <th className="p-2.5 font-semibold text-[#1B1F1C]">Net Payable</th>
                    <th className="p-2.5 text-[#234D3A]">Paid</th>
                    <th className="p-2.5 text-[#8C3A32]">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFECE3]">
                  {viewedRows.map((r, i) => (
                    <tr key={i} className="hover:bg-[#FAF9F5]">
                      <td className="p-2.5 text-left font-medium text-[#1B1F1C] sticky left-0 bg-white">
                        {r.name}
                      </td>
                      <td className="p-2.5 font-mono-nums">{formatINR(r.currUnit)}</td>
                      <td className="p-2.5 font-mono-nums text-[#5B5F58]">{formatINR(r.prevUnit)}</td>
                      <td className="p-2.5 font-mono-nums font-medium">{formatINR(r.unitsUsed)}</td>
                      <td className="p-2.5 font-mono-nums">{formatINR(r.elecCharge)}</td>
                      <td className="p-2.5 font-mono-nums">{formatINR(r.rent)}</td>
                      <td className="p-2.5 font-mono-nums text-[#5B5F58]">{formatINR(r.waterCharge)}</td>
                      <td className="p-2.5 font-mono-nums">{formatINR(r.prevDue)}</td>
                      <td className="p-2.5 font-mono-nums font-semibold text-[#1B1F1C]">{formatCurrencyINR(r.netPayable)}</td>
                      <td className="p-2.5 font-mono-nums text-[#234D3A]">{formatCurrencyINR(r.paid)}</td>
                      <td className={`p-2.5 font-mono-nums font-semibold ${r.due > 0 ? 'text-[#8C3A32]' : 'text-[#234D3A]'}`}>
                        {formatCurrencyINR(r.due)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-xs text-[#5B5F58] italic py-3">
            {availableSheets.length === 0
              ? 'Load a previous records file (.xlsx) in Step 1 or save a month to browse past records here.'
              : 'Select a month from the dropdown above and click "View Ledger" to inspect the detailed figures.'}
          </div>
        )}
      </div>
    </section>
  );
};
