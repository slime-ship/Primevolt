import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Lock, Mail, ShieldAlert } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await adminLogin(email, password);
    if (res.success) {
      navigate('/admin/dashboard');
    } else {
      setError(res.error);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-transparent px-4 text-left">
      <div className="w-full max-w-md p-8 rounded-xl glass-panel relative border border-slate-200 dark:border-gray-800">
        {/* Neon accent top bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-t-xl"></div>

        <div className="text-center mb-8">
          <ShieldAlert className="mx-auto text-red-400 mb-3" size={40} />
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">PrimeVolt Terminal</h2>
          <p className="text-xs text-gray-500 mt-1">Authorized Administrative Staff Access Only</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-950/40 border border-red-500/50 p-4 text-xs text-red-200 mb-6">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">Staff Email or Username</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="staff@primevolt.com or username"
                className="w-full p-3 rounded glass-input text-xs pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail className="absolute left-3 top-3.5 text-gray-500" size={16} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">Security Key Password</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••••••"
                className="w-full p-3 rounded glass-input text-xs pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock className="absolute left-3 top-3.5 text-gray-500" size={16} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-xs rounded hover:opacity-90 disabled:opacity-50 transition shadow-lg shadow-red-500/10"
          >
            {loading ? 'Authenticating Credentials...' : 'Sign in to Terminal'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
