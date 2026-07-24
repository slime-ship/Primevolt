import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/api';
import { ArrowLeft, Upload, CheckCircle, Copy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Deposit = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [proofImage, setProofImage] = useState(null);
  
  const [depositHistory, setDepositHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [walletRes, depositRes] = await Promise.all([
        api.get('wallets/'),
        api.get('deposits/')
      ]);
      setWallets(walletRes.data);
      setDepositHistory(depositRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setProofImage(e.target.files[0]);
  };

  const userWallet = wallets.find((w) => w.currency === selectedCurrency);

  const copyAddress = () => {
    if (!userWallet?.address) return;
    navigator.clipboard.writeText(userWallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (user?.is_frozen) {
      setErrorMsg('Your account is frozen. Deposits are disabled.');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setErrorMsg('Please enter a valid positive deposit amount.');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('currency', selectedCurrency);
    formData.append('transaction_hash', txHash);
    if (proofImage) {
      formData.append('proof_image', proofImage);
    }

    try {
      await api.post('deposits/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccessMsg('Deposit proof uploaded successfully. Awaiting administrator verification.');
      setAmount('');
      setTxHash('');
      setProofImage(null);
      
      // Reset file input element
      const fileInput = document.getElementById('proof_image');
      if (fileInput) fileInput.value = '';

      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit deposit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Find user wallet address for selected currency or fallback

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-transparent">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyanAccent border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 min-h-[calc(100vh-4rem)] text-left">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition mb-6">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-8">{t('Deposit Crypto Funds')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Deposit details card */}
        <div className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-xl space-y-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('Step 1: Send Funds')}</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-2">{t('Select Asset')}</label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full rounded p-3 text-xs glass-input"
              >
                <option value="USDT">{t('USDT (ERC-20)')}</option>
                <option value="BTC">{t('Bitcoin (BTC)')}</option>
                <option value="ETH">{t('Ethereum (ETH)')}</option>
                <option value="BNB">{t('Binance Coin (BNB)')}</option>
                <option value="SOL">{t('Solana (SOL)')}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-2">{t('Your receiving address')}</label>
              <div className="p-3 bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-gray-800 rounded text-xs text-cyanAccent select-all font-mono">
                {userWallet?.address || 'no wallet address for currency'}
              </div>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-gray-800 bg-slate-100/40 dark:bg-[#090b12]/50 p-4 rounded-lg">
            <p className="text-xs text-gray-400 leading-6 mb-4">
              {t('Send the desired deposit amount to the platform\'s official receiving address listed below. Make sure to copy the exact address.')}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-gray-850 rounded">
              <div className="text-left">
                <span className="text-[10px] text-gray-400 block font-semibold">{t('Official receiving ')}{selectedCurrency}{t(' address:')}</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white select-all font-mono break-all">
                  {userWallet?.address || 'no wallet address for currency'}
                </span>
              </div>
              {userWallet?.address && (
                <button
                  type="button"
                  onClick={copyAddress}
                  className="text-cyanAccent hover:text-white transition flex items-center gap-1 self-start sm:self-center cursor-pointer"
                >
                  <span className="text-[10px]">{copied ? t('Copied') : t('Copy')}</span>
                  <Copy size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Upload proof form */}
        <div className="glass-panel p-6 rounded-xl flex flex-col justify-between">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('Step 2: Submit Proof')}</h3>

            {successMsg && (
              <div className="rounded bg-emerald-950/30 border border-emerald-500/50 p-3 text-[11px] text-emerald-250 flex items-center gap-2">
                <CheckCircle size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="rounded bg-red-950/30 border border-red-500/50 p-3 text-[11px] text-red-250">
                {errorMsg}
              </div>
            )}

            <div>
              <label htmlFor="amount" className="text-xs font-semibold text-gray-400 block mb-1">
                Amount Sent ({selectedCurrency})
              </label>
              <input
                id="amount"
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded p-3 text-xs glass-input"
                placeholder="100"
              />
            </div>

            <div>
              <label htmlFor="txHash" className="text-xs font-semibold text-gray-400 block mb-1">
                Transaction Hash / TX ID
              </label>
              <input
                id="txHash"
                type="text"
                required
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                className="w-full rounded p-3 text-xs glass-input font-mono"
                placeholder="0x..."
              />
            </div>

            <div>
              <label htmlFor="proof_image" className="text-xs font-semibold text-gray-400 block mb-1">
                Proof of Payment (Image)
              </label>
              <div className="border border-dashed border-slate-300 dark:border-gray-800 rounded p-4 text-center cursor-pointer hover:border-cyanAccent transition relative">
                <input
                  id="proof_image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                <span className="text-[10px] text-gray-450 block">
                  {proofImage ? proofImage.name : 'Select or drag receipt image'}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded bg-gradient-to-r from-cyanAccent to-emeraldAccent py-3 text-xs font-bold text-black hover:opacity-90 transition disabled:opacity-50"
            >
              {submitting ? 'Submitting proof...' : 'Confirm Deposit'}
            </button>
          </form>
        </div>
      </div>

      {/* Deposit history */}
      <div className="glass-panel rounded-xl p-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">{t('Deposit History')}</h3>
        {depositHistory.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-500">
            {t('No deposits registered.')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-gray-850 text-slate-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">{t('ID')}</th>
                  <th className="pb-3">{t('Amount')}</th>
                  <th className="pb-3">{t('Currency')}</th>
                  <th className="pb-3">{t('TX Hash')}</th>
                  <th className="pb-3">{t('Created')}</th>
                  <th className="pb-3">{t('Status')}</th>
                  <th className="pb-3">{t('Admin Notes')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-gray-800/40 text-slate-700 dark:text-gray-300">
                {depositHistory.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-100/50 dark:hover:bg-gray-800/10">
                    <td className="py-3 text-gray-500 font-mono">{`DEP-${d.id}`}</td>
                    <td className="py-3 font-semibold text-emeraldAccent">+${parseFloat(d.amount).toFixed(2)}</td>
                    <td className="py-3">{d.currency}</td>
                    <td className="py-3 text-gray-450 font-mono truncate max-w-[120px]">{d.transaction_hash}</td>
                    <td className="py-3 text-gray-500">{new Date(d.created_at).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.status === 'CONFIRMED' ? 'bg-emeraldAccent/15 text-emeraldAccent' : (d.status === 'REJECTED' ? 'bg-red-400/15 text-red-400' : 'bg-yellow-500/15 text-yellow-500')
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-gray-450">{d.admin_notes || '-'}</td>
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

export default Deposit;
