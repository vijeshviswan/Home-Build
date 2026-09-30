import React from 'react';
import { Home, ListOrdered, Plus, UserCheck, Search } from 'lucide-react';

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="bottom-nav">
      <button 
        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => onTabChange('dashboard')}
      >
        <div className="nav-icon-container">
          <Home size={22} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
        </div>
        <span className="nav-item-label">Home</span>
        {activeTab === 'dashboard' && <span className="nav-active-dot" />}
      </button>

      <button 
        className={`nav-item ${activeTab === 'payments' ? 'active' : ''}`}
        onClick={() => onTabChange('payments')}
      >
        <div className="nav-icon-container">
          <ListOrdered size={22} strokeWidth={activeTab === 'payments' ? 2.5 : 2} />
        </div>
        <span className="nav-item-label">Payments</span>
        {activeTab === 'payments' && <span className="nav-active-dot" />}
      </button>

      {/* Floating Center Plus for New Payment */}
      <div className="nav-fab-wrapper">
        <button 
          className="nav-fab-btn"
          onClick={() => onTabChange('new-payment')}
          title="Record New Payment"
          aria-label="New Payment"
        >
          <Plus size={26} strokeWidth={3} />
        </button>
      </div>

      <button 
        className={`nav-item ${activeTab === 'builder' ? 'active' : ''}`}
        onClick={() => onTabChange('builder')}
      >
        <div className="nav-icon-container">
          <UserCheck size={22} strokeWidth={activeTab === 'builder' ? 2.5 : 2} />
        </div>
        <span className="nav-item-label">Builder</span>
        {activeTab === 'builder' && <span className="nav-active-dot" />}
      </button>

      <button 
        className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
        onClick={() => onTabChange('search')}
      >
        <div className="nav-icon-container">
          <Search size={22} strokeWidth={activeTab === 'search' ? 2.5 : 2} />
        </div>
        <span className="nav-item-label">Search</span>
        {activeTab === 'search' && <span className="nav-active-dot" />}
      </button>
    </nav>
  );
}
