import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  Plus, 
  Trash2, 
  ArrowDownRight, 
  ArrowUpRight, 
  Calendar, 
  Check, 
  FileText, 
  Sparkles,
  Edit2,
  DollarSign
} from 'lucide-react';
import { formatCurrency, formatDate, toInputDate } from '../utils/formatters';
import { getCategoryMeta } from '../utils/categories';

export default function OwnCashModal({
  isOpen,
  onClose,
  dashboardData,
  payments = [],
  fundAdditions = [],
  onAddFundAddition,
  onDeleteFundAddition,
  onUpdateInitialBalance,
  onSelectPayment
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('inflow'); // 'inflow' | 'expenses'
  const [isEditingInitial, setIsEditingInitial] = useState(false);

  // Add Fund Form State
  const [amount, setAmount] = useState('');
  const [sourceName, setSourceName] = useState('Personal Savings');
  const [date, setDate] = useState(toInputDate());
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Initial Balance State
  const ownCashData = dashboardData?.fundSources?.ownCash;
  const initialBalance = ownCashData?.initialBalance ?? 130000;
  const [newInitialVal, setNewInitialVal] = useState(initialBalance);

  if (!isOpen) return null;

  // Filter payments paid using Own Cash
  const ownCashPayments = payments.filter(
    p => p.paymentSource === 'Own Cash' || p.category === 'Own Cash'
  );
  const totalSpent = ownCashData?.totalSpent ?? ownCashPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Total additions from fund additions list
  const totalAdditions = fundAdditions.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalAdded = initialBalance + totalAdditions;
  const currentBalance = totalAdded - totalSpent;
  const percentRemaining = totalAdded > 0 
    ? Math.max(0, Math.min(100, Math.round((currentBalance / totalAdded) * 100))) 
    : 0;

  const quickPresets = [10000, 25000, 50000, 100000];
  const quickSources = ['Personal Savings', 'Salary / Bonus', 'Fixed Deposit', 'Family Fund', 'Cash on Hand'];

  const handleResetForm = () => {
    setAmount('');
    setSourceName('Personal Savings');
    setDate(toInputDate());
    setDescription('');
    setShowAddForm(false);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      alert('Please enter a valid fund amount greater than zero');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddFundAddition({
        amount: numAmount,
        sourceName: sourceName.trim() || 'Personal Savings',
        date,
        description: description.trim(),
        fundSource: 'Own Cash'
      });
      handleResetForm();
    } catch (err) {
      alert('Failed to add fund: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAddition = async (id) => {
    if (window.confirm('Are you sure you want to remove this fund entry?')) {
      try {
        await onDeleteFundAddition(id);
      } catch (err) {
        alert('Failed to delete fund entry');
      }
    }
  };

  const handleSaveInitial = async (e) => {
    e.preventDefault();
    const val = parseFloat(newInitialVal);
    if (isNaN(val) || val < 0) {
      alert('Please enter a valid starting balance');
      return;
    }
    try {
      await onUpdateInitialBalance(val);
      setIsEditingInitial(false);
    } catch (err) {
      alert('Failed to update starting balance');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-sheet own-cash-sheet" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px' }}
      >
        <div className="modal-drag-handle" />

        {/* MODAL HEADER */}
        <div className="modal-header" style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="fund-icon-circle" style={{ background: '#ecfdf5', color: '#059669', width: '38px', height: '38px' }}>
              <Wallet size={20} strokeWidth={2.4} />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.25rem', margin: 0 }}>Own Cash Account</h2>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>Personal Funds & Dynamic Balance</span>
            </div>
          </div>
          <button 
            className="icon-btn modal-close-btn" 
            onClick={onClose} 
            aria-label="Close"
            id="btn-close-own-cash-modal"
          >
            <X size={20} strokeWidth={2.4} />
          </button>
        </div>

        {/* 1. CURRENT AVAILABLE BALANCE (HERO CARD) */}
        <div className="own-cash-hero-card">
          <div className="hero-top-badge">
            <span className="hero-badge-pill">
              <Sparkles size={12} /> {percentRemaining}% of Total Funds Available
            </span>
          </div>
          <div className="hero-balance-label">Current Own Cash Balance</div>
          <div className="hero-balance-value" id="modal-own-cash-current-balance">
            {formatCurrency(currentBalance)}
          </div>
          <div className="hero-progress-track">
            <div 
              className="hero-progress-fill" 
              style={{ width: `${percentRemaining}%` }} 
            />
          </div>
        </div>

        {/* 2. DEDICATED OWN CASH STATISTICS (STRICTLY NO BUILDING COST CLUTTER) */}
        <div className="own-cash-stats-grid">
          {/* TOTAL OWN CASH ADDED */}
          <div className="own-stat-box box-inflow">
            <div className="stat-box-header">
              <span className="stat-box-title">Total Own Cash Added</span>
              <div className="stat-icon-circle icon-inflow">
                <ArrowDownRight size={14} strokeWidth={2.8} />
              </div>
            </div>
            <div className="stat-box-number" id="modal-own-cash-total-added">
              {formatCurrency(totalAdded)}
            </div>
            <div className="stat-box-breakdown">
              <span>Start: {formatCurrency(initialBalance)}</span>
              {totalAdditions > 0 && (
                <span> + Added: {formatCurrency(totalAdditions)}</span>
              )}
            </div>
          </div>

          {/* TOTAL SPENT FROM OWN CASH */}
          <div className="own-stat-box box-outflow">
            <div className="stat-box-header">
              <span className="stat-box-title">Total Spent</span>
              <div className="stat-icon-circle icon-outflow">
                <ArrowUpRight size={14} strokeWidth={2.8} />
              </div>
            </div>
            <div className="stat-box-number" style={{ color: '#e11d48' }} id="modal-own-cash-total-spent">
              {formatCurrency(totalSpent)}
            </div>
            <div className="stat-box-breakdown" style={{ color: '#94a3b8' }}>
              {ownCashPayments.length} {ownCashPayments.length === 1 ? 'payment' : 'payments'} recorded
            </div>
          </div>
        </div>

        {/* 3. PROMINENT "ADD NEW FUND" BUTTON */}
        {!showAddForm && (
          <button 
            className="btn-submit btn-add-own-fund"
            onClick={() => setShowAddForm(true)}
            id="btn-open-add-own-fund"
            style={{ 
              marginBottom: '16px', 
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Plus size={18} strokeWidth={2.6} /> Add New Fund to Own Cash
          </button>
        )}

        {/* 4. EXPANDABLE "ADD NEW FUND" FORM */}
        {showAddForm && (
          <div className="fund-form-card" style={{ marginBottom: '16px' }}>
            <div className="fund-form-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} color="#059669" strokeWidth={2.6} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                  Deposit / Add Fund to Balance
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
              {/* AMOUNT INPUT */}
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label">Amount (₹) *</label>
                <input 
                  type="number"
                  className="form-input"
                  placeholder="e.g. 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                  required
                  min="1"
                  step="any"
                  id="input-add-own-cash-amount"
                  style={{ fontSize: '1.1rem', fontWeight: 700, color: '#059669' }}
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

              {/* FUND SOURCE / CATEGORY */}
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label">Source of Fund</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g. Salary, Savings Transfer, FD"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  id="input-add-own-cash-source"
                />
              </div>

              {/* QUICK SOURCE CHIPS */}
              <div className="quick-chip-row" style={{ marginBottom: '12px' }}>
                {quickSources.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`quick-source-chip ${sourceName === s ? 'active' : ''}`}
                    onClick={() => setSourceName(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* DATE INPUT */}
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label">Date Received</label>
                <input 
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  id="input-add-own-cash-date"
                />
              </div>

              {/* DESCRIPTION / NOTES */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Notes / Description (Optional)</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g. Transfer from HDFC Bank account"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  id="input-add-own-cash-desc"
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
                  style={{ flex: 2, background: '#059669' }}
                  id="btn-submit-add-own-fund"
                >
                  {isSubmitting ? 'Adding...' : 'Add to Own Cash'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 5. EDIT STARTING BALANCE ACCORDION */}
        <div className="starting-balance-edit-box">
          {!isEditingInitial ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Base Starting Fund: </span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(initialBalance)}</span>
              </div>
              <button 
                type="button"
                className="text-link-btn"
                onClick={() => {
                  setNewInitialVal(initialBalance);
                  setIsEditingInitial(true);
                }}
                id="btn-edit-starting-balance"
              >
                <Edit2 size={12} /> Edit Starting Balance
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveInitial} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="number"
                className="form-input"
                value={newInitialVal}
                onChange={(e) => setNewInitialVal(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '0.88rem' }}
                placeholder="Starting balance"
                id="input-edit-starting-balance"
              />
              <button 
                type="submit" 
                className="btn-submit" 
                style={{ padding: '6px 12px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
              >
                Save
              </button>
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={() => setIsEditingInitial(false)}
                style={{ padding: '6px 10px', fontSize: '0.82rem' }}
              >
                Cancel
              </button>
            </form>
          )}
        </div>

        {/* 6. TABS: FUNDS INFLOW vs EXPENSES */}
        <div className="modal-pill-tabs" style={{ margin: '16px 0 12px' }}>
          <button 
            type="button"
            className={`pill-tab-btn ${activeTab === 'inflow' ? 'active' : ''}`}
            onClick={() => setActiveTab('inflow')}
            id="tab-own-cash-inflow"
          >
            Funds Added ({fundAdditions.length + 1})
          </button>
          <button 
            type="button"
            className={`pill-tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('expenses')}
            id="tab-own-cash-expenses"
          >
            Expenses Paid ({ownCashPayments.length})
          </button>
        </div>

        {/* 7. TAB CONTENT: INFLOW LIST */}
        {activeTab === 'inflow' && (
          <div className="fund-list-container">
            {/* Initial Starting Balance Row */}
            <div className="fund-history-item starting-fund-item">
              <div className="fund-item-left">
                <div className="fund-item-icon-circle icon-inflow">
                  <Wallet size={14} />
                </div>
                <div>
                  <div className="fund-item-title">Initial Starting Balance</div>
                  <div className="fund-item-meta">Base allocation</div>
                </div>
              </div>
              <div className="fund-item-amount positive">
                +{formatCurrency(initialBalance)}
              </div>
            </div>

            {/* Additional deposits */}
            {fundAdditions.map(item => (
              <div key={item._id} className="fund-history-item">
                <div className="fund-item-left">
                  <div className="fund-item-icon-circle icon-inflow">
                    <ArrowDownRight size={14} />
                  </div>
                  <div>
                    <div className="fund-item-title">{item.sourceName || 'Added Fund'}</div>
                    <div className="fund-item-meta">
                      {formatDate(item.date)}
                      {item.description ? ` • ${item.description}` : ''}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="fund-item-amount positive">
                    +{formatCurrency(item.amount)}
                  </span>
                  <button 
                    type="button"
                    className="icon-btn delete-item-btn"
                    onClick={() => handleDeleteAddition(item._id)}
                    title="Delete entry"
                    aria-label="Delete entry"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 8. TAB CONTENT: EXPENSES LIST */}
        {activeTab === 'expenses' && (
          <div className="fund-list-container">
            {ownCashPayments.length === 0 ? (
              <div className="empty-state-mini">
                <FileText size={20} color="#94a3b8" />
                <span>No expenses recorded from Own Cash yet</span>
              </div>
            ) : (
              ownCashPayments.map(p => (
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
                      <div className="fund-item-meta" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                        <span>{formatDate(p.date)} • {p.paymentMethod}</span>
                        {(() => {
                          const catMeta = getCategoryMeta(p.expenseCategory || (p.isBuilderPayment ? 'Builder / Contractor' : 'Others'));
                          return (
                            <span className={`tag-mini-cat ${catMeta.tagClass}`}>
                              {catMeta.label}
                            </span>
                          );
                        })()}
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
