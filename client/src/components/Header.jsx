import React from 'react';
import { ArrowLeft, SlidersHorizontal, Home } from 'lucide-react';

export default function Header({ title, subtitle, showBack, onBack, onOpenSettings }) {
  return (
    <header className="app-header">
      <div className="header-left">
        {showBack ? (
          <button className="icon-btn" onClick={onBack} aria-label="Go back">
            <ArrowLeft size={22} />
          </button>
        ) : (
          <div style={{ color: '#0284c7', display: 'flex', alignItems: 'center' }}>
            <Home size={22} />
          </div>
        )}
        <div>
          <h1 className="header-title">{title}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
      </div>
      {onOpenSettings && (
        <button className="icon-btn" onClick={onOpenSettings} title="Project & Loan Settings" aria-label="Settings">
          <SlidersHorizontal size={20} />
        </button>
      )}
    </header>
  );
}
