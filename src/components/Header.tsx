import React from 'react';
import { Calendar, FileSpreadsheet, Settings as SettingsIcon, AlertCircle, CheckCircle2, Zap, Droplets } from 'lucide-react';
import { formatCurrencyINR, formatINR } from '../utils/excel';

interface HeaderProps {
  monthLabel: string;
  totalNet: number;
  totalPaid: number;
  totalDue: number;
  totalUnits: number;
  totalElec: number;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  monthLabel,
  totalNet,
  totalPaid,
  totalDue,
  totalUnits,
  totalElec,
  onOpenSettings,
}) => {
  return (
    <header className="border-b border-[#DCD5C3] pb-6 mb-8">
      {/* Brand & Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-sm border border-[#DCD5C3] bg-white flex items-center justify-center shrink-0">
            <img
              src="/logo.png"
              alt="Rent Calculator Logo"
              className="w-full h-full object-contain p-1"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback to stylized vector icon if image file cannot load
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif-heading text-3xl md:text-4xl font-semibold text-[#1B1F1C] tracking-tight">
                Rent Calculator
              </h1>
              <span className="text-xs bg-[#234D3A] text-white px-2 py-0.5 rounded font-mono font-medium">
                Register
              </span>
            </div>
            <p className="text-sm text-[#5B5F58] mt-1">
              Electricity, rent, and water charges for 11 tenants — calculated on the 10th of every month.
            </p>
          </div>
        </div>

        {/* Month Badge & Settings */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 bg-[#234D3A] text-white px-4 py-2 rounded shadow-sm">
            <Calendar className="w-4 h-4 text-[#A9863F]" />
            <span className="font-mono-nums text-sm font-semibold tracking-wide">
              {monthLabel || 'No month selected'}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2.5 rounded border border-[#DCD5C3] bg-white hover:bg-[#F2EFE6] text-[#1B1F1C] transition-colors shadow-xs"
            title="Configure Rates & Tenants"
          >
            <SettingsIcon className="w-4 h-4 text-[#5B5F58]" />
          </button>
        </div>
      </div>

      {/* Summary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <div className="bg-white p-3.5 rounded border border-[#DCD5C3] shadow-xs">
          <span className="text-xs text-[#5B5F58] block mb-1">Total Net Payable</span>
          <span className="font-mono-nums text-lg font-semibold text-[#1B1F1C]">
            {formatCurrencyINR(totalNet)}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded border border-[#DCD5C3] shadow-xs">
          <span className="text-xs text-[#5B5F58] block mb-1">Total Collected</span>
          <span className="font-mono-nums text-lg font-semibold text-[#234D3A]">
            {formatCurrencyINR(totalPaid)}
          </span>
        </div>

        <div className={`p-3.5 rounded border shadow-xs ${totalDue > 0 ? 'bg-[#F7E9E6] border-[#E8C5BE]' : 'bg-white border-[#DCD5C3]'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#5B5F58]">Outstanding Due</span>
            {totalDue > 0 ? (
              <AlertCircle className="w-3.5 h-3.5 text-[#8C3A32]" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#234D3A]" />
            )}
          </div>
          <span className={`font-mono-nums text-lg font-semibold ${totalDue > 0 ? 'text-[#8C3A32]' : 'text-[#234D3A]'}`}>
            {formatCurrencyINR(totalDue)}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded border border-[#DCD5C3] shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#5B5F58]">Power Consumed</span>
            <Zap className="w-3.5 h-3.5 text-[#A9863F]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono-nums text-lg font-semibold text-[#1B1F1C]">
              {formatINR(totalUnits)}
            </span>
            <span className="text-xs text-[#5B5F58]">units ({formatCurrencyINR(totalElec)})</span>
          </div>
        </div>
      </div>
    </header>
  );
};
