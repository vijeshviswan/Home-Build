import React from 'react';
import { Landmark, SlidersHorizontal, FileText, Plus } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import PaymentCard from '../components/PaymentCard';

export default function LoanPage({ 
  dashboardData, 
  payments, 
  onSelectPayment, 
  onOpenSettings,
  onNavigateNewPayment,
  loanInstallments = [],
  onAddLoanInstallment,
  onDeleteLoanInstallment
}) {
  const homeLoan = dashboardData?.homeLoan || {
    totalHomeLoan: 3000000,
    loanCashReceived: 0,
    loanBalance: 3000000,
    initialBalance: 3000000
  };

  const initialSanctioned = homeLoan.sanctionedAmount || homeLoan.totalHomeLoan || 3000000;

  // Filter payments financed via Home Loan
  const loanPayments = payments.filter(
    p => p.paymentSource === 'Home Loan' || p.category === 'Home Loan' || p.category === 'Loan Cash'
  );
  const totalLoanSpent = loanPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // Total Disbursed from installments
  const totalDisbursedFromInst = loanInstallments.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalDisbursed = totalDisbursedFromInst > 0 
    ? totalDisbursedFromInst 
    : (dashboardData?.fundSources?.homeLoan?.totalDisbursed || homeLoan.loanCashReceived || 0);

  // Available cash in bank account
  const loanRemainingBalance = Math.max(0, totalDisbursed - totalLoanSpent);
  const percentRemaining = totalDisbursed > 0 
    ? Math.max(0, Math.min(100, Math.round((loanRemainingBalance / totalDisbursed) * 100))) 
    : 0;

  return (
    <div className="page-wrapper">
      {/* LOAN SUMMARY CARD */}
      <div className="tile hero-tile-purple" style={{ marginBottom: '16px' }}>
        <div className="tile-header">
          <div className="tile-title-group">
            <div className="tile-badge-icon badge-purple">
              <Landmark size={20} />
            </div>
            <div>
              <div className="tile-title">Home Loan Account</div>
              <div className="tile-subtitle-text">Sanctioned limit vs utilization</div>
            </div>
          </div>
          <button 
            className="icon-btn tile-settings-btn" 
            onClick={onOpenSettings}
            title="Edit Loan Details"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        <div className="tile-hero-amount-block">
          <span className="tile-hero-label">Home Loan Remaining Balance</span>
          <div className="tile-hero-val-row">
            <span className="tile-value-large tile-value-purple">
              {formatCurrency(loanRemainingBalance)}
            </span>
            <span className="tile-hero-pill-badge pill-purple">{percentRemaining}% Available</span>
          </div>
        </div>

        {/* PROGRESS TRACK */}
        <div className="progress-track-wrapper">
          <div className="progress-track">
            <div className="progress-fill progress-fill-purple" style={{ width: `${percentRemaining}%` }} />
          </div>
        </div>

        <div className="tile-stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <div className="tile-stat-item">
            <span className="tile-stat-label">Sanctioned</span>
            <span className="tile-stat-value" style={{ fontSize: '0.95rem' }}>
              {formatCurrency(initialSanctioned)}
            </span>
          </div>
          <div className="tile-stat-item">
            <span className="tile-stat-label">Disbursed</span>
            <span className="tile-stat-value" style={{ fontSize: '0.95rem', color: '#7c3aed' }}>
              {formatCurrency(totalDisbursed)}
            </span>
          </div>
          <div className="tile-stat-item">
            <span className="tile-stat-label">Spent</span>
            <span className="tile-stat-value" style={{ fontSize: '0.95rem', color: '#ef4444' }}>
              {formatCurrency(totalLoanSpent)}
            </span>
          </div>
        </div>
      </div>

      {/* DISBURSED STAGES BREAKDOWN */}
      <div className="section-header" style={{ marginTop: '16px' }}>
        <span className="section-title">Bank Installments / Stages</span>
        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
          {loanInstallments.length} {loanInstallments.length === 1 ? 'stage' : 'stages'}
        </span>
      </div>

      {loanInstallments.length === 0 ? (
        <div className="summary-counter-card" style={{ marginBottom: '16px' }}>
          <span className="summary-counter-label">Total Disbursed so far:</span>
          <span className="summary-counter-amount" style={{ color: '#7c3aed' }}>
            {formatCurrency(totalDisbursed)}
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {loanInstallments.map((inst, idx) => (
            <div key={inst._id} className="fund-history-item stage-history-item">
              <div className="fund-item-left">
                <div className="stage-number-badge">{idx + 1}</div>
                <div>
                  <div className="fund-item-title">{inst.stage}</div>
                  <div className="fund-item-meta">
                    {formatDate(inst.disbursementDate)}
                    {inst.bankName ? ` • ${inst.bankName}` : ''}
                    {inst.referenceNumber ? ` (${inst.referenceNumber})` : ''}
                  </div>
                </div>
              </div>
              <div className="fund-item-amount positive" style={{ color: '#7c3aed' }}>
                +{formatCurrency(inst.amount)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LOAN PAYMENTS LIST */}
      <div className="section-header">
        <span className="section-title">Home Loan Payments History</span>
        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
          {loanPayments.length} {loanPayments.length === 1 ? 'record' : 'records'}
        </span>
      </div>

      {loanPayments.length === 0 ? (
        <div className="empty-state">
          <FileText className="empty-state-icon" style={{ margin: '0 auto 8px' }} />
          <div className="empty-state-title">No Home Loan payments yet</div>
          <div className="empty-state-desc">
            When recording a payment, select "Home Loan" as the payment source.
          </div>
          <button
            onClick={onNavigateNewPayment}
            className="btn-submit"
            style={{ maxWidth: '200px', margin: '16px auto 0', padding: '10px 16px', fontSize: '0.9rem' }}
          >
            <Plus size={16} /> Add Loan Payment
          </button>
        </div>
      ) : (
        loanPayments.map((p) => (
          <PaymentCard
            key={p._id}
            payment={p}
            onSelect={onSelectPayment}
          />
        ))
      )}
    </div>
  );
}
