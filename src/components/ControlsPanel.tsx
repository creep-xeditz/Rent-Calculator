import React, { useRef } from 'react';
import { Upload, Calendar, HelpCircle, Check, AlertTriangle, Zap, Droplets } from 'lucide-react';
import { AppSettings } from '../types';

interface ControlsPanelProps {
  monthValue: string;
  onMonthChange: (val: string) => void;
  onFileUpload: (file: File) => void;
  statusMessage: { text: string; isError?: boolean } | null;
  settings: AppSettings;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  monthValue,
  onMonthChange,
  onFileUpload,
  statusMessage,
  settings,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-[#DCD5C3]">
        <h2 className="font-serif-heading font-semibold text-xl text-[#1B1F1C]">
          1. Start this month's calculation
        </h2>
        
        {/* Rate indicators */}
        <div className="flex items-center gap-3 text-xs text-[#5B5F58]">
          <span className="inline-flex items-center gap-1 bg-[#FAF9F5] border border-[#DCD5C3] px-2.5 py-1 rounded">
            <Zap className="w-3.5 h-3.5 text-[#A9863F]" />
            Rate: <strong className="text-[#1B1F1C]">₹{settings.pricePerUnit}/unit</strong>
          </span>
          <span className="inline-flex items-center gap-1 bg-[#FAF9F5] border border-[#DCD5C3] px-2.5 py-1 rounded">
            <Droplets className="w-3.5 h-3.5 text-[#3C6B54]" />
            Water: <strong className="text-[#1B1F1C]">₹{settings.waterCharge}/tenant</strong>
          </span>
        </div>
      </div>

      <div className="bg-white border border-[#DCD5C3] rounded p-5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
          {/* File Upload */}
          <div>
            <label className="block text-xs font-medium text-[#5B5F58] mb-1.5" htmlFor="fileInput">
              Load previous records (.xlsx) — optional
            </label>
            <div className="flex gap-2">
              <input
                type="file"
                id="fileInput"
                ref={fileInputRef}
                accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileSelected}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-[#DCD5C3] rounded text-sm text-[#1B1F1C] bg-[#FAF9F5] hover:bg-[#F2EFE6] transition-colors"
              >
                <Upload className="w-4 h-4 text-[#5B5F58]" />
                <span>Upload Excel File</span>
              </button>
            </div>
          </div>

          {/* Month Picker */}
          <div>
            <label className="block text-xs font-medium text-[#5B5F58] mb-1.5" htmlFor="monthPicker">
              Billing month (usually 10th of every month)
            </label>
            <div className="relative">
              <input
                type="month"
                id="monthPicker"
                value={monthValue}
                onChange={(e) => onMonthChange(e.target.value)}
                className="w-full px-3 py-2 border border-[#DCD5C3] rounded text-sm text-[#1B1F1C] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#234D3A] focus:border-[#234D3A] font-mono-nums"
              />
            </div>
          </div>
        </div>

        {/* Status Line */}
        {statusMessage && (
          <div
            className={`mt-4 pt-3 border-t border-[#F2EFE6] text-xs flex items-center gap-2 ${
              statusMessage.isError ? 'text-[#8C3A32]' : 'text-[#234D3A]'
            }`}
          >
            {statusMessage.isError ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <Check className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>
    </section>
  );
};
