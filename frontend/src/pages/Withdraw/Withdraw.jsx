import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/api';
import { ArrowLeft, CheckCircle, AlertCircle, CreditCard, Bitcoin, Wallet as WalletIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Withdraw = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wallets, setWallets] = useState([]);
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Step management: 'form' | 'confirm'
  const [step, setStep] = useState('form');
  const [createdWithdrawal, setCreatedWithdrawal] = useState(null);
  const [confirmCode, setConfirmCode] = useState('');

  // Withdrawal method
  const [withdrawalMethod, setWithdrawalMethod] = useState('CRYPTOCURRENCY');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USDT');
  const [code2fa, setCode2fa] = useState('');

  // BANK_TRANSFER fields
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [country, setCountry] = useState('');

  // CRYPTOCURRENCY fields
  const [cryptoCoin, setCryptoCoin] = useState('USDT');
  const [cryptoNetwork, setCryptoNetwork] = useState('');
  const [cryptoAddress, setCryptoAddress] = useState('');

  // PAYPAL fields
  const [paypalEmail, setPaypalEmail] = useState('');

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRelevantWallet = () => {
    const lookupCur = withdrawalMethod === 'BANK_TRANSFER' ? 'USDT' : currency;
    return wallets.find(w => w.currency === lookupCur);
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (user?.is_frozen) {
      setErrorMsg('Your account is frozen. Withdrawals are disabled.');
      return;
    }

    const selectedWallet = getRelevantWallet();
    if (!selectedWallet || parseFloat(selectedWallet.balance) < parseFloat(amount)) {
      const walletCur = withdrawalMethod === 'BANK_TRANSFER' ? 'USDT' : currency;
      setErrorMsg(`Insufficient funds. Available balance: ${selectedWallet?.balance || 0} ${walletCur}`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        amount,
        currency: withdrawalMethod === 'BANK_TRANSFER' ? 'USDT' : currency,
        withdrawal_method: withdrawalMethod,
        ...(withdrawalMethod === 'BANK_TRANSFER' && { bank_name: bankName, account_name: accountName, account_number: accountNumber, swift_code: swiftCode, country }),
        ...(withdrawalMethod === 'CRYPTOCURRENCY' && { crypto_coin: cryptoCoin, crypto_network: cryptoNetwork, crypto_address: cryptoAddress }),
        ...(withdrawalMethod === 'PAYPAL' && { paypal_email: paypalEmail }),
        ...(code2fa && { code_2fa: code2fa }),
      };

      const res = await api.post('withdrawals/', payload);
      setCreatedWithdrawal(res.data);
      setSuccessMsg('Withdrawal request initialized. Please enter the 6-digit confirmation code.');
      setStep('confirm');
    } catch (err) {
      const errData = err.response?.data;
      const msg = errData?.non_field_errors?.[0] || errData?.error || JSON.stringify(errData) || 'Failed to initialize withdrawal.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await api.post(`withdrawals/${createdWithdrawal.id}/confirm/`, { code: confirmCode });
      setStep('form');
      setCreatedWithdrawal(null);
      setConfirmCode('');
      setAmount('');
      setCryptoAddress('');
      setPaypalEmail('');
      setBankName('');
      setAccountName('');
      setAccountNumber('');
      setSwiftCode('');
      setCountry('');

      if (!user?.vip_level_details || user.vip_level_details.level < 2) {
        navigate('/upgrade-vip');
      } else {
        setSuccessMsg('Withdrawal confirmed and is now awaiting admin approval.');
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Confirmation failed. Check the code and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedWallet = getRelevantWallet();

  const methodTabs = [
    { id: 'CRYPTOCURRENCY', label: 'Cryptocurrency', icon: Bitcoin },
    { id: 'BANK_TRANSFER', label: 'Bank Transfer', icon: CreditCard },
    { id: 'PAYPAL', label: 'PayPal', icon: WalletIcon },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
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
            <div className="rounded bg-emerald-950/30 border border-emerald-500/50 p-4 text-xs text-emerald-200 flex items-center gap-2 mb-6">
              <CheckCircle size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="rounded bg-red-950/30 border border-red-500/50 p-4 text-xs text-red-200 mb-6 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'confirm' ? (
            /* ── STEP 2: Confirmation code ── */
            <form onSubmit={handleConfirm} className="space-y-6 max-w-sm">
              <div className="rounded bg-emerald-950/30 border border-emerald-500/50 p-4 text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle size={16} />
                <span>Withdrawal request initialized. Please enter the 6-digit confirmation code.</span>
              </div>

              <div>
                {createdWithdrawal?.transaction_code && (
                  <p className="text-xs text-gray-400 mb-3">
                    Transaction Code: <span className="font-mono font-bold text-cyanAccent">{createdWithdrawal.transaction_code}</span>
                  </p>
                )}
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
                  {t('Check your verification logs. Code: ')}{createdWithdrawal?.confirmation_code}
                </span>
              </div>

              <div className="flex gap-4">
                <button type="submit" disabled={submitting}
                  className="rounded bg-cyanAccent px-6 py-2.5 text-xs font-bold text-black hover:opacity-90 transition disabled:opacity-50">
                  {submitting ? t('Confirming...') : t('Confirm Withdrawal')}
                </button>
                <button type="button" onClick={() => { setStep('form'); setCreatedWithdrawal(null); setErrorMsg(''); setSuccessMsg(''); }}
                  className="rounded border border-slate-300 dark:border-gray-700 px-6 py-2.5 text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-gray-800 transition">
                  {t('Cancel')}
                </button>
              </div>
            </form>
          ) : (
            /* ── STEP 1: Withdrawal form ── */
            <form onSubmit={handleRequest} className="space-y-6">

              {/* Method selector tabs */}
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-3">{t('Withdrawal Method')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {methodTabs.map(({ id, label, icon: Icon }) => (
                    <button key={id} type="button"
                      onClick={() => setWithdrawalMethod(id)}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition
                        ${withdrawalMethod === id
                          ? 'bg-cyanAccent/10 border-cyanAccent text-cyanAccent'
                          : 'border-slate-300 dark:border-gray-700 text-slate-500 dark:text-gray-400 hover:border-slate-400 dark:hover:border-gray-600'}`}>
                      <Icon size={18} />
                      <span>{t(label)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="amount" className="text-xs font-semibold text-gray-400 block mb-2">
                    {t('Withdrawal Amount')}
                  </label>
                  <input
                    id="amount"
                    type="number"
                    step="any"
                    required
                    min="10"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded p-3 text-xs glass-input"
                    placeholder="100.00"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    {t('Available: ')}{parseFloat(selectedWallet?.balance || 0).toFixed(6)} {withdrawalMethod === 'BANK_TRANSFER' ? 'USDT' : currency}
                  </span>
                </div>

                {withdrawalMethod === 'CRYPTOCURRENCY' && (
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-2">{t('Select Asset')}</label>
                    <select value={currency} onChange={(e) => { setCurrency(e.target.value); setCryptoCoin(e.target.value); }}
                      className="w-full rounded p-3 text-xs glass-input">
                      <option value="USDT">USDT</option>
                      <option value="BTC">Bitcoin (BTC)</option>
                      <option value="ETH">Ethereum (ETH)</option>
                      <option value="BNB">Binance Coin (BNB)</option>
                      <option value="SOL">Solana (SOL)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* ── CRYPTOCURRENCY fields ── */}
              {withdrawalMethod === 'CRYPTOCURRENCY' && (
                <div className="space-y-4 border border-slate-200 dark:border-gray-800 rounded-lg p-4 bg-slate-100/10">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">{t('Crypto Destination')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-400 block mb-1">{t('Network')}</label>
                      <input type="text" required value={cryptoNetwork} onChange={(e) => setCryptoNetwork(e.target.value)}
                        className="w-full rounded p-3 text-xs glass-input" placeholder="e.g. ERC-20, TRC-20, BSC" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-400 block mb-1">{t('Wallet Address')}</label>
                      <input type="text" required value={cryptoAddress} onChange={(e) => setCryptoAddress(e.target.value)}
                        className="w-full rounded p-3 text-xs glass-input font-mono" placeholder="0x... or bc1..." />
                    </div>
                  </div>
                </div>
              )}

              {/* ── BANK TRANSFER fields ── */}
              {withdrawalMethod === 'BANK_TRANSFER' && (
                <div className="space-y-4 border border-slate-200 dark:border-gray-800 rounded-lg p-4 bg-slate-100/10">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">{t('Bank Transfer Details')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-400 block mb-1">{t('Bank Name')}</label>
                      <input type="text" required value={bankName} onChange={(e) => setBankName(e.target.value)}
                        className="w-full rounded p-3 text-xs glass-input" placeholder="Chase Bank, HSBC..." />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-400 block mb-1">{t('Account Holder Name')}</label>
                      <input type="text" required value={accountName} onChange={(e) => setAccountName(e.target.value)}
                        className="w-full rounded p-3 text-xs glass-input" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-400 block mb-1">{t('Account Number / IBAN')}</label>
                      <input type="text" required value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full rounded p-3 text-xs glass-input font-mono" placeholder="1234567890" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-400 block mb-1">{t('SWIFT / BIC Code')} <span className="text-gray-500">(optional)</span></label>
                      <input type="text" value={swiftCode} onChange={(e) => setSwiftCode(e.target.value)}
                        className="w-full rounded p-3 text-xs glass-input font-mono" placeholder="e.g. CHASUS33" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-semibold text-gray-400 block mb-1">{t('Country')}</label>
                      <input type="text" required value={country} onChange={(e) => setCountry(e.target.value)}
                        className="w-full rounded p-3 text-xs glass-input" placeholder="United States" />
                    </div>
                  </div>
                </div>
              )}

              {/* ── PAYPAL fields ── */}
              {withdrawalMethod === 'PAYPAL' && (
                <div className="border border-slate-200 dark:border-gray-800 rounded-lg p-4 bg-slate-100/10">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3">{t('PayPal Details')}</h3>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 block mb-1">{t('PayPal Email Address')}</label>
                    <input type="email" required value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)}
                      className="w-full rounded p-3 text-xs glass-input" placeholder="you@example.com" />
                  </div>
                </div>
              )}

              {/* 2FA */}
              {user?.is_2fa_enabled && (
                <div>
                  <label htmlFor="code2fa" className="text-xs font-semibold text-gray-400 block mb-2">
                    {t('Google Authenticator 2FA Code')}
                  </label>
                  <input id="code2fa" type="text" required value={code2fa} onChange={(e) => setCode2fa(e.target.value)}
                    className="w-full rounded p-3 text-xs glass-input font-mono" placeholder="000000" maxLength={6} />
                </div>
              )}

              <button type="submit" disabled={submitting}
                className="rounded bg-gradient-to-r from-cyanAccent to-emeraldAccent px-6 py-3 text-xs font-bold text-black hover:opacity-90 transition disabled:opacity-50">
                {submitting ? t('Initializing...') : t('Request Withdrawal')}
              </button>
            </form>
          )}
        </div>

        {/* Withdrawal limits card */}
        <div className="glass-panel p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">{t('Withdrawal Limits')}</h3>
            <ul className="text-xs text-slate-500 dark:text-gray-400 space-y-4">
              <li className="flex justify-between border-b border-slate-200 dark:border-gray-800 pb-2">
                <span>{t('Minimum Amount:')}</span>
                <span className="font-semibold text-slate-900 dark:text-white">$10.00 USDT</span>
              </li>
              <li className="flex justify-between border-b border-slate-200 dark:border-gray-800 pb-2">
                <span>{t('Daily Limit (VIP 1):')}</span>
                <span className="font-semibold text-slate-900 dark:text-white">$5,000.00 USDT</span>
              </li>
              <li className="flex justify-between border-b border-slate-200 dark:border-gray-800 pb-2">
                <span>{t('Daily Limit (VIP 3):')}</span>
                <span className="font-semibold text-emeraldAccent">{t('Unlimited')}</span>
              </li>
              <li className="flex justify-between pb-2">
                <span>{t('Withdrawal Fee:')}</span>
                <span className="font-semibold text-emeraldAccent">0.00%</span>
              </li>
            </ul>
          </div>
          <div className="mt-6 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">
            <p className="font-semibold mb-1">Supported Methods</p>
            <ul className="space-y-1 text-gray-400">
              <li>• Cryptocurrency (BTC, ETH, USDT, BNB, SOL)</li>
              <li>• Bank Transfer (Wire / SEPA)</li>
              <li>• PayPal</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Withdrawal history */}
      <div className="glass-panel rounded-xl p-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">{t('Withdrawal History')}</h3>
        {withdrawHistory.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-500">{t('No withdrawal history found.')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-gray-850 text-slate-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">{t('Tx Code')}</th>
                  <th className="pb-3">{t('Method')}</th>
                  <th className="pb-3">{t('Amount')}</th>
                  <th className="pb-3">{t('Destination')}</th>
                  <th className="pb-3">{t('Date')}</th>
                  <th className="pb-3">{t('Status')}</th>
                  <th className="pb-3">{t('Notes')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-gray-800/40 text-slate-700 dark:text-gray-300">
                {withdrawHistory.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-100/50 dark:hover:bg-gray-800/10">
                    <td className="py-3 text-gray-500 font-mono text-[11px]">{w.transaction_code || `WD-${w.id}`}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200/50 dark:bg-gray-700/50 text-slate-600 dark:text-gray-300">
                        {w.withdrawal_method?.replace('_', ' ') || 'CRYPTO'}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-red-400">-${parseFloat(w.amount).toFixed(2)}</td>
                    <td className="py-3 text-gray-450 font-mono truncate max-w-[120px]">{w.address || '-'}</td>
                    <td className="py-3 text-gray-500">{new Date(w.created_at).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        w.status === 'COMPLETED' ? 'bg-emeraldAccent/15 text-emeraldAccent' :
                        w.status === 'REJECTED' ? 'bg-red-400/15 text-red-400' :
                        'bg-yellow-500/15 text-yellow-500'
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
