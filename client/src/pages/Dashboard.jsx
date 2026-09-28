import React from 'react';
import { IndianRupee, Landmark, HardHat, Wallet, Search, Printer } from 'lucide-react';

export default function Dashboard({ onNavigate }) {
  return (
    <div className="dashboard-menu-container">
      <div className="dashboard-menu-grid">
        {/* TILE 1: TOTAL COST */}
        <button
          className="menu-tile"
          onClick={() => onNavigate('total-cost')}
          id="tile-total-cost"
          aria-label="Total Cost"
        >
          <div className="menu-tile-icon-box icon-box-blue">
            <IndianRupee size={26} strokeWidth={2.4} />
          </div>
          <div className="menu-tile-text">
            <span className="menu-tile-title">Total Cost</span>
          </div>
        </button>

        {/* TILE 2: HOME LOAN */}
        <button
          className="menu-tile"
          onClick={() => onNavigate('home-loan')}
          id="tile-home-loan"
          aria-label="Home Loan"
        >
          <div className="menu-tile-icon-box icon-box-amber">
            <Landmark size={26} strokeWidth={2.2} />
          </div>
          <div className="menu-tile-text">
            <span className="menu-tile-title">Home Loan</span>
            <span className="menu-tile-subtitle">Loan Details</span>
          </div>
        </button>

        {/* TILE 3: BUILDER DETAILS */}
        <button
          className="menu-tile"
          onClick={() => onNavigate('builder')}
          id="tile-builder"
          aria-label="Builder Details"
        >
          <div className="menu-tile-icon-box icon-box-indigo">
            <HardHat size={26} strokeWidth={2.2} />
          </div>
          <div className="menu-tile-text">
            <span className="menu-tile-title">Builder Details</span>
          </div>
        </button>

        {/* TILE 4: SOURCE OF CASH */}
        <button
          className="menu-tile"
          onClick={() => onNavigate('cash-sources')}
          id="tile-cash-sources"
          aria-label="Source of Cash"
        >
          <div className="menu-tile-icon-box icon-box-emerald">
            <Wallet size={26} strokeWidth={2.2} />
          </div>
          <div className="menu-tile-text">
            <span className="menu-tile-title">Source of Cash</span>
          </div>
        </button>

        {/* TILE 5: SEARCH */}
        <button
          className="menu-tile"
          onClick={() => onNavigate('search')}
          id="tile-search"
          aria-label="Search"
        >
          <div className="menu-tile-icon-box icon-box-slate">
            <Search size={26} strokeWidth={2.4} />
          </div>
          <div className="menu-tile-text">
            <span className="menu-tile-title">Search</span>
          </div>
        </button>

        {/* TILE 6: PRINT */}
        <button
          className="menu-tile"
          onClick={() => onNavigate('print')}
          id="tile-print"
          aria-label="Print"
        >
          <div className="menu-tile-icon-box icon-box-rose">
            <Printer size={26} strokeWidth={2.2} />
          </div>
          <div className="menu-tile-text">
            <span className="menu-tile-title">Print</span>
          </div>
        </button>
      </div>
    </div>
  );
}
