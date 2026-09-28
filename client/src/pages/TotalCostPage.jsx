import React, { useState } from 'react';
import { Building, SlidersHorizontal, Plus, FileText } from 'lucide-react';
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
  const totalAmountPaid = dashboardData?.totalAmountPaid || 0;
  const remainingBudget = Math.max(0, totalBuildingCost - totalAmountPaid);

  const filtered = activeCategory === 'All' 
    ? payments 
    : payments.filter(p => p.category === activeCategory);

  const filteredTotal = filtered.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div>
      {/* TOTAL COST SUMMARY CARD */}
      <div className="tile" style={{ marginBottom: '16px' }}>
        <div className="tile-header">
          <div className="tile-title-group">
            <div className="tile-badge-icon badge-blue">
              <Building size={20} />
            </div>
            <div>
              <div className="tile-title">Total Construction Cost</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Estimated budget vs paid</div>
            </div>
          </div>
          <button 
            className="icon-btn" 
            onClick={onOpenSettings}
            title="Edit Budget"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        <div className="tile-row">
          <span className="tile-label">Total Amount Paid</span>
          <span className="tile-value-large tile-value-green">
            {formatCurrency(totalAmountPaid)}
          </span>
        </div>

        <div className="divider" />

        <div className="tile-row">
          <span className="tile-label">Total Building Cost (Budget)</span>
          <span className="tile-value">
            {formatCurrency(totalBuildingCost)}
          </span>
        </div>

        <div className="tile-row">
          <span className="tile-label">Remaining Budget</span>
          <span className="tile-value" style={{ color: remainingBudget > 0 ? '#0284c7' : '#e11d48' }}>
            {formatCurrency(remainingBudget)}
          </span>
        </div>
      </div>

      {/* QUICK CATEGORY PILLS */}
      <div className="category-pill-group">
        {['All', 'Own Cash', 'Loan Cash'].map((cat) => (
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
      <div style={{ 
        background: '#ffffff', 
        padding: '12px 16px', 
        borderRadius: '14px', 
        border: '1px solid #e2e8f0',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
          {filtered.length} {filtered.length === 1 ? 'Payment' : 'Payments'}
        </span>
        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
          {formatCurrency(filteredTotal)}
        </span>
      </div>

      {/* PAYMENT CARDS */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <FileText className="empty-state-icon" style={{ margin: '0 auto 8px' }} />
          <div className="empty-state-title">No payments found</div>
          <div className="empty-state-desc">There are no payments recorded in this category yet.</div>
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
