import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Menu, X, Bell, User, LogOut, ShieldAlert, Sun, Moon } from 'lucide-react';
import api from '../api/api';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('notifications/');
      setNotifications(res.data.filter(n => !n.is_read));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('notifications/mark-all-read/');
      setNotifications([]);
      setNotifDropdownOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-slate-200/80 dark:border-gray-850 bg-white/85 dark:bg-[#0b0f19]/80 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-700 text-white shadow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12c5 0 4-8 10-8 0 3 6 3 6 8s-6 5-6 8c-6 0-5-8-10-8Z" fill="currentColor" />
                </svg>
              </div>
              <span className="font-semibold text-lg tracking-tight text-slate-900 dark:text-white">
                PrimeVolt
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                isActive('/') ? 'text-cyanAccent' : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Home
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/dashboard') ? 'text-cyanAccent' : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/invest"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/invest') ? 'text-cyanAccent' : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Invest
                </Link>
                <Link
                  to="/wallets"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/wallets') ? 'text-cyanAccent' : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Wallets
                </Link>
                <Link
                  to="/kyc"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/kyc') ? 'text-cyanAccent' : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  KYC
                </Link>
                <Link
                  to="/support"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/support') ? 'text-cyanAccent' : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Support
                </Link>
                <Link
                  to="/referrals"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/referrals') ? 'text-cyanAccent' : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Referrals
                </Link>
              </>
            ) : null}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800/40 transition"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {/* Notification Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                    className="relative rounded-full p-2 text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800/40 transition"
                  >
                    <Bell size={20} />
                    {notifications.length > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyanAccent text-[9px] font-bold text-slate-950">
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-md border border-slate-200 dark:border-gray-850 bg-white dark:bg-[#111827] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="p-4 border-b border-slate-200 dark:border-gray-850 flex justify-between items-center">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</span>
                        {notifications.length > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-xs text-cyanAccent hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-60 overflow-y-auto p-2 space-y-2">
                        {notifications.length === 0 ? (
                          <div className="text-center text-xs text-slate-400 dark:text-gray-500 py-6">No new alerts</div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded transition text-left">
                              <p className="text-xs font-semibold text-slate-900 dark:text-white">{n.title}</p>
                              <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-1">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* VIP badge & Profile button */}
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-goldAccent to-yellow-600 text-black shadow">
                    {user?.vip_level_details?.name || 'VIP 1'}
                  </span>
                  <Link to="/profile" className="flex items-center space-x-2 text-slate-650 hover:text-slate-950 dark:text-gray-300 dark:hover:text-white transition">
                    {user?.profile_picture ? (
                      <img src={user.profile_picture} alt="Avatar" className="h-6 w-6 rounded-full object-cover border border-cyanAccent/50" />
                    ) : (
                      <User size={18} />
                    )}
                    <span className="text-xs font-medium max-w-[100px] truncate">{user?.username}</span>
                  </Link>
                </div>

                <button
                  onClick={handleLogout}
                  className="rounded-full p-2 text-slate-400 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-gray-800 transition"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-gray-300 dark:hover:text-white transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-gradient-to-r from-cyanAccent to-emeraldAccent px-4 py-2 text-sm font-semibold text-black hover:opacity-90 transition shadow-lg shadow-cyanAccent/10"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800/40"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {isAuthenticated && (
              <button
                onClick={() => navigate('/profile')}
                className="rounded-full p-1 text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white flex items-center"
              >
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt="Avatar" className="h-7 w-7 rounded-full object-cover border border-cyanAccent/50" />
                ) : (
                  <User size={20} />
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-md p-2 text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 focus:outline-none transition"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-gray-850 bg-white dark:bg-[#0b0f19] px-2 py-4 space-y-1">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-650 hover:text-slate-900 dark:text-gray-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800"
          >
            Home
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-650 hover:text-slate-900 dark:text-gray-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800"
              >
                Dashboard
              </Link>
              <Link
                to="/invest"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-650 hover:text-slate-900 dark:text-gray-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800"
              >
                Invest
              </Link>
              <Link
                to="/wallets"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-650 hover:text-slate-900 dark:text-gray-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800"
              >
                Wallets
              </Link>
              <Link
                to="/kyc"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-650 hover:text-slate-900 dark:text-gray-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800"
              >
                KYC
              </Link>
              <Link
                to="/support"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-650 hover:text-slate-900 dark:text-gray-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800"
              >
                Support
              </Link>
              <Link
                to="/referrals"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-650 hover:text-slate-900 dark:text-gray-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800"
              >
                Referrals
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-slate-100 dark:hover:bg-gray-800"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div className="pt-4 border-t border-slate-200 dark:border-gray-850 flex flex-col space-y-2 px-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 rounded border border-slate-300 dark:border-gray-700 text-sm font-medium text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-gray-800"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 rounded bg-gradient-to-r from-cyanAccent to-emeraldAccent text-sm font-semibold text-black"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
