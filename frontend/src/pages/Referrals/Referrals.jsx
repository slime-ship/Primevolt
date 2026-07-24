import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/api';
import { ArrowLeft, Share2, Clipboard, Check, Users, Gift, ShieldAlert, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const Referrals = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    referral_code: '',
    referral_link: '',
    successful_referrals: 0,
    total_earnings: 0,
    history: []
  });
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const res = await api.get('users/me/referrals/');
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load referrals stats:', err);
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(data.referral_link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(data.referral_code || user?.referral_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-transparent">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyanAccent border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 min-h-[calc(100vh-4rem)] text-left relative">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition mb-6">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Referral Program</h1>
      <p className="text-xs text-slate-500 dark:text-gray-400 mb-8 leading-relaxed">
        Invite your business colleagues, associates, or community members to PrimeVolt.
        Earn <span className="text-emeraldAccent font-bold">$10.00 USDT</span> directly credited for every valid registrant, and your invitees will receive a <span className="text-cyanAccent font-bold">$5.00 USDT</span> signup bonus.
      </p>

      {/* Referral Link & Codes Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 flex items-center gap-2">
            <Share2 size={14} className="text-cyanAccent" /> Your Referral Link
          </h3>
          <p className="text-[11px] text-gray-500">Copy this link and share it across social networks or email.</p>
          <div className="flex items-center gap-2 mt-2 bg-slate-100 dark:bg-gray-900/60 p-2.5 rounded border border-slate-200 dark:border-gray-800">
            <span className="font-mono text-xs text-slate-800 dark:text-gray-300 truncate flex-1">{data.referral_link}</span>
            <button
              onClick={copyLink}
              className="p-1.5 bg-cyanAccent text-black rounded hover:opacity-90 transition flex items-center justify-center"
              title="Copy Referral Link"
            >
              {copiedLink ? <Check size={14} /> : <Clipboard size={14} />}
            </button>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 flex items-center gap-2">
            <Gift size={14} className="text-emeraldAccent" /> Your Referral Code
          </h3>
          <p className="text-[11px] text-gray-500">Invitees can also input this code manually during signup.</p>
          <div className="flex items-center gap-2 mt-2 bg-slate-100 dark:bg-gray-900/60 p-2.5 rounded border border-slate-200 dark:border-gray-800">
            <span className="font-mono text-sm font-bold text-slate-900 dark:text-white flex-1">{data.referral_code || user?.referral_code}</span>
            <button
              onClick={copyCode}
              className="p-1.5 bg-cyanAccent text-black rounded hover:opacity-90 transition flex items-center justify-center"
              title="Copy Referral Code"
            >
              {copiedCode ? <Check size={14} /> : <Clipboard size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="glass-panel p-6 rounded-xl flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-20 w-20 bg-cyanAccent/5 rounded-bl-full"></div>
          <div className="h-12 w-12 rounded-lg bg-cyanAccent/10 text-cyanAccent flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-gray-450 uppercase font-semibold">Successful Invites</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{data.successful_referrals}</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-20 w-20 bg-emeraldAccent/5 rounded-bl-full"></div>
          <div className="h-12 w-12 rounded-lg bg-emeraldAccent/10 text-emeraldAccent flex items-center justify-center">
            <Award size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-gray-455 uppercase font-semibold">Total Referral Earnings</span>
            <p className="text-2xl font-black text-emeraldAccent mt-1">${data.total_earnings.toFixed(2)} USDT</p>
          </div>
        </div>
      </div>

      {/* Referral History Logs */}
      <div className="glass-panel p-6 rounded-xl">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2">
          <Gift size={18} className="text-cyanAccent" /> Referral Invites History
        </h3>
        
        {data.history.length === 0 ? (
          <div className="text-center text-xs text-slate-400 py-12">
            No referral registrations recorded yet. Start sharing your link!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-gray-850 text-slate-550 dark:text-gray-400 font-semibold">
                  <th className="pb-3">Invitee Details</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Referrer Reward</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-gray-800/45 text-slate-700 dark:text-gray-300">
                {data.history.map((h, idx) => (
                  <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-gray-900/10">
                    <td className="py-3.5 font-bold text-slate-900 dark:text-white">{h.username}</td>
                    <td className="py-3.5">{h.email}</td>
                    <td className="py-3.5 text-gray-550">{new Date(h.date).toLocaleString()}</td>
                    <td className="py-3.5 text-emeraldAccent font-bold">+${h.bonus_earned.toFixed(2)} USDT</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        h.status === 'COMPLETED' ? 'bg-emeraldAccent/15 text-emeraldAccent' : 'bg-red-400/15 text-red-400'
                      }`}>
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Referrals;
