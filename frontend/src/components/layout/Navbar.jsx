import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../auth/AuthContext.jsx';
import { authApi } from '../../api/auth.api.js';
import { useToast } from '../ui/Toast.jsx';
import { Button } from '../ui/Button.jsx';
import { getErrorMessage } from '../../lib/errors.js';
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
  Layers,
  Users,
  Compass,
  Tag,
  Power,
} from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isTogglingDuty, setIsTogglingDuty] = useState(false);
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

    if (user?.role === 'ADMIN') {
      navigate(`/admin/orders?search=${encodeURIComponent(query)}`);
    } else if (user?.role === 'AGENT') {
      navigate(`/agent?search=${encodeURIComponent(query)}`);
    } else {
      navigate(`/app?search=${encodeURIComponent(query)}`);
    }
    setSearchQuery('');
    setIsMobileSearchOpen(false);
  };

  // Agent self-duty availability toggle
  const handleToggleAgentDuty = async () => {
    if (user?.role !== 'AGENT') return;
    setIsTogglingDuty(true);
    const targetState = !(user?.isAvailable !== false);
    try {
      await authApi.updateMyAvailability(targetState);
      updateUser({ isAvailable: targetState });
      toast.success(
        `You are now ${targetState ? 'ONLINE & AVAILABLE for dispatches' : 'OFF-DUTY'}.`
      );
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update duty status.'));
    } finally {
      setIsTogglingDuty(false);
    }
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

  // Sub-navigation tabs (Only displayed for ADMIN role)
  const getAdminNavTabs = () => {
    if (!isAuthenticated || user?.role !== 'ADMIN') return [];

    return [
      { label: 'Overview', path: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: 'All Shipments', path: '/admin/orders', icon: <Layers className="w-4 h-4" /> },
      { label: 'Dispatch Queue', path: '/admin/dispatch', icon: <Compass className="w-4 h-4" /> },
      { label: 'Agents & Fleet', path: '/admin/agents', icon: <Users className="w-4 h-4" /> },
      { label: 'Rate Cards', path: '/admin/rates', icon: <Tag className="w-4 h-4" /> },
      { label: 'Create Shipment', path: '/app/new', icon: <PlusCircle className="w-4 h-4" /> },
    ];
  };

  const adminNavTabs = getAdminNavTabs();
  const showAdminSubNav = isAuthenticated && user?.role === 'ADMIN' && adminNavTabs.length > 0;

  // Helper to check active tab state
  const isTabActive = (tabPath) => {
    if (tabPath === '/admin') {
      return location.pathname === tabPath;
    }
    return location.pathname === tabPath || location.pathname.startsWith(tabPath + '/');
  };

  return (
    <header className="bg-container-lowest hairline border-t-0 border-x-0 sticky top-0 z-40 transition-colors">
      {/* Tier 1: Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded bg-primary text-on-primary flex items-center justify-center transition-transform group-hover:scale-105">
              <Truck className="w-4 h-4 stroke-[2]" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-ink">
              Dispatch<span className="text-accent">Pro</span>
            </span>
          </Link>
        </div>

        {/* Center: Quick Tracking Search (When Logged In) */}
        {isAuthenticated ? (
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-variant/50 pointer-events-none" />
              <input
                type="text"
                placeholder="Search tracking ID (e.g. ORD-1724508920123)..."
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
              {/* Mobile Search Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                className="md:hidden p-2 rounded-full hover:bg-container-low text-ink-variant hover:text-ink transition-colors cursor-pointer"
                title="Search shipments"
                aria-label="Toggle search bar"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Agent Duty Toggle in Header */}
              {user?.role === 'AGENT' && (
                <button
                  type="button"
                  onClick={handleToggleAgentDuty}
                  disabled={isTogglingDuty}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hairline text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    user?.isAvailable !== false
                      ? 'bg-success-soft border-success/40 text-success hover:bg-success-soft/80'
                      : 'bg-container-high border-hairline text-ink-variant hover:bg-container-high/70'
                  }`}
                  title="Click to toggle your duty availability"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      user?.isAvailable !== false ? 'bg-success animate-pulse' : 'bg-ink-variant/50'
                    }`}
                  />
                  <span>{user?.isAvailable !== false ? 'Available' : 'Off-Duty'}</span>
                  <Power className="w-3 h-3 ml-0.5 opacity-60" />
                </button>
              )}

              {/* Admin Create Shipment Quick CTA */}
              {user?.role === 'ADMIN' && (
                <Link to="/app/new" className="hidden sm:inline-flex">
                  <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-3.5 h-3.5" />}>
                    Create Shipment
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
                      </div>
                    </div>

                    {/* Agent Duty Toggle in dropdown */}
                    {user?.role === 'AGENT' && (
                      <div className="p-2 border-b border-hairline">
                        <button
                          onClick={() => {
                            handleToggleAgentDuty();
                            setIsProfileOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs rounded hover:bg-container-low transition-colors cursor-pointer"
                        >
                          <span className="text-ink font-medium">Duty Status</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              user?.isAvailable !== false
                                ? 'bg-success-soft text-success'
                                : 'bg-container-high text-ink-variant'
                            }`}
                          >
                            {user?.isAvailable !== false ? 'Available' : 'Off-Duty'}
                          </span>
                        </button>
                      </div>
                    )}

                    {/* Logout Option */}
                    <div className="p-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger-soft rounded transition-colors cursor-pointer"
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
            /* Unauthenticated Visitor Options */
            <div className="flex items-center gap-2">
              <Link to="/quote">
                <Button variant="secondary" size="sm" leftIcon={<Calculator className="w-3.5 h-3.5" />}>
                  Rate Calculator
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="primary" size="sm">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Expandable Bar */}
      {isAuthenticated && isMobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-hairline bg-surface animate-in fade-in slide-in-from-top-1">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-variant/50 pointer-events-none" />
            <input
              type="text"
              autoFocus
              placeholder="Search tracking ID, address, or pincode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-container-lowest text-xs text-ink placeholder:text-ink-variant/50 rounded-lg pl-9 pr-4 py-2.5 hairline focus:outline-none focus:border-primary shadow-xs transition-all"
            />
          </form>
        </div>
      )}

      {/* Tier 2: Only Rendered for ADMIN Console */}
      {showAdminSubNav && (
        <div className="bg-surface hairline border-t border-b-0 border-x-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
              {adminNavTabs.map((tab) => {
                const active = isTabActive(tab.path);
                return (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
                      active
                        ? 'bg-container-lowest text-ink hairline shadow-xs font-bold'
                        : 'text-ink-variant hover:text-ink hover:bg-container-low'
                    }`}
                  >
                    <span className={active ? 'text-primary' : 'text-ink-variant/70'}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
