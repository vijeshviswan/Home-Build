import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

export default function SettingsModal({ settings, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    totalBuildingCost: '',
    totalHomeLoan: '',
    loanCashReceived: '',
    builderName: '',
    builderContractAmount: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        totalBuildingCost: settings.totalBuildingCost ?? 5000000,
        totalHomeLoan: settings.totalHomeLoan ?? 3000000,
        loanCashReceived: settings.loanCashReceived ?? 1200000,
        builderName: settings.builderName || 'Sri Krishna Builders',
        builderContractAmount: settings.builderContractAmount ?? 3500000
      });
    }
  }, [settings]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        totalBuildingCost: parseFloat(formData.totalBuildingCost) || 0,
        totalHomeLoan: parseFloat(formData.totalHomeLoan) || 0,
        loanCashReceived: parseFloat(formData.loanCashReceived) || 0,
        builderName: formData.builderName.trim(),
        builderContractAmount: parseFloat(formData.builderContractAmount) || 0
      });
      onClose();
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Project & Loan Settings</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Total Estimated Building Cost (₹)</label>
            <input
              type="number"
              className="form-input"
              value={formData.totalBuildingCost}
              onChange={(e) => setFormData({ ...formData, totalBuildingCost: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Total Home Loan Sanctioned (₹)</label>
            <input
              type="number"
              className="form-input"
              value={formData.totalHomeLoan}
              onChange={(e) => setFormData({ ...formData, totalHomeLoan: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Loan Cash Disbursed / Received (₹)</label>
            <input
              type="number"
              className="form-input"
              value={formData.loanCashReceived}
              onChange={(e) => setFormData({ ...formData, loanCashReceived: e.target.value })}
              required
            />
          </div>

          <div style={{ height: '1px', background: '#e2e8f0', margin: '16px 0' }} />

          <div className="form-group">
            <label className="form-label">Builder Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.builderName}
              onChange={(e) => setFormData({ ...formData, builderName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Builder Contract Amount (₹)</label>
            <input
              type="number"
              className="form-input"
              value={formData.builderContractAmount}
              onChange={(e) => setFormData({ ...formData, builderContractAmount: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={isSaving}
          >
            <Check size={20} />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
