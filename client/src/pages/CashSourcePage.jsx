import React, { useState } from 'react';
import { Plus, Wallet, Calendar, X, Check, Trash2, FileText, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDate, toInputDate } from '../utils/formatters';

export default function CashSourcePage({ 
  cashSources, 
  totalCashReceived, 
  onAddCashSource, 
  onDeleteCashSource 
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Form State
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(toInputDate());
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setSource('');
    setAmount('');
    setDate(toInputDate());
    setDetails('');
    setShowAddForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!source.trim()) {
      alert('Please enter a source name');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddCashSource({
        source: source.trim(),
        amount: parseFloat(amount),
        date,
        details: details.trim()
      });
      resetForm();
    } catch (err) {
      alert('Failed to save cash source: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this cash source record?')) {
      try {
        await onDeleteCashSource(id);
        setSelectedEntry(null);
      } catch (err) {
        alert('Failed to delete record');
      }
    }
  };

  return (
    <div className="page-wrapper">
      {/* 1. TOTAL CASH RECEIVED SUMMARY TILE */}
      <div className="tile hero-tile-mint" style={{ marginBottom: '16px' }}>
        <div className="tile-header">
          <div className="tile-title-group">
            <div className="tile-badge-icon badge-mint">
              <Wallet size={20} />
            </div>
            <div>
              <div className="tile-title">Source of Cash</div>
              <div className="tile-subtitle-text">Borrowed & personal funding</div>
            </div>
          </div>
        </div>

        <div className="tile-hero-amount-block">
          <span className="tile-hero-label">Total Cash Received</span>
          <div className="tile-hero-val-row">
            <span className="tile-value-large tile-value-green">
              {formatCurrency(totalCashReceived)}
            </span>
            <span className="tile-hero-pill-badge pill-mint">{cashSources.length} {cashSources.length === 1 ? 'Source' : 'Sources'}</span>
          </div>
        </div>
      </div>

      {/* 2. PROMINENT "+ ADD CASH" BUTTON */}
      {!showAddForm && (
        <button
          className="btn-submit"
          onClick={() => setShowAddForm(true)}
          style={{ marginBottom: '20px' }}
          id="btn-add-cash-source"
        >
          <Plus size={20} />
          Add Cash
        </button>
      )}

      {/* 3. ADD CASH FORM (MODAL/CARD) */}
      {showAddForm && (
        <div className="form-card" style={{ marginBottom: '20px', border: '1.5px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              Record Received Cash
            </h3>
            <button className="icon-btn" onClick={resetForm} aria-label="Cancel">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* SOURCE FIELD */}
            <div className="form-group">
              <label className="form-label" htmlFor="cash-source-input">
                Source *
              </label>
              <input
                id="cash-source-input"
                type="text"
                className="form-input"
                placeholder="e.g. Friend - Rahul, Gold Loan, Chitty, Family"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* AMOUNT FIELD */}
            <div className="form-group">
              <label className="form-label" htmlFor="cash-amount-input">
                Amount (₹) *
              </label>
              <div className="amount-input-wrapper">
                <span className="amount-prefix">₹</span>
                <input
                  id="cash-amount-input"
                  type="number"
                  step="any"
                  min="1"
                  className="form-input amount-input"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* DATE FIELD */}
            <div className="form-group">
              <label className="form-label" htmlFor="cash-date-input">
                Date *
              </label>
              <input
                id="cash-date-input"
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* DETAILS FIELD (OPTIONAL) */}
            <div className="form-group">
              <label className="form-label" htmlFor="cash-details-input">
                Details (Optional)
              </label>
              <input
                id="cash-details-input"
                type="text"
                className="form-input"
                placeholder="e.g. Borrowed for house construction"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="btn-submit"
              disabled={isSubmitting}
            >
              <Check size={20} />
              {isSubmitting ? 'Saving Cash Entry...' : 'Save Cash'}
            </button>

            <button
              type="button"
              onClick={resetForm}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '10px',
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* 4. SOURCE OF CASH LIST */}
      <div className="section-header">
        <span className="section-title">Saved Cash Sources</span>
        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
          {cashSources.length} {cashSources.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {cashSources.length === 0 ? (
        <div className="empty-state">
          <FileText className="empty-state-icon" style={{ margin: '0 auto 8px' }} />
          <div className="empty-state-title">No cash sources recorded yet</div>
          <div className="empty-state-desc">
            Tap "+ Add Cash" to track borrowed money, chitty, gold loan, or family funds.
          </div>
        </div>
      ) : (
        <div>
          {cashSources.map((item) => (
            <div
              key={item._id}
              className="payment-card"
              onClick={() => setSelectedEntry(item)}
              style={{ cursor: 'pointer' }}
            >
              <div className="payment-card-top">
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  {item.source}
                </div>
                <div className="payment-card-date">
                  {formatDate(item.date)}
                </div>
              </div>

              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669', margin: '4px 0 2px' }}>
                {formatCurrency(item.amount)}
              </div>

              {item.details && (
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                  {item.details}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 5. DETAILS MODAL */}
      {selectedEntry && (
        <div className="modal-overlay" onClick={() => setSelectedEntry(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Cash Source Details</h2>
              <button className="icon-btn" onClick={() => setSelectedEntry(null)} aria-label="Close">
                <X size={22} />
              </button>
            </div>

            <div style={{ textAlign: 'center', margin: '8px 0 20px' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>Cash Amount</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669' }}>
                {formatCurrency(selectedEntry.amount)}
              </div>
            </div>

            <div>
              <div className="detail-row">
                <span className="detail-label">Source</span>
                <span className="detail-val" style={{ maxWidth: '65%' }}>
                  {selectedEntry.source}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Date Received</span>
                <span className="detail-val">{formatDate(selectedEntry.date)}</span>
              </div>

              {selectedEntry.details && (
                <div className="detail-row">
                  <span className="detail-label">Details / Notes</span>
                  <span className="detail-val" style={{ maxWidth: '65%', fontWeight: 500, color: '#475569' }}>
                    {selectedEntry.details}
                  </span>
                </div>
              )}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleDelete(selectedEntry._id)}
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
                Delete
              </button>

              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
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
      )}
    </div>
  );
}
