import React from 'react';
import { Home, ListOrdered, Plus, UserCheck, Search } from 'lucide-react';

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="bottom-nav">
      <button 
        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => onTabChange('dashboard')}
      >
        <Home size={22} />
        <span className="nav-item-label">Home</span>
      </button>

      <button 
        className={`nav-item ${activeTab === 'payments' ? 'active' : ''}`}
        onClick={() => onTabChange('payments')}
      >
        <ListOrdered size={22} />
        <span className="nav-item-label">Payments</span>
      </button>

      {/* Floating Center Plus for New Payment */}
      <button 
        className="nav-fab-btn"
        onClick={() => onTabChange('new-payment')}
        title="Record New Payment"
        aria-label="New Payment"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      <button 
        className={`nav-item ${activeTab === 'builder' ? 'active' : ''}`}
        onClick={() => onTabChange('builder')}
      >
        <UserCheck size={22} />
        <span className="nav-item-label">Builder</span>
      </button>

      <button 
        className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
        onClick={() => onTabChange('search')}
      >
        <Search size={22} />
        <span className="nav-item-label">Search</span>
      </button>
    </nav>
  );
}
