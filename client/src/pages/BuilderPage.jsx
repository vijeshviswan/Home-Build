import React from 'react';
import { 
  HardHat, 
  Plus, 
  AlertCircle, 
  CheckCircle, 
  FileText,
  SlidersHorizontal 
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import PaymentCard from '../components/PaymentCard';

export default function BuilderPage({ 
  builderData, 
  onAddBuilderPayment, 
  onSelectPayment,
  onOpenSettings 
}) {
  const {
    builderName = 'Builder',
    contractAmount = 0,
    totalPaid = 0,
    balance = 0,
    extraPaid = 0,
    payments = []
  } = builderData || {};

  return (
    <div>
      {/* BUILDER SUMMARY TILE */}
      <div className="tile" style={{ marginBottom: '16px' }}>
        <div className="tile-header">
          <div className="tile-title-group">
            <div className="tile-badge-icon badge-indigo">
              <HardHat size={18} />
            </div>
            <div>
              <div className="tile-title">{builderName}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Main Contractor</div>
            </div>
          </div>
          <button 
            className="icon-btn"
            onClick={onOpenSettings}
            title="Edit Builder Details"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        <div className="tile-row">
          <span className="tile-label">Total Contract Amount</span>
          <span className="tile-value">
            {formatCurrency(contractAmount)}
          </span>
        </div>

        <div className="tile-row">
          <span className="tile-label">Total Paid to Builder</span>
          <span className="tile-value tile-value-green">
            {formatCurrency(totalPaid)}
          </span>
        </div>

        <div className="divider" />

        <div className="tile-row">
          <span className="tile-label" style={{ fontWeight: 600, color: '#0f172a' }}>
            Remaining Balance
          </span>
          <span className="tile-value-large">
            {formatCurrency(balance)}
          </span>
        </div>

        {extraPaid > 0 && (
          <div style={{ marginTop: '10px', padding: '10px 14px', background: '#fff1f2', borderRadius: '12px', border: '1px solid #fecdd3', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} color="#e11d48" />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#be123c' }}>
                Extra Money Paid to Builder
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#e11d48' }}>
                {formatCurrency(extraPaid)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QUICK ACTION BUTTON */}
      <button
        className="btn-submit"
        onClick={onAddBuilderPayment}
        style={{ marginBottom: '20px' }}
      >
        <Plus size={20} />
        Pay Builder
      </button>

      {/* PAYMENT HISTORY HEADER */}
      <div className="section-header">
        <span className="section-title">Builder Payment History</span>
        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
          {payments.length} {payments.length === 1 ? 'payment' : 'payments'}
        </span>
      </div>

      {/* BUILDER PAYMENTS LIST */}
      {payments.length === 0 ? (
        <div className="empty-state">
          <FileText className="empty-state-icon" style={{ margin: '0 auto 8px' }} />
          <div className="empty-state-title">No payments made to builder yet</div>
          <div className="empty-state-desc">
            Tap "Pay Builder" above or log a new payment with "Paid to Builder" checked.
          </div>
        </div>
      ) : (
        payments.map((p) => (
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
