import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowUpRight, UserPlus, Zap, HelpCircle, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../../api/api';
import Footer from '../../components/Footer';

const Stat = ({ label, value }) => (
  <div className="space-y-1">
    <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</div>
    <div className="text-xs text-slate-500 dark:text-gray-400">{label}</div>
  </div>
);

function MiniBars() {
  return (
    <div className="mt-6 flex h-24 items-end gap-3 rounded-xl bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/20 dark:to-gray-900 p-4">
      {[18, 48, 72, 96].map((h, i) => (
        <motion.div
          key={i}
          initial={{ height: 0, opacity: 0.6 }}
          animate={{ height: h * 0.7 }}
          transition={{ delay: 0.5 + i * 0.15, type: "spring" }}
          className="w-8 rounded-t bg-gradient-to-t from-emerald-400 to-emerald-500 shadow-inner"
        />
      ))}
    </div>
  );
}

function Planet() {
  return (
    <motion.svg
      initial={{ rotate: -8 }}
      animate={{ rotate: 0 }}
      transition={{ duration: 2, type: "spring" }}
      width="150"
      height="150"
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <circle cx="110" cy="110" r="56" fill="url(#grad)" opacity="0.95" />
      <circle cx="94" cy="98" r="10" fill="white" opacity="0.45" />
      <circle cx="132" cy="126" r="8" fill="white" opacity="0.35" />
      <motion.ellipse
        cx="110" cy="110" rx="100" ry="34" stroke="white" strokeOpacity="0.6" fill="none"
        animate={{ strokeDashoffset: [200, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} strokeDasharray="200 200"
      />
      <motion.circle cx="210" cy="110" r="4" fill="white" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 2.2, repeat: Infinity }} />
    </motion.svg>
  );
}

const Home = () => {
  const [marketData, setMarketData] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [calcPlan, setCalcPlan] = useState('starter'); // starter, premium, gold
  const [calcAmount, setCalcAmount] = useState(500);
  const [faqOpen, setFaqOpen] = useState(null);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchPrices = async () => {
    try {
      const res = await api.get('market-data/');
      setMarketData(res.data);
      setLoadingPrices(false);
    } catch (err) {
      console.error(err);
    }
  };

  const getPlanDetails = () => {
    switch (calcPlan) {
      case 'premium':
        return { name: 'Premium Plan', daily: 1.2, duration: 90, min: 1000, max: 9999 };
      case 'gold':
        return { name: 'Gold VIP Plan', daily: 2.5, duration: 180, min: 10000, max: 100000 };
      default:
        return { name: 'Starter Plan', daily: 0.5, duration: 30, min: 100, max: 999 };
    }
  };

  const plan = getPlanDetails();
  const dailyReturn = calcAmount * (plan.daily / 100);
  const totalReturn = dailyReturn * plan.duration;

  const toggleFaq = (index) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  const faqs = [
    { q: 'How does the investment process work?', a: 'Choose an investment plan (Starter, Premium, or Gold VIP), deposit your crypto funds, and purchase the plan. Returns accrue daily and can be withdrawn directly to your wallet.' },
    { q: 'What are the withdrawal limits?', a: 'The minimum withdrawal limit is $10 (or equivalent). Higher VIP levels receive fee discounts and faster withdrawal processing.' },
    { q: 'Is identity verification (KYC) mandatory?', a: 'Yes. To protect our brokerage integrity, KYC verification is required. Basic features are enabled at Level 1, while deposit/withdrawal limits unlock fully at Level 2 (Identity Document upload) and Level 3 (Selfie + SSN).' },
    { q: 'What is the referral bonus structure?', a: 'Share your referral code from your profile. When new users register using your code and invest, you earn referral bonuses directly credited to your wallet.' }
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-darkBg text-slate-900 dark:text-gray-100 transition-colors duration-300">
      
      {/* Hero Section */}
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-4 pt-12 pb-20 md:grid-cols-2 sm:px-6 lg:px-8 lg:pt-20">
        
        {/* Left: headline */}
        <div className="flex flex-col justify-center space-y-8 pr-2">
          <div className="space-y-4">
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-cyanAccent ring-1 ring-inset ring-emerald-500/20">
              ⚡ Next Generation Yield Optimization
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight text-slate-900 dark:text-white">
              Secure your crypto
              <br />
              with precision.
            </h1>
            <p className="max-w-md text-sm text-slate-650 dark:text-gray-400 leading-relaxed">
              Join over a million users who trust <span className="font-semibold text-slate-900 dark:text-white">PrimeVolt</span> for high-yield cryptocurrency brokerage and secure assets protection.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/register"
              className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800 px-6 py-3 text-xs font-bold shadow-lg transition-all flex items-center gap-1.5"
            >
              Open Account <ArrowUpRight className="h-4 w-4" />
            </Link>
            <a 
              href="#calculator" 
              className="text-xs font-bold text-slate-600 dark:text-gray-300 hover:text-cyanAccent transition"
            >
              Calculate ROI →
            </a>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-2 md:max-w-sm border-t border-slate-200 dark:border-gray-800/80">
            <Stat label="Total Currencies" value="140+" />
            <Stat label="Total Volume" value="$1.2B" />
          </div>

          <div className="mt-6 flex items-center gap-6 opacity-70">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-gray-400">TRUSTED BY THE BEST</span>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-400 dark:text-gray-600">
              <span>loom</span>
              <span>HubSpot</span>
              <span>ramp</span>
            </div>
          </div>
        </div>

        {/* Right: animated card grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Secure card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative col-span-1 overflow-hidden rounded-xl bg-gradient-to-b from-emerald-950 to-emerald-800 p-6 text-emerald-50 shadow-lg min-h-[170px] flex flex-col justify-between"
          >
            <div className="absolute inset-0">
              <svg className="absolute inset-0 h-full w-full opacity-20" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="rg" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                </defs>
                <rect width="400" height="400" fill="url(#rg)" />
                {[...Array(10)].map((_, i) => (
                  <circle key={i} cx="200" cy="200" r={20 + i * 18} fill="none" stroke="currentColor" strokeOpacity="0.1" />
                ))}
              </svg>
            </div>

            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-emerald-700/60 p-1.5 ring-1 ring-white/10">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-200 font-bold">Extra Secure</span>
              </div>
              <div className="mt-8 text-base font-semibold leading-snug text-emerald-50/95">
                Advanced AES-256
                <br />
                cryptographic security keeps your money safe.
              </div>
              <motion.div
                className="absolute right-2 top-2 h-10 w-10 rounded-full bg-emerald-600/30"
                animate={{ boxShadow: ["0 0 0 0 rgba(16,185,129,0.35)", "0 0 0 12px rgba(16,185,129,0)"] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            </div>
          </motion.div>

          {/* Currencies card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative col-span-1 overflow-hidden rounded-xl bg-gradient-to-b from-teal-500 to-emerald-500 p-6 text-white shadow-lg min-h-[170px] flex flex-col justify-between"
          >
            <div className="pointer-events-none absolute -right-6 -top-6 opacity-60">
              <Planet />
            </div>
            <div className="relative mt-12">
              <div className="text-[10px] text-emerald-100 uppercase tracking-widest font-semibold">Global Reach</div>
              <div className="text-base font-semibold leading-snug mt-2">
                Dozens of popular assets
                <br /> in one single platform.
              </div>
            </div>
          </motion.div>

          {/* Growth card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="col-span-1 sm:col-span-2 rounded-xl bg-white dark:bg-[#111827] p-6 text-slate-800 dark:text-gray-100 shadow-lg border border-slate-200 dark:border-gray-800"
          >
            <div className="text-xs text-slate-500 dark:text-gray-400">Total Yield Growth</div>
            <div className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              $50,240.85 <span className="text-xs font-medium text-slate-400 align-middle">USDT</span>
            </div>
            <div className="mt-1 text-xs font-bold text-emeraldAccent">↑ +1.24% today</div>
            <MiniBars />
          </motion.div>
        </div>
      </div>

      {/* Live Market Prices */}
      <section className="py-16 bg-slate-100/40 dark:bg-darkCard/40 border-y border-slate-200 dark:border-gray-800/80 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Zap size={18} className="text-cyanAccent" /> Live Crypto Markets
              </h2>
              <p className="text-[10px] text-gray-400">Real-time asset exchange rates from leading liquidity pools.</p>
            </div>
            <span className="text-[10px] text-gray-500 font-medium">Refreshes automatically</span>
          </div>

          {loadingPrices ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyanAccent border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {marketData.slice(0, 5).map((coin) => {
                const isPos = coin.change_24h >= 0;
                return (
                  <div key={coin.symbol} className="glass-panel p-5 rounded-xl flex flex-col text-left border border-slate-200 dark:border-gray-800">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{coin.name}</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white mt-2">${coin.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    <span className={`inline-flex items-center gap-1 text-xs mt-2 font-bold ${isPos ? 'text-emeraldAccent' : 'text-red-400'}`}>
                      {isPos ? '+' : ''}{coin.change_24h.toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Interactive ROI Calculator */}
      <section id="calculator" className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">Investment ROI Calculator</h2>
          <p className="mt-2 text-xs text-gray-400">Estimate your potential returns based on our active investment plans.</p>

          <div className="glass-panel p-6 sm:p-8 rounded-xl mt-12 text-left grid grid-cols-1 md:grid-cols-2 gap-8 border border-slate-200 dark:border-gray-800 shadow-2xl">
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-gray-400 block mb-3 uppercase tracking-wider">Select Plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {['starter', 'premium', 'gold'].map((planKey) => (
                    <button
                      key={planKey}
                      onClick={() => {
                        setCalcPlan(planKey);
                        if (planKey === 'starter') setCalcAmount(500);
                        if (planKey === 'premium') setCalcAmount(3000);
                        if (planKey === 'gold') setCalcAmount(25000);
                      }}
                      className={`py-2 px-3 rounded text-xs font-bold border capitalize transition ${
                        calcPlan === planKey 
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-lg shadow-emerald-700/20' 
                          : 'border-slate-300 dark:border-gray-800 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {planKey === 'gold' ? 'Gold VIP' : planKey}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                  <span>Investment Amount</span>
                  <span className="text-cyanAccent font-black text-sm">${calcAmount.toLocaleString()} USDT</span>
                </div>
                <input
                  type="range"
                  min={plan.min}
                  max={plan.max}
                  step={plan.min / 2}
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyanAccent"
                />
                <div className="flex justify-between text-[9px] text-gray-500 mt-1.5">
                  <span>Min: ${plan.min} USDT</span>
                  <span>Max: ${plan.max.toLocaleString()} USDT</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-100/40 dark:bg-darkCard/30 border border-slate-200 dark:border-gray-800/80 rounded-xl p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between border-b border-slate-200 dark:border-gray-800/40 pb-2.5">
                  <span className="text-xs text-slate-500 dark:text-gray-400">Daily Return ({plan.daily}%)</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">${dailyReturn.toFixed(2)} USDT</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-gray-800/40 pb-2.5">
                  <span className="text-xs text-slate-500 dark:text-gray-400">Plan Duration</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{plan.duration} Days</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-xs text-slate-500 dark:text-gray-400">Principal Locking</span>
                  <span className="text-xs font-bold text-slate-505">Locked</span>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-200 dark:border-gray-800 flex justify-between items-end">
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Total Est. Profit</span>
                  <span className="text-2xl font-black text-emeraldAccent">${totalReturn.toLocaleString(undefined, {minimumFractionDigits: 2})} USDT</span>
                </div>
                <Link
                  to="/register"
                  className="px-5 py-2.5 bg-gradient-to-r from-cyanAccent to-emeraldAccent text-black text-xs font-bold rounded hover:opacity-90 transition shadow shadow-cyanAccent/10"
                >
                  Invest Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="glass-panel rounded-xl overflow-hidden border border-slate-200 dark:border-gray-800 shadow-sm">
              <button
                onClick={() => toggleFaq(i)}
                className="w-full flex justify-between items-center p-5 text-left text-xs font-semibold text-slate-800 dark:text-white hover:bg-slate-100/50 dark:hover:bg-gray-800/20 transition"
              >
                <span>{faq.q}</span>
                <HelpCircle size={16} className={`text-cyanAccent transition-transform duration-300 ${faqOpen === i ? 'rotate-180' : ''}`} />
              </button>
              {faqOpen === i && (
                <div className="p-5 border-t border-slate-250 dark:border-gray-800/60 bg-slate-100/20 dark:bg-[#090b12]/20 text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
