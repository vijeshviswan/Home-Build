import React, { useState, useRef } from 'react';
import { Camera, X, Check } from 'lucide-react';
import { toInputDate } from '../utils/formatters';

export default function NewPayment({ onSubmitPayment, onCancel, defaultIsBuilder = false }) {
  const [date, setDate] = useState(toInputDate());
  const [category, setCategory] = useState('Own Cash');
  const [paymentMethod, setPaymentMethod] = useState('Online');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isBuilderPayment, setIsBuilderPayment] = useState(defaultIsBuilder);
  
  const [proofFile, setProofFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    setProofFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (!description.trim()) {
      alert('Please enter a description');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('date', date);
      formData.append('category', category);
      formData.append('paymentMethod', paymentMethod);
      formData.append('amount', amount);
      formData.append('description', description.trim());
      formData.append('isBuilderPayment', isBuilderPayment);
      if (proofFile) {
        formData.append('proofImage', proofFile);
      }

      await onSubmitPayment(formData);
    } catch (err) {
      alert('Failed to save payment: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const showChequeUpload = paymentMethod === 'Cheque';
  const showOnlineUpload = paymentMethod === 'Online';

  return (
    <div className="form-card">
      <form onSubmit={handleSubmit} id="new-payment-form">
        {/* AMOUNT */}
        <div className="form-group">
          <label className="form-label" htmlFor="payment-amount">
            Amount (₹) *
          </label>
          <div className="amount-input-wrapper">
            <span className="amount-prefix">₹</span>
            <input
              id="payment-amount"
              type="number"
              step="any"
              min="1"
              className="form-input amount-input"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="form-group">
          <label className="form-label" htmlFor="payment-description">
            Description *
          </label>
          <input
            id="payment-description"
            type="text"
            className="form-input"
            placeholder="e.g. Cement purchase, Electrician, Builder advance"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {/* DATE */}
        <div className="form-group">
          <label className="form-label" htmlFor="payment-date">
            Date *
          </label>
          <input
            id="payment-date"
            type="date"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* CATEGORY & METHOD */}
        <div className="filter-row" style={{ marginBottom: '18px' }}>
          <div>
            <label className="form-label" htmlFor="payment-category">
              Category *
            </label>
            <select
              id="payment-category"
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Own Cash">Own Cash</option>
              <option value="Loan Cash">Loan Cash</option>
            </select>
          </div>

          <div>
            <label className="form-label" htmlFor="payment-method">
              Payment Method *
            </label>
            <select
              id="payment-method"
              className="form-select"
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                // Reset file when switching to Cash
                if (e.target.value === 'Cash') {
                  handleRemoveFile();
                }
              }}
            >
              <option value="Online">Online</option>
              <option value="Cheque">Cheque</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
        </div>

        {/* CONDITIONAL PROOF UPLOAD */}
        {(showChequeUpload || showOnlineUpload) && (
          <div className="form-group">
            <label className="form-label">
              {showChequeUpload ? 'Upload Cheque Photo' : 'Upload Payment Screenshot / Proof'}
            </label>
            
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="proof-file-input"
            />

            {!previewUrl ? (
              <div 
                className="file-upload-box"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                <Camera size={26} color="#0284c7" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                  Tap to upload or take photo
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {showChequeUpload ? 'Cheque copy or scan' : 'UPI, NetBanking receipt or slip'}
                </span>
              </div>
            ) : (
              <div className="file-preview">
                <img src={previewUrl} alt="Receipt preview" />
                <button
                  type="button"
                  className="remove-file-btn"
                  onClick={handleRemoveFile}
                  title="Remove uploaded file"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* BUILDER PAYMENT TOGGLE */}
        <div className="form-group">
          <label className="checkbox-row">
            <input
              type="checkbox"
              id="is-builder-payment"
              checked={isBuilderPayment}
              onChange={(e) => setIsBuilderPayment(e.target.checked)}
            />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>
              This payment is for the Builder contract
            </span>
          </label>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          className="btn-submit"
          id="btn-submit-payment"
          disabled={isSubmitting}
        >
          <Check size={20} />
          {isSubmitting ? 'Saving Payment...' : 'Submit Payment'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
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
        )}
      </form>
    </div>
  );
}
