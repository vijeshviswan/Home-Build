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
    <div>
      {/* QUICK CATEGORY PILLS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
        {['All', 'Own Cash', 'Loan Cash'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              border: activeCategory === cat ? '1px solid #0284c7' : '1px solid #e2e8f0',
              backgroundColor: activeCategory === cat ? '#0284c7' : '#ffffff',
              color: activeCategory === cat ? '#ffffff' : '#475569',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* SUMMARY BAR */}
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
