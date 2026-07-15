import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// User Pages
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import VerifyEmail from './pages/Auth/VerifyEmail';
import ResetPassword from './pages/Auth/ResetPassword';
import Dashboard from './pages/Dashboard/Dashboard';
import Wallet from './pages/Wallet/Wallet';
import Deposit from './pages/Deposit/Deposit';
import Withdraw from './pages/Withdraw/Withdraw';
import Invest from './pages/Invest/Invest';
import KYC from './pages/KYC/KYC';
import Support from './pages/Support/Support';
import Profile from './pages/Profile/Profile';
import Referrals from './pages/Referrals/Referrals';
import DemoOne from './components/ui/demo';
import UpgradeVIP from './pages/UpgradeVIP/UpgradeVIP';

// Admin Pages
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';

// Layout wrapper to conditionally show Navbar/Footer
const AppLayout = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const isDemoPath = location.pathname === '/demo';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0b0f19] dark:text-gray-100 flex flex-col transition-colors duration-300">
      {!isAdminPath && !isDemoPath && <Navbar />}
      <div className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/demo" element={<DemoOne />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* User Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/wallets" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
          <Route path="/deposit" element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
          <Route path="/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
          <Route path="/upgrade-vip" element={<ProtectedRoute><UpgradeVIP /></ProtectedRoute>} />

          <Route path="/invest" element={<ProtectedRoute><Invest /></ProtectedRoute>} />
          <Route path="/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Routes>
      </div>
      {!isAdminPath && !isDemoPath && <Footer />}
      {!isAdminPath && !isDemoPath && (
        <a
          href="mailto:info.cryptoverse@gmail.com"
          className="fixed bottom-6 left-6 z-50 p-3.5 bg-gradient-to-r from-cyanAccent to-emeraldAccent text-[#0b0f19] rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.7)] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer border border-[#10b981]/25 animate-bounce"
          title="Email Support"
        >
          <Mail size={20} />
        </a>
      )}
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppLayout />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
