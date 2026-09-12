import React, { useState } from 'react';
import { X, Plus, Trash2, Save, RotateCcw } from 'lucide-react';
import { Tenant, AppSettings } from '../types';
import { DEFAULT_TENANTS, DEFAULT_SETTINGS } from '../data/defaultTenants';

interface SettingsModalProps {
  tenants: Tenant[];
  settings: AppSettings;
  onSave: (newTenants: Tenant[], newSettings: AppSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  tenants: initialTenants,
  settings: initialSettings,
  onSave,
  onClose,
}) => {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantRent, setNewTenantRent] = useState('');

  const handleTenantChange = (id: number, field: 'name' | 'rent', val: string | number) => {
    setTenants((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: val } : t))
    );
  };

  const handleAddTenant = () => {
    if (!newTenantName.trim()) return;
    const rent = parseFloat(newTenantRent) || 0;
    const nextId = tenants.length > 0 ? Math.max(...tenants.map((t) => t.id)) + 1 : 1;
    setTenants((prev) => [...prev, { id: nextId, name: newTenantName.trim(), rent }]);
    setNewTenantName('');
    setNewTenantRent('');
  };

  const handleRemoveTenant = (id: number) => {
    if (tenants.length <= 1) return;
    setTenants((prev) => prev.filter((t) => t.id !== id));
  };

  const handleResetDefaults = () => {
    if (confirm('Reset to default 11 tenants and standard rates (₹8/unit, ₹200 water)?')) {
      setTenants(DEFAULT_TENANTS);
      setSettings(DEFAULT_SETTINGS);
    }
  };

  const handleSaveAll = () => {
    onSave(tenants, settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-[#DCD5C3] shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#FAF9F5] px-5 py-4 border-b border-[#DCD5C3] flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-serif-heading text-lg font-semibold text-[#1B1F1C]">
              Register &amp; Rate Settings
            </h3>
            <p className="text-xs text-[#5B5F58]">
              Configure standard monthly rates and manage tenant list
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-[#EAE6DB] text-[#5B5F58] hover:text-[#1B1F1C]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-sm">
          {/* Default Rates */}
          <div>
            <h4 className="text-xs font-semibold text-[#1B1F1C] uppercase tracking-wider mb-2">
              Default Charges
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#5B5F58] mb-1">
                  Electricity Rate (₹ per unit)
                </label>
                <input
                  type="number"
                  step="any"
                  value={settings.pricePerUnit}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      pricePerUnit: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 border border-[#DCD5C3] rounded text-sm font-mono-nums"
                />
              </div>
              <div>
                <label className="block text-xs text-[#5B5F58] mb-1">
                  Fixed Water Charge (₹ per tenant)
                </label>
                <input
                  type="number"
                  step="any"
                  value={settings.waterCharge}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      waterCharge: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 border border-[#DCD5C3] rounded text-sm font-mono-nums"
                />
              </div>
            </div>
          </div>

          {/* Tenants List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-[#1B1F1C] uppercase tracking-wider">
                Tenants ({tenants.length})
              </h4>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs text-[#5B5F58] hover:text-[#1B1F1C] flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to defaults</span>
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto border border-[#DCD5C3] rounded divide-y divide-[#EFECE3]">
              {tenants.map((t, idx) => (
                <div key={t.id} className="flex items-center gap-3 p-2.5 bg-white">
                  <span className="w-6 text-xs text-[#5B5F58] font-mono-nums text-center">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={t.name}
                    onChange={(e) => handleTenantChange(t.id, 'name', e.target.value)}
                    className="flex-1 px-2.5 py-1 border border-[#DCD5C3] rounded text-xs"
                    placeholder="Tenant Name"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[#5B5F58]">₹</span>
                    <input
                      type="number"
                      step="any"
                      value={t.rent}
                      onChange={(e) =>
                        handleTenantChange(t.id, 'rent', parseFloat(e.target.value) || 0)
                      }
                      className="w-24 px-2 py-1 border border-[#DCD5C3] rounded text-xs font-mono-nums text-right"
                      placeholder="Rent"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTenant(t.id)}
                    className="p-1 text-[#8C3A32] hover:bg-[#F7E9E6] rounded"
                    title="Remove tenant"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Tenant row */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#DCD5C3]">
              <input
                type="text"
                placeholder="New tenant name"
                value={newTenantName}
                onChange={(e) => setNewTenantName(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-[#DCD5C3] rounded text-xs"
              />
              <input
                type="number"
                placeholder="Rent (₹)"
                value={newTenantRent}
                onChange={(e) => setNewTenantRent(e.target.value)}
                className="w-28 px-3 py-1.5 border border-[#DCD5C3] rounded text-xs font-mono-nums text-right"
              />
              <button
                type="button"
                onClick={handleAddTenant}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#234D3A] text-white rounded text-xs font-medium hover:bg-[#3C6B54]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#FAF9F5] px-5 py-3 border-t border-[#DCD5C3] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#5B5F58] hover:text-[#1B1F1C]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1B1F1C] text-white rounded text-xs font-medium hover:bg-[#2E3330]"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
