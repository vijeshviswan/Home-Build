import React, { useState } from 'react';
import PaymentCard from '../components/PaymentCard';
import { formatCurrency } from '../utils/formatters';
import { FileText, Plus } from 'lucide-react';

export default function PaymentList({ payments, onSelectPayment, onNavigateNewPayment }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All' 
    ? payments 
    : payments.filter(p => p.category === activeCategory);

  const totalAmount = filtered.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="page-wrapper">
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

      {/* SUMMARY BAR */}
      <div className="summary-counter-card">
        <span className="summary-counter-label">
          {filtered.length} {filtered.length === 1 ? 'Payment' : 'Payments'}
        </span>
        <span className="summary-counter-amount">
          {formatCurrency(totalAmount)}
        </span>
      </div>

      {/* PAYMENT CARDS */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <FileText className="empty-state-icon" style={{ margin: '0 auto 8px' }} />
          <div className="empty-state-title">No payments found</div>
          <div className="empty-state-desc">There are no payments in this category yet.</div>
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
