import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/api';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Withdraw = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wallets, setWallets] = useState([]);
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [code2fa, setCode2fa] = useState('');
  
  // Multi-step verification state
  const [createdWithdrawal, setCreatedWithdrawal] = useState(null);
  const [confirmCode, setConfirmCode] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [walletRes, withdrawRes] = await Promise.all([
        api.get('wallets/'),
        api.get('withdrawals/')
      ]);
      setWallets(walletRes.data);
      setWithdrawHistory(withdrawRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (user?.is_frozen) {
      setErrorMsg('Your account is frozen. Withdrawals are disabled.');
      return;
    }

    const currentWallet = wallets.find(w => w.currency === (selectedCurrency === 'BANK' ? 'USDT' : selectedCurrency));
    if (!currentWallet || parseFloat(currentWallet.balance) < parseFloat(amount)) {
      setErrorMsg(`Insufficient funds. Your available balance is ${currentWallet?.balance || 0} ${selectedCurrency === 'BANK' ? 'USDT' : selectedCurrency}`);
      return;
    }

    setSubmitting(true);
    try {
      const finalAddress = selectedCurrency === 'BANK'
        ? `Bank: ${bankName} | Acc Name: ${accountName} | Acc Num: ${accountNumber} | Routing: ${routingNumber}`
        : address;

      const res = await api.post('withdrawals/', {
        amount,
        currency: selectedCurrency,
        address: finalAddress,
        code_2fa: code2fa // passed if enabled
      });
      setCreatedWithdrawal(res.data);
      setSuccessMsg('Withdrawal request initialized. Please enter the 6-digit confirmation code.');
    } catch (err) {
      setErrorMsg(err.response?.data?.non_field_errors?.[0] || err.response?.data?.error || 'Failed to initialize withdrawal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      await api.post(`withdrawals/${createdWithdrawal.id}/confirm/`, {
        code: confirmCode
      });
      setConfirmCode('');
      setAmount('');
      setAddress('');
      setCode2fa('');

      if (!user?.vip_level_details || user.vip_level_details.level === 1) {
        navigate('/upgrade-vip');
      } else {
        setSuccessMsg('Withdrawal confirmed successfully. It is now awaiting admin approval.');
        setCreatedWithdrawal(null);
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Confirmation failed. Please check the code.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedWallet = wallets.find(w => w.currency === (selectedCurrency === 'BANK' ? 'USDT' : selectedCurrency));

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
        <ArrowLeft size={14} /> {t('Back to Dashboard')}
      </Link>

      <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-8">{t('Withdraw Balance')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Form panel */}
        <div className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-xl">
          {successMsg && (
            <div className="rounded bg-emerald-950/30 border border-emerald-500/50 p-4 text-xs text-emerald-250 flex items-center gap-2 mb-6">
              <CheckCircle size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="rounded bg-red-950/30 border border-red-500/50 p-4 text-xs text-red-250 mb-6">
              {errorMsg}
            </div>
          )}

          {!createdWithdrawal ? (
            <form onSubmit={handleRequest} className="space-y-6">
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
                    <option value="BANK">{t('Bank Transfer (USD)')}</option>
                  </select>
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    {t('Available: ')}{parseFloat(selectedWallet?.balance || 0).toFixed(6)} {selectedCurrency === 'BANK' ? 'USDT' : selectedCurrency}
                  </span>
                </div>

                <div>
                  <label htmlFor="amount" className="text-xs font-semibold text-gray-400 block mb-2">
                    {t('Withdrawal Amount')}
                  </label>
                  <input
                    id="amount"
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded p-3 text-xs glass-input"
                    placeholder="100.00"
                  />
                </div>
              </div>

              {selectedCurrency === 'BANK' ? (
                <div className="space-y-4 border border-slate-200 dark:border-gray-800 rounded-lg p-4 bg-slate-100/10">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2">{t('Bank Transfer Payout Details')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-400 block mb-1">{t('Bank Name')}</label>
                      <input
                        type="text"
                        required
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full rounded p-3 text-xs glass-input"
                        placeholder="Chase Bank, Wells Fargo, etc."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-400 block mb-1">{t('Account Holder Name')}</label>
                      <input
                        type="text"
                        required
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="w-full rounded p-3 text-xs glass-input"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-400 block mb-1">{t('Account Number / IBAN')}</label>
                      <input
                        type="text"
                        required
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full rounded p-3 text-xs glass-input font-mono"
                        placeholder="1234567890"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-400 block mb-1">{t('Routing Number / Sort Code')}</label>
                      <input
                        type="text"
                        required
                        value={routingNumber}
                        onChange={(e) => setRoutingNumber(e.target.value)}
                        className="w-full rounded p-3 text-xs glass-input font-mono"
                        placeholder="987654321"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="address" className="text-xs font-semibold text-gray-400 block mb-2">
                    {t('Destination Blockchain Address')}{' '}({selectedCurrency})
                  </label>
                  <input
                    id="address"
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded p-3 text-xs glass-input font-mono"
                    placeholder="Enter external destination address"
                  />
                </div>
              )}

              {user?.is_2fa_enabled && (
                <div>
                  <label htmlFor="code2fa" className="text-xs font-semibold text-gray-400 block mb-2">
                    {t('Google Authenticator 2FA Code')}
                  </label>
                  <input
                    id="code2fa"
                    type="text"
                    required
                    value={code2fa}
                    onChange={(e) => setCode2fa(e.target.value)}
                    className="w-full rounded p-3 text-xs glass-input font-mono"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="rounded bg-gradient-to-r from-cyanAccent to-emeraldAccent px-6 py-3 text-xs font-bold text-black hover:opacity-90 transition disabled:opacity-50"
              >
                {submitting ? t('Initializing...') : t('Request Withdrawal')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-6 max-w-sm">
              <div>
                <label htmlFor="confirmCode" className="text-xs font-semibold text-gray-400 block mb-2">
                  {t('Enter 6-Digit Email/SMS Confirmation Code (Mock value sent)')}
                </label>
                <input
                  id="confirmCode"
                  type="text"
                  required
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  className="w-full text-center tracking-widest rounded p-3 text-sm font-bold glass-input"
                  placeholder="123456"
                  maxLength={6}
                />
                <span className="text-[10px] text-gray-500 mt-1 block">
                  {t('Check your verification logs. Code: ')}{createdWithdrawal.confirmation_code}
                </span>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-cyanAccent px-6 py-2.5 text-xs font-bold text-black hover:opacity-90 transition disabled:opacity-50"
                >
                  {submitting ? t('Confirming...') : t('Confirm Withdrawal')}
                </button>
                <button
                  type="button"
                  onClick={() => setCreatedWithdrawal(null)}
                  className="rounded border border-slate-300 dark:border-gray-700 px-6 py-2.5 text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-gray-800 transition"
                >
                  {t('Cancel')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Withdrawal limits card */}
        <div className="glass-panel p-6 rounded-xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">{t('Withdrawal Limits')}</h3>
            <ul className="text-xs text-slate-500 dark:text-gray-400 space-y-4">
              <li className="flex justify-between border-b border-slate-200 dark:border-gray-880 pb-2">
                <span>{t('Minimum Amount:')}</span>
                <span className="font-semibold text-slate-900 dark:text-white">$10.00 USDT</span>
              </li>
              <li className="flex justify-between border-b border-slate-200 dark:border-gray-880 pb-2">
                <span>{t('Daily Limit (VIP 1):')}</span>
                <span className="font-semibold text-slate-900 dark:text-white">$5,000.00 USDT</span>
              </li>
              <li className="flex justify-between border-b border-slate-200 dark:border-gray-880 pb-2">
                <span>{t('Daily Limit (VIP 3):')}</span>
                <span className="font-semibold text-emeraldAccent">{t('Unlimited')}</span>
              </li>
              <li className="flex justify-between pb-2">
                <span>{t('Withdrawal Fee:')}</span>
                <span className="font-semibold text-emeraldAccent">0.00%</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Withdrawal history */}
      <div className="glass-panel rounded-xl p-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">{t('Withdrawal History')}</h3>
        {withdrawHistory.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-500">
            {t('No withdrawal history found.')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-gray-850 text-slate-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">{t('ID')}</th>
                  <th className="pb-3">{t('Amount')}</th>
                  <th className="pb-3">{t('Currency')}</th>
                  <th className="pb-3">{t('Destination Address')}</th>
                  <th className="pb-3">{t('Date')}</th>
                  <th className="pb-3">{t('Status')}</th>
                  <th className="pb-3">{t('Notes')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-gray-800/40 text-slate-700 dark:text-gray-300">
                {withdrawHistory.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-100/50 dark:hover:bg-gray-800/10">
                    <td className="py-3 text-gray-500 font-mono">WD-{w.id}</td>
                    <td className="py-3 font-semibold text-red-400">-${parseFloat(w.amount).toFixed(2)}</td>
                    <td className="py-3">{w.currency}</td>
                    <td className="py-3 text-gray-450 font-mono truncate max-w-[120px]">{w.address}</td>
                    <td className="py-3 text-gray-500">{new Date(w.created_at).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        w.status === 'COMPLETED' ? 'bg-emeraldAccent/15 text-emeraldAccent' : (w.status === 'REJECTED' ? 'bg-red-400/15 text-red-400' : 'bg-yellow-500/15 text-yellow-500')
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-gray-450">{w.admin_notes || '-'}</td>
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

export default Withdraw;
