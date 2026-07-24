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
      // Check if browser supports notifications on this device/mode
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
      // Some browsers return a promise, others only support a callback
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
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-cyanAccent/5 blur-[100px]"></div>

      <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-xl z-10 border border-slate-205 dark:border-gray-800 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cyanAccent/10 text-cyanAccent mb-4">
            <Shield size={24} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sign in to your account</h2>
          <p className="mt-2 text-xs text-gray-400">
            Or{' '}
            <Link to="/register" className="font-semibold text-cyanAccent hover:underline">
              create a new account
            </Link>
          </p>
        </div>

        {verifiedSuccess && (
          <div className="rounded-md bg-emerald-950/40 border border-emerald-500/50 p-4 text-xs text-emerald-200">
            ✓ Email verified successfully! You can now sign in to your account.
          </div>
        )}

        {notificationMessage && (
          <div className={`rounded-md p-4 text-xs border ${
            notificationMessage.type === 'success' 
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' 
              : 'bg-red-950/40 border-red-500/50 text-red-200'
          }`}>
            {notificationMessage.type === 'success' ? '✓' : '⚠'} {notificationMessage.text}
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-900/30 border border-red-500/50 p-4 text-xs text-red-200">
            {error}
          </div>
        )}


        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="text-xs font-semibold text-gray-400 block mb-1">
                Username or Email
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded p-3 text-xs glass-input"
                placeholder="Enter username"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="text-xs font-semibold text-gray-400">
                  Password
                </label>
                <Link
                  to="/reset-password"
                  className="text-[10px] font-semibold text-cyanAccent hover:underline"
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
                className="w-full rounded p-3 text-xs glass-input"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-gradient-to-r from-cyanAccent to-emeraldAccent py-3 text-xs font-bold text-black hover:opacity-90 transition shadow shadow-cyanAccent/15 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>

      {/* Notifications Request Modal */}
      {showPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-sm glass-panel p-6 rounded-xl border border-slate-205 dark:border-gray-800 shadow-2xl text-center flex flex-col items-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyanAccent/10 text-cyanAccent mb-4">
              <Bell size={28} className="animate-bounce" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Enable Notifications</h3>
            <p className="mt-2 text-xs text-gray-400 leading-relaxed">
              Allow notifications to receive real-time alerts whenever a deposit, withdrawal, or daily credit occurs on your account.
            </p>
            <div className="mt-6 flex flex-col gap-3 w-full">
              <button
                onClick={handleAllowNotifications}
                className="w-full py-2.5 bg-gradient-to-r from-cyanAccent to-emeraldAccent text-black text-xs font-bold rounded shadow hover:opacity-90 transition"
              >
                Allow Notifications
              </button>
              <button
                onClick={() => setShowPromo(false)}
                className="w-full py-2.5 border border-slate-350 dark:border-gray-700 text-slate-700 dark:text-white text-xs font-semibold rounded hover:bg-slate-100 dark:hover:bg-gray-800/45 transition"
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
