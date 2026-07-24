import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/api';
import { ArrowLeft, CheckCircle, Upload, Copy, Info, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const UpgradeVIP = () => {
  const { t } = useTranslation();
  const { user, fetchUserMe } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const billingAddress = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';

  useEffect(() => {
    fetchUpgradeRequests();
  }, []);

  const fetchUpgradeRequests = async () => {
    try {
      const res = await api.get('users/vip-upgrade/');
      setRequests(res.data);
      setLoadingRequests(false);
    } catch (err) {
      console.error(err);
      setLoadingRequests(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(billingAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please upload a payment screenshot.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('screenshot', file);

    try {
      await api.post('users/vip-upgrade/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccessMsg('Upgrade request submitted successfully! Our audit team will verify your payment.');
      setFile(null);
      fetchUpgradeRequests();
      fetchUserMe();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit upgrade request. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const activeRequest = requests[0]; // Get the latest request

  if (loadingRequests) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-transparent">
        <Loader2 className="h-8 w-8 animate-spin text-cyanAccent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 min-h-[calc(100vh-4rem)] text-left font-jakarta">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition mb-6">
        <ArrowLeft size={14} /> {t('Back to Dashboard')}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left/Main Column: Instructions and Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-gray-800">
            <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">{t('Upgrade Account to VIP Level 2')}</h1>
            <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed mb-6">
              {t('To process external cryptocurrency withdrawals, users are required to upgrade to ')} <span className="font-semibold text-emeraldAccent">{t('VIP Level 2')}</span>. 
              {t(' The VIP 2 subscription enables fast withdrawals, priority support, and higher transactional limits.')}
            </p>

            {successMsg && (
              <div className="rounded bg-emerald-950/30 border border-emerald-500/50 p-4 text-xs text-emerald-200 flex items-center gap-2 mb-6">
                <CheckCircle size={16} className="text-emeraldAccent shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="rounded bg-red-950/30 border border-red-500/50 p-4 text-xs text-red-200 mb-6">
                ⚠ {errorMsg}
              </div>
            )}

            {/* Request Status Box */}
            {activeRequest && activeRequest.status === 'PENDING' && (
              <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4 text-xs text-yellow-600 dark:text-yellow-400 mb-6 space-y-2">
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                  <Info size={16} /> {t('Status: Audit Processing')}
                </div>
                <p className="leading-relaxed">
                  {t('Your VIP Level 2 upgrade request is currently being verified by our administrative staff. Once the payment is approved, your account will instantly shift to VIP Level 2 and a fee of $200.00 USDT will reflect as a deduction in your balance. Your pending withdrawal will also reflect as queued in the system.')}
                </p>
              </div>
            )}

            {user?.vip_level_details?.level >= 2 ? (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-5 text-center text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="mx-auto mb-2 text-emeraldAccent" size={32} />
                <p className="font-bold uppercase tracking-wider mb-1">{t('VIP Level 2 Active')}</p>
                <p>{t('Your account is already upgraded to VIP Level 2. You have full withdrawal privileges enabled.')}</p>
              </div>
            ) : (!activeRequest || activeRequest.status === 'REJECTED') ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Billing Details */}
                <div className="p-4 rounded-lg bg-slate-100/50 dark:bg-darkCard/30 border border-slate-200 dark:border-gray-800 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-gray-800">
                    <span className="text-xs text-slate-500 dark:text-gray-400">{t('VIP 2 Subscription Fee:')}</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">$200.00 USDT</span>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase font-semibold mb-2">{t('Company USDT Address (ERC-20)')}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={billingAddress}
                        className="flex-grow p-3 rounded glass-input text-xs font-mono text-slate-650 dark:text-gray-300"
                      />
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="px-4 py-2 border border-slate-300 dark:border-gray-700 hover:bg-slate-250 dark:hover:bg-gray-800 rounded transition flex items-center gap-1.5 text-xs text-slate-700 dark:text-white font-bold"
                      >
                        {copied ? t('Copied') : <><Copy size={14} /> {t('Copy')}</>}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Screenshot upload */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-2">{t('Upload Proof of Payment (Screenshot)')}</label>
                  <div className="border-2 border-dashed border-slate-300 dark:border-gray-700 rounded-xl p-6 text-center hover:border-cyanAccent transition cursor-pointer relative">
                    <input
                      type="file"
                      required
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                    <p className="text-xs font-semibold text-slate-700 dark:text-white">
                      {file ? file.name : t('Click to select or drag screenshot here')}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">{t('PNG, JPG, or JPEG (Max 5MB)')}</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-3 bg-gradient-to-r from-cyanAccent to-emeraldAccent text-black font-bold text-xs rounded hover:opacity-90 disabled:opacity-50 transition shadow-lg shadow-cyanAccent/10 flex items-center justify-center gap-1.5"
                >
                  {uploading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> {t('Uploading Screenshot...')}</>
                  ) : (
                    t('Submit VIP Upgrade Request')
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                {t('You have a pending upgrade request. Please wait for the admin\'s approval.')}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Account Status and FAQ */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-xl border border-slate-200 dark:border-gray-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">{t('Account Status')}</h3>
            <ul className="text-xs space-y-3">
              <li className="flex justify-between border-b border-slate-200 dark:border-gray-800 pb-2 text-slate-650 dark:text-gray-400">
                <span>{t('Current Tier:')}</span>
                <span className="font-semibold text-slate-900 dark:text-white">{user?.vip_level_details?.name || 'VIP Level 1'}</span>
              </li>
              <li className="flex justify-between border-b border-slate-200 dark:border-gray-800 pb-2 text-slate-650 dark:text-gray-400">
                <span>{t('KYC Level:')}</span>
                <span className="font-semibold text-slate-900 dark:text-white">{t('Level ')}{user?.kyc_level || 1}</span>
              </li>
              <li className="flex justify-between pb-2 text-slate-650 dark:text-gray-400">
                <span>{t('USDT Balance:')}</span>
                <span className="font-bold text-cyanAccent">${parseFloat(user?.balance || 0).toFixed(2)}</span>
              </li>
            </ul>
          </div>

          <div className="glass-panel p-6 rounded-xl border border-slate-200 dark:border-gray-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">{t('VIP Level 2 Benefits')}</h3>
            <ul className="text-xs text-slate-500 dark:text-gray-400 space-y-3 list-disc pl-4 leading-relaxed">
              <li>{t('Unlocks external crypto wallet withdrawals')}</li>
              <li>{t('Faster withdrawal queue processing (usually < 30 minutes)')}</li>
              <li>{t('Increased daily withdrawal limits up to $10,000 USDT')}</li>
              <li>{t('Priority support response time')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeVIP;
