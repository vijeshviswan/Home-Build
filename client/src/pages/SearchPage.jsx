import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X, Calendar, Filter, FileText } from 'lucide-react';
import PaymentCard from '../components/PaymentCard';
import { formatCurrency } from '../utils/formatters';
import { EXPENSE_CATEGORIES } from '../utils/categories';

export default function SearchPage({ payments, onSelectPayment }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // Client-side filtering for instantaneous mobile responsiveness
  const filteredPayments = payments.filter((payment) => {
    // 1. Expense Category filter
    const cat = payment.expenseCategory || (payment.isBuilderPayment ? 'Builder / Contractor' : 'Others');
    if (categoryFilter !== 'All' && cat !== categoryFilter) {
      return false;
    }

    // 2. Payment Source filter
    const src = payment.paymentSource || (payment.category === 'Loan Cash' ? 'Home Loan' : payment.category) || 'Own Cash';
    if (sourceFilter !== 'All' && src !== sourceFilter) {
      return false;
    }

    // 3. Search query in description or method
    if (searchTerm.trim() !== '') {
      const query = searchTerm.toLowerCase();
      const descMatch = (payment.description || '').toLowerCase().includes(query);
      const methodMatch = (payment.paymentMethod || '').toLowerCase().includes(query);
      const catMatch = cat.toLowerCase().includes(query);
      if (!descMatch && !methodMatch && !catMatch) {
        return false;
      }
    }

    // 4. Date filter
    if (dateFilter) {
      const pDate = new Date(payment.date);
      const selDate = new Date(dateFilter);
      const sameDay =
        pDate.getFullYear() === selDate.getFullYear() &&
        pDate.getMonth() === selDate.getMonth() &&
        pDate.getDate() === selDate.getDate();
      if (!sameDay) return false;
    }

    return true;
  });

  const totalFilteredAmount = filteredPayments.reduce(
    (acc, curr) => acc + (curr.amount || 0),
    0
  );

  return (
    <div>
      {/* SEARCH CONTROLS */}
      <div className="search-controls">
        {/* TEXT SEARCH */}
        <div className="search-input-wrapper">
          <SearchIcon size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by description or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="search-input-box"
          />
          {searchTerm && (
            <button
              className="icon-btn"
              style={{ position: 'absolute', right: '6px' }}
              onClick={() => setSearchTerm('')}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* FILTERS ROW 1: CATEGORY & SOURCE */}
        <div className="filter-row" style={{ marginBottom: '8px' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>
              Expense Category
            </label>
            <select
              className="form-select"
              style={{ padding: '10px 12px' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              id="filter-category"
            >
              <option value="All">All Categories</option>
              {EXPENSE_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>
              Payment Source
            </label>
            <select
              className="form-select"
              style={{ padding: '10px 12px' }}
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              id="filter-source"
            >
              <option value="All">All Sources</option>
              <option value="Own Cash">Own Cash</option>
              <option value="Home Loan">Home Loan</option>
            </select>
          </div>
        </div>

        {/* FILTERS ROW 2: DATE */}
        <div className="filter-row">
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>
                Filter by Date
              </label>
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Clear Date
                </button>
              )}
            </div>
            <input
              type="date"
              className="form-input"
              style={{ padding: '10px 12px' }}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              id="filter-date"
            />
          </div>
        </div>
      </div>

      {/* FILTER SUMMARY BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 4px 10px', fontSize: '0.82rem', color: '#64748b' }}>
        <span>
          Found <strong>{filteredPayments.length}</strong> {filteredPayments.length === 1 ? 'record' : 'records'}
        </span>
        {filteredPayments.length > 0 && (
          <span>
            Total: <strong style={{ color: '#0f172a' }}>{formatCurrency(totalFilteredAmount)}</strong>
          </span>
        )}
      </div>

      {/* RESULTS LIST */}
      {filteredPayments.length === 0 ? (
        <div className="empty-state">
          <FileText className="empty-state-icon" style={{ margin: '0 auto 8px' }} />
          <div className="empty-state-title">No matching payments found</div>
          <div className="empty-state-desc">Try clearing filters or search terms.</div>
        </div>
      ) : (
        <div>
          {filteredPayments.map((p) => (
            <PaymentCard key={p._id} payment={p} onSelect={onSelectPayment} />
          ))}
        </div>
      )}
    </div>
  );
}
