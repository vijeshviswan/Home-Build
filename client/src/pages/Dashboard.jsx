import React from 'react';
import { IndianRupee, Landmark, HardHat, Wallet, Search, Printer, Sparkles } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function Dashboard({ 
  onNavigate,
  dashboardData,
  builderData,
  totalCashReceived = 0,
  payments = []
}) {
  const totalAmountPaid = dashboardData?.totalAmountPaid ?? 0;
  const loanBalance = dashboardData?.homeLoan?.loanBalance ?? 0;
  const builderPaid = builderData?.totalPaid ?? dashboardData?.builder?.amountPaid ?? 0;

  return (
    <div className="dashboard-menu-container">
      {/* PLAYFUL FINTECH WELCOME BANNER */}
      <div className="dashboard-welcome-card">
        <div className="welcome-card-content">
          <div className="welcome-badge">
            <Sparkles size={13} className="sparkle-icon" />
            <span>Smart Construction Tracker</span>
          </div>
          <h2 className="welcome-heading">My Dream House</h2>
          <p className="welcome-subtext">Manage budget, contractor payments & loans in one place</p>
        </div>
      </div>

      <div className="dashboard-menu-grid">
        {/* TILE 1: TOTAL COST (Coral-Red) */}
        <button
          className="menu-tile menu-tile-coral"
          onClick={() => onNavigate('total-cost')}
          id="tile-total-cost"
          aria-label="Total Cost"
        >
          <div className="tile-top-row">
            <span className="tile-top-title">Total Cost</span>
            <div className="tile-icon-circle icon-circle-coral">
              <IndianRupee size={17} strokeWidth={2.6} />
            </div>
          </div>
          <div className="tile-main-row">
            <span className="tile-primary-value">{formatCurrency(totalAmountPaid)}</span>
          </div>
          <div className="tile-bottom-row">
            <span className="tile-bottom-subtext">Estimated budget vs paid</span>
          </div>
        </button>

        {/* TILE 2: HOME LOAN (Purple) */}
        <button
          className="menu-tile menu-tile-purple"
          onClick={() => onNavigate('home-loan')}
          id="tile-home-loan"
          aria-label="Home Loan"
        >
          <div className="tile-top-row">
            <span className="tile-top-title">Home Loan</span>
            <div className="tile-icon-circle icon-circle-purple">
              <Landmark size={17} strokeWidth={2.4} />
            </div>
          </div>
          <div className="tile-main-row">
            <span className="tile-primary-value">{formatCurrency(loanBalance)}</span>
          </div>
          <div className="tile-bottom-row">
            <span className="tile-bottom-subtext">Loan balance remaining</span>
          </div>
        </button>

        {/* TILE 3: BUILDER DETAILS (Orange) */}
        <button
          className="menu-tile menu-tile-amber"
          onClick={() => onNavigate('builder')}
          id="tile-builder"
          aria-label="Builder Details"
        >
          <div className="tile-top-row">
            <span className="tile-top-title">Builder Details</span>
            <div className="tile-icon-circle icon-circle-amber">
              <HardHat size={17} strokeWidth={2.4} />
            </div>
          </div>
          <div className="tile-main-row">
            <span className="tile-primary-value">{formatCurrency(builderPaid)}</span>
          </div>
          <div className="tile-bottom-row">
            <span className="tile-bottom-subtext">Total paid to contractor</span>
          </div>
        </button>

        {/* TILE 4: SOURCE OF CASH (Cyan/Teal) */}
        <button
          className="menu-tile menu-tile-cyan"
          onClick={() => onNavigate('cash-sources')}
          id="tile-cash-sources"
          aria-label="Source of Cash"
        >
          <div className="tile-top-row">
            <span className="tile-top-title">Source of Cash</span>
            <div className="tile-icon-circle icon-circle-cyan">
              <Wallet size={17} strokeWidth={2.4} />
            </div>
          </div>
          <div className="tile-main-row">
            <span className="tile-primary-value">{formatCurrency(totalCashReceived)}</span>
          </div>
          <div className="tile-bottom-row">
            <span className="tile-bottom-subtext">Borrowed & personal funds</span>
          </div>
        </button>

        {/* TILE 5: SEARCH (Deep Indigo) */}
        <button
          className="menu-tile menu-tile-indigo"
          onClick={() => onNavigate('search')}
          id="tile-search"
          aria-label="Search"
        >
          <div className="tile-top-row">
            <span className="tile-top-title">Search</span>
            <div className="tile-icon-circle icon-circle-indigo">
              <Search size={17} strokeWidth={2.6} />
            </div>
          </div>
          <div className="tile-main-row">
            <span className="tile-primary-value">{payments.length} Payments</span>
          </div>
          <div className="tile-bottom-row">
            <span className="tile-bottom-subtext">Filter by date & category</span>
          </div>
        </button>

        {/* TILE 6: PRINT (Vibrant Green) */}
        <button
          className="menu-tile menu-tile-green"
          onClick={() => onNavigate('print')}
          id="tile-print"
          aria-label="Print"
        >
          <div className="tile-top-row">
            <span className="tile-top-title">Print</span>
            <div className="tile-icon-circle icon-circle-green">
              <Printer size={17} strokeWidth={2.4} />
            </div>
          </div>
          <div className="tile-main-row">
            <span className="tile-primary-value">Monthly PDF</span>
          </div>
          <div className="tile-bottom-row">
            <span className="tile-bottom-subtext">Financial statement sheet</span>
          </div>
        </button>
      </div>
    </div>
  );
}

