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

  // Filter payments financed via Loan Cash
  const loanPayments = payments.filter(p => p.category === 'Loan Cash');
  const totalLoanSpent = loanPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div>
      {/* LOAN SUMMARY CARD */}
      <div className="tile" style={{ marginBottom: '16px' }}>
        <div className="tile-header">
          <div className="tile-title-group">
            <div className="tile-badge-icon badge-amber">
              <Landmark size={20} />
            </div>
            <div>
              <div className="tile-title">Home Loan Summary</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Sanctioned loan & disbursements</div>
            </div>
          </div>
          <button 
            className="icon-btn" 
            onClick={onOpenSettings}
            title="Edit Loan Details"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        <div className="tile-row">
          <span className="tile-label">Total Home Loan</span>
          <span className="tile-value">
            {formatCurrency(homeLoan.totalHomeLoan)}
          </span>
        </div>

        <div className="tile-row">
          <span className="tile-label">Loan Cash Received</span>
          <span className="tile-value tile-value-indigo">
            {formatCurrency(homeLoan.loanCashReceived)}
          </span>
        </div>

        <div className="divider" />

        <div className="tile-row">
          <span className="tile-label" style={{ fontWeight: 600, color: '#0f172a' }}>
            Loan Balance Remaining
          </span>
          <span className="tile-value-large tile-value-amber">
            {formatCurrency(homeLoan.loanBalance)}
          </span>
        </div>
      </div>

      {/* LOAN CASH SPENT INFO */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '14px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '18px'
      }}>
        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
          Loan Cash Utilized in Payments:
        </span>
        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
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
