import React from 'react';
import { 
  HardHat, 
  Plus, 
  AlertCircle, 
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

  const paidPercentage = contractAmount > 0 
    ? Math.min(100, Math.round((totalPaid / contractAmount) * 100)) 
    : 0;

  return (
    <div className="page-wrapper">
      {/* BUILDER SUMMARY TILE */}
      <div className="tile hero-tile-amber" style={{ marginBottom: '16px' }}>
        <div className="tile-header">
          <div className="tile-title-group">
            <div className="tile-badge-icon badge-amber">
              <HardHat size={18} />
            </div>
            <div>
              <div className="tile-title">{builderName}</div>
              <div className="tile-subtitle-text">Main Contractor</div>
            </div>
          </div>
          <button 
            className="icon-btn tile-settings-btn"
            onClick={onOpenSettings}
            title="Edit Builder Details"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        <div className="tile-hero-amount-block">
          <span className="tile-hero-label">Remaining Balance</span>
          <div className="tile-hero-val-row">
            <span className="tile-value-large tile-value-amber">
              {formatCurrency(balance)}
            </span>
            <span className="tile-hero-pill-badge pill-amber">{paidPercentage}% Paid</span>
          </div>
        </div>

        {/* PROGRESS TRACK */}
        <div className="progress-track-wrapper">
          <div className="progress-track">
            <div className="progress-fill progress-fill-amber" style={{ width: `${paidPercentage}%` }} />
          </div>
        </div>

        <div className="tile-stat-grid">
          <div className="tile-stat-item">
            <span className="tile-stat-label">Contract Amount</span>
            <span className="tile-stat-value">
              {formatCurrency(contractAmount)}
            </span>
          </div>
          <div className="tile-stat-item">
            <span className="tile-stat-label">Total Paid</span>
            <span className="tile-stat-value" style={{ color: '#10b981' }}>
              {formatCurrency(totalPaid)}
            </span>
          </div>
        </div>

        {extraPaid > 0 && (
          <div className="builder-extra-alert">
            <AlertCircle size={20} className="extra-alert-icon" />
            <div>
              <div className="extra-alert-label">
                Extra Money Paid to Builder
              </div>
              <div className="extra-alert-val">
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
