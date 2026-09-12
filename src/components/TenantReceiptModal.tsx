import React, { useState } from 'react';
import { X, Copy, Check, Share2, Printer, CheckCircle2, AlertCircle } from 'lucide-react';
import { ComputedRow, Tenant, AppSettings } from '../types';
import { formatCurrencyINR, formatINR, generateTenantSlipText } from '../utils/excel';

interface TenantReceiptModalProps {
  tenant: Tenant | null;
  row: ComputedRow | null;
  monthLabel: string;
  settings: AppSettings;
  onClose: () => void;
}

export const TenantReceiptModal: React.FC<TenantReceiptModalProps> = ({
  tenant,
  row,
  monthLabel,
  settings,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!tenant || !row) return null;

  const unitsUsed = row.unitsUsed ?? 0;
  const elecCharge = row.elecCharge ?? 0;
  const netPayable = row.netPayable ?? 0;
  const due = row.due ?? 0;

  const slipText = generateTenantSlipText(
    tenant.name,
    monthLabel || 'Current Month',
    tenant.rent,
    row.prevUnit,
    row.currUnit ?? 0,
    unitsUsed,
    settings.pricePerUnit,
    elecCharge,
    row.waterCharge,
    row.prevDue,
    netPayable,
    row.paid,
    due
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(slipText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = slipText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(slipText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-[#DCD5C3] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#FAF9F5] px-5 py-4 border-b border-[#DCD5C3] flex items-center justify-between">
          <div>
            <h3 className="font-serif-heading text-lg font-semibold text-[#1B1F1C]">
              Tenant Bill Slip
            </h3>
            <p className="text-xs text-[#5B5F58]">
              {tenant.name} — {monthLabel || 'Current Month'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-[#EAE6DB] text-[#5B5F58] hover:text-[#1B1F1C] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bill Receipt Preview */}
        <div className="p-5 space-y-4 text-sm">
          <div className="bg-[#FAF9F5] border border-[#DCD5C3] rounded p-4 font-mono-nums text-xs space-y-2">
            <div className="flex justify-between pb-2 border-b border-[#DCD5C3] text-sm font-sans font-semibold text-[#1B1F1C]">
              <span>{tenant.name}</span>
              <span>{monthLabel}</span>
            </div>

            <div className="flex justify-between pt-1">
              <span className="text-[#5B5F58] font-sans">Monthly Rent:</span>
              <span className="font-semibold">{formatCurrencyINR(tenant.rent)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#5B5F58] font-sans">
                Electricity ({unitsUsed} units @ ₹{settings.pricePerUnit}):
              </span>
              <span>{formatCurrencyINR(elecCharge)}</span>
            </div>
            <div className="text-[11px] text-[#5B5F58] pl-2">
              (Meter: {row.currUnit ?? '—'} - {row.prevUnit})
            </div>

            <div className="flex justify-between">
              <span className="text-[#5B5F58] font-sans">Water Charges:</span>
              <span>{formatCurrencyINR(row.waterCharge)}</span>
            </div>

            {row.prevDue !== 0 && (
              <div className="flex justify-between text-[#8C3A32]">
                <span className="font-sans">Previous Dues:</span>
                <span>{formatCurrencyINR(row.prevDue)}</span>
              </div>
            )}

            <div className="border-t border-[#DCD5C3] pt-2 flex justify-between font-sans text-sm font-semibold text-[#1B1F1C]">
              <span>Net Payable:</span>
              <span>{formatCurrencyINR(netPayable)}</span>
            </div>

            <div className="flex justify-between font-sans text-xs text-[#234D3A]">
              <span>Paid Amount:</span>
              <span>{formatCurrencyINR(row.paid)}</span>
            </div>

            <div className="border-t border-dashed border-[#DCD5C3] pt-2 flex justify-between font-sans text-sm font-semibold">
              <span className={due > 0 ? 'text-[#8C3A32]' : 'text-[#234D3A]'}>
                {due > 0 ? 'Balance Due:' : 'Status:'}
              </span>
              <span className={due > 0 ? 'text-[#8C3A32]' : 'text-[#234D3A]'}>
                {due > 0 ? formatCurrencyINR(due) : 'Paid in Full'}
              </span>
            </div>

            <div className="text-[11px] text-[#8C8F89] text-center pt-2 italic font-sans">
              Generated Via Rent Generator &#123;Developed By Harsh&#125;
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-[#DCD5C3] rounded text-xs font-medium text-[#1B1F1C] bg-white hover:bg-[#FAF9F5] transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#234D3A]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#5B5F58]" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-medium text-white bg-[#25D366] hover:bg-[#20bd5a] transition-colors shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
