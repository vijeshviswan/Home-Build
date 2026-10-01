import React from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Paperclip, ChevronRight } from 'lucide-react';
import { getCategoryMeta } from '../utils/categories';

export default function PaymentCard({ payment, onSelect }) {
  const sourceName = payment.paymentSource || (payment.category === 'Loan Cash' ? 'Home Loan' : payment.category) || 'Own Cash';
  const isLoan = sourceName === 'Home Loan';
  const isBuilder = payment.isBuilderPayment;
  
  const categoryName = payment.expenseCategory || (payment.isBuilderPayment ? 'Builder / Contractor' : 'Others');
  const catMeta = getCategoryMeta(categoryName);
  const CatIcon = catMeta.icon;

  return (
    <div 
      className={`payment-card ${isBuilder ? 'card-builder-accent' : isLoan ? 'card-loan-accent' : 'card-own-accent'}`} 
      onClick={() => onSelect(payment)}
    >
      <div className="payment-card-header">
        <div className="payment-card-avatar-group">
          <div 
            className="payment-avatar"
            style={{ 
              backgroundColor: catMeta.bg, 
              color: catMeta.color, 
              border: `1px solid ${catMeta.border}` 
            }}
          >
            <CatIcon size={18} strokeWidth={2.2} />
          </div>
          <div className="payment-card-meta">
            <div className="payment-card-desc">
              {payment.description}
            </div>
            <div className="payment-card-date">
              {formatDate(payment.date)}
            </div>
          </div>
        </div>

        <div className="payment-card-amount-block">
          <div className="payment-card-amount">
            {formatCurrency(payment.amount)}
          </div>
          <ChevronRight size={14} className="payment-card-chevron" />
        </div>
      </div>

      <div className="payment-card-footer">
        <div className="tags-group">
          <span className={`tag ${catMeta.tagClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CatIcon size={12} strokeWidth={2.4} />
            {catMeta.label}
          </span>
          <span className={`tag ${isLoan ? 'tag-loan' : 'tag-own'}`}>
            {sourceName}
          </span>
          <span className="tag tag-method">
            {payment.paymentMethod}
          </span>
        </div>

        {(payment.proofUrl || payment.proofImage) && (
          <div className="has-proof-indicator">
            <Paperclip size={13} strokeWidth={2.2} />
            <span>Proof</span>
          </div>
        )}
      </div>
    </div>
  );
}
