import React, { useState } from 'react';
import { 
  X, 
  Landmark, 
  Plus, 
  Trash2, 
  ArrowDownRight, 
  ArrowUpRight, 
  Calendar, 
  Check, 
  FileText, 
  Sparkles,
  Building,
  Edit2
} from 'lucide-react';
import { formatCurrency, formatDate, toInputDate } from '../utils/formatters';

export default function HomeLoanModal({
  isOpen,
  onClose,
  dashboardData,
  payments = [],
  loanInstallments = [],
  onAddLoanInstallment,
  onDeleteLoanInstallment,
  onUpdateSanctionedAmount,
  onSelectPayment
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('stages'); // 'stages' | 'expenses'
  const [isEditingSanctioned, setIsEditingSanctioned] = useState(false);

  // Add Installment Form State
  const [stage, setStage] = useState('');
  const [amount, setAmount] = useState('');
  const [disbursementDate, setDisbursementDate] = useState(toInputDate());
  const [description, setDescription] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [bankName, setBankName] = useState('SBI');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sanctioned Loan Edit State
  const sanctionedLimit = dashboardData?.homeLoan?.totalHomeLoan ?? (dashboardData?.fundSources?.homeLoan?.sanctionedAmount ?? 3000000);
  const [newSanctionedVal, setNewSanctionedVal] = useState(sanctionedLimit);

  if (!isOpen) return null;

  // Filter payments paid using Home Loan
  const loanPayments = payments.filter(
    p => p.paymentSource === 'Home Loan' || p.category === 'Home Loan' || p.category === 'Loan Cash'
  );
  const totalLoanSpent = dashboardData?.fundSources?.homeLoan?.totalSpent ?? loanPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Disbursed installments sum
  const totalDisbursed = loanInstallments.reduce((sum, item) => sum + (item.amount || 0), 0);
  
  // If no installments exist yet, check fallback from dashboardData
  const effectiveDisbursed = totalDisbursed > 0 
    ? totalDisbursed 
    : (dashboardData?.homeLoan?.loanCashReceived || 0);

  // Available Disbursed Cash in Account
  const availableBalance = Math.max(0, effectiveDisbursed - totalLoanSpent);
  
  // Pending Disbursement from Bank
  const pendingDisbursement = Math.max(0, sanctionedLimit - effectiveDisbursed);

  const percentAvailable = effectiveDisbursed > 0 
    ? Math.max(0, Math.min(100, Math.round((availableBalance / effectiveDisbursed) * 100))) 
    : 0;

  const percentDisbursedOfSanctioned = sanctionedLimit > 0
    ? Math.max(0, Math.min(100, Math.round((effectiveDisbursed / sanctionedLimit) * 100)))
    : 0;

  const suggestedStages = [
    'Stage 1 - Foundation & Plinth',
    'Stage 2 - Ground Floor Slab',
    'Stage 3 - First Floor Slab',
    'Stage 4 - Brickwork & Plastering',
    'Stage 5 - Final Finishing & Handover'
  ];

  const quickPresets = [100000, 250000, 500000, 1000000];

  const handleResetForm = () => {
    setStage('');
    setAmount('');
    setDisbursementDate(toInputDate());
    setDescription('');
    setReferenceNumber('');
    setBankName('SBI');
    setShowAddForm(false);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!stage.trim()) {
      alert('Please enter a stage/installment name');
      return;
    }
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      alert('Please enter a valid disbursement amount greater than zero');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddLoanInstallment({
        stage: stage.trim(),
        amount: numAmount,
        disbursementDate,
        description: description.trim(),
        referenceNumber: referenceNumber.trim(),
        bankName: bankName.trim()
      });
      handleResetForm();
    } catch (err) {
      alert('Failed to add installment: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInstallment = async (id) => {
    if (window.confirm('Are you sure you want to remove this loan installment record?')) {
      try {
        await onDeleteLoanInstallment(id);
      } catch (err) {
        alert('Failed to delete installment');
      }
    }
  };

  const handleSaveSanctioned = async (e) => {
    e.preventDefault();
    const val = parseFloat(newSanctionedVal);
    if (isNaN(val) || val < 0) {
      alert('Please enter a valid sanctioned amount');
      return;
    }
    try {
      await onUpdateSanctionedAmount(val);
      setIsEditingSanctioned(false);
    } catch (err) {
      alert('Failed to update sanctioned amount');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-sheet loan-modal-sheet" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px' }}
      >
        <div className="modal-drag-handle" />

        {/* MODAL HEADER */}
        <div className="modal-header" style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="fund-icon-circle" style={{ background: '#f5f3ff', color: '#7c3aed', width: '38px', height: '38px' }}>
              <Landmark size={20} strokeWidth={2.4} />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.25rem', margin: 0 }}>Home Loan Account</h2>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>Bank Disbursements & Available Funds</span>
            </div>
          </div>
          <button 
            className="icon-btn modal-close-btn" 
            onClick={onClose} 
            aria-label="Close"
            id="btn-close-home-loan-modal"
          >
            <X size={20} strokeWidth={2.4} />
          </button>
        </div>

        {/* 1. CURRENT AVAILABLE BALANCE (HERO CARD) */}
        <div className="home-loan-hero-card">
          <div className="hero-top-badge">
            <span className="hero-badge-pill loan-badge-pill">
              <Sparkles size={12} /> {percentAvailable}% Available to Spend
            </span>
          </div>
          <div className="hero-balance-label">Current Available Loan Balance (In Account)</div>
          <div className="hero-balance-value" id="modal-home-loan-current-balance">
            {formatCurrency(availableBalance)}
          </div>
          <div className="hero-progress-track">
            <div 
              className="hero-progress-fill hero-progress-fill-loan" 
              style={{ width: `${percentAvailable}%` }} 
            />
          </div>
        </div>

        {/* 2. DEDICATED HOME LOAN STATISTICS (STRICTLY NO BUILDING COST CLUTTER) */}
        <div className="home-loan-stats-grid">
          {/* TOTAL DISBURSED SO FAR */}
          <div className="loan-stat-box box-disbursed">
            <div className="stat-box-header">
              <span className="stat-box-title">Total Disbursed</span>
              <div className="stat-icon-circle icon-inflow" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                <ArrowDownRight size={14} strokeWidth={2.8} />
              </div>
            </div>
            <div className="stat-box-number" style={{ color: '#7c3aed' }} id="modal-home-loan-total-disbursed">
              {formatCurrency(effectiveDisbursed)}
            </div>
            <div className="stat-box-breakdown" style={{ color: '#64748b' }}>
              {loanInstallments.length} {loanInstallments.length === 1 ? 'stage received' : 'stages received'}
            </div>
          </div>

          {/* TOTAL SPENT FROM LOAN */}
          <div className="loan-stat-box box-spent">
            <div className="stat-box-header">
              <span className="stat-box-title">Loan Spent</span>
              <div className="stat-icon-circle icon-outflow">
                <ArrowUpRight size={14} strokeWidth={2.8} />
              </div>
            </div>
            <div className="stat-box-number" style={{ color: '#e11d48' }} id="modal-home-loan-total-spent">
              {formatCurrency(totalLoanSpent)}
            </div>
            <div className="stat-box-breakdown" style={{ color: '#94a3b8' }}>
              {loanPayments.length} {loanPayments.length === 1 ? 'payment made' : 'payments made'}
            </div>
          </div>
        </div>

        {/* 2b. SANCTIONED LOAN PROGRESS STRIP */}
        <div className="sanctioned-strip-card">
          <div className="sanctioned-strip-header">
            <div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Sanctioned Loan Limit: </span>
              <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatCurrency(sanctionedLimit)}</span>
            </div>
            <span className="sanctioned-percent-pill">
              {percentDisbursedOfSanctioned}% Released
            </span>
          </div>
          <div className="sanctioned-progress-track">
            <div 
              className="sanctioned-progress-fill" 
              style={{ width: `${percentDisbursedOfSanctioned}%` }}
            />
          </div>
          <div className="sanctioned-strip-footer">
            <span>Pending from bank: <strong>{formatCurrency(pendingDisbursement)}</strong></span>
            {!isEditingSanctioned && (
              <button 
                type="button" 
                className="text-link-btn" 
                onClick={() => {
                  setNewSanctionedVal(sanctionedLimit);
                  setIsEditingSanctioned(true);
                }}
                id="btn-edit-sanctioned-limit"
              >
                <Edit2 size={11} /> Edit Limit
              </button>
            )}
          </div>

          {/* EDIT SANCTIONED LIMIT FORM */}
          {isEditingSanctioned && (
            <form onSubmit={handleSaveSanctioned} style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
              <input 
                type="number"
                className="form-input"
                value={newSanctionedVal}
                onChange={(e) => setNewSanctionedVal(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '0.88rem' }}
                placeholder="Total Sanctioned Limit"
                id="input-edit-sanctioned-limit"
              />
              <button 
                type="submit" 
                className="btn-submit" 
                style={{ padding: '6px 12px', fontSize: '0.82rem', whiteSpace: 'nowrap', background: '#7c3aed' }}
              >
                Save
              </button>
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={() => setIsEditingSanctioned(false)}
                style={{ padding: '6px 10px', fontSize: '0.82rem' }}
              >
                Cancel
              </button>
            </form>
          )}
        </div>

        {/* 3. PROMINENT "ADD NEW HOME LOAN INSTALLMENT" BUTTON */}
        {!showAddForm && (
          <button 
            className="btn-submit btn-add-loan-installment"
            onClick={() => setShowAddForm(true)}
            id="btn-open-add-loan-installment"
            style={{ 
              marginBottom: '16px', 
              background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
            }}
          >
            <Plus size={18} strokeWidth={2.6} /> Add New Home Loan Installment
          </button>
        )}

        {/* 4. EXPANDABLE "ADD NEW HOME LOAN INSTALLMENT" FORM */}
        {showAddForm && (
          <div className="fund-form-card loan-form-card" style={{ marginBottom: '16px' }}>
            <div className="fund-form-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} color="#7c3aed" strokeWidth={2.6} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                  Record Bank Installment Disbursement
                </span>
              </div>
              <button 
                type="button" 
                className="icon-btn" 
                onClick={handleResetForm}
                style={{ width: '28px', height: '28px' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              {/* STAGE NAME */}
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label">Stage / Installment Name *</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g. Stage 2 - Ground Floor Slab"
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  autoFocus
                  required
                  id="input-add-installment-stage"
                />
              </div>

              {/* QUICK STAGE CHIPS */}
              <div className="quick-chip-row" style={{ marginBottom: '12px' }}>
                {suggestedStages.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`quick-source-chip ${stage === s ? 'active-loan' : ''}`}
                    onClick={() => setStage(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* AMOUNT INPUT */}
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label">Disbursed Amount (₹) *</label>
                <input 
                  type="number"
                  className="form-input"
                  placeholder="e.g. 500000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="1"
                  step="any"
                  id="input-add-installment-amount"
                  style={{ fontSize: '1.1rem', fontWeight: 700, color: '#7c3aed' }}
                />
              </div>

              {/* QUICK AMOUNT CHIPS */}
              <div className="quick-chip-row" style={{ marginBottom: '12px' }}>
                {quickPresets.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    className="quick-chip-btn"
                    onClick={() => setAmount(String((parseFloat(amount) || 0) + preset))}
                  >
                    +{formatCurrency(preset)}
                  </button>
                ))}
              </div>

              {/* DISBURSEMENT DATE */}
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label">Disbursement Date *</label>
                <input 
                  type="date"
                  className="form-input"
                  value={disbursementDate}
                  onChange={(e) => setDisbursementDate(e.target.value)}
                  id="input-add-installment-date"
                  required
                />
              </div>

              {/* BANK & REFERENCE UTR */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Bank Name</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="e.g. SBI, HDFC"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    id="input-add-installment-bank"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">UTR / Ref No.</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="e.g. UTR123456"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    id="input-add-installment-ref"
                  />
                </div>
              </div>

              {/* DESCRIPTION / NOTES */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Notes / Description (Optional)</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g. Disbursed after site valuation approval"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  id="input-add-installment-desc"
                />
              </div>

              {/* ACTION BUTTONS */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={handleResetForm}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={isSubmitting}
                  style={{ flex: 2, background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)' }}
                  id="btn-submit-add-installment"
                >
                  {isSubmitting ? 'Saving...' : 'Save Installment'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 5. TABS: DISBURSED STAGES vs EXPENSES */}
        <div className="modal-pill-tabs" style={{ margin: '16px 0 12px' }}>
          <button 
            type="button"
            className={`pill-tab-btn ${activeTab === 'stages' ? 'active active-loan' : ''}`}
            onClick={() => setActiveTab('stages')}
            id="tab-loan-stages"
          >
            Bank Installments ({loanInstallments.length})
          </button>
          <button 
            type="button"
            className={`pill-tab-btn ${activeTab === 'expenses' ? 'active active-loan' : ''}`}
            onClick={() => setActiveTab('expenses')}
            id="tab-loan-expenses"
          >
            Loan Expenses ({loanPayments.length})
          </button>
        </div>

        {/* 6. TAB CONTENT: DISBURSED STAGES LIST */}
        {activeTab === 'stages' && (
          <div className="fund-list-container">
            {loanInstallments.length === 0 ? (
              <div className="empty-state-mini">
                <Building size={22} color="#a78bfa" />
                <span style={{ fontWeight: 600 }}>No stage disbursements recorded yet</span>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Click "Add New Home Loan Installment" above as stages are released by your bank.
                </span>
              </div>
            ) : (
              loanInstallments.map((inst, index) => (
                <div key={inst._id} className="fund-history-item stage-history-item">
                  <div className="fund-item-left">
                    <div className="stage-number-badge">
                      {index + 1}
                    </div>
                    <div>
                      <div className="fund-item-title">{inst.stage}</div>
                      <div className="fund-item-meta">
                        {formatDate(inst.disbursementDate)}
                        {inst.bankName ? ` • ${inst.bankName}` : ''}
                        {inst.referenceNumber ? ` (${inst.referenceNumber})` : ''}
                      </div>
                      {inst.description && (
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                          {inst.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="fund-item-amount positive" style={{ color: '#7c3aed' }}>
                      +{formatCurrency(inst.amount)}
                    </span>
                    <button 
                      type="button"
                      className="icon-btn delete-item-btn"
                      onClick={() => handleDeleteInstallment(inst._id)}
                      title="Delete installment"
                      aria-label="Delete installment"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 7. TAB CONTENT: LOAN EXPENSES LIST */}
        {activeTab === 'expenses' && (
          <div className="fund-list-container">
            {loanPayments.length === 0 ? (
              <div className="empty-state-mini">
                <FileText size={20} color="#94a3b8" />
                <span>No payments recorded from Home Loan yet</span>
                <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                  When creating an expense, select "Home Loan" as the payment source.
                </span>
              </div>
            ) : (
              loanPayments.map(p => (
                <div 
                  key={p._id} 
                  className="fund-history-item expense-item"
                  onClick={() => {
                    if (onSelectPayment) {
                      onSelectPayment(p);
                    }
                  }}
                  style={{ cursor: onSelectPayment ? 'pointer' : 'default' }}
                >
                  <div className="fund-item-left">
                    <div className="fund-item-icon-circle icon-outflow">
                      <ArrowUpRight size={14} />
                    </div>
                    <div>
                      <div className="fund-item-title">{p.description}</div>
                      <div className="fund-item-meta">
                        {formatDate(p.date)} • {p.paymentMethod}
                        {p.isBuilderPayment && <span className="tag-mini-builder">Builder</span>}
                      </div>
                    </div>
                  </div>
                  <div className="fund-item-amount negative">
                    -{formatCurrency(p.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
