import React, { useState } from 'react';
import { Building, SlidersHorizontal, Plus, FileText, Wallet, Landmark, Layers } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import PaymentCard from '../components/PaymentCard';
import { EXPENSE_CATEGORIES } from '../utils/categories';

export default function TotalCostPage({ 
  dashboardData, 
  payments, 
  onSelectPayment, 
  onOpenSettings,
  onNavigateNewPayment 
}) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSource, setActiveSource] = useState('All');

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

  // Live Category breakdown
  const categoryStats = EXPENSE_CATEGORIES.map(cat => {
    const catPayments = payments.filter(p => {
      const pCat = p.expenseCategory || (p.isBuilderPayment ? 'Builder / Contractor' : 'Others');
      return pCat === cat.id;
    });
    const total = catPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const percentage = totalAmountPaid > 0 ? Math.round((total / totalAmountPaid) * 100) : 0;
    return {
      ...cat,
      count: catPayments.length,
      totalSpent: total,
      percentage
    };
  });

  // Filter payments
  const filtered = payments.filter(p => {
    const pCat = p.expenseCategory || (p.isBuilderPayment ? 'Builder / Contractor' : 'Others');
    const pSrc = p.paymentSource || (p.category === 'Loan Cash' ? 'Home Loan' : p.category) || 'Own Cash';

    const matchCategory = activeCategory === 'All' || pCat === activeCategory;
    const matchSource = activeSource === 'All' || pSrc === activeSource;
    return matchCategory && matchSource;
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

      {/* CATEGORY BREAKDOWN SECTION */}
      <div className="category-breakdown-section">
        <div className="category-breakdown-header">
          <div className="category-breakdown-title">
            <Layers size={17} color="#6366f1" />
            <span>Spending by Category</span>
          </div>
          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
            Tap card to filter
          </span>
        </div>

        <div className="category-breakdown-grid">
          {categoryStats.map(cat => {
            const IconComp = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <div 
                key={cat.id} 
                className={`category-breakdown-card ${isSelected ? 'active-filter' : ''}`}
                onClick={() => setActiveCategory(isSelected ? 'All' : cat.id)}
              >
                <div className="cat-card-top">
                  <div className="cat-card-name">
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '6px', 
                      backgroundColor: cat.bg, 
                      color: cat.color 
                    }}>
                      <IconComp size={14} />
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '105px' }} title={cat.label}>
                      {cat.label}
                    </span>
                  </div>
                  {isSelected && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6366f1', background: '#e0e7ff', padding: '1px 5px', borderRadius: '4px' }}>
                      Active
                    </span>
                  )}
                </div>

                <div className="cat-card-amount">
                  {formatCurrency(cat.totalSpent)}
                </div>

                <div className="cat-card-bar">
                  <div 
                    className="cat-card-bar-fill" 
                    style={{ 
                      width: `${cat.percentage}%`, 
                      backgroundColor: cat.color 
                    }} 
                  />
                </div>

                <div className="cat-card-meta">
                  <span>{cat.count} {cat.count === 1 ? 'payment' : 'payments'}</span>
                  <span style={{ fontWeight: 700, color: cat.percentage > 0 ? '#334155' : '#94a3b8' }}>
                    {cat.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CATEGORY FILTER HORIZONTAL SCROLL PILLS */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', paddingLeft: '2px' }}>
          Filter by Category
        </div>
        <div className="category-filter-scroll">
          <button
            onClick={() => setActiveCategory('All')}
            className={`category-pill ${activeCategory === 'All' ? 'active' : ''}`}
          >
            All Categories
          </button>
          {EXPENSE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
              style={{ whiteSpace: 'nowrap' }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* SOURCE FILTER PILLS */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', paddingLeft: '2px' }}>
          Filter by Fund Source
        </div>
        <div className="category-pill-group">
          {['All', 'Own Cash', 'Home Loan'].map((src) => (
            <button
              key={src}
              onClick={() => setActiveSource(src)}
              className={`category-pill ${activeSource === src ? 'active' : ''}`}
            >
              {src === 'All' ? 'All Sources' : src}
            </button>
          ))}
        </div>
      </div>

      {/* SUMMARY COUNT */}
      <div className="summary-counter-card">
        <span className="summary-counter-label">
          {filtered.length} {filtered.length === 1 ? 'Payment' : 'Payments'}
          {activeCategory !== 'All' ? ` • ${activeCategory}` : ''}
          {activeSource !== 'All' ? ` (${activeSource})` : ''}
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
          <div className="empty-state-desc">
            No payments recorded matching {activeCategory !== 'All' ? activeCategory : 'selected filters'}.
          </div>
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
