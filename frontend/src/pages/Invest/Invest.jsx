import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/api';
import { ArrowLeft, Play, RefreshCw, Layers, Sparkles, HelpCircle, Shield, TrendingUp, Calendar, Clock, DollarSign, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useTranslation } from 'react-i18next';

const Invest = () => {
  const { t } = useTranslation();
  const { user, fetchUserMe } = useAuth();
  const [plans, setPlans] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans'); // 'plans', 'portfolios', 'analytics'
  const [filterRange, setFilterRange] = useState('ALL'); // '7D', '30D', 'ALL'
  const [now, setNow] = useState(new Date().getTime());

  // Modal investment form states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USDT');
  const [autoReinvest, setAutoReinvest] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetailInvestment, setSelectedDetailInvestment] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date().getTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [planRes, invRes, walletRes, txRes] = await Promise.all([
        api.get('investment-plans/'),
        api.get('investments/'),
        api.get('wallets/'),
        api.get('transactions/')
      ]);
      setPlans(planRes.data);
      setInvestments(invRes.data);
      setWallets(walletRes.data);
      setTransactions(txRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const openInvestModal = (plan) => {
    setSelectedPlan(plan);
    setAmount(plan.min_deposit);
    setCurrency('USDT');
    setAutoReinvest(false);
    setErrorMsg('');
    setSuccessMsg('');
    setModalOpen(true);
  };

  const closeInvestModal = () => {
    setModalOpen(false);
    setSelectedPlan(null);
  };

  const handleInvest = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (user?.is_frozen) {
      setErrorMsg('Your account is frozen. Investments are disabled.');
      return;
    }

    const currentWallet = wallets.find((w) => w.currency === currency);
    if (!currentWallet || parseFloat(currentWallet.balance) < parseFloat(amount)) {
      setErrorMsg(`Insufficient funds in your ${currency} wallet. Available balance: ${currentWallet?.balance || 0}`);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('investments/', {
        plan: selectedPlan.id,
        amount,
        currency,
        auto_reinvest: autoReinvest
      });
      setSuccessMsg('Investment successful! Your daily yields have started.');
      setTimeout(() => {
        closeInvestModal();
        fetchUserMe();
        fetchData();
      }, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.non_field_errors?.[0] || err.response?.data?.error || 'Investment transaction failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleReinvest = async (id) => {
    try {
      await api.post(`investments/${id}/reinvest/`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleWithdrawProfit = async (id) => {
    try {
      const res = await api.post(`investments/${id}/withdraw-profit/`);
      alert(res.data.message);
      fetchUserMe();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to withdraw profit.');
    }
  };

  // Calculate percentage progress of investment maturity
  const calculateProgress = (startDateStr, endDateStr) => {
    const start = new Date(startDateStr).getTime();
    const end = new Date(endDateStr).getTime();
    const now = new Date().getTime();

    if (now >= end) return 100;
    if (now <= start) return 0;

    const total = end - start;
    const progress = now - start;
    return Math.round((progress / total) * 100);
  };

  const activeInvestments = investments.filter((i) => i.status === 'ACTIVE' || i.status === 'PAUSED');
  const pastInvestments = investments.filter((i) => i.status === 'COMPLETED' || i.status === 'CANCELLED');

  // Analytics calculations
  const totalProfitEarned = transactions
    .filter(t => t.type === 'PROFIT')
    .reduce((acc, t) => acc + parseFloat(t.amount), 0);

  const totalExpectedProfit = activeInvestments
    .reduce((acc, i) => {
      const expected = i.expected_profit_type === 'PERCENT'
        ? parseFloat(i.amount) * (parseFloat(i.expected_profit) / 100)
        : parseFloat(i.expected_profit);
      return acc + expected;
    }, 0);

  const totalCreditedFromActive = activeInvestments
    .reduce((acc, i) => acc + parseFloat(i.profit_accrued), 0);

  const remainingExpectedProfit = Math.max(0, totalExpectedProfit - totalCreditedFromActive);
  const performancePercentage = totalExpectedProfit > 0
    ? Math.round((totalCreditedFromActive / totalExpectedProfit) * 100)
    : 0;

  // Chart data filter
  const getChartData = () => {
    const profitTx = transactions
      .filter(tx => tx.type === 'PROFIT')
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const nowTime = new Date().getTime();
    let cutoff = 0;
    if (filterRange === '7D') {
      cutoff = nowTime - (7 * 24 * 60 * 60 * 1000);
    } else if (filterRange === '30D') {
      cutoff = nowTime - (30 * 24 * 60 * 60 * 1000);
    }

    const filtered = cutoff > 0 
      ? profitTx.filter(tx => new Date(tx.created_at).getTime() >= cutoff)
      : profitTx;

    let cumulative = 0;
    return filtered.map(tx => {
      cumulative += parseFloat(tx.amount);
      return {
        date: new Date(tx.created_at).toLocaleDateString(),
        amount: cumulative,
        rawAmount: parseFloat(tx.amount)
      };
    });
  };

  const getSingleInvestmentChartData = (inv) => {
    if (!inv) return [];
    const invTransactions = transactions
      .filter(t => t.type === 'PROFIT' && t.reference_id === String(inv.id))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    let cumulative = 0;
    const data = invTransactions.map(tx => {
      cumulative += parseFloat(tx.amount);
      return {
        date: new Date(tx.created_at).toLocaleDateString(),
        profit: cumulative,
        rawAmount: parseFloat(tx.amount)
      };
    });

    data.unshift({
      date: new Date(inv.start_date).toLocaleDateString(),
      profit: 0,
      rawAmount: 0
    });

    return data;
  };

  const getNextPayoutCountdown = () => {
    const activeInvs = investments.filter(i => i.status === 'ACTIVE' && i.next_payout_at);
    if (activeInvs.length === 0) return 'No active payouts';
    
    const dates = activeInvs.map(i => new Date(i.next_payout_at).getTime());
    const nextDate = Math.min(...dates);
    const diff = nextDate - now;
    if (diff <= 0) return 'Processing...';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const getRemainingTime = (endDateStr) => {
    const end = new Date(endDateStr).getTime();
    const diff = end - now;
    if (diff <= 0) return 'Matured';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const getElapsedDays = (startDateStr) => {
    const start = new Date(startDateStr).getTime();
    const diff = now - start;
    if (diff <= 0) return 0;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const getRemainingDays = (endDateStr) => {
    const end = new Date(endDateStr).getTime();
    const diff = end - now;
    if (diff <= 0) return 0;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
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

      <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-6">{t('Investment Portal')}</h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-gray-800 pb-4 mb-8">
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
            activeTab === 'plans'
              ? 'bg-cyanAccent text-black font-black'
              : 'text-gray-400 hover:text-white hover:bg-slate-800/30'
          }`}
        >
          <Sparkles size={14} /> {t('Investment Plans')}
        </button>
        <button
          onClick={() => setActiveTab('portfolios')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
            activeTab === 'portfolios'
              ? 'bg-cyanAccent text-black font-black'
              : 'text-gray-400 hover:text-white hover:bg-slate-800/30'
          }`}
        >
          <Layers size={14} /> {t('Active Portfolios')} ({activeInvestments.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
            activeTab === 'analytics'
              ? 'bg-cyanAccent text-black font-black'
              : 'text-gray-400 hover:text-white hover:bg-slate-800/30'
          }`}
        >
          <TrendingUp size={14} /> {t('Profit Analytics')}
        </button>
      </div>

      {activeTab === 'plans' && (
        <>
          {/* Plans List */}
          <div className="mb-12">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={18} className="text-cyanAccent" /> {t('Active Investment Plans')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <div key={plan.id} className="glass-panel p-6 sm:p-8 rounded-xl flex flex-col justify-between hover:border-cyanAccent/50 transition duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 h-24 w-24 bg-cyanAccent/5 rounded-bl-full group-hover:bg-cyanAccent/10 transition"></div>
                  
                  <div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyanAccent/10 text-cyanAccent border border-cyanAccent/20">
                      {plan.compounding ? t('Compound Return') : t('Fixed Return')}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mt-4">{plan.name}</h3>
                    
                    <div className="mt-6 space-y-3 text-xs text-slate-500 dark:text-gray-400">
                      <div className="flex justify-between border-b border-slate-200 dark:border-gray-800 pb-2">
                        <span>{t('Daily Profit:')}</span>
                        <span className="font-bold text-emeraldAccent">+{plan.daily_profit_percent}%</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 dark:border-gray-800 pb-2">
                        <span>{t('Min Investment:')}</span>
                        <span className="font-semibold text-slate-900 dark:text-white">${parseFloat(plan.min_deposit).toLocaleString()} USDT</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 dark:border-gray-800 pb-2">
                        <span>{t('Max Investment:')}</span>
                        <span className="font-semibold text-slate-900 dark:text-white">${parseFloat(plan.max_deposit).toLocaleString()} USDT</span>
                      </div>
                      <div className="flex justify-between pb-2">
                        <span>{t('Duration:')}</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{plan.duration_days} {t('Days')}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => openInvestModal(plan)}
                    className="w-full mt-8 rounded bg-gradient-to-r from-cyanAccent to-emeraldAccent py-3 text-xs font-bold text-black hover:opacity-90 transition flex items-center justify-center gap-1"
                  >
                    <Play size={14} className="fill-current" /> {t('Invest In Plan')}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Completed Investments history */}
          {pastInvestments.length > 0 && (
            <div className="glass-panel p-6 rounded-xl">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">{t('Completed Investments')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-gray-850 text-slate-555 dark:text-gray-400 font-semibold">
                      <th className="pb-3">{t('ID')}</th>
                      <th className="pb-3">{t('Plan')}</th>
                      <th className="pb-3">{t('Amount')}</th>
                      <th className="pb-3">{t('Accrued Profit')}</th>
                      <th className="pb-3">{t('Start Date')}</th>
                      <th className="pb-3">{t('End Date')}</th>
                      <th className="pb-3">{t('Status')}</th>
                      <th className="pb-3 text-right">{t('Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 dark:divide-gray-800/45 text-slate-700 dark:text-gray-300">
                    {pastInvestments.map((inv) => (
                      <tr key={inv.id}>
                        <td className="py-3 text-gray-500 font-mono">INV-{inv.id}</td>
                        <td className="py-3 font-semibold text-slate-900 dark:text-white">{inv.plan_details?.name}</td>
                        <td className="py-3">${parseFloat(inv.amount).toFixed(2)} {inv.currency}</td>
                        <td className="py-3 text-emeraldAccent">+${parseFloat(inv.profit_accrued).toFixed(2)}</td>
                        <td className="py-3 text-gray-550">{new Date(inv.start_date).toLocaleDateString()}</td>
                        <td className="py-3 text-gray-550">{new Date(inv.end_date).toLocaleDateString()}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.status === 'COMPLETED' ? 'bg-slate-200 dark:bg-gray-800 text-slate-500 dark:text-gray-400' : 'bg-red-400/15 text-red-400'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedDetailInvestment(inv);
                              setDetailModalOpen(true);
                            }}
                            className="px-2 py-1 bg-cyanAccent text-[#0b0f19] font-bold text-[9px] rounded hover:opacity-90 transition cursor-pointer"
                          >
                            View Growth
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'portfolios' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2">
            <Layers size={18} className="text-emeraldAccent" /> Your Active Investments
          </h2>

          {activeInvestments.length === 0 ? (
            <div className="glass-panel p-8 text-center text-xs text-gray-500 rounded-xl">
              You do not have any active investments currently.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeInvestments.map((inv) => {
                const start = new Date(inv.start_date).getTime();
                const end = new Date(inv.end_date).getTime();
                const total = end - start;
                const elapsed = now - start;
                const progress = total > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / total) * 100))) : 0;

                const expectedProfit = inv.expected_profit_type === 'PERCENT'
                  ? parseFloat(inv.amount) * (parseFloat(inv.expected_profit) / 100)
                  : parseFloat(inv.expected_profit);

                return (
                  <div key={inv.id} className="glass-panel p-6 rounded-xl space-y-4 relative border border-slate-250 dark:border-gray-800">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {inv.plan_details?.name}
                          {inv.status === 'PAUSED' && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              Paused
                            </span>
                          )}
                        </h4>
                        <span className="text-[10px] text-gray-500 font-mono">ID: INV-{inv.id}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emeraldAccent/15 text-emeraldAccent border border-emeraldAccent/20">
                        {inv.distribution_frequency} Yield
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-gray-400 block mb-0.5">Principal</span>
                        <span className="font-bold text-slate-900 dark:text-white">${parseFloat(inv.amount).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">Accrued Profit</span>
                        <span className="font-bold text-emeraldAccent">+${parseFloat(inv.profit_accrued).toFixed(6)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">Expected Payout</span>
                        <span className="font-bold text-cyanAccent">${expectedProfit.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">Next Payout</span>
                        <span className="font-semibold text-gray-300 font-mono text-[10px]">
                          {inv.status === 'PAUSED' ? 'Paused' : (inv.next_payout_at ? getRemainingTime(inv.next_payout_at) : 'Completed')}
                        </span>
                      </div>
                    </div>

                    {/* Progress tracking */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-500">
                        <span>Completion Progress: {progress}%</span>
                        <span className="flex items-center gap-0.5"><Clock size={10} /> Countdown: {getRemainingTime(inv.end_date)}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${inv.status === 'PAUSED' ? 'bg-amber-500' : 'bg-cyanAccent'}`} style={{ width: `${progress}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[9px] text-gray-400">
                        <span>Days Elapsed: {getElapsedDays(inv.start_date)}d</span>
                        <span>Days Remaining: {getRemainingDays(inv.end_date)}d</span>
                      </div>
                    </div>

                    {/* Footer toggles / actions */}
                    <div className="flex flex-wrap justify-between items-center text-xs pt-3 border-t border-slate-200 dark:border-gray-800 gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={inv.auto_reinvest}
                          onChange={() => handleToggleReinvest(inv.id)}
                          className="rounded border-slate-300 dark:border-gray-700 bg-slate-100 dark:bg-gray-900 text-cyanAccent focus:ring-0 focus:ring-offset-0 h-4 w-4"
                        />
                        <span className="text-slate-500 dark:text-gray-400 text-[11px]">Auto Reinvest on Maturity</span>
                      </label>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedDetailInvestment(inv);
                            setDetailModalOpen(true);
                          }}
                          className="px-3 py-1 bg-cyanAccent text-[#0b0f19] font-bold text-[10px] rounded hover:opacity-90 transition flex items-center gap-1 cursor-pointer"
                        >
                          <Activity size={10} /> Yield Growth
                        </button>
                        <button
                          onClick={() => handleWithdrawProfit(inv.id)}
                          disabled={parseFloat(inv.profit_accrued) <= 0}
                          className="px-3 py-1 bg-emeraldAccent text-black font-bold text-[10px] rounded hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                        >
                          Withdraw Profit
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Summary stats widgets */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-xl relative overflow-hidden">
              <DollarSign size={20} className="absolute right-4 top-4 text-cyanAccent opacity-20" />
              <span className="text-[10px] text-gray-400 font-bold block mb-1">Total Account Balance</span>
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                ${parseFloat(user?.balance || 0).toLocaleString()} <span className="text-[10px] text-gray-400">USDT</span>
              </span>
            </div>

            <div className="glass-panel p-4 rounded-xl relative overflow-hidden">
              <TrendingUp size={20} className="absolute right-4 top-4 text-emeraldAccent opacity-20" />
              <span className="text-[10px] text-gray-400 font-bold block mb-1">Total Profits Earned</span>
              <span className="text-lg sm:text-xl font-black text-emeraldAccent">
                +${totalProfitEarned.toFixed(6)}
              </span>
            </div>

            <div className="glass-panel p-4 rounded-xl relative overflow-hidden">
              <Clock size={20} className="absolute right-4 top-4 text-cyanAccent opacity-20" />
              <span className="text-[10px] text-gray-400 font-bold block mb-1">Pending expected Profit</span>
              <span className="text-lg sm:text-xl font-black text-cyanAccent">
                ${remainingExpectedProfit.toFixed(6)}
              </span>
            </div>

            <div className="glass-panel p-4 rounded-xl relative overflow-hidden">
              <Activity size={20} className="absolute right-4 top-4 text-emeraldAccent opacity-20" />
              <span className="text-[10px] text-gray-400 font-bold block mb-1">Portfolio Performance %</span>
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {performancePercentage}%
              </span>
            </div>
          </div>

          {/* Payout Chart */}
          <div className="glass-panel p-6 rounded-xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cumulative Profit Growth</h3>
                <span className="text-[10px] text-gray-500">Real-time performance index</span>
              </div>
              <div className="flex gap-2">
                {['7D', '30D', 'ALL'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setFilterRange(range)}
                    className={`px-2 py-1 text-[9px] font-bold rounded transition ${
                      filterRange === range
                        ? 'bg-cyanAccent text-black'
                        : 'text-gray-400 hover:text-white bg-slate-800/30'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[250px] w-full bg-slate-950/20 rounded-lg p-2 border border-slate-900/30">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px', textAlign: 'left' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                    itemStyle={{ color: '#22c55e' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#profitGrad)" name="Total Profit ($)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Timeline list of profit payouts */}
          <div className="glass-panel p-6 rounded-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Payout History Timeline</h3>
            
            {transactions.filter(t => t.type === 'PROFIT').length === 0 ? (
              <div className="text-center text-xs text-gray-500 py-6">
                No profit credits recorded yet.
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[300px] divide-y divide-slate-200 dark:divide-gray-800/50 pr-2">
                {transactions
                  .filter(t => t.type === 'PROFIT')
                  .map((tx) => (
                    <div key={tx.id} className="py-3 flex justify-between items-center text-xs hover:bg-slate-100/5 px-2 rounded transition">
                      <div className="space-y-1">
                        <span className="font-semibold text-slate-900 dark:text-white block">{tx.description}</span>
                        <span className="text-[10px] text-gray-500 block">{new Date(tx.created_at).toLocaleString()}</span>
                      </div>
                      <span className="font-bold text-emeraldAccent">
                        +${parseFloat(tx.amount).toFixed(6)} {tx.currency}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Investment Modal */}
      {modalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-xl relative border border-slate-200 dark:border-gray-805 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Invest in {selectedPlan.name}</h3>
            <p className="text-xs text-gray-400 mb-6">
              Expected Daily Yield: <span className="text-emeraldAccent font-bold">+{selectedPlan.daily_profit_percent}%</span>. Principal locks for {selectedPlan.duration_days} days.
            </p>

            {errorMsg && (
              <div className="rounded bg-red-950/30 border border-red-500/50 p-3 text-[11px] text-red-200 mb-4">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="rounded bg-emerald-950/30 border border-emerald-500/50 p-3 text-[11px] text-emerald-200 mb-4">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleInvest} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Select Investment Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded p-3 text-xs glass-input"
                >
                  <option value="USDT">USDT (ERC-20)</option>
                  <option value="BTC">Bitcoin (BTC)</option>
                  <option value="ETH">Ethereum (ETH)</option>
                  <option value="BNB">Binance Coin (BNB)</option>
                  <option value="SOL">Solana (SOL)</option>
                </select>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Available: {parseFloat(wallets.find(w => w.currency === currency)?.balance || 0).toFixed(6)} {currency}
                </span>
              </div>

              <div>
                <label htmlFor="modalAmount" className="text-xs font-semibold text-gray-400 block mb-1">
                  Investment Amount
                </label>
                <input
                  id="modalAmount"
                  type="number"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded p-3 text-xs glass-input"
                  placeholder="500"
                />
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Min: ${selectedPlan.min_deposit} | Max: ${selectedPlan.max_deposit.toLocaleString()} USDT
                </span>
              </div>

              <label className="flex items-center space-x-2 cursor-pointer py-2">
                <input
                  type="checkbox"
                  checked={autoReinvest}
                  onChange={(e) => setAutoReinvest(e.target.checked)}
                  className="rounded border-gray-700 bg-gray-900 text-cyanAccent focus:ring-0 focus:ring-offset-0 h-4 w-4"
                />
                <span className="text-gray-300 text-xs font-semibold">Auto Reinvest on Maturity</span>
              </label>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded bg-gradient-to-r from-cyanAccent to-emeraldAccent py-3 text-xs font-bold text-black hover:opacity-90 transition disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Confirm & Purchase'}
                </button>
                <button
                  type="button"
                  onClick={closeInvestModal}
                  className="flex-1 rounded border border-gray-700 py-3 text-xs font-bold text-white hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Investment Yield Growth Detail Modal */}
      {detailModalOpen && selectedDetailInvestment && (() => {
        const start = new Date(selectedDetailInvestment.start_date).getTime();
        const end = new Date(selectedDetailInvestment.end_date).getTime();
        const total = end - start;
        const elapsed = now - start;
        const progress = total > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / total) * 100))) : 0;

        const expectedProfit = selectedDetailInvestment.expected_profit_type === 'PERCENT'
          ? parseFloat(selectedDetailInvestment.amount) * (parseFloat(selectedDetailInvestment.expected_profit) / 100)
          : parseFloat(selectedDetailInvestment.expected_profit);

        const chartData = getSingleInvestmentChartData(selectedDetailInvestment);
        const invProfitTransactions = transactions
          .filter(t => t.type === 'PROFIT' && t.reference_id === String(selectedDetailInvestment.id))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // newest first

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-3xl glass-panel p-6 sm:p-8 rounded-xl relative border border-slate-200 dark:border-gray-805 shadow-2xl my-8">
              <button 
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedDetailInvestment(null);
                }} 
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition font-bold"
              >
                ✕
              </button>
              
              <div className="mb-4">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyanAccent/10 text-cyanAccent border border-cyanAccent/20">
                  {selectedDetailInvestment.plan_details?.name || 'Investment Plan'} (ID: INV-{selectedDetailInvestment.id})
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-2">
                  <TrendingUp className="text-cyanAccent" size={20} /> Profit Accrual Growth Tracker
                </h3>
                <p className="text-xs text-gray-450 mt-1">Real-time daily yield accumulation history and projections.</p>
              </div>

              {/* Status and Progress banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-100/40 dark:bg-gray-950/20 border border-slate-250 dark:border-gray-850 rounded-lg text-xs mb-6">
                <div>
                  <span className="text-gray-500 block mb-0.5 uppercase font-bold text-[9px]">Status</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                    selectedDetailInvestment.status === 'ACTIVE' ? 'bg-emeraldAccent/15 text-emeraldAccent border border-emeraldAccent/20' :
                    selectedDetailInvestment.status === 'PAUSED' ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20' :
                    'bg-slate-200 dark:bg-gray-800 text-slate-500'
                  }`}>{selectedDetailInvestment.status}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5 uppercase font-bold text-[9px]">Principal Amount</span>
                  <span className="font-bold text-slate-900 dark:text-white">${parseFloat(selectedDetailInvestment.amount).toFixed(2)} {selectedDetailInvestment.currency}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5 uppercase font-bold text-[9px]">Accrued Yield</span>
                  <span className="font-bold text-emeraldAccent">+${parseFloat(selectedDetailInvestment.profit_accrued).toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5 uppercase font-bold text-[9px]">Total Expected Payout</span>
                  <span className="font-bold text-cyanAccent">${expectedProfit.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side: Performance Chart */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Profit Growth Chart</h4>
                  
                  <div className="h-[220px] w-full bg-slate-950/20 rounded-lg p-2 border border-slate-900/30">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="invProfitGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.2} />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={9} />
                        <YAxis stroke="#64748b" fontSize={9} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px', textAlign: 'left' }}
                          labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                          itemStyle={{ color: '#10b981' }}
                        />
                        <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#invProfitGrad)" name="Profit ($)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Progress detail */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-gray-500 font-semibold text-[10px]">
                      <span>COMPLETION: {progress}%</span>
                      <span>COUNTDOWN: {getRemainingTime(selectedDetailInvestment.end_date)}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyanAccent to-emeraldAccent" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 font-medium">
                      <span>Start: {new Date(selectedDetailInvestment.start_date).toLocaleDateString()}</span>
                      <span>End: {new Date(selectedDetailInvestment.end_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Timeline of Daily Payouts */}
                <div className="flex flex-col h-[320px]">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Daily Yield Transaction History</h4>
                  
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-gray-800/50 pr-2 max-h-[280px]">
                    {invProfitTransactions.length === 0 ? (
                      <div className="text-center text-xs text-gray-500 py-12">
                        No profit distributions recorded yet. Daily yields accrue automatically according to your package timeline.
                      </div>
                    ) : (
                      invProfitTransactions.map((tx) => (
                        <div key={tx.id} className="py-2.5 flex justify-between items-center text-xs hover:bg-slate-100/5 px-2 rounded transition">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-900 dark:text-white block text-[11px]">{tx.description}</span>
                            <span className="text-[9px] text-gray-550 block">{new Date(tx.created_at).toLocaleString()}</span>
                          </div>
                          <span className="font-bold text-emeraldAccent text-[11px]">
                            +${parseFloat(tx.amount).toFixed(6)} {tx.currency}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => {
                    setDetailModalOpen(false);
                    setSelectedDetailInvestment(null);
                  }}
                  className="px-6 py-2.5 border border-gray-700 rounded text-xs font-bold text-white hover:bg-gray-800 transition cursor-pointer"
                >
                  Close Tracker
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Invest;
