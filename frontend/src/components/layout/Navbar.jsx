import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../auth/AuthContext.jsx';
import { Button } from '../ui/Button.jsx';
import {
  Truck,
  PlusCircle,
  LayoutDashboard,
  Search,
  LogOut,
  ChevronDown,
  Calculator,
  ShieldCheck,
  AlertCircle,
  Package,
  Layers,
  Users,
  Compass,
  Tag,
} from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Navigate to order search or detail if tracking number provided
    if (user?.role === 'ADMIN') {
      navigate(`/admin/orders?search=${encodeURIComponent(query)}`);
    } else {
      navigate(`/app?search=${encodeURIComponent(query)}`);
    }
    setSearchQuery('');
  };

  // Get user initials for circular avatar
  const getInitials = () => {
    if (!user) return 'U';
    if (user.fullName) {
      const parts = user.fullName.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  // Portal metadata
  const portalLabel =
    user?.role === 'ADMIN'
      ? 'Admin Console'
      : user?.role === 'AGENT'
      ? 'Agent Console'
      : user?.role === 'CUSTOMER'
      ? 'Customer Portal'
      : null;

  // Sub-navigation tabs based on active role
  const getNavTabs = () => {
    if (!isAuthenticated || !user) return [];

    if (user.role === 'CUSTOMER') {
      return [
        { label: 'My Shipments', path: '/app', icon: <Package className="w-4 h-4" /> },
        { label: 'Book Shipment', path: '/app/new', icon: <PlusCircle className="w-4 h-4" /> },
        { label: 'Rate Calculator', path: '/quote', icon: <Calculator className="w-4 h-4" /> },
      ];
    }

    if (user.role === 'AGENT') {
      return [
        { label: 'Assigned Deliveries', path: '/agent', icon: <Truck className="w-4 h-4" /> },
        { label: 'Rate Calculator', path: '/quote', icon: <Calculator className="w-4 h-4" /> },
      ];
    }

    if (user.role === 'ADMIN') {
      return [
        { label: 'Overview', path: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: 'All Shipments', path: '/admin/orders', icon: <Layers className="w-4 h-4" /> },
        { label: 'Dispatch Queue', path: '/admin/dispatch', icon: <Compass className="w-4 h-4" /> },
        { label: 'Agents & Fleet', path: '/admin/agents', icon: <Users className="w-4 h-4" /> },
        { label: 'Rate Cards', path: '/admin/rates', icon: <Tag className="w-4 h-4" /> },
        { label: 'Rate Calculator', path: '/quote', icon: <Calculator className="w-4 h-4" /> },
      ];
    }

    return [];
  };

  const navTabs = getNavTabs();
  const showSubNav = isAuthenticated && navTabs.length > 0;

  // Helper to check active tab state
  const isTabActive = (tabPath) => {
    if (tabPath === '/app' || tabPath === '/admin' || tabPath === '/agent') {
      return location.pathname === tabPath;
    }
    return location.pathname === tabPath || location.pathname.startsWith(tabPath + '/');
  };

  return (
    <header className="bg-container-lowest hairline border-t-0 border-x-0 sticky top-0 z-40 transition-colors">
      {/* Tier 1: Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-4">
        {/* Brand Logo + Portal Tag */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded bg-primary text-on-primary flex items-center justify-center transition-transform group-hover:scale-105">
              <Truck className="w-4 h-4 stroke-[2]" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-ink">
              Dispatch<span className="text-accent">Pro</span>
            </span>
          </Link>

          {portalLabel && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-container-low hairline text-[11px] font-medium text-ink-variant">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span>{portalLabel}</span>
            </div>
          )}
        </div>

        {/* Center: Quick Tracking Search (When Logged In) */}
        {isAuthenticated ? (
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-variant/50 pointer-events-none" />
              <input
                type="text"
                placeholder="Search tracking ID (e.g. LM-2026-000001)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-container-low text-xs text-ink placeholder:text-ink-variant/50 rounded-full pl-9 pr-4 py-2 hairline focus:outline-none focus:bg-container-lowest focus:border-primary transition-all"
              />
            </form>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Right Actions & Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <>
              {/* Customer Quick Action */}
              {user?.role === 'CUSTOMER' && (
                <Link to="/app/new" className="hidden sm:inline-flex">
                  <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-3.5 h-3.5" />}>
                    New Shipment
                  </Button>
                </Link>
              )}

              {/* Profile Dropdown Menu */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2.5 p-1 rounded-full hover:bg-container-low cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-display font-bold text-xs tracking-tight">
                    {getInitials()}
                  </div>

                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-semibold text-ink leading-tight max-w-[130px] truncate">
                      {user?.fullName || user?.email}
                    </span>
                    <span className="text-[10px] text-ink-variant/70 capitalize">
                      {user?.role?.toLowerCase()}
                    </span>
                  </div>

                  <ChevronDown className="w-3.5 h-3.5 text-ink-variant/60 hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-container-lowest hairline rounded-lg shadow-overlay py-2 z-50 animate-in fade-in slide-in-from-top-1">
                    {/* Header info */}
                    <div className="px-4 py-2.5 border-b border-hairline bg-surface">
                      <div className="font-semibold text-xs text-ink truncate">
                        {user?.fullName || 'User'}
                      </div>
                      <div className="text-[11px] text-ink-variant truncate">{user?.email}</div>

                      <div className="mt-2 flex items-center gap-1.5">
                        {user?.isEmailVerified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success bg-success-soft px-1.5 py-0.5 rounded">
                            <ShieldCheck className="w-3 h-3" />
                            Email Verified
                          </span>
                        ) : (
                          <Link
                            to="/verify"
                            onClick={() => setIsProfileOpen(false)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-warning bg-warning-soft px-1.5 py-0.5 rounded hover:underline"
                          >
                            <AlertCircle className="w-3 h-3" />
                            Verify Email
                          </Link>
                        )}
                        <span className="text-[10px] bg-container-high text-ink px-1.5 py-0.5 rounded font-mono">
                          {user?.role}
                        </span>
                      </div>
                    </div>

                    {/* Menu links */}
                    <div className="py-1">
                      <Link
                        to="/quote"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-ink hover:bg-container-low transition-colors"
                      >
                        <Calculator className="w-3.5 h-3.5 text-ink-variant" />
                        <span>Shipping Rate Calculator</span>
                      </Link>

                      {user?.role === 'CUSTOMER' && (
                        <Link
                          to="/app/new"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-ink hover:bg-container-low transition-colors sm:hidden"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-ink-variant" />
                          <span>Book New Shipment</span>
                        </Link>
                      )}
                    </div>

                    {/* Sign out */}
                    <div className="pt-1 border-t border-hairline">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-danger hover:bg-danger-soft/40 transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/quote"
                className="hidden sm:inline-flex text-xs font-semibold text-ink-variant hover:text-ink transition-colors"
              >
                Rate Calculator
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Tier 2: Secondary Sub-Navigation Tab Bar (Authenticated Only) */}
      {showSubNav && (
        <div className="border-t border-hairline bg-surface overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 sm:gap-2">
            {navTabs.map((tab) => {
              const active = isTabActive(tab.path);
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all shrink-0 ${
                    active
                      ? 'border-primary text-ink font-semibold'
                      : 'border-transparent text-ink-variant hover:text-ink hover:border-outline-variant'
                  }`}
                >
                  <span className={active ? 'text-primary' : 'text-ink-variant'}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
