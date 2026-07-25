import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Shield, Bell } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (new URLSearchParams(location.search).get('verify_success') === 'true') {
      setVerifiedSuccess(true);
      const supportsNotifications = 
        'Notification' in window && 
        (!/iPhone|iPad|iPod/.test(navigator.userAgent) || window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches);
      
      if (supportsNotifications) {
        setShowPromo(true);
      }
    }
  }, [location]);

  const handleAllowNotifications = async () => {
    setShowPromo(false);
    if (!('Notification' in window)) {
      setNotificationMessage({ type: 'error', text: 'This browser does not support notifications.' });
      return;
    }
    
    try {
      let permission;
      const result = Notification.requestPermission();
      if (result && typeof result.then === 'function') {
        permission = await result;
      } else {
        permission = await new Promise((resolve) => {
          Notification.requestPermission(resolve);
        });
      }

      if (permission === 'granted') {
        setNotificationMessage({ type: 'success', text: 'Notifications enabled successfully!' });
        try {
          new Notification("PrimeVolt", {
            body: "Notifications enabled! You will receive credit and debit alerts here.",
          });
        } catch (e) {
          console.warn("Notification instantiation failed", e);
        }
      } else {
        setNotificationMessage({ type: 'error', text: 'Notification permission denied.' });
      }
    } catch (err) {
      console.error(err);
      setNotificationMessage({ type: 'error', text: 'Failed to enable notifications.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(username, password);
    setLoading(false);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-transparent px-4 py-12 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-[#2F80ED]/10 blur-[100px]"></div>

      <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-2xl z-10 border border-[#2F80ED]/20 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#0A3D91] to-[#2F80ED] text-white mb-4 shadow-md shadow-[#0A3D91]/20">
            <Shield size={24} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sign in to your account</h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-gray-400">
            Or{' '}
            <Link to="/register" className="font-semibold text-[#2F80ED] dark:text-[#56CCF2] hover:underline">
              create a new account
            </Link>
          </p>
        </div>

        {verifiedSuccess && (
          <div className="rounded-xl bg-[#27AE60]/15 border border-[#27AE60]/40 p-4 text-xs text-[#27AE60]">
            ✓ Account verified successfully! You can now sign in to your account.
          </div>
        )}

        {notificationMessage && (
          <div className={`rounded-xl p-4 text-xs border ${
            notificationMessage.type === 'success' 
              ? 'bg-[#27AE60]/15 border-[#27AE60]/40 text-[#27AE60]' 
              : 'bg-[#EB5757]/15 border-[#EB5757]/40 text-[#EB5757]'
          }`}>
            {notificationMessage.type === 'success' ? '✓' : '⚠'} {notificationMessage.text}
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-[#EB5757]/15 border border-[#EB5757]/40 p-4 text-xs text-[#EB5757] break-words">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="text-xs font-semibold text-slate-600 dark:text-gray-400 block mb-1">
                Username or Email
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl p-3 text-xs glass-input"
                placeholder="Enter username"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="text-xs font-semibold text-slate-600 dark:text-gray-400">
                  Password
                </label>
                <Link
                  to="/reset-password"
                  className="text-[10px] font-semibold text-[#2F80ED] dark:text-[#56CCF2] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl p-3 text-xs glass-input"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#0A3D91] via-[#2F80ED] to-[#56CCF2] py-3.5 text-xs font-bold text-white hover:opacity-95 transition shadow-md shadow-[#0A3D91]/20 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>

      {showPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm glass-panel p-6 rounded-2xl border border-[#2F80ED]/20 shadow-2xl text-center flex flex-col items-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#2F80ED]/10 text-[#2F80ED] mb-4">
              <Bell size={28} className="animate-bounce" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Enable Notifications</h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
              Allow notifications to receive real-time alerts whenever a deposit, withdrawal, or daily credit occurs on your account.
            </p>
            <div className="mt-6 flex flex-col gap-3 w-full">
              <button
                onClick={handleAllowNotifications}
                className="w-full py-2.5 bg-gradient-to-r from-[#0A3D91] via-[#2F80ED] to-[#56CCF2] text-white text-xs font-bold rounded-xl shadow hover:opacity-95 transition"
              >
                Allow Notifications
              </button>
              <button
                onClick={() => setShowPromo(false)}
                className="w-full py-2.5 border border-slate-300 dark:border-gray-700 text-slate-700 dark:text-white text-xs font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800/45 transition"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
