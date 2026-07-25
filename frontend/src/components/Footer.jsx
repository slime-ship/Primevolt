import React from 'react';

const Footer = () => {
  return (
    <footer className="border-t border-[#2F80ED]/15 bg-white dark:bg-[#040d1c] py-8 text-slate-500 dark:text-gray-400 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-tr from-[#0A3D91] to-[#2F80ED] text-white shadow-md shadow-[#0A3D91]/20">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12c5 0 4-8 10-8 0 3 6 3 6 8s-6 5-6 8c-6 0-5-8-10-8Z" fill="currentColor" />
                </svg>
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                Prime<span className="text-[#2F80ED] dark:text-[#56CCF2]">Volt</span>
              </span>
            </div>
            <p className="mt-4 text-sm max-w-md text-slate-500 dark:text-gray-400">
              Secure, premium, and state-of-the-art cryptocurrency investment and yield optimization platform. Explore Starter, Premium, and custom Gold VIP plans.
            </p>
          </div>
          <div>
            <h4 className="text-slate-900 dark:text-white font-semibold text-sm tracking-wider uppercase">Platform</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="/" className="hover:text-[#2F80ED] dark:hover:text-[#56CCF2] transition">Home</a></li>
              <li><a href="/login" className="hover:text-[#2F80ED] dark:hover:text-[#56CCF2] transition">Invest Plans</a></li>
              <li><a href="/register" className="hover:text-[#2F80ED] dark:hover:text-[#56CCF2] transition">Register</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-900 dark:text-white font-semibold text-sm tracking-wider uppercase">Security & Legal</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><span className="text-[#27AE60] font-medium">✔ KYC Verified</span></li>
              <li><span className="text-[#27AE60] font-medium">✔ 2FA Protected</span></li>
              <li><a href="#" className="hover:text-[#2F80ED] dark:hover:text-[#56CCF2] transition">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-[#2F80ED]/15 pt-8 text-center text-xs text-slate-500 dark:text-gray-500">
          <p>© {new Date().getFullYear()} PrimeVolt, Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
