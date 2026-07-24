import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/api';
import { Copy, Plus, RefreshCw, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const WalletView = () => {
  const { t } = useTranslation();
  const { user, fetchUserMe } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('BTC');
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [walletRes, ledgerRes] = await Promise.all([
        api.get('wallets/'),
        api.get('transactions/')
      ]);
      setWallets(walletRes.data);
      setLedger(ledgerRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    setCreating(true);
    try {
      await api.post('wallets/create/', { currency: selectedCurrency });
      await fetchData();
      setCreating(false);
    } catch (err) {
      console.error(err);
      setCreating(false);
    }
  };

  const copyAddress = (address, index) => {
    navigator.clipboard.writeText(address);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const unassignedCurrencies = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL'].filter(
    (cur) => !wallets.some((w) => w.currency === cur)
  );

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-transparent">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyanAccent border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 min-h-[calc(100vh-4rem)] text-left">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white font-sans">{t('Wallets & Assets')}</h1>
          <p className="text-xs text-gray-400">{t('Generate addresses and check your ledger balances.')}</p>
        </div>
        <button
          onClick={fetchData}
          className="rounded-lg border border-slate-200 dark:border-gray-800 p-2 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Grid of Wallets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {wallets.map((w, index) => (
          <div key={w.id} className="glass-panel p-6 rounded-xl relative overflow-hidden flex flex-col justify-between h-48">
            <div className="absolute top-0 right-0 p-4 opacity-5 font-black text-6xl text-slate-950 dark:text-white">
              {w.currency}
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-black text-slate-900 dark:text-white tracking-widest">{w.currency} {t('WALLET')}</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-slate-100 dark:bg-gray-800 text-cyanAccent">
                {t('Active')}
              </span>
            </div>

            <div className="my-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {parseFloat(w.balance).toFixed(6)}
              </span>
              <span className="text-xs text-gray-500 ml-1">{w.currency}</span>
              {parseFloat(w.locked_balance) > 0 && (
                <span className="text-[10px] text-yellow-500 block mt-0.5">
                  {t('Locked: ')}{parseFloat(w.locked_balance).toFixed(6)} {w.currency} {t('(Pending withdrawal)')}
                </span>
              )}
            </div>

            {w.address ? (
              <div className="mt-2 bg-slate-100/50 dark:bg-[#090b12]/50 border border-slate-200 dark:border-gray-800 p-2 rounded flex justify-between items-center">
                <span className="text-[9px] text-slate-500 dark:text-gray-400 truncate max-w-[200px]">
                  {w.address}
                </span>
                <button
                  onClick={() => copyAddress(w.address, index)}
                  className="text-cyanAccent hover:text-slate-900 dark:hover:text-white transition"
                  title="Copy Address"
                >
                  <span className="text-[10px] mr-1">{copiedIndex === index ? t('Copied') : ''}</span>
                  <Copy size={12} className="inline" />
                </button>
              </div>
            ) : (
              <div className="text-[10px] text-red-500 dark:text-red-400 font-bold mt-2">
                {t('no wallet address for currency')}
              </div>
            )}
          </div>
        ))}

        {/* Generate New Wallet card */}
        {unassignedCurrencies.length > 0 && (
          <div className="glass-panel p-6 rounded-xl border-dashed border-slate-300 dark:border-gray-700 flex flex-col justify-center items-center h-48 text-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">{t('Generate New Address')}</h3>
            <div className="flex gap-2">
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="rounded p-2 text-xs glass-input"
              >
                {unassignedCurrencies.map((cur) => (
                  <option key={cur} value={cur}>{cur}</option>
                ))}
              </select>
              <button
                onClick={handleCreateWallet}
                disabled={creating}
                className="bg-cyanAccent text-black font-bold text-xs px-4 py-2 rounded hover:opacity-90 transition flex items-center gap-1"
              >
                <Plus size={16} /> {t('Generate')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ledger History */}
      <div className="glass-panel rounded-xl p-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">{t('Complete Account Ledger')}</h3>
        {ledger.length === 0 ? (
          <div className="text-center py-12 text-xs text-gray-500 flex flex-col items-center">
            <Clock size={32} className="text-gray-600 mb-2" />
            {t('No transaction records in your ledger history.')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-gray-850 text-slate-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">{t('Transaction ID')}</th>
                  <th className="pb-3">{t('Type')}</th>
                  <th className="pb-3">{t('Amount')}</th>
                  <th className="pb-3">{t('Currency')}</th>
                  <th className="pb-3">{t('Description')}</th>
                  <th className="pb-3">{t('Date')}</th>
                  <th className="pb-3">{t('Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-gray-800/40 text-slate-700 dark:text-gray-300">
                {ledger.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-100/50 dark:hover:bg-gray-800/10">
                    <td className="py-4 text-gray-500 font-mono">TX-{1000 + tx.id}</td>
                    <td className="py-4 font-semibold text-slate-900 dark:text-white">{tx.type}</td>
                    <td className={`py-4 font-semibold ${
                      ['DEPOSIT', 'PROFIT', 'REFERRAL_BONUS'].includes(tx.type) ? 'text-emeraldAccent' : 'text-red-400'
                    }`}>
                      {['DEPOSIT', 'PROFIT', 'REFERRAL_BONUS'].includes(tx.type) ? '+' : '-'}${Math.abs(parseFloat(tx.amount)).toFixed(2)}
                    </td>
                    <td className="py-4">{tx.currency}</td>
                    <td className="py-4 text-gray-450">{tx.description}</td>
                    <td className="py-4 text-gray-500">{new Date(tx.created_at).toLocaleString()}</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.status === 'COMPLETED' ? 'bg-emeraldAccent/15 text-emeraldAccent' : 'bg-yellow-500/15 text-yellow-500'
                      }`}>
                        {tx.status}
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

export default WalletView;
