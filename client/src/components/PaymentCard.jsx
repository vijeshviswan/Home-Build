import React from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Paperclip, Building2 } from 'lucide-react';

export default function PaymentCard({ payment, onSelect }) {
  const isLoan = payment.category === 'Loan Cash';

  return (
    <div className="payment-card" onClick={() => onSelect(payment)}>
      <div className="payment-card-top">
        <div className="payment-card-amount">
          {formatCurrency(payment.amount)}
        </div>
        <div className="payment-card-date">
          {formatDate(payment.date)}
        </div>
      </div>

      <div className="payment-card-desc">
        {payment.description}
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

        {payment.proofImage && (
          <div className="has-proof-indicator">
            <Paperclip size={13} />
            <span>Proof</span>
          </div>
        )}
      </div>
    </div>
  );
}
