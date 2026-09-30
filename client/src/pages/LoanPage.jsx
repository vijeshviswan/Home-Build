import React from 'react';
import { Landmark, SlidersHorizontal, FileText, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import PaymentCard from '../components/PaymentCard';

export default function LoanPage({ 
  dashboardData, 
  payments, 
  onSelectPayment, 
  onOpenSettings,
  onNavigateNewPayment
}) {
  const homeLoan = dashboardData?.homeLoan || {
    totalHomeLoan: 0,
    loanCashReceived: 0,
    loanBalance: 0
  };

  const disbursedPercentage = homeLoan.totalHomeLoan > 0 
    ? Math.min(100, Math.round((homeLoan.loanCashReceived / homeLoan.totalHomeLoan) * 100)) 
    : 0;

  // Filter payments financed via Loan Cash
  const loanPayments = payments.filter(p => p.category === 'Loan Cash');
  const totalLoanSpent = loanPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

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
              <div className="tile-title">Home Loan Summary</div>
              <div className="tile-subtitle-text">Sanctioned loan & disbursements</div>
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
          <span className="tile-hero-label">Loan Balance Remaining</span>
          <div className="tile-hero-val-row">
            <span className="tile-value-large tile-value-purple">
              {formatCurrency(homeLoan.loanBalance)}
            </span>
            <span className="tile-hero-pill-badge pill-purple">{disbursedPercentage}% Received</span>
          </div>
        </div>

        {/* PROGRESS TRACK */}
        <div className="progress-track-wrapper">
          <div className="progress-track">
            <div className="progress-fill progress-fill-purple" style={{ width: `${disbursedPercentage}%` }} />
          </div>
        </div>

        <div className="tile-stat-grid">
          <div className="tile-stat-item">
            <span className="tile-stat-label">Total Home Loan</span>
            <span className="tile-stat-value">
              {formatCurrency(homeLoan.totalHomeLoan)}
            </span>
          </div>
          <div className="tile-stat-item">
            <span className="tile-stat-label">Cash Received</span>
            <span className="tile-stat-value" style={{ color: '#10b981' }}>
              {formatCurrency(homeLoan.loanCashReceived)}
            </span>
          </div>
        </div>
      </div>

      {/* LOAN CASH SPENT INFO */}
      <div className="summary-counter-card">
        <span className="summary-counter-label">
          Loan Cash Utilized in Payments:
        </span>
        <span className="summary-counter-amount">
          {formatCurrency(totalLoanSpent)}
        </span>
      </div>

      {/* LOAN PAYMENTS LIST */}
      <div className="section-header">
        <span className="section-title">Loan Payments History</span>
        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
          {loanPayments.length} {loanPayments.length === 1 ? 'record' : 'records'}
        </span>
      </div>

      {loanPayments.length === 0 ? (
        <div className="empty-state">
          <FileText className="empty-state-icon" style={{ margin: '0 auto 8px' }} />
          <div className="empty-state-title">No loan cash payments yet</div>
          <div className="empty-state-desc">
            When recording a payment, select "Loan Cash" as the category.
          </div>
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
