import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, ArrowDownLeft, ArrowUpRight, Award, Clock, Sparkles } from 'lucide-react';
import LiveMarketTrades from '../../components/LiveMarketTrades';

const Dashboard = () => {
  const { user, fetchUserMe } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ invested: 0, profit: 0, referral: 0 });
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  // Currency conversion states
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  const [convertedBalance, setConvertedBalance] = useState(null);
  const [converting, setConverting] = useState(false);

  // Live calculator states
  const [calcAmount, setCalcAmount] = useState('');
  const [calcCurrency, setCalcCurrency] = useState('BTC');
  const [calcResult, setCalcResult] = useState('0.00');
  const [calcLoading, setCalcLoading] = useState(false);

  const fetchConversion = async (currency) => {
    if (currency === 'USDT') {
      setConvertedBalance(null);
      return;
    }
    setConverting(true);
    try {
      const res = await api.get(`convert-balance/?target_currency=${currency}`);
      setConvertedBalance(res.data.converted_amount);
    } catch (err) {
      console.error(err);
    } finally {
      setConverting(false);
    }
  };

  useEffect(() => {
    fetchConversion(selectedCurrency);
  }, [selectedCurrency, user?.balance]);

  useEffect(() => {
    if (user?.balance) {
      setCalcAmount(parseFloat(user.balance).toString());
    }
  }, [user?.balance]);

  const handleConvertCalculate = async () => {
    if (!calcAmount || isNaN(parseFloat(calcAmount))) return;
    setCalcLoading(true);
    try {
      const rates = {
        'BTC': 65230.50,
        'ETH': 3450.25,
        'USDT': 1.00,
        'BNB': 585.10,
        'SOL': 145.75,
        'EUR': 0.92,
        'GBP': 0.79,
      };
      const rate = Object.prototype.hasOwnProperty.call(rates, calcCurrency) ? rates[calcCurrency] : 1;
      const amount = parseFloat(calcAmount);
      let resVal = 0;
      if (['BTC', 'ETH', 'BNB', 'SOL'].includes(calcCurrency)) {
        resVal = amount / rate;
      } else {
        resVal = amount * rate;
      }
      setCalcResult(resVal.toLocaleString(undefined, { maximumFractionDigits: 6 }));
    } catch (err) {
      console.error(err);
    } finally {
      setCalcLoading(false);
    }
  };

  useEffect(() => {
    handleConvertCalculate();
  }, [calcAmount, calcCurrency]);

  const handleWithdrawDailyProfit = async () => {
    if (parseFloat(user?.profit_balance || 0) <= 0) return;
    setWithdrawing(true);
    try {
      const res = await api.post('users/me/withdraw-profit/');
      alert(res.data.message || 'Profit successfully withdrawn to USDT wallet!');
      fetchUserMe();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to withdraw daily profit.');
    } finally {
      setWithdrawing(false);
    }
  };


  useEffect(() => {
    fetchUserMe();
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [txRes, invRes] = await Promise.all([
        api.get('transactions/'),
        api.get('investments/')
      ]);

      setTransactions(txRes.data.slice(0, 5)); // get recent 5
      
      // Calculate stats
      let investedSum = 0;
      let profitSum = 0;
      invRes.data.forEach((inv) => {
        if (inv.status === 'ACTIVE') {
          investedSum += parseFloat(inv.amount);
          profitSum += parseFloat(inv.profit_accrued);
        }
      });

      // Calculate referral bonuses from transactions
      let referralSum = 0;
      txRes.data.forEach((tx) => {
        if (tx.type === 'REFERRAL_BONUS') {
          referralSum += parseFloat(tx.amount);
        }
      });

      setStats({
        invested: investedSum,
        profit: profitSum,
        referral: referralSum
      });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const activeInvestment = user?.active_investment !== undefined ? parseFloat(user.active_investment || 0) : stats.invested;
  const profitAccrued = user?.profit_accrued !== undefined ? parseFloat(user.profit_accrued || 0) : stats.profit;
  const referralBonus = user?.referral_bonus !== undefined ? parseFloat(user.referral_bonus || 0) : stats.referral;

  // Mock data for the portfolio performance chart
  const chartData = [
    { day: 'Mon', value: activeInvestment * 1.0 },
    { day: 'Tue', value: activeInvestment * 1.01 },
    { day: 'Wed', value: activeInvestment * 1.015 },
    { day: 'Thu', value: (activeInvestment + profitAccrued) * 0.99 },
    { day: 'Fri', value: (activeInvestment + profitAccrued) * 1.01 },
    { day: 'Sat', value: (activeInvestment + profitAccrued) * 1.02 },
    { day: 'Sun', value: (activeInvestment + profitAccrued) * 1.025 + referralBonus },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-transparent">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyanAccent border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 min-h-[calc(100vh-4rem)] text-left">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Welcome back, {user?.full_name}</h1>
          <p className="text-xs text-gray-400">Track and manage your crypto portfolio yield.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-gray-800 p-2 rounded-lg transition-colors">
          <Award className="text-goldAccent" size={20} />
          <div className="text-left">
            <span className="text-[10px] text-gray-400 block font-semibold">Tier Status</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">{user?.vip_level_details?.name || 'VIP Level 1'}</span>
          </div>
        </div>
      </div>

      {user?.is_frozen && (
        <div className="rounded-md bg-red-950/40 border border-red-500/50 p-4 text-xs text-red-200 mb-8">
          ⚠ Your account is currently FROZEN. Transactions, investments and withdrawals are disabled. Please contact support.
        </div>
      )}

      {/* Main cards */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-8">
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Available Balance</span>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="text-[10px] bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-slate-800 dark:text-white rounded px-1.5 py-0.5 font-bold outline-none cursor-pointer"
            >
              <option value="USDT">USDT</option>
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
              <option value="BNB">BNB</option>
              <option value="SOL">SOL</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 dark:text-white">${parseFloat(user?.balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            {selectedCurrency !== 'USDT' && convertedBalance !== null && (
              <span className="text-xs font-bold text-cyanAccent block mt-1">
                ≈ {converting ? '...' : `${convertedBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${selectedCurrency}`}
              </span>
            )}
            <span className="text-[9px] text-gray-500 block mt-1">USDT equivalent</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Active Investment</span>
            <TrendingUp className="text-emeraldAccent" size={16} />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 dark:text-white">${activeInvestment.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            <span className="text-[9px] text-gray-500 block mt-1">Accruing daily returns</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Profit Accrued</span>
            <ArrowUpRight className="text-emeraldAccent" size={16} />
          </div>
          <div>
            <span className="text-xl font-black text-emeraldAccent">+${profitAccrued.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            <span className="text-[9px] text-gray-500 block mt-1">Ready for withdrawal</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Referral Bonus</span>
            <ArrowDownLeft className="text-purple-400" size={16} />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 dark:text-white">${referralBonus.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            <span className="text-[9px] text-gray-500 block mt-1">Earned from referrals</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between border border-cyanAccent/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-1 bg-cyanAccent/10 text-cyanAccent text-[8px] uppercase tracking-widest font-black rounded-bl">New Yield</div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Daily Reward</span>
            <Sparkles className="text-cyanAccent" size={16} />
          </div>
          <div>
            <span className="text-xl font-black text-cyanAccent">+${parseFloat(user?.profit_balance || 0).toFixed(2)}</span>
            <button
              onClick={handleWithdrawDailyProfit}
              disabled={withdrawing || parseFloat(user?.profit_balance || 0) <= 0}
              className="w-full mt-2 py-1 bg-cyanAccent text-black font-bold text-[9px] rounded hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {withdrawing ? 'Withdrawing...' : 'Claim to Wallet'}
            </button>
          </div>
        </div>
      </div>


      {/* Quick Actions & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Portfolio Growth (USDT Value)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#4b5563" fontSize={11} />
                <YAxis stroke="#4b5563" fontSize={11} hide={true} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937' }} itemStyle={{ color: '#fff' }} />
                <Area type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions & Limits info */}
        <div className="glass-panel p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Quick Financial Actions</h3>
            <div className="grid grid-cols-1 gap-4">
              <Link
                to="/deposit"
                className="w-full flex items-center justify-center py-3 bg-cyanAccent text-black font-bold text-xs rounded hover:opacity-90 transition shadow-sm"
              >
                Deposit Funds
              </Link>
              <Link
                to="/withdraw"
                className="w-full flex items-center justify-center py-3 border border-slate-350 dark:border-gray-700 text-slate-800 dark:text-white font-bold text-xs rounded hover:bg-slate-100 dark:hover:bg-gray-800 transition"
              >
                Withdraw Balance
              </Link>
              <Link
                to="/invest"
                className="w-full flex items-center justify-center py-3 bg-gradient-to-r from-cyanAccent to-emeraldAccent text-black font-bold text-xs rounded hover:opacity-90 transition shadow-sm"
              >
                Invest in Plans
              </Link>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 dark:border-gray-850 pt-4 text-xs text-gray-400 space-y-2">
            <div className="flex justify-between">
              <span>KYC Level:</span>
              <span className="font-semibold text-slate-800 dark:text-white">Level {user?.kyc_level}</span>
            </div>
            <div className="flex justify-between">
              <span>Account Status:</span>
              <span className={`font-semibold ${user?.is_frozen ? 'text-red-400' : 'text-emeraldAccent'}`}>
                {user?.is_frozen ? 'Frozen' : 'Active'}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Live Balance & Currency Converter */}
      <div className="glass-panel p-6 rounded-xl mb-8">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles size={16} className="text-cyanAccent" /> Live Balance & Currency Converter
        </h3>
        <p className="text-xs text-gray-400 mb-6">Convert any custom amount or your current available balance to other digital assets and fiat currencies instantly using real-time rates.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">Amount to Convert (USDT)</label>
            <div className="relative">
              <input
                type="number"
                step="any"
                className="w-full p-2.5 rounded glass-input text-xs font-bold"
                value={calcAmount}
                onChange={(e) => setCalcAmount(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setCalcAmount(parseFloat(user?.balance || 0).toString())}
                className="absolute right-2 top-1.5 px-2 py-1 bg-cyanAccent/10 text-cyanAccent text-[9px] font-bold rounded hover:bg-cyanAccent/20 transition cursor-pointer"
              >
                Max Balance
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">Convert To</label>
            <select
              value={calcCurrency}
              onChange={(e) => setCalcCurrency(e.target.value)}
              className="w-full p-2.5 rounded glass-input text-xs font-bold cursor-pointer"
            >
              <option value="BTC">Bitcoin (BTC)</option>
              <option value="ETH">Ethereum (ETH)</option>
              <option value="BNB">Binance Coin (BNB)</option>
              <option value="SOL">Solana (SOL)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="GBP">British Pound (GBP)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">Result Amount</label>
            <div className="w-full p-2.5 rounded bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-xs font-bold text-slate-800 dark:text-white min-h-[38px] flex items-center">
              {calcLoading ? 'Converting...' : `${calcResult} ${calcCurrency}`}
            </div>
          </div>

          <div>
            <button
              onClick={handleConvertCalculate}
              disabled={calcLoading || !calcAmount}
              className="w-full py-2.5 bg-gradient-to-r from-cyanAccent to-emeraldAccent text-black font-bold text-xs rounded hover:opacity-90 transition shadow-sm cursor-pointer"
            >
              Calculate Exchange
            </button>
          </div>
        </div>
      </div>

      {/* Live Trade Tickers Table */}
      <div className="mb-8">
        <LiveMarketTrades />
      </div>

      {/* Recent Ledger Transactions */}
      <div className="glass-panel rounded-xl p-6">

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Activity</h3>
          <Link to="/wallets" className="text-xs text-cyanAccent hover:underline">View All Ledger</Link>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-500 flex flex-col items-center justify-center">
            <Clock size={32} className="text-slate-400 dark:text-gray-600 mb-2" />
            No transaction records found in ledger.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-gray-850 text-slate-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Currency</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-gray-800/40 text-slate-700 dark:text-gray-300">
                {transactions.map((tx) => {
                  const isCredit = ['DEPOSIT', 'PROFIT', 'REFERRAL_BONUS'].includes(tx.type) || 
                    (tx.type === 'ADMIN_ADJUSTMENT' && parseFloat(tx.amount) > 0);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-100/50 dark:hover:bg-gray-800/10">
                      <td className="py-3 font-semibold text-slate-800 dark:text-white">
                        {isCredit ? 'Credit Alert' : 'Debit Alert'}
                        <span className="text-[9px] text-gray-500 block font-normal uppercase tracking-wider">{tx.type.replace('_', ' ')}</span>
                      </td>
                      <td className={`py-3 font-semibold ${isCredit ? 'text-emeraldAccent' : 'text-red-400'}`}>
                        {isCredit ? '+' : '-'}${Math.abs(parseFloat(tx.amount)).toFixed(2)}
                      </td>
                      <td className="py-3">{tx.currency}</td>
                      <td className="py-3 text-gray-450">{tx.description}</td>
                      <td className="py-3 text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.status === 'COMPLETED' ? 'bg-emeraldAccent/15 text-emeraldAccent' : 'bg-yellow-500/15 text-yellow-500'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
