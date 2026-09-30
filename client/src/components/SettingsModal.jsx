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
  const [googleAuth, setGoogleAuth] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/auth/google/status')
        .then(r => r.json())
        .then(data => setGoogleAuth(data))
        .catch(() => {});
    }
  }, [isOpen]);

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
        <div className="modal-drag-handle" />
        <div className="modal-header">
          <h2 className="modal-title">Project & Loan Settings</h2>
          <button className="icon-btn modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* GOOGLE DRIVE STORAGE STATUS CARD */}
        {googleAuth && (
          <div style={{
            background: googleAuth.authenticated ? '#ecfdf5' : '#eff6ff',
            border: `1px solid ${googleAuth.authenticated ? '#a7f3d0' : '#bfdbfe'}`,
            borderRadius: '14px',
            padding: '12px 16px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: googleAuth.authenticated ? '#065f46' : '#1e40af' }}>
                Google Drive: {googleAuth.authenticated ? 'Connected' : 'Not Connected'}
              </div>
              <div style={{ fontSize: '0.75rem', color: googleAuth.authenticated ? '#047857' : '#3b82f6', marginTop: '2px' }}>
                {googleAuth.authenticated ? `${googleAuth.account} (Personal Drive)` : 'Authorize to enable payment proof uploads'}
              </div>
            </div>
            {googleAuth.authenticated ? (
              <span style={{ background: '#10b981', color: 'white', fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: '20px' }}>
                Active
              </span>
            ) : (
              <a
                href="/api/auth/google/url?redirect=true"
                target="_blank"
                rel="noreferrer"
                style={{
                  background: '#2563eb',
                  color: 'white',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  padding: '7px 14px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                Connect
              </a>
            )}
          </div>
        )}

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
