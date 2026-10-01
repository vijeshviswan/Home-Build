import React, { useState, useRef } from 'react';
import { X, Trash2, Edit3, ExternalLink, Calendar, CreditCard, Tag, FileText, CheckCircle2, Camera, Check } from 'lucide-react';
import { formatCurrency, formatDate, toInputDate } from '../utils/formatters';
import { EXPENSE_CATEGORIES, getCategoryMeta } from '../utils/categories';

export default function PaymentDetailsModal({ payment, onClose, onDelete, onUpdate }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editAmount, setEditAmount] = useState(payment ? payment.amount : '');
  const [editDescription, setEditDescription] = useState(payment ? payment.description : '');
  const [editDate, setEditDate] = useState(payment ? toInputDate(payment.date) : toInputDate());
  const [editCategory, setEditCategory] = useState(
    payment ? (payment.expenseCategory || (payment.isBuilderPayment ? 'Builder / Contractor' : 'Others')) : 'Builder / Contractor'
  );
  const [editSource, setEditSource] = useState(
    payment ? (payment.paymentSource || (payment.category === 'Loan Cash' ? 'Home Loan' : payment.category) || 'Own Cash') : 'Own Cash'
  );
  const [editMethod, setEditMethod] = useState(payment ? payment.paymentMethod : 'Online');
  const [editIsBuilder, setEditIsBuilder] = useState(payment ? Boolean(payment.isBuilderPayment) : false);
  const [newProofFile, setNewProofFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  if (!payment) return null;

  const currentSource = payment.paymentSource || (payment.category === 'Loan Cash' ? 'Home Loan' : payment.category) || 'Own Cash';
  const isLoan = currentSource === 'Home Loan';
  const categoryName = payment.expenseCategory || (payment.isBuilderPayment ? 'Builder / Contractor' : 'Others');
  const catMeta = getCategoryMeta(categoryName);
  const CatIcon = catMeta.icon;

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewProofFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editAmount || parseFloat(editAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (!editDescription.trim()) {
      alert('Please enter a description');
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('amount', editAmount);
      formData.append('description', editDescription.trim());
      formData.append('date', editDate);
      formData.append('paymentSource', editSource);
      formData.append('category', editSource);
      formData.append('expenseCategory', editCategory);
      formData.append('paymentMethod', editMethod);
      formData.append('isBuilderPayment', editCategory === 'Builder / Contractor' || editIsBuilder);
      if (newProofFile) {
        formData.append('proofImage', newProofFile);
      }

      if (onUpdate) {
        await onUpdate(payment._id, formData);
      }
      setIsEditing(false);
    } catch (err) {
      alert('Failed to update payment: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-drag-handle" />
        <div className="modal-header">
          <h2 className="modal-title">{isEditing ? 'Edit Payment' : 'Payment Details'}</h2>
          <button className="icon-btn modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {!isEditing ? (
          /* ================= VIEW MODE ================= */
          <div>
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
                <span className="detail-label">Expense Category</span>
                <span className="detail-val">
                  <span className={`tag ${catMeta.tagClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <CatIcon size={13} strokeWidth={2.4} />
                    {catMeta.label}
                  </span>
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Payment Source</span>
                <span className="detail-val">
                  <span className={`tag ${isLoan ? 'tag-loan' : 'tag-own'}`}>
                    {currentSource}
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

            {/* ACTION BUTTONS (Edit, Delete, Close) */}
            <div style={{ marginTop: '24px', display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #bfdbfe',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Edit3 size={16} />
                Edit
              </button>

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
                  flex: 1,
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
        ) : (
          /* ================= EDIT MODE ================= */
          <form onSubmit={handleSaveEdit}>
            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <div className="amount-input-wrapper">
                <span className="amount-prefix">₹</span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  className="form-input amount-input"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <input
                type="text"
                className="form-input"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                type="date"
                className="form-input"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Category / Service *</label>
              <div className="category-chips-grid">
                {EXPENSE_CATEGORIES.map((cat) => {
                  const IconComp = cat.icon;
                  const isSelected = editCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`category-select-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setEditCategory(cat.id);
                        if (cat.id === 'Builder / Contractor') {
                          setEditIsBuilder(true);
                        } else {
                          setEditIsBuilder(false);
                        }
                      }}
                      style={{
                        borderColor: isSelected ? cat.color : '#e2e8f0',
                        backgroundColor: isSelected ? cat.bg : '#ffffff',
                        color: isSelected ? cat.color : '#334155'
                      }}
                    >
                      <IconComp size={15} color={isSelected ? cat.color : '#64748b'} strokeWidth={2.2} />
                      <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? 700 : 500 }}>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="filter-row" style={{ marginBottom: '14px' }}>
              <div>
                <label className="form-label">Payment Source *</label>
                <select
                  className="form-select"
                  value={editSource}
                  onChange={(e) => setEditSource(e.target.value)}
                >
                  <option value="Own Cash">Own Cash</option>
                  <option value="Home Loan">Home Loan</option>
                </select>
              </div>

              <div>
                <label className="form-label">Payment Method *</label>
                <select
                  className="form-select"
                  value={editMethod}
                  onChange={(e) => setEditMethod(e.target.value)}
                >
                  <option value="Online">Online</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={editIsBuilder}
                  onChange={(e) => setEditIsBuilder(e.target.checked)}
                />
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>
                  This payment is for the Builder contract
                </span>
              </label>
            </div>

            {/* Optional photo proof update */}
            <div className="form-group">
              <label className="form-label">Update Proof / Receipt (Optional)</label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div 
                className="file-upload-box" 
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                style={{ padding: '12px' }}
              >
                <Camera size={22} color="#0284c7" />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                  {previewUrl ? 'New image selected (tap to change)' : 'Tap to replace proof screenshot/cheque'}
                </span>
              </div>
              {previewUrl && (
                <div style={{ marginTop: '8px', textAlign: 'center' }}>
                  <img src={previewUrl} alt="New Preview" style={{ maxHeight: '120px', borderRadius: '8px' }} />
                </div>
              )}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                className="btn-submit"
                disabled={isSaving}
                style={{ flex: 2 }}
              >
                <Check size={18} />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setNewProofFile(null);
                  setPreviewUrl('');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
