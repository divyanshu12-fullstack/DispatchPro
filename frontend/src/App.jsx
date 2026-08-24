import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext.jsx';
import { RequireRole, RedirectIfAuthed } from './auth/guards.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';

import { LandingPage } from './features/public/LandingPage.jsx';
import { LoginPage } from './features/public/LoginPage.jsx';
import { RegisterPage } from './features/public/RegisterPage.jsx';
import { VerifyPage } from './features/public/VerifyPage.jsx';
import { QuoteCalculatorPage } from './features/public/QuoteCalculatorPage.jsx';

import { CustomerDashboardPage } from './features/customer/CustomerDashboardPage.jsx';
import { CreateOrderWizardPage } from './features/customer/CreateOrderWizardPage.jsx';
import { OrderDetailPage } from './features/customer/OrderDetailPage.jsx';
import { ReschedulePage } from './features/customer/ReschedulePage.jsx';

import { AgentDashboardPage } from './features/agent/AgentDashboardPage.jsx';
import { AgentOrderDetailPage } from './features/agent/AgentOrderDetailPage.jsx';

import { AdminOverviewPage } from './features/admin/AdminOverviewPage.jsx';
import { AdminOrdersPage } from './features/admin/AdminOrdersPage.jsx';
import { AdminDispatchPage } from './features/admin/AdminDispatchPage.jsx';
import { AdminAgentsPage } from './features/admin/AdminAgentsPage.jsx';
import { AdminRatesPage } from './features/admin/AdminRatesPage.jsx';

import { Navbar } from './components/layout/Navbar.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

function Layout() {
  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans selection:bg-primary selection:text-on-primary">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}

// Temporary Placeholder Shell
function PlaceholderPage({ title, subtitle, roleTag }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 w-full flex flex-col items-center justify-center text-center">
      {roleTag && (
        <div className="label-caps text-[10px] bg-container-high text-ink px-2 py-0.5 rounded mb-3">
          {roleTag}
        </div>
      )}
      <h1 className="font-display text-3xl font-bold text-ink mb-2">{title}</h1>
      <p className="text-sm text-ink-variant max-w-md mb-6">{subtitle}</p>
      <div className="p-8 bg-container-lowest hairline rounded-lg shadow-card max-w-md w-full">
        <p className="text-xs text-ink-variant font-mono">
          Phase 1 Scaffold verified. Ready for feature build.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes with Main Layout */}
              <Route element={<Layout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/quote" element={<QuoteCalculatorPage />} />

                {/* Auth Pages (Redirect if already logged in) */}
                <Route
                  path="/login"
                  element={
                    <RedirectIfAuthed>
                      <LoginPage />
                    </RedirectIfAuthed>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <RedirectIfAuthed>
                      <RegisterPage />
                    </RedirectIfAuthed>
                  }
                />
                <Route path="/verify" element={<VerifyPage />} />

                {/* Customer Routes */}
                <Route
                  path="/app"
                  element={
                    <RequireRole roles={['CUSTOMER', 'ADMIN']}>
                      <Outlet />
                    </RequireRole>
                  }
                >
                  <Route index element={<CustomerDashboardPage />} />
                  <Route path="new" element={<CreateOrderWizardPage />} />
                  <Route path="orders/:id" element={<OrderDetailPage />} />
                  <Route path="reschedule" element={<ReschedulePage />} />
                </Route>

                {/* Agent Mobile Routes */}
                <Route
                  path="/agent"
                  element={
                    <RequireRole roles={['AGENT']}>
                      <Outlet />
                    </RequireRole>
                  }
                >
                  <Route index element={<AgentDashboardPage />} />
                  <Route path="orders/:id" element={<AgentOrderDetailPage />} />
                </Route>

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <RequireRole roles={['ADMIN']}>
                      <Outlet />
                    </RequireRole>
                  }
                >
                  <Route index element={<AdminOverviewPage />} />
                  <Route path="orders" element={<AdminOrdersPage />} />
                  <Route path="dispatch" element={<AdminDispatchPage />} />
                  <Route path="agents" element={<AdminAgentsPage />} />
                  <Route path="rates" element={<AdminRatesPage />} />
                </Route>

                {/* 404 Route */}
                <Route
                  path="*"
                  element={
                    <PlaceholderPage
                      title="Page Not Found"
                      subtitle="The requested route does not exist."
                    />
                  }
                />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
