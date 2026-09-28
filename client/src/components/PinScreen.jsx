import React, { useState } from 'react';
import { Home, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

const CORRECT_PIN = '27426840';

export default function PinScreen({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin.trim() === CORRECT_PIN) {
      setError('');
      onUnlock();
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  return (
    <div className="pin-screen-container">
      <div className="pin-card">
        {/* ICON & APP BRANDING */}
        <div className="pin-icon-box">
          <Home size={30} strokeWidth={2.2} />
        </div>

        <h1 className="pin-app-title">House Finance</h1>
        <p className="pin-subtitle">Enter Access PIN</p>

        {/* PIN FORM */}
        <form onSubmit={handleSubmit} className="pin-form">
          <div className="pin-input-group">
            <input
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              pattern="[0-9]*"
              className="pin-input"
              placeholder="••••••••"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError('');
              }}
              autoFocus
              id="access-pin-input"
              maxLength={12}
            />

            <button
              type="button"
              className="pin-eye-btn"
              onClick={() => setShowPin(!showPin)}
              title={showPin ? 'Hide PIN' : 'Show PIN'}
              aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
            >
              {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="pin-error-box" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* CONTINUE BUTTON */}
          <button
            type="submit"
            className="btn-submit pin-submit-btn"
            id="btn-submit-pin"
          >
            <span>Continue</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
