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
                  <Route
                    index
                    element={
                      <PlaceholderPage
                        title="Customer Dashboard"
                        subtitle="View and manage your active shipments and delivery status."
                        roleTag="Customer Portal"
                      />
                    }
                  />
                  <Route
                    path="new"
                    element={
                      <PlaceholderPage
                        title="Create Shipment Order"
                        subtitle="4-Step shipment wizard: addresses, parcel specifications, business details, review & pay."
                        roleTag="Customer Portal"
                      />
                    }
                  />
                  <Route
                    path="orders/:id"
                    element={
                      <PlaceholderPage
                        title="Order Details & Timeline"
                        subtitle="Waybill header, lifecycle milestone stepper, and immutable audit timeline."
                        roleTag="Customer Portal"
                      />
                    }
                  />
                  <Route
                    path="reschedule"
                    element={
                      <PlaceholderPage
                        title="Reschedule Failed Delivery"
                        subtitle="Select a new future delivery window for failed deliveries."
                        roleTag="Customer Portal"
                      />
                    }
                  />
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
                  <Route
                    index
                    element={
                      <PlaceholderPage
                        title="Agent Delivery Task Queue"
                        subtitle="View assigned deliveries and pending doorsteps."
                        roleTag="Agent Console"
                      />
                    }
                  />
                  <Route
                    path="orders/:id"
                    element={
                      <PlaceholderPage
                        title="Delivery Action & Handover"
                        subtitle="Advance status milestones and verify customer doorstep code."
                        roleTag="Agent Console"
                      />
                    }
                  />
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
                  <Route
                    index
                    element={
                      <PlaceholderPage
                        title="Operations Overview"
                        subtitle="Live metrics, unassigned orders, and fleet overview."
                        roleTag="Admin Console"
                      />
                    }
                  />
                  <Route
                    path="orders"
                    element={
                      <PlaceholderPage
                        title="All Shipments Table"
                        subtitle="Search, filter, and inspect all orders across Delhi NCR."
                        roleTag="Admin Console"
                      />
                    }
                  />
                  <Route
                    path="dispatch"
                    element={
                      <PlaceholderPage
                        title="Manual Dispatch Queue"
                        subtitle="Manage unassigned orders and manual intervention queues."
                        roleTag="Admin Console"
                      />
                    }
                  />
                  <Route
                    path="agents"
                    element={
                      <PlaceholderPage
                        title="Fleet & Agent Management"
                        subtitle="Monitor agent loads, assign zones, and onboard new drivers."
                        roleTag="Admin Console"
                      />
                    }
                  />
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
