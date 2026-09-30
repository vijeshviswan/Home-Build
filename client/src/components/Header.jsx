import React from 'react';
import { ArrowLeft, SlidersHorizontal, Home } from 'lucide-react';

export default function Header({ title, subtitle, showBack, onBack, onOpenSettings }) {
  return (
    <header className="app-header">
      <div className="header-left">
        {showBack ? (
          <button className="icon-btn header-back-btn" onClick={onBack} aria-label="Go back">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
        ) : (
          <div className="header-brand-icon">
            <Home size={20} strokeWidth={2.5} />
          </div>
        )}
        <div className="header-text-group">
          <h1 className="header-title">{title}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
      </div>
      {onOpenSettings && (
        <button className="icon-btn header-settings-btn" onClick={onOpenSettings} title="Project & Loan Settings" aria-label="Settings">
          <SlidersHorizontal size={19} strokeWidth={2.2} />
        </button>
      )}
    </header>
  );
}

