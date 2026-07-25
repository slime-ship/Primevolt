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
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-[#2F80ED]/10 blur-[100px]"></div>

        <div className="w-full max-w-md space-y-6 glass-panel p-8 rounded-2xl z-10 border border-[#2F80ED]/20 shadow-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-[#0A3D91] to-[#2F80ED] text-white mb-4 shadow-lg shadow-[#0A3D91]/20">
            <UserPlus size={32} />
          </div>
          
          <div className="space-y-3 text-slate-800 dark:text-gray-200">
            <p className="text-sm font-bold text-[#2F80ED] dark:text-[#56CCF2]">
              {t('Your account has been created successfully.')}
            </p>
            <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
              {t('Your account is currently pending administrator verification.')}
            </p>
            <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
              {t('Please contact the administrator to complete your account verification.')}
            </p>
          </div>

          <div className="pt-4">
            <Link
              to="/login"
              className="w-full flex items-center justify-center py-3.5 bg-gradient-to-r from-[#0A3D91] via-[#2F80ED] to-[#56CCF2] text-white font-bold text-xs rounded-xl hover:opacity-95 transition shadow-lg shadow-[#0A3D91]/20"
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
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-[#2F80ED]/10 blur-[100px]"></div>

      <div className="w-full max-w-md sm:max-w-2xl space-y-8 glass-panel p-6 sm:p-8 rounded-2xl z-10 border border-[#2F80ED]/20 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#0A3D91] to-[#2F80ED] text-white mb-4 shadow-md shadow-[#0A3D91]/20">
            <UserPlus size={24} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{t('Create your investment account')}</h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#2F80ED] dark:text-[#56CCF2] hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-900/20 border border-red-500/40 p-4 text-xs text-red-300 break-words">
            {error}
          </div>
        )}

        <form className="mt-6 grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="text-xs font-semibold text-slate-600 dark:text-gray-400 block mb-1">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full rounded-xl p-3 text-xs glass-input"
              placeholder="johndoe"
            />
          </div>

          <div>
            <label htmlFor="email" className="text-xs font-semibold text-slate-600 dark:text-gray-400 block mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl p-3 text-xs glass-input"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label htmlFor="full_name" className="text-xs font-semibold text-slate-600 dark:text-gray-400 block mb-1">
              Full Name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              value={formData.full_name}
              onChange={handleChange}
              className="w-full rounded-xl p-3 text-xs glass-input"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="phone" className="text-xs font-semibold text-slate-600 dark:text-gray-400 block mb-1">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="text"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-xl p-3 text-xs glass-input"
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-xs font-semibold text-slate-600 dark:text-gray-400 block mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-xl p-3 text-xs glass-input"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="referral_code" className="text-xs font-semibold text-slate-600 dark:text-gray-400 block mb-1">
              Referral Code (Optional)
            </label>
            <input
              id="referral_code"
              name="referral_code"
              type="text"
              value={formData.referral_code}
              onChange={handleChange}
              className="w-full rounded-xl p-3 text-xs glass-input"
              placeholder="AG-XXXXXX"
            />
          </div>

          <div className="sm:col-span-2 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#0A3D91] via-[#2F80ED] to-[#56CCF2] py-3.5 text-xs font-bold text-white hover:opacity-95 transition shadow-md shadow-[#0A3D91]/20 disabled:opacity-50"
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
