import React, { useState } from 'react';
import { Printer, Calendar, FileText, CheckCircle, ArrowDownLeft, ArrowUpRight, Wallet, Landmark } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function PrintPage({ payments, cashSources, dashboardData }) {
  // Current month default in YYYY-MM format
  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  const [yearStr, monthStr] = selectedMonth.split('-');
  const selYear = parseInt(yearStr, 10);
  const selMonth = parseInt(monthStr, 10) - 1; // 0-indexed

  const monthLabel = new Date(selYear, selMonth, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric'
  });

  // Filter Cash Sources for selected month
  const monthCashSources = cashSources.filter((cs) => {
    const d = new Date(cs.date);
    return d.getFullYear() === selYear && d.getMonth() === selMonth;
  });

  // Filter Payments for selected month
  const monthPayments = payments.filter((p) => {
    const d = new Date(p.date);
    return d.getFullYear() === selYear && d.getMonth() === selMonth;
  });

  // Separate builder payments & other payments
  const monthBuilderPayments = monthPayments.filter((p) => p.isBuilderPayment);
  const monthOtherPayments = monthPayments.filter((p) => !p.isBuilderPayment);

  // Separate by source
  const monthOwnCashPayments = monthPayments.filter(
    (p) => (p.paymentSource === 'Own Cash' || p.category === 'Own Cash')
  );
  const monthHomeLoanPayments = monthPayments.filter(
    (p) => (p.paymentSource === 'Home Loan' || p.category === 'Home Loan' || p.category === 'Loan Cash')
  );

  // Calculations
  const totalCashSourcesReceived = monthCashSources.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalMoneyReceived = totalCashSourcesReceived;

  const totalBuilderPayments = monthBuilderPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalOtherPayments = monthOtherPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalPayments = totalBuilderPayments + totalOtherPayments;

  const monthOwnCashSpent = monthOwnCashPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const monthHomeLoanSpent = monthHomeLoanPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const balanceDifference = totalMoneyReceived - totalPayments;

  // Global remaining balances
  const ownCashRemaining = dashboardData?.fundSources?.ownCash?.remainingBalance ?? 123000;
  const homeLoanRemaining = dashboardData?.fundSources?.homeLoan?.remainingBalance ?? 3000000;

  const handlePrint = () => {
    window.print();
  };

  const getSourceLabel = (p) => {
    return p.paymentSource || (p.category === 'Loan Cash' ? 'Home Loan' : p.category) || 'Own Cash';
  };

  return (
    <div className="print-page-wrapper">
      {/* CONTROLS BAR (Hidden during print) */}
      <div className="print-controls-bar no-print">
        <div style={{ flex: 1, minWidth: '180px' }}>
          <label className="form-label" htmlFor="select-statement-month" style={{ fontSize: '0.82rem', marginBottom: '6px' }}>
            Select Month
          </label>
          <input
            id="select-statement-month"
            type="month"
            className="form-input"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ padding: '11px 14px' }}
          />
        </div>

        <button
          onClick={handlePrint}
          className="btn-submit"
          id="btn-print-report"
          style={{
            flex: 'none',
            padding: '12px 22px',
            marginTop: 'auto',
            height: '46px'
          }}
        >
          <Printer size={18} />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* PRINTABLE STATEMENT DOCUMENT */}
      <div className="printable-statement" id="printable-area">
        {/* HEADER */}
        <div className="statement-header">
          <div className="statement-title">Monthly Construction Statement</div>
          <div className="statement-month-pill">{monthLabel}</div>
          <div className="statement-meta">
            Generated on: {formatDate(new Date())} • House Construction Payment Tracker
          </div>
        </div>

        {/* MONTHLY SUMMARY CARD / TABLE */}
        <div className="statement-section">
          <div className="statement-section-title">Monthly Financial Summary</div>

          <div className="table-wrapper-block">
            <table className="statement-table">
              <tbody>
                <tr>
                  <td className="stat-label">Total Cash Inflow Received (External / Borrowed)</td>
                  <td className="stat-val" style={{ color: '#059669' }}>
                    {formatCurrency(totalMoneyReceived)}
                  </td>
                </tr>
                <tr>
                  <td className="stat-label">Total Monthly Expenses Paid</td>
                  <td className="stat-val" style={{ color: '#e11d48' }}>
                    {formatCurrency(totalPayments)}
                  </td>
                </tr>
                <tr>
                  <td className="stat-sublabel" style={{ paddingLeft: '24px' }}>
                    • Paid via Own Cash
                  </td>
                  <td className="stat-subval">
                    {formatCurrency(monthOwnCashSpent)}
                  </td>
                </tr>
                <tr>
                  <td className="stat-sublabel" style={{ paddingLeft: '24px' }}>
                    • Paid via Home Loan
                  </td>
                  <td className="stat-subval">
                    {formatCurrency(monthHomeLoanSpent)}
                  </td>
                </tr>
                <tr>
                  <td className="stat-sublabel" style={{ paddingLeft: '24px' }}>
                    • Builder Payments Subtotal
                  </td>
                  <td className="stat-subval">
                    {formatCurrency(totalBuilderPayments)}
                  </td>
                </tr>
                <tr>
                  <td className="stat-sublabel" style={{ paddingLeft: '24px' }}>
                    • Other Construction Expenses Subtotal
                  </td>
                  <td className="stat-subval">
                    {formatCurrency(totalOtherPayments)}
                  </td>
                </tr>
                <tr className="stat-highlight-row">
                  <td className="stat-label" style={{ fontWeight: 800 }}>
                    Inflow - Outflow Difference
                  </td>
                  <td className="stat-val" style={{ fontWeight: 800, color: balanceDifference >= 0 ? '#059669' : '#e11d48' }}>
                    {formatCurrency(balanceDifference)}
                  </td>
                </tr>
                <tr>
                  <td className="stat-label" style={{ fontWeight: 700, color: '#047857' }}>
                    Current Own Cash Remaining Balance
                  </td>
                  <td className="stat-val" style={{ fontWeight: 800, color: '#047857' }}>
                    {formatCurrency(ownCashRemaining)}
                  </td>
                </tr>
                <tr>
                  <td className="stat-label" style={{ fontWeight: 700, color: '#4338ca' }}>
                    Current Home Loan Remaining Balance
                  </td>
                  <td className="stat-val" style={{ fontWeight: 800, color: '#4338ca' }}>
                    {formatCurrency(homeLoanRemaining)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 1. CASH INFLOW RECEIVED IN MONTH */}
        <div className="statement-section">
          <div className="statement-section-title">
            1. Cash Inflow / Sources of Cash ({monthCashSources.length})
          </div>

          {monthCashSources.length === 0 ? (
            <div className="statement-empty">No borrowed cash sources recorded for this month.</div>
          ) : (
            <div className="table-wrapper-block">
              <table className="statement-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Source / Person</th>
                    <th>Details / Purpose</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {monthCashSources.map((cs) => (
                    <tr key={cs._id}>
                      <td>{formatDate(cs.date)}</td>
                      <td style={{ fontWeight: 600 }}>{cs.source}</td>
                      <td>{cs.details || '-'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                        {formatCurrency(cs.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ fontWeight: 700 }}>Total Inflow Received</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                      {formatCurrency(totalCashSourcesReceived)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* 2. PAYMENTS BREAKDOWN */}
        <div className="statement-section">
          <div className="statement-section-title">
            2. Construction Expenses Paid ({monthPayments.length})
          </div>

          {/* BUILDER PAYMENTS */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
              Contractor / Builder Payments ({monthBuilderPayments.length})
            </div>
            {monthBuilderPayments.length === 0 ? (
              <div className="statement-empty">No payments made to the builder in this month.</div>
            ) : (
              <div className="table-wrapper-block">
                <table className="statement-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Source</th>
                      <th>Method</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthBuilderPayments.map((p) => (
                      <tr key={p._id}>
                        <td>{formatDate(p.date)}</td>
                        <td style={{ fontWeight: 600 }}>{p.description}</td>
                        <td>
                          <span className={`tag ${getSourceLabel(p) === 'Home Loan' ? 'tag-loan' : 'tag-own'}`}>
                            {getSourceLabel(p)}
                          </span>
                        </td>
                        <td>{p.paymentMethod}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          {formatCurrency(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} style={{ fontWeight: 700 }}>Subtotal Builder</td>
                      <td style={{ textAlign: 'right', fontWeight: 800 }}>
                        {formatCurrency(totalBuilderPayments)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* OTHER CONSTRUCTION PAYMENTS */}
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
              Other Construction Payments ({monthOtherPayments.length})
            </div>
            {monthOtherPayments.length === 0 ? (
              <div className="statement-empty">No other construction payments in this month.</div>
            ) : (
              <div className="table-wrapper-block">
                <table className="statement-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Source</th>
                      <th>Method</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthOtherPayments.map((p) => (
                      <tr key={p._id}>
                        <td>{formatDate(p.date)}</td>
                        <td style={{ fontWeight: 600 }}>{p.description}</td>
                        <td>
                          <span className={`tag ${getSourceLabel(p) === 'Home Loan' ? 'tag-loan' : 'tag-own'}`}>
                            {getSourceLabel(p)}
                          </span>
                        </td>
                        <td>{p.paymentMethod}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          {formatCurrency(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} style={{ fontWeight: 700 }}>Subtotal Other</td>
                      <td style={{ textAlign: 'right', fontWeight: 800 }}>
                        {formatCurrency(totalOtherPayments)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* SIGNATURE / FOOTER */}
        <div className="statement-footer">
          <div className="signature-box">
            <div className="sig-line">Prepared By</div>
            <div className="sig-title">Home Owner</div>
          </div>
          <div className="signature-box">
            <div className="sig-line">Verified By</div>
            <div className="sig-title">Auditor / Contractor</div>
          </div>
        </div>
      </div>
    </div>
  );
}
