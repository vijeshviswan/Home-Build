import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X, Calendar, Filter, FileText } from 'lucide-react';
import PaymentCard from '../components/PaymentCard';
import { formatCurrency } from '../utils/formatters';

export default function SearchPage({ payments, onSelectPayment }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // Client-side filtering for instantaneous mobile responsiveness
  const filteredPayments = payments.filter((payment) => {
    // 1. Category filter
    if (categoryFilter !== 'All' && payment.category !== categoryFilter) {
      return false;
    }

    // 2. Search query in description
    if (searchTerm.trim() !== '') {
      const query = searchTerm.toLowerCase();
      const descMatch = (payment.description || '').toLowerCase().includes(query);
      const methodMatch = (payment.paymentMethod || '').toLowerCase().includes(query);
      if (!descMatch && !methodMatch) {
        return false;
      }
    }

    // 3. Date filter
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
            placeholder="Search payments by description..."
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

        {/* FILTERS ROW */}
        <div className="filter-row">
          <div>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>
              Category
            </label>
            <select
              className="form-select"
              style={{ padding: '9px 10px', fontSize: '0.85rem' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              id="filter-category"
            >
              <option value="All">All Categories</option>
              <option value="Own Cash">Own Cash</option>
              <option value="Loan Cash">Loan Cash</option>
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>
                Date
              </label>
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.72rem', cursor: 'pointer' }}
                >
                  Clear
                </button>
              )}
            </div>
            <input
              type="date"
              className="form-input"
              style={{ padding: '8px 10px', fontSize: '0.85rem' }}
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
