import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import useStore from './context/store';

import Layout         from './components/layout/Layout';
import LoginPage      from './pages/LoginPage';
import DashboardPage  from './pages/DashboardPage';
import CompaniesPage  from './pages/CompaniesPage';
import ContactsPage   from './pages/ContactsPage';
import SendPage       from './pages/SendPage';
import HistoryPage    from './pages/HistoryPage';
import OptOutsPage    from './pages/OptOutsPage'; // ✅ NEW

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000, refetchOnWindowFocus: false } },
});

const Protected = ({ children }) => {
  const { isAuthenticated } = useStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default function App() {
  const { theme, isAuthenticated } = useStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          duration: 4000,
          style: { background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '12px' },
        }} />
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />

          <Route path="/" element={<Protected><Layout /></Protected>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"  element={<DashboardPage />} />
            <Route path="companies"  element={<CompaniesPage />} />
            <Route path="contacts"   element={<ContactsPage />} />
            <Route path="send"       element={<SendPage />} />
            <Route path="history"    element={<HistoryPage />} />
            <Route path="opt-outs"   element={<OptOutsPage />} /> {/* ✅ NEW */}
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}