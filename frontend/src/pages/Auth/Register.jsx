import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Register = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone: '',
    referral_code: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refCode = params.get('ref');
    if (refCode) {
      setFormData(prev => ({ ...prev, referral_code: refCode }));
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await register(formData);
    setLoading(false);
    if (res.success) {
      setRegistered(true);
    } else {
      setError(res.error);
    }
  };

  if (registered) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-transparent px-4 py-12 sm:px-6 lg:px-8 relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-emeraldAccent/5 blur-[100px]"></div>

        <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-xl z-10 border border-slate-205 dark:border-gray-800 shadow-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emeraldAccent/10 text-emeraldAccent mb-6">
            <UserPlus size={32} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{t('Registration Successful!')}</h2>
          <p className="text-xs text-gray-400 mt-4 leading-relaxed">
            {t('A verification link has been sent to')} <span className="text-cyanAccent font-semibold">{formData.email}</span>. 
            {t('Please tap the link in the email to activate your account and access your dashboard.')}
          </p>
          <div className="mt-8">
            <Link
              to="/login"
              className="w-full flex items-center justify-center py-3 bg-gradient-to-r from-cyanAccent to-emeraldAccent text-black font-bold text-xs rounded hover:opacity-90 transition shadow shadow-cyanAccent/15"
            >
              {t('Go to Login Page')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-transparent px-4 py-12 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-emeraldAccent/5 blur-[100px]"></div>

      <div className="w-full max-w-md sm:max-w-2xl space-y-8 glass-panel p-6 sm:p-8 rounded-xl z-10 border border-slate-205 dark:border-gray-800 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emeraldAccent/10 text-emeraldAccent mb-4">
            <UserPlus size={24} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{t('Create your investment account')}</h2>
          <p className="mt-2 text-xs text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-cyanAccent hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-900/30 border border-red-500/50 p-4 text-xs text-red-200 break-words">
            {error}
          </div>
        )}

        <form className="mt-6 grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="text-xs font-semibold text-gray-400 block mb-1">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full rounded p-3 text-xs glass-input"
              placeholder="johndoe"
            />
          </div>

          <div>
            <label htmlFor="email" className="text-xs font-semibold text-gray-400 block mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded p-3 text-xs glass-input"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label htmlFor="full_name" className="text-xs font-semibold text-gray-400 block mb-1">
              Full Name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              value={formData.full_name}
              onChange={handleChange}
              className="w-full rounded p-3 text-xs glass-input"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="phone" className="text-xs font-semibold text-gray-400 block mb-1">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="text"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded p-3 text-xs glass-input"
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-xs font-semibold text-gray-400 block mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded p-3 text-xs glass-input"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="referral_code" className="text-xs font-semibold text-gray-400 block mb-1">
              Referral Code (Optional)
            </label>
            <input
              id="referral_code"
              name="referral_code"
              type="text"
              value={formData.referral_code}
              onChange={handleChange}
              className="w-full rounded p-3 text-xs glass-input"
              placeholder="AG-XXXXXX"
            />
          </div>

          <div className="sm:col-span-2 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-gradient-to-r from-cyanAccent to-emeraldAccent py-3 text-xs font-bold text-black hover:opacity-90 transition shadow shadow-cyanAccent/15 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
