import React from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Paperclip, HardHat, Landmark, IndianRupee, ChevronRight } from 'lucide-react';

export default function PaymentCard({ payment, onSelect }) {
  const isLoan = payment.category === 'Loan Cash';
  const isBuilder = payment.isBuilderPayment;

  return (
    <div 
      className={`payment-card ${isBuilder ? 'card-builder-accent' : isLoan ? 'card-loan-accent' : 'card-own-accent'}`} 
      onClick={() => onSelect(payment)}
    >
      <div className="payment-card-header">
        <div className="payment-card-avatar-group">
          <div className={`payment-avatar ${isBuilder ? 'avatar-builder' : isLoan ? 'avatar-loan' : 'avatar-own'}`}>
            {isBuilder ? (
              <HardHat size={18} strokeWidth={2.2} />
            ) : isLoan ? (
              <Landmark size={18} strokeWidth={2.2} />
            ) : (
              <IndianRupee size={18} strokeWidth={2.4} />
            )}
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
          <span className={`tag ${isLoan ? 'tag-loan' : 'tag-own'}`}>
            {payment.category}
          </span>
          <span className="tag tag-method">
            {payment.paymentMethod}
          </span>
          {payment.isBuilderPayment && (
            <span className="tag tag-builder">
              Builder
            </span>
          )}
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

