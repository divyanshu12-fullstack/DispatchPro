import React from 'react';
import { Navigate, useLocation, Link } from 'react-router';
import { useAuth } from './AuthContext.jsx';
import { ROLE_HOME_MAP } from '../lib/constants.js';
import { ShieldAlert } from 'lucide-react';

/**
 * Guard that requires an active authenticated session.
 */
export function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="label-caps text-ink-variant">Authenticating...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

/**
 * Guard that requires a specific user role.
 * @param {{ roles: string[], children: React.ReactNode }} props
 */
export function RequireRole({ roles, children }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="label-caps text-ink-variant">Verifying access...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!roles.includes(user?.role)) {
    const homePath = ROLE_HOME_MAP[user?.role] || '/';
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-container-lowest hairline rounded-lg p-8 shadow-card text-center">
          <div className="w-12 h-12 rounded-full bg-danger-soft text-danger flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">Access Restricted</h2>
          <p className="text-sm text-ink-variant mb-6 leading-relaxed">
            Your account ({user?.role}) does not have permission to view this section.
          </p>
          <Link
            to={homePath}
            className="inline-flex items-center justify-center px-4 py-2 bg-primary text-on-primary rounded text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return children;
}

/**
 * Guard for public auth pages (login/register) to redirect already logged-in users.
 */
export function RedirectIfAuthed({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated && user?.role) {
    const homePath = ROLE_HOME_MAP[user.role] || '/app';
    return <Navigate to={homePath} replace />;
  }

  return children;
}
