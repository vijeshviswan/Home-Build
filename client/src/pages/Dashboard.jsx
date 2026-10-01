import React from 'react';
import { IndianRupee, Landmark, HardHat, Wallet, Search, Printer, Sparkles, TrendingDown, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function Dashboard({ 
  onNavigate,
  dashboardData,
  builderData,
  totalCashReceived = 0,
  payments = []
}) {
  // Extract or compute dynamic fund source balances
  const fundSources = dashboardData?.fundSources;
  const ownCashData = fundSources?.ownCash;
  const homeLoanData = fundSources?.homeLoan;

  // Own Cash calculations
  const ownCashInitial = ownCashData?.initialBalance ?? 130000;
  const ownCashSpent = ownCashData?.totalSpent ?? payments
    .filter(p => (p.paymentSource === 'Own Cash' || p.category === 'Own Cash'))
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const ownCashRemaining = ownCashData?.remainingBalance ?? (ownCashInitial - ownCashSpent);
  const ownCashPercentRemaining = ownCashInitial > 0 
    ? Math.max(0, Math.min(100, Math.round((ownCashRemaining / ownCashInitial) * 100))) 
    : 0;

  // Home Loan calculations
  const homeLoanInitial = homeLoanData?.initialBalance ?? (dashboardData?.homeLoan?.totalHomeLoan || 3000000);
  const homeLoanSpent = homeLoanData?.totalSpent ?? payments
    .filter(p => (p.paymentSource === 'Home Loan' || p.category === 'Home Loan' || p.category === 'Loan Cash'))
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const homeLoanRemaining = homeLoanData?.remainingBalance ?? (homeLoanInitial - homeLoanSpent);
  const homeLoanPercentRemaining = homeLoanInitial > 0 
    ? Math.max(0, Math.min(100, Math.round((homeLoanRemaining / homeLoanInitial) * 100))) 
    : 0;

  // Total Construction Spent
  const totalSpent = dashboardData?.totalSpent ?? (dashboardData?.totalAmountPaid ?? (ownCashSpent + homeLoanSpent));

  // Builder info
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

      {/* DYNAMIC FINANCIAL BALANCE OVERVIEW SECTION */}
      <section className="balance-overview-section" aria-label="Financial Balance Overview">
        <div className="balance-overview-header">
          <div className="balance-section-title">
            <span>Account Balances & Spending</span>
          </div>
          <span className="balance-section-subtitle">Dynamic live balance</span>
        </div>

        {/* 1. TOTAL SPENT CARD (Primary Overview) */}
        <div 
          className="total-spent-card" 
          onClick={() => onNavigate('total-cost')}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          id="card-total-spent"
        >
          <div className="total-spent-top-row">
            <div className="total-spent-label-group">
              <div className="total-spent-icon-circle">
                <IndianRupee size={16} strokeWidth={2.8} />
              </div>
              <span className="total-spent-label">Total Spent to Date</span>
            </div>
            <span className="total-spent-count-pill">
              {payments.length} {payments.length === 1 ? 'Payment' : 'Payments'}
            </span>
          </div>

          <div className="total-spent-amount">
            {formatCurrency(totalSpent)}
          </div>

          <div className="total-spent-subtext">
            Combined expenses paid across Own Cash & Home Loan
          </div>
        </div>

        {/* 2. DYNAMIC OWN CASH & HOME LOAN BALANCE CARDS */}
        <div className="fund-balance-grid">
          {/* OWN CASH CARD */}
          <div 
            className="fund-balance-card fund-balance-card-own"
            onClick={() => onNavigate('total-cost')}
            id="card-own-cash-balance"
            role="button"
            tabIndex={0}
          >
            <div className="fund-card-top">
              <div className="fund-icon-title">
                <div className="fund-icon-circle">
                  <Wallet size={16} strokeWidth={2.4} />
                </div>
                <span className="fund-card-name">Own Cash</span>
              </div>
              <span className="fund-badge">
                {ownCashPercentRemaining}% Left
              </span>
            </div>

            <div className="fund-remaining-block">
              <div className="fund-remaining-label">Remaining Balance</div>
              <div className="fund-remaining-num">
                {formatCurrency(ownCashRemaining)}
              </div>
            </div>

            <div className="fund-progress-wrapper">
              <div className="fund-progress-track">
                <div 
                  className="fund-progress-fill" 
                  style={{ width: `${ownCashPercentRemaining}%` }}
                />
              </div>
            </div>

            <div className="fund-split-row">
              <div className="fund-split-col">
                <span className="fund-split-label">Starting</span>
                <span className="fund-split-val">{formatCurrency(ownCashInitial)}</span>
              </div>
              <div className="fund-split-col" style={{ textAlign: 'right' }}>
                <span className="fund-split-label">Spent</span>
                <span className="fund-split-val" style={{ color: '#e11d48' }}>
                  {formatCurrency(ownCashSpent)}
                </span>
              </div>
            </div>
          </div>

          {/* HOME LOAN CARD */}
          <div 
            className="fund-balance-card fund-balance-card-loan"
            onClick={() => onNavigate('home-loan')}
            id="card-home-loan-balance"
            role="button"
            tabIndex={0}
          >
            <div className="fund-card-top">
              <div className="fund-icon-title">
                <div className="fund-icon-circle">
                  <Landmark size={16} strokeWidth={2.4} />
                </div>
                <span className="fund-card-name">Home Loan</span>
              </div>
              <span className="fund-badge">
                {homeLoanPercentRemaining}% Left
              </span>
            </div>

            <div className="fund-remaining-block">
              <div className="fund-remaining-label">Remaining Balance</div>
              <div className="fund-remaining-num">
                {formatCurrency(homeLoanRemaining)}
              </div>
            </div>

            <div className="fund-progress-wrapper">
              <div className="fund-progress-track">
                <div 
                  className="fund-progress-fill" 
                  style={{ width: `${homeLoanPercentRemaining}%` }}
                />
              </div>
            </div>

            <div className="fund-split-row">
              <div className="fund-split-col">
                <span className="fund-split-label">Starting</span>
                <span className="fund-split-val">{formatCurrency(homeLoanInitial)}</span>
              </div>
              <div className="fund-split-col" style={{ textAlign: 'right' }}>
                <span className="fund-split-label">Spent</span>
                <span className="fund-split-val" style={{ color: '#e11d48' }}>
                  {formatCurrency(homeLoanSpent)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ACCESS MENU TILES */}
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
            <span className="tile-primary-value">{formatCurrency(totalSpent)}</span>
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
            <span className="tile-primary-value">{formatCurrency(homeLoanRemaining)}</span>
          </div>
          <div className="tile-bottom-row">
            <span className="tile-bottom-subtext">Sanctioned & disbursed</span>
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
            <span className="tile-bottom-subtext">Filter by date & source</span>
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
