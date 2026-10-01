import React, { useState } from 'react';
import { Building, SlidersHorizontal, Plus, FileText, Wallet, Landmark } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import PaymentCard from '../components/PaymentCard';

export default function TotalCostPage({ 
  dashboardData, 
  payments, 
  onSelectPayment, 
  onOpenSettings,
  onNavigateNewPayment 
}) {
  const [activeCategory, setActiveCategory] = useState('All');

  const totalBuildingCost = dashboardData?.totalBuildingCost || 0;
  const totalAmountPaid = dashboardData?.totalAmountPaid || dashboardData?.totalSpent || 0;
  const remainingBudget = Math.max(0, totalBuildingCost - totalAmountPaid);
  const paidPercentage = totalBuildingCost > 0 ? Math.min(100, Math.round((totalAmountPaid / totalBuildingCost) * 100)) : 0;

  // Breakdown by source
  const ownCashSpent = dashboardData?.fundSources?.ownCash?.totalSpent ?? payments
    .filter(p => (p.paymentSource === 'Own Cash' || p.category === 'Own Cash'))
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const homeLoanSpent = dashboardData?.fundSources?.homeLoan?.totalSpent ?? payments
    .filter(p => (p.paymentSource === 'Home Loan' || p.category === 'Home Loan' || p.category === 'Loan Cash'))
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const filtered = activeCategory === 'All' 
    ? payments 
    : payments.filter(p => {
        const src = p.paymentSource || (p.category === 'Loan Cash' ? 'Home Loan' : p.category);
        return src === activeCategory;
      });

  const filteredTotal = filtered.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="page-wrapper">
      {/* TOTAL COST SUMMARY CARD */}
      <div className="tile hero-tile-coral" style={{ marginBottom: '16px' }}>
        <div className="tile-header">
          <div className="tile-title-group">
            <div className="tile-badge-icon badge-coral">
              <Building size={20} />
            </div>
            <div>
              <div className="tile-title">Total Construction Cost</div>
              <div className="tile-subtitle-text">Estimated budget vs paid</div>
            </div>
          </div>
          <button 
            className="icon-btn tile-settings-btn" 
            onClick={onOpenSettings}
            title="Edit Budget"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        <div className="tile-hero-amount-block">
          <span className="tile-hero-label">Total Amount Paid</span>
          <div className="tile-hero-val-row">
            <span className="tile-value-large tile-value-green">
              {formatCurrency(totalAmountPaid)}
            </span>
            <span className="tile-hero-pill-badge">{paidPercentage}% Paid</span>
          </div>
        </div>

        {/* PROGRESS TRACK */}
        <div className="progress-track-wrapper">
          <div className="progress-track">
            <div className="progress-fill progress-fill-coral" style={{ width: `${paidPercentage}%` }} />
          </div>
        </div>

        <div className="tile-stat-grid" style={{ marginBottom: '12px' }}>
          <div className="tile-stat-item">
            <span className="tile-stat-label">Total Building Budget</span>
            <span className="tile-stat-value">
              {formatCurrency(totalBuildingCost)}
            </span>
          </div>
          <div className="tile-stat-item">
            <span className="tile-stat-label">Remaining Budget</span>
            <span className="tile-stat-value" style={{ color: remainingBudget > 0 ? '#0284c7' : '#e11d48' }}>
              {formatCurrency(remainingBudget)}
            </span>
          </div>
        </div>

        {/* SOURCE SPENDING SPLIT */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '8px', 
          background: 'rgba(255, 255, 255, 0.08)', 
          padding: '10px', 
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.12)' 
        }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Wallet size={12} color="#10b981" /> Own Cash Spent
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
              {formatCurrency(ownCashSpent)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Landmark size={12} color="#818cf8" /> Home Loan Spent
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
              {formatCurrency(homeLoanSpent)}
            </div>
          </div>
        </div>
      </div>

      {/* QUICK CATEGORY PILLS */}
      <div className="category-pill-group">
        {['All', 'Own Cash', 'Home Loan'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* SUMMARY COUNT */}
      <div className="summary-counter-card">
        <span className="summary-counter-label">
          {filtered.length} {filtered.length === 1 ? 'Payment' : 'Payments'} ({activeCategory})
        </span>
        <span className="summary-counter-amount">
          {formatCurrency(filteredTotal)}
        </span>
      </div>

      {/* PAYMENT CARDS */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <FileText className="empty-state-icon" style={{ margin: '0 auto 8px' }} />
          <div className="empty-state-title">No payments found</div>
          <div className="empty-state-desc">There are no payments recorded for {activeCategory} yet.</div>
          <button
            onClick={onNavigateNewPayment}
            className="btn-submit"
            style={{ maxWidth: '200px', margin: '16px auto 0', padding: '10px 16px', fontSize: '0.9rem' }}
          >
            <Plus size={16} /> Add Payment
          </button>
        </div>
      ) : (
        <div>
          {filtered.map((payment) => (
            <PaymentCard
              key={payment._id}
              payment={payment}
              onSelect={onSelectPayment}
            />
          ))}
        </div>
      )}
    </div>
  );
}
