import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const INITIAL_COINS = [
  { name: 'Bitcoin', symbol: 'BTC', price: 64230.50, change24h: 2.45, volume: '28.4B', high: 64800.00, low: 62900.00 },
  { name: 'Ethereum', symbol: 'ETH', price: 3450.25, change24h: -1.12, volume: '14.2B', high: 3520.00, low: 3410.00 },
  { name: 'Solana', symbol: 'SOL', price: 142.80, change24h: 5.78, volume: '3.8B', high: 145.50, low: 134.20 },
  { name: 'BNB', symbol: 'BNB', price: 575.40, change24h: 0.15, volume: '1.2B', high: 580.10, low: 571.50 },
  { name: 'Cardano', symbol: 'ADA', price: 0.385, change24h: -2.34, volume: '320M', high: 0.398, low: 0.378 },
  { name: 'Ripple', symbol: 'XRP', price: 0.485, change24h: 1.05, volume: '740M', high: 0.495, low: 0.476 }
];

const LiveMarketTrades = () => {
  const { t } = useTranslation();
  const [coins, setCoins] = useState(INITIAL_COINS);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [blinkStates, setBlinkStates] = useState(new Map()); // Map of symbol => 'up' | 'down' | null

  useEffect(() => {
    const interval = setInterval(() => {
      const indexesToUpdate = [];
      while (indexesToUpdate.length < 2) {
        const idx = Math.floor(Math.random() * INITIAL_COINS.length);
        if (!indexesToUpdate.includes(idx)) {
          indexesToUpdate.push(idx);
        }
      }

      setCoins((prevCoins) =>
        prevCoins.map((coin, index) => {
          if (indexesToUpdate.includes(index)) {
            const percentChange = (Math.random() * 0.4 - 0.2) / 100;
            const priceDiff = coin.price * percentChange;
            const newPrice = coin.price + priceDiff;
            const direction = priceDiff >= 0 ? 'up' : 'down';
            
            setBlinkStates((prev) => {
              const next = new Map(prev);
              next.set(coin.symbol, direction);
              return next;
            });
            setTimeout(() => {
              setBlinkStates((prev) => {
                const next = new Map(prev);
                next.delete(coin.symbol);
                return next;
              });
            }, 1000);

            const newChange = coin.change24h + (percentChange * 100);
            
            return {
              ...coin,
              price: newPrice,
              change24h: newChange,
              high: newPrice > coin.high ? newPrice : coin.high,
              low: newPrice < coin.low ? newPrice : coin.low
            };
          }
          return coin;
        })
      );
      setLastUpdated(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel rounded-xl p-6 glow-cyan">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {t('Live Market Trades')} <span className="h-2 w-2 rounded-full bg-emeraldAccent animate-pulse"></span>
          </h3>
          <p className="text-[10px] text-gray-400">{t('Popular digital currencies observed in real-time.')}</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <RefreshCw size={12} className="animate-spin-slow" />
          <span>{t('Updated: ')}{lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-gray-800 text-slate-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
              <th className="pb-3">{t('Asset')}</th>
              <th className="pb-3 text-right">{t('Price')}</th>
              <th className="pb-3 text-right">{t('24h Change')}</th>
              <th className="pb-3 text-right hidden sm:table-cell">{t('24h High / Low')}</th>
              <th className="pb-3 text-right hidden sm:table-cell">{t('Volume (24h)')}</th>
              <th className="pb-3 text-center">{t('Trend')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800/40 text-slate-700 dark:text-gray-300">
            {coins.map((coin) => {
              const isPositive = coin.change24h >= 0;
              const blink = blinkStates.get(coin.symbol) || null;
              let rowBlinkClass = "";
              if (blink === 'up') {
                rowBlinkClass = "bg-emeraldAccent/5 transition-colors duration-150";
              } else if (blink === 'down') {
                rowBlinkClass = "bg-red-500/5 transition-colors duration-150";
              }

              return (
                <tr key={coin.symbol} className={`hover:bg-slate-100/50 dark:hover:bg-gray-800/10 ${rowBlinkClass}`}>
                  <td className="py-3.5 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-cyanAccent/10 text-cyanAccent flex items-center justify-center font-bold text-xs">
                      {coin.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-white block">{coin.name}</span>
                      <span className="text-[10px] text-gray-500 uppercase">{coin.symbol}/USDT</span>
                    </div>
                  </td>
                  <td className={`py-3.5 text-right font-bold transition-all duration-300 ${
                    blink === 'up' ? 'text-emeraldAccent scale-105' : 
                    blink === 'down' ? 'text-red-450 scale-105' : 'text-slate-900 dark:text-white'
                  }`}>
                    ${coin.price.toLocaleString(undefined, {
                      minimumFractionDigits: coin.price < 1 ? 4 : 2,
                      maximumFractionDigits: coin.price < 1 ? 4 : 2
                    })}
                  </td>
                  <td className={`py-3.5 text-right font-bold ${
                    isPositive ? 'text-emeraldAccent' : 'text-red-400'
                  }`}>
                    {isPositive ? '+' : ''}{coin.change24h.toFixed(2)}%
                  </td>
                  <td className="py-3.5 text-right text-gray-500 hidden sm:table-cell">
                    <span className="text-emeraldAccent font-semibold text-[10px]">${coin.high.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                    <span className="mx-1">/</span>
                    <span className="text-red-400 font-semibold text-[10px]">${coin.low.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                  </td>
                  <td className="py-3.5 text-right text-gray-500 hidden sm:table-cell">
                    ${coin.volume}
                  </td>
                  <td className="py-3.5 text-center">
                    <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full ${
                      isPositive ? 'bg-emeraldAccent/15 text-emeraldAccent' : 'bg-red-500/15 text-red-450'
                    }`}>
                      {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LiveMarketTrades;
