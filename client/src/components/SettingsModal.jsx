import React, { useState, useEffect } from 'react';
import { X, Check, Wallet, Landmark } from 'lucide-react';

export default function SettingsModal({ settings, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    totalBuildingCost: '',
    totalHomeLoan: '',
    loanCashReceived: '',
    ownCashInitialBalance: '',
    homeLoanInitialBalance: '',
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
        ownCashInitialBalance: settings.ownCashInitialBalance ?? 130000,
        homeLoanInitialBalance: settings.homeLoanInitialBalance ?? (settings.totalHomeLoan ?? 3000000),
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
        ownCashInitialBalance: parseFloat(formData.ownCashInitialBalance) || 0,
        homeLoanInitialBalance: parseFloat(formData.homeLoanInitialBalance) || 0,
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
          <h2 className="modal-title">Project & Account Settings</h2>
          <button className="icon-btn modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* GOOGLE DRIVE STORAGE STATUS CARD */}
        {googleAuth && (
          <div style={{
            background: googleAuth.status === 'expired'
              ? '#fff1f2'
              : (googleAuth.authenticated ? '#ecfdf5' : '#eff6ff'),
            border: `1px solid ${
              googleAuth.status === 'expired'
                ? '#fecdd3'
                : (googleAuth.authenticated ? '#a7f3d0' : '#bfdbfe')
            }`,
            borderRadius: '14px',
            padding: '14px 16px',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  color: googleAuth.status === 'expired'
                    ? '#9f1239'
                    : (googleAuth.authenticated ? '#065f46' : '#1e40af'),
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {googleAuth.status === 'expired' && <span>⚠️</span>}
                  Google Drive: {googleAuth.status === 'expired' ? 'Session Expired' : (googleAuth.authenticated ? 'Connected' : 'Not Connected')}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: googleAuth.status === 'expired'
                    ? '#be123c'
                    : (googleAuth.authenticated ? '#047857' : '#3b82f6'),
                  marginTop: '3px',
                  lineHeight: 1.4
                }}>
                  {googleAuth.status === 'expired'
                    ? 'Token has expired (invalid_grant). Tap Reconnect to grant fresh access.'
                    : (googleAuth.authenticated
                        ? `${googleAuth.account} (Personal Drive)`
                        : 'Authorize to enable payment proof uploads')}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {googleAuth.authenticated ? (
                  <>
                    <span style={{ background: '#10b981', color: 'white', fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: '20px' }}>
                      Active
                    </span>
                    <a
                      href="/api/auth/google/url?redirect=true"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: '#059669',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        textDecoration: 'underline'
                      }}
                    >
                      Reconnect
                    </a>
                  </>
                ) : (
                  <a
                    href="/api/auth/google/url?redirect=true"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: googleAuth.status === 'expired' ? '#e11d48' : '#2563eb',
                      color: 'white',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '8px 16px',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      boxShadow: googleAuth.status === 'expired' ? '0 2px 8px rgba(225, 29, 72, 0.25)' : 'none'
                    }}
                  >
                    {googleAuth.status === 'expired' ? 'Reconnect Now' : 'Connect'}
                  </a>
                )}
              </div>
            </div>

            {googleAuth.status === 'expired' && (
              <div style={{
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px dashed #fecdd3',
                fontSize: '0.72rem',
                color: '#9f1239'
              }}>
                💡 <strong>Tip to prevent 7-day expiry:</strong> In Google Cloud Console, change OAuth consent screen publishing status from <em>Testing</em> to <em>In production</em>.
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* FUND SOURCE INITIAL BALANCES */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              Fund Sources Initial Balances
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: '12px' }}>
              Expenses are dynamically deducted from these initial balances.
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wallet size={15} color="#059669" /> Own Cash Starting Balance (₹)
              </label>
              <input
                type="number"
                className="form-input"
                value={formData.ownCashInitialBalance}
                onChange={(e) => setFormData({ ...formData, ownCashInitialBalance: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Landmark size={15} color="#4f46e5" /> Home Loan Sanctioned / Starting (₹)
              </label>
              <input
                type="number"
                className="form-input"
                value={formData.homeLoanInitialBalance}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  homeLoanInitialBalance: e.target.value,
                  totalHomeLoan: e.target.value 
                })}
                required
              />
            </div>
          </div>

          <div style={{ height: '1px', background: '#e2e8f0', margin: '16px 0' }} />

          {/* PROJECT BUDGET & LOAN DISBURSEMENT */}
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
            <label className="form-label">Loan Cash Disbursed / Received into Bank (₹)</label>
            <input
              type="number"
              className="form-input"
              value={formData.loanCashReceived}
              onChange={(e) => setFormData({ ...formData, loanCashReceived: e.target.value })}
              required
            />
          </div>

          <div style={{ height: '1px', background: '#e2e8f0', margin: '16px 0' }} />

          {/* BUILDER DETAILS */}
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
