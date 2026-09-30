import React, { useState } from 'react';
import { X, Trash2, ExternalLink, Calendar, CreditCard, Tag, FileText, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function PaymentDetailsModal({ payment, onClose, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!payment) return null;

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this payment record?')) {
      setIsDeleting(true);
      try {
        await onDelete(payment._id);
        onClose();
      } catch (err) {
        alert('Failed to delete payment');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-drag-handle" />
        <div className="modal-header">
          <h2 className="modal-title">Payment Details</h2>
          <button className="icon-btn modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="modal-amount-hero">
          <div className="modal-amount-label">Amount Paid</div>
          <div className="modal-amount-value">
            {formatCurrency(payment.amount)}
          </div>
        </div>

        <div>
          <div className="detail-row">
            <span className="detail-label">Description</span>
            <span className="detail-val" style={{ maxWidth: '65%', wordBreak: 'break-word' }}>
              {payment.description}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Date</span>
            <span className="detail-val">{formatDate(payment.date)}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Category</span>
            <span className="detail-val">
              <span className={`tag ${payment.category === 'Loan Cash' ? 'tag-loan' : 'tag-own'}`}>
                {payment.category}
              </span>
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Payment Method</span>
            <span className="detail-val">{payment.paymentMethod}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Paid to Builder</span>
            <span className="detail-val">
              {payment.isBuilderPayment ? (
                <span className="tag tag-builder">Yes</span>
              ) : (
                <span style={{ color: '#94a3b8', fontWeight: 500 }}>No</span>
              )}
            </span>
          </div>

          {(() => {
            const proofSrc = payment.proofUrl || payment.proofImage;
            if (!proofSrc) return null;
            return (
              <div style={{ marginTop: '16px' }}>
                <div className="detail-label" style={{ marginBottom: '8px' }}>
                  Uploaded Cheque / Proof:
                </div>
                <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'center' }}>
                  <a href={proofSrc} target="_blank" rel="noreferrer" title="Open full image">
                    <img
                      src={proofSrc}
                      alt="Proof"
                      style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', display: 'block' }}
                      onError={(e) => {
                        // If direct drive image embed fails, hide broken img icon
                        e.target.style.display = 'none';
                      }}
                    />
                  </a>
                </div>
                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                  <a 
                    href={proofSrc} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ fontSize: '0.84rem', color: '#6366f1', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <ExternalLink size={14} /> View full resolution {payment.proofFileId ? '(Google Drive)' : ''}
                  </a>
                </div>
              </div>
            );
          })()}
        </div>

        <div style={{ marginTop: '24px', display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid #fecdd3',
              backgroundColor: '#fff1f2',
              color: '#e11d48',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Trash2 size={16} />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
