import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import TotalCostPage from './pages/TotalCostPage';
import LoanPage from './pages/LoanPage';
import CashSourcePage from './pages/CashSourcePage';
import PrintPage from './pages/PrintPage';
import NewPayment from './pages/NewPayment';
import SearchPage from './pages/SearchPage';
import BuilderPage from './pages/BuilderPage';
import PaymentDetailsModal from './components/PaymentDetailsModal';
import SettingsModal from './components/SettingsModal';
import PinScreen from './components/PinScreen';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [builderData, setBuilderData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [cashSources, setCashSources] = useState([]);
  const [totalCashReceived, setTotalCashReceived] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modals & Navigation state
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [defaultIsBuilderForNew, setDefaultIsBuilderForNew] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3200);
  };

  const loadData = useCallback(async () => {
    try {
      const [dashRes, paymentsRes, builderRes, settingsRes, cashRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/payments'),
        fetch('/api/builder'),
        fetch('/api/settings'),
        fetch('/api/cash-sources')
      ]);

      if (dashRes.ok) {
        const data = await dashRes.json();
        setDashboardData(data);
      }
      if (paymentsRes.ok) {
        const pData = await paymentsRes.json();
        setPayments(pData);
      }
      if (builderRes.ok) {
        const bData = await builderRes.json();
        setBuilderData(bData);
      }
      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        setSettings(sData);
      }
      if (cashRes.ok) {
        const cData = await cashRes.json();
        setCashSources(cData.cashSources || []);
        setTotalCashReceived(cData.totalCashReceived || 0);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (tab) => {
    if (tab === 'new-payment') {
      setDefaultIsBuilderForNew(false);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBuilderNewPayment = () => {
    setDefaultIsBuilderForNew(true);
    setActiveTab('new-payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreatePayment = async (formData) => {
    const res = await fetch('/api/payments', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to save payment');
    }

    await loadData();
    showToast('Payment saved successfully!');
    setActiveTab('total-cost');
  };

  const handleDeletePayment = async (paymentId) => {
    const res = await fetch(`/api/payments/${paymentId}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      throw new Error('Failed to delete payment');
    }

    await loadData();
    showToast('Payment deleted successfully');
  };

  const handleAddCashSource = async (entryData) => {
    const res = await fetch('/api/cash-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entryData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save cash source');
    }

    await loadData();
    showToast('Cash source saved successfully!');
  };

  const handleDeleteCashSource = async (id) => {
    const res = await fetch(`/api/cash-sources/${id}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      throw new Error('Failed to delete cash source');
    }

    await loadData();
    showToast('Cash source deleted');
  };

  const handleSaveSettings = async (newSettings) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });

    if (!res.ok) {
      throw new Error('Failed to save settings');
    }

    await loadData();
    showToast('Settings updated successfully');
  };

  // Header Titles
  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'House Finance',
          subtitle: 'Personal Construction Tracker',
          showBack: false
        };
      case 'total-cost':
      case 'payments':
        return {
          title: 'Total Cost',
          subtitle: 'Payment & Budget Summary',
          showBack: true
        };
      case 'home-loan':
        return {
          title: 'Home Loan',
          subtitle: 'Loan Details & Disbursements',
          showBack: true
        };
      case 'builder':
        return {
          title: 'Builder Details',
          subtitle: builderData?.builderName || 'Contractor',
          showBack: true
        };
      case 'cash-sources':
        return {
          title: 'Source of Cash',
          subtitle: 'Track borrowed & external funds',
          showBack: true
        };
      case 'search':
        return {
          title: 'Search',
          subtitle: 'Filter payments by date & category',
          showBack: true
        };
      case 'print':
        return {
          title: 'Print Statement',
          subtitle: 'Monthly Construction Report',
          showBack: true
        };
      case 'new-payment':
        return {
          title: 'New Payment',
          subtitle: 'Record an expense or advance',
          showBack: true
        };
      default:
        return { title: 'Construction Finance', subtitle: '', showBack: false };
    }
  };

  const headerInfo = getHeaderInfo();

  if (!isAuthenticated) {
    return (
      <div className="app-container">
        <PinScreen onUnlock={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* HEADER */}
      <Header
        title={headerInfo.title}
        subtitle={headerInfo.subtitle}
        showBack={headerInfo.showBack}
        onBack={() => handleTabChange('dashboard')}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* TOAST BANNER */}
      {toastMessage && (
        <div className="toast-banner no-print">
          <CheckCircle2 size={18} color="#22c55e" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN VIEW */}
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <Dashboard 
            onNavigate={handleTabChange}
            dashboardData={dashboardData}
            builderData={builderData}
            totalCashReceived={totalCashReceived}
            payments={payments}
          />
        )}

        {(activeTab === 'total-cost' || activeTab === 'payments') && (
          <TotalCostPage
            dashboardData={dashboardData}
            payments={payments}
            onSelectPayment={setSelectedPayment}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onNavigateNewPayment={() => handleTabChange('new-payment')}
          />
        )}

        {activeTab === 'home-loan' && (
          <LoanPage
            dashboardData={dashboardData}
            payments={payments}
            onSelectPayment={setSelectedPayment}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onNavigateNewPayment={() => handleTabChange('new-payment')}
          />
        )}

        {activeTab === 'builder' && (
          <BuilderPage
            builderData={builderData}
            onAddBuilderPayment={handleOpenBuilderNewPayment}
            onSelectPayment={setSelectedPayment}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {activeTab === 'cash-sources' && (
          <CashSourcePage
            cashSources={cashSources}
            totalCashReceived={totalCashReceived}
            onAddCashSource={handleAddCashSource}
            onDeleteCashSource={handleDeleteCashSource}
          />
        )}

        {activeTab === 'search' && (
          <SearchPage
            payments={payments}
            onSelectPayment={setSelectedPayment}
          />
        )}

        {activeTab === 'print' && (
          <PrintPage
            payments={payments}
            cashSources={cashSources}
            dashboardData={dashboardData}
          />
        )}

        {activeTab === 'new-payment' && (
          <NewPayment
            onSubmitPayment={handleCreatePayment}
            onCancel={() => handleTabChange('dashboard')}
            defaultIsBuilder={defaultIsBuilderForNew}
          />
        )}
      </main>

      {/* BOTTOM NAVIGATION */}
      <BottomNav
        activeTab={activeTab === 'total-cost' ? 'payments' : activeTab}
        onTabChange={handleTabChange}
      />

      {/* MODALS */}
      {selectedPayment && (
        <PaymentDetailsModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onDelete={handleDeletePayment}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
