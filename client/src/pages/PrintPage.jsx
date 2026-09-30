import React, { useState } from 'react';
import { Printer, Calendar, FileText, CheckCircle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
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

  // Calculations
  const totalCashSourcesReceived = monthCashSources.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalMoneyReceived = totalCashSourcesReceived;

  const totalBuilderPayments = monthBuilderPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalOtherPayments = monthOtherPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalPayments = totalBuilderPayments + totalOtherPayments;

  const balanceDifference = totalMoneyReceived - totalPayments;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-page-wrapper">
      {/* CONTROLS BAR (Hidden during print) */}
      <div className="print-controls-bar no-print">
        <div style={{ flex: 1 }}>
          <label className="form-label" htmlFor="select-statement-month" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
            Select Month
          </label>
          <input
            id="select-statement-month"
            type="month"
            className="form-input"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ padding: '9px 12px', fontSize: '0.9rem' }}
          />
        </div>

        <button
          onClick={handlePrint}
          className="btn-submit"
          id="btn-print-report"
          style={{
            flex: 'none',
            width: 'auto',
            padding: '10px 18px',
            fontSize: '0.9rem',
            marginTop: 'auto',
            height: '42px'
          }}
        >
          <Printer size={18} />
          Print
        </button>
      </div>

      {/* PRINTABLE STATEMENT DOCUMENT */}
      <div className="printable-statement" id="printable-area">
        {/* HEADER */}
        <div className="statement-header">
          <div className="statement-title">Monthly Statement</div>
          <div className="statement-month-pill">{monthLabel}</div>
          <div className="statement-meta">
            Generated on: {formatDate(new Date())} • Personal House Construction
          </div>
        </div>

        {/* MONTHLY SUMMARY CARD / TABLE */}
        <div className="statement-section">
          <div className="statement-section-title">Monthly Summary</div>

          <div className="table-wrapper-block">
            <table className="statement-table">
              <tbody>
                <tr>
                  <td className="stat-label">Total Money Received</td>
                  <td className="stat-val" style={{ color: '#059669' }}>
                    {formatCurrency(totalMoneyReceived)}
                  </td>
                </tr>
                <tr>
                  <td className="stat-label">Total Payments</td>
                  <td className="stat-val" style={{ color: '#e11d48' }}>
                    {formatCurrency(totalPayments)}
                  </td>
                </tr>
                <tr>
                  <td className="stat-sublabel" style={{ paddingLeft: '24px' }}>
                    • Builder Payments
                  </td>
                  <td className="stat-subval">
                    {formatCurrency(totalBuilderPayments)}
                  </td>
                </tr>
                <tr>
                  <td className="stat-sublabel" style={{ paddingLeft: '24px' }}>
                    • Other Construction Payments
                  </td>
                  <td className="stat-subval">
                    {formatCurrency(totalOtherPayments)}
                  </td>
                </tr>
                <tr className="stat-highlight-row">
                  <td className="stat-label" style={{ fontWeight: 800 }}>
                    Balance / Difference
                  </td>
                  <td className="stat-val" style={{ fontWeight: 800, color: balanceDifference >= 0 ? '#059669' : '#e11d48' }}>
                    {formatCurrency(balanceDifference)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 1. MONEY RECEIVED */}
        <div className="statement-section">
          <div className="statement-section-title">
            Money Received ({monthCashSources.length})
          </div>

          {monthCashSources.length === 0 ? (
            <div className="statement-empty">No money received recorded for {monthLabel}.</div>
          ) : (
            <div className="table-wrapper-block">
              <table className="statement-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Source</th>
                    <th>Details</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {monthCashSources.map((cs) => (
                    <tr key={cs._id}>
                      <td>{formatDate(cs.date)}</td>
                      <td style={{ fontWeight: 600 }}>{cs.source}</td>
                      <td style={{ color: '#64748b' }}>{cs.details || '-'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                        {formatCurrency(cs.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ fontWeight: 700 }}>Total Received</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                      {formatCurrency(totalMoneyReceived)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* 2. PAYMENTS MADE */}
        <div className="statement-section">
          <div className="statement-section-title">
            Payments Made ({monthPayments.length})
          </div>

          {/* BUILDER PAYMENTS */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
              Builder Payments ({monthBuilderPayments.length})
            </div>
            {monthBuilderPayments.length === 0 ? (
              <div className="statement-empty">No builder payments in this month.</div>
            ) : (

              <div className="table-wrapper-block">
                <table className="statement-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Method</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthBuilderPayments.map((p) => (
                      <tr key={p._id}>
                        <td>{formatDate(p.date)}</td>
                        <td style={{ fontWeight: 600 }}>{p.description}</td>
                        <td>{p.paymentMethod}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          {formatCurrency(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} style={{ fontWeight: 700 }}>Subtotal Builder</td>
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
                      <th>Category</th>
                      <th>Method</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthOtherPayments.map((p) => (
                      <tr key={p._id}>
                        <td>{formatDate(p.date)}</td>
                        <td style={{ fontWeight: 600 }}>{p.description}</td>
                        <td>{p.category}</td>
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

        {/* STATEMENT FOOTER */}
        <div className="statement-footer">
          End of Monthly Statement for {monthLabel} • Generated from Personal Construction Finance App
        </div>
      </div>

      {/* PRINT BUTTON AT BOTTOM TOO (Hidden during print) */}
      <div className="no-print" style={{ marginTop: '16px', textAlign: 'center' }}>
        <button
          onClick={handlePrint}
          className="btn-submit"
          style={{ width: '100%' }}
        >
          <Printer size={20} />
          Print / Save Statement
        </button>
      </div>
    </div>
  );
}
