import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import api from '../../api/api';
import { Shield, Users, ArrowUpCircle, ArrowDownCircle, FileCheck, Megaphone, History, UserMinus, UserCheck, Plus, Minus, Eye, Settings, LogOut, Check, X, ShieldAlert, Award, Sun, Moon, Receipt, Trash2, Layers, MessageSquare, LifeBuoy, Send, User } from 'lucide-react';

const AdminDashboard = () => {
  const { adminUser, adminLogout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lists
  const [users, setUsers] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [kycDocs, setKycDocs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [vipUpgrades, setVipUpgrades] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [adminInvestments, setAdminInvestments] = useState([]);
  const [scheduledPayouts, setScheduledPayouts] = useState([]);
  const [globalAutomationEnabled, setGlobalAutomationEnabled] = useState(true);

  // Support states
  const [supportTickets, setSupportTickets] = useState([]);
  const [selectedAdminTicket, setSelectedAdminTicket] = useState(null);
  const [adminTicketDetails, setAdminTicketDetails] = useState(null);
  const [adminReplyMessage, setAdminReplyMessage] = useState('');
  const [adminReplying, setAdminReplying] = useState(false);
  const adminChatEndRef = useRef(null);

  // Investment form states
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [invUser, setInvUser] = useState('');
  const [invPlan, setInvPlan] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invCurrency, setInvCurrency] = useState('USDT');
  const [invStartDate, setInvStartDate] = useState('');
  const [invEndDate, setInvEndDate] = useState('');
  const [invExpectedProfit, setInvExpectedProfit] = useState('');
  const [invExpectedProfitType, setInvExpectedProfitType] = useState('PERCENT');
  const [invDistributionFrequency, setInvDistributionFrequency] = useState('DAILY');
  const [invIsAutomated, setInvIsAutomated] = useState(true);
  const [invIsPaused, setInvIsPaused] = useState(false);
  const [invAutoReinvest, setInvAutoReinvest] = useState(false);
  const [invStatus, setInvStatus] = useState('ACTIVE');
  const [submittingInvestment, setSubmittingInvestment] = useState(false);

  // Plans Form States
  const [editingPlan, setEditingPlan] = useState(null);
  const [planName, setPlanName] = useState('');
  const [planMinDeposit, setPlanMinDeposit] = useState('');
  const [planMaxDeposit, setPlanMaxDeposit] = useState('');
  const [planDailyProfit, setPlanDailyProfit] = useState('');
  const [planDuration, setPlanDuration] = useState('');
  const [planCompounding, setPlanCompounding] = useState(false);
  const [submittingPlan, setSubmittingPlan] = useState(false);

  // System Wallets States
  const [adminWalletAddresses, setAdminWalletAddresses] = useState([]);
  const [selectedAdminWallet, setSelectedAdminWallet] = useState(null);
  const [walletCurrency, setWalletCurrency] = useState('BTC');
  const [walletAddressVal, setWalletAddressVal] = useState('');
  const [submittingWalletAddress, setSubmittingWalletAddress] = useState(false);

  // Detail Modal States
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [txEditType, setTxEditType] = useState('DEPOSIT');
  const [txEditAmount, setTxEditAmount] = useState('');
  const [txEditCurrency, setTxEditCurrency] = useState('USDT');
  const [txEditDesc, setTxEditDesc] = useState('');
  const [txEditStatus, setTxEditStatus] = useState('COMPLETED');
  const [txEditCreatedAt, setTxEditCreatedAt] = useState('');
  const [submittingTxEdit, setSubmittingTxEdit] = useState(false);

  const [editUserBalance, setEditUserBalance] = useState('');
  const [editUserProfitBalance, setEditUserProfitBalance] = useState('');
  const [editUserActiveInvestment, setEditUserActiveInvestment] = useState('');
  const [editUserProfitAccrued, setEditUserProfitAccrued] = useState('');
  const [editUserReferralBonus, setEditUserReferralBonus] = useState('');
  const [editUserVipLevel, setEditUserVipLevel] = useState('');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  // Approval Note States
  const [processingId, setProcessingId] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Broadcast Notification State
  const [bcTitle, setBcTitle] = useState('');
  const [bcMessage, setBcMessage] = useState('');
  const [submittingBc, setSubmittingBc] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setError('');
    setSuccess('');
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'deposits') fetchDeposits();
    if (activeTab === 'withdrawals') fetchWithdrawals();
    if (activeTab === 'kyc') fetchKycDocs();
    if (activeTab === 'logs') fetchAuditLogs();
    if (activeTab === 'vip_upgrades') fetchVIPUpgrades();
    if (activeTab === 'transactions') fetchTransactions();
    if (activeTab === 'plans') fetchPlans();
    if (activeTab === 'system_wallets') fetchAdminWalletAddresses();
    if (activeTab === 'investments') fetchAdminInvestments();
    if (activeTab === 'automation') fetchAutomationPanel();
    if (activeTab === 'support') fetchSupportTickets();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await api.get('admin/stats/');
      setStats(res.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch admin stats.');
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('admin/users/');
      setUsers(res.data);
    } catch (err) {
      setError('Failed to fetch user list.');
    }
  };

  const fetchDeposits = async () => {
    try {
      const res = await api.get('admin/deposits/');
      setDeposits(res.data);
    } catch (err) {
      setError('Failed to fetch deposits queue.');
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await api.get('admin/withdrawals/');
      setWithdrawals(res.data);
    } catch (err) {
      setError('Failed to fetch withdrawals queue.');
    }
  };

  const fetchKycDocs = async () => {
    try {
      const res = await api.get('admin/kyc/');
      setKycDocs(res.data);
    } catch (err) {
      setError('Failed to fetch KYC queue.');
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('admin/audit-logs/');
      setAuditLogs(res.data);
    } catch (err) {
      setError('Failed to fetch audit logs.');
    }
  };

  const fetchVIPUpgrades = async () => {
    try {
      const res = await api.get('admin/vip-upgrades/');
      setVipUpgrades(res.data);
    } catch (err) {
      setError('Failed to fetch VIP upgrades queue.');
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get('admin/transactions/');
      setTransactions(res.data);
    } catch (err) {
      setError('Failed to fetch transactions list.');
    }
  };

  const fetchAdminInvestments = async () => {
    try {
      const res = await api.get('admin/investments/');
      setAdminInvestments(res.data);
    } catch (err) {
      setError('Failed to fetch user investments.');
    }
  };

  const fetchAutomationPanel = async () => {
    try {
      const res = await api.get('admin/investments/automation/');
      setGlobalAutomationEnabled(res.data.global_enabled);
      setScheduledPayouts(res.data.scheduled_payouts);
    } catch (err) {
      setError('Failed to fetch automation settings.');
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await api.get('admin/plans/');
      setPlans(res.data);
    } catch (err) {
      setError('Failed to fetch investment plans.');
    }
  };

  const fetchSupportTickets = async () => {
    try {
      const res = await api.get('admin/support/tickets/');
      setSupportTickets(res.data);
      if (res.data.length > 0 && !selectedAdminTicket) {
        setSelectedAdminTicket(res.data[0]);
      }
    } catch (err) {
      setError('Failed to fetch support tickets.');
    }
  };

  const fetchAdminTicketDetails = async (id, isSilent = false) => {
    try {
      const res = await api.get(`admin/support/tickets/${id}/`);
      setAdminTicketDetails(res.data);
    } catch (err) {
      if (!isSilent) {
        setError('Failed to fetch conversation history.');
      }
    }
  };

  const scrollAdminChatToBottom = () => {
    adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (adminTicketDetails) {
      scrollAdminChatToBottom();
    }
  }, [adminTicketDetails]);

  useEffect(() => {
    if (activeTab === 'support' && selectedAdminTicket) {
      fetchAdminTicketDetails(selectedAdminTicket.id);
      const interval = setInterval(() => {
        fetchAdminTicketDetails(selectedAdminTicket.id, true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedAdminTicket]);

  const handleAdminSendReply = async (e) => {
    e.preventDefault();
    if (!adminReplyMessage.trim()) return;

    setAdminReplying(true);
    setError('');
    try {
      const res = await api.post(`admin/support/tickets/${selectedAdminTicket.id}/messages/`, {
        message: adminReplyMessage
      });
      if (adminTicketDetails) {
        setAdminTicketDetails({
          ...adminTicketDetails,
          messages: [...adminTicketDetails.messages, res.data]
        });
      }
      setAdminReplyMessage('');
      fetchSupportTickets();
    } catch (err) {
      setError('Failed to deliver message.');
    } finally {
      setAdminReplying(false);
    }
  };

  const handleUpdateTicketStatus = async (id, newStatus) => {
    try {
      await api.patch(`admin/support/tickets/${id}/`, { status: newStatus });
      setSuccess(`Ticket status updated to ${newStatus}.`);
      fetchSupportTickets();
      setSelectedAdminTicket(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err) {
      setError('Failed to update ticket status.');
    }
  };

  const handleCreateOrUpdateInvestment = async (e) => {
    e.preventDefault();
    if (!invUser || !invPlan || !invAmount) {
      setError('Please select a user, plan, and input amount.');
      return;
    }

    setSubmittingInvestment(true);
    setError('');
    setSuccess('');

    const payload = {
      user: invUser,
      plan: invPlan,
      amount: invAmount,
      currency: invCurrency,
      expected_profit: invExpectedProfit || 0,
      expected_profit_type: invExpectedProfitType,
      distribution_frequency: invDistributionFrequency,
      is_automated: invIsAutomated,
      is_paused: invIsPaused,
      auto_reinvest: invAutoReinvest,
      status: invStatus
    };

    if (invStartDate) payload.start_date = invStartDate;
    if (invEndDate) payload.end_date = invEndDate;

    try {
      if (editingInvestment) {
        await api.put(`admin/investments/${editingInvestment.id}/`, payload);
        setSuccess('Investment updated successfully.');
      } else {
        await api.post('admin/investments/', payload);
        setSuccess('Investment created successfully.');
      }
      setEditingInvestment(null);
      resetInvestmentForm();
      fetchAdminInvestments();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.non_field_errors?.[0] || 'Failed to save investment.');
    } finally {
      setSubmittingInvestment(false);
    }
  };

  const resetInvestmentForm = () => {
    setInvUser('');
    setInvPlan('');
    setInvAmount('');
    setInvCurrency('USDT');
    setInvStartDate('');
    setInvEndDate('');
    setInvExpectedProfit('');
    setInvExpectedProfitType('PERCENT');
    setInvDistributionFrequency('DAILY');
    setInvIsAutomated(true);
    setInvIsPaused(false);
    setInvAutoReinvest(false);
    setInvStatus('ACTIVE');
  };

  const startEditInvestment = (inv) => {
    setEditingInvestment(inv);
    setInvUser(inv.user);
    setInvPlan(inv.plan);
    setInvAmount(inv.amount);
    setInvCurrency(inv.currency);
    setInvStartDate(inv.start_date ? inv.start_date.substring(0, 16) : '');
    setInvEndDate(inv.end_date ? inv.end_date.substring(0, 16) : '');
    setInvExpectedProfit(inv.expected_profit);
    setInvExpectedProfitType(inv.expected_profit_type);
    setInvDistributionFrequency(inv.distribution_frequency);
    setInvIsAutomated(inv.is_automated);
    setInvIsPaused(inv.is_paused);
    setInvAutoReinvest(inv.auto_reinvest);
    setInvStatus(inv.status);
  };

  const handlePauseInvestment = async (id) => {
    try {
      await api.post(`admin/investments/${id}/pause/`);
      setSuccess('Investment paused.');
      fetchAdminInvestments();
    } catch (err) {
      setError('Failed to pause investment.');
    }
  };

  const handleResumeInvestment = async (id) => {
    try {
      await api.post(`admin/investments/${id}/resume/`);
      setSuccess('Investment resumed.');
      fetchAdminInvestments();
    } catch (err) {
      setError('Failed to resume investment.');
    }
  };

  const handleCancelInvestment = async (id, refund) => {
    try {
      await api.post(`admin/investments/${id}/cancel/`, { refund });
      setSuccess(`Investment cancelled. Refund: ${refund ? 'Yes' : 'No'}`);
      fetchAdminInvestments();
    } catch (err) {
      setError('Failed to cancel investment.');
    }
  };

  const handleTriggerPayout = async (id) => {
    const amt = prompt('Enter profit amount to credit manually (leave blank for standard payout):');
    if (amt === null) return;
    
    try {
      const payload = amt ? { amount: parseFloat(amt) } : {};
      await api.post(`admin/investments/${id}/trigger-payout/`, payload);
      setSuccess('Manual payout triggered.');
      fetchAdminInvestments();
    } catch (err) {
      setError('Failed to trigger payout.');
    }
  };

  const handleToggleGlobalAutomation = async (val) => {
    try {
      await api.post('admin/investments/automation/', { global_enabled: val });
      setGlobalAutomationEnabled(val);
      setSuccess(`Global automation ${val ? 'enabled' : 'disabled'}.`);
      fetchAutomationPanel();
    } catch (err) {
      setError('Failed to toggle global automation.');
    }
  };

  const handleToggleUserAutomation = async (userId, val) => {
    try {
      await api.post('admin/investments/automation/', { user_id: userId, user_enabled: val });
      setSuccess('User automation state updated.');
      fetchAutomationPanel();
    } catch (err) {
      setError('Failed to update user automation.');
    }
  };

  const handleDeleteInvestment = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this investment?')) return;
    try {
      await api.delete(`admin/investments/${id}/`);
      setSuccess('Investment deleted.');
      fetchAdminInvestments();
    } catch (err) {
      setError('Failed to delete investment.');
    }
  };

  const handleCreateOrUpdatePlan = async (e) => {
    e.preventDefault();
    if (!planName || !planMinDeposit || !planMaxDeposit || !planDailyProfit || !planDuration) {
      setError('Please fill in all plan details.');
      return;
    }
    setSubmittingPlan(true);
    setError('');
    setSuccess('');

    const payload = {
      name: planName,
      min_deposit: planMinDeposit,
      max_deposit: planMaxDeposit,
      daily_profit_percent: planDailyProfit,
      duration_days: parseInt(planDuration),
      compounding: planCompounding
    };

    try {
      if (editingPlan) {
        await api.put(`admin/plans/${editingPlan.id}/`, payload);
        setSuccess('Investment plan updated successfully.');
      } else {
        await api.post('admin/plans/', payload);
        setSuccess('Investment plan created successfully.');
      }
      setEditingPlan(null);
      setPlanName('');
      setPlanMinDeposit('');
      setPlanMaxDeposit('');
      setPlanDailyProfit('');
      setPlanDuration('');
      setPlanCompounding(false);
      fetchPlans();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save investment plan.');
    } finally {
      setSubmittingPlan(false);
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Are you sure you want to delete this investment plan?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`admin/plans/${id}/`);
      setSuccess('Investment plan deleted successfully.');
      fetchPlans();
    } catch (err) {
      setError('Failed to delete investment plan.');
    }
  };

  const startEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanName(plan.name);
    setPlanMinDeposit(plan.min_deposit);
    setPlanMaxDeposit(plan.max_deposit);
    setPlanDailyProfit(plan.daily_profit_percent);
    setPlanDuration(plan.duration_days);
    setPlanCompounding(plan.compounding);
  };

  const fetchAdminWalletAddresses = async () => {
    try {
      const res = await api.get('admin/wallet-addresses/');
      setAdminWalletAddresses(res.data);
    } catch (err) {
      setError('Failed to fetch admin wallet addresses.');
    }
  };

  const handleCreateOrUpdateWalletAddress = async (e) => {
    e.preventDefault();
    if (!walletCurrency || !walletAddressVal) {
      setError('Currency and wallet address are required.');
      return;
    }
    setSubmittingWalletAddress(true);
    setError('');
    setSuccess('');

    const payload = {
      currency: walletCurrency,
      address: walletAddressVal
    };

    try {
      if (selectedAdminWallet) {
        await api.put(`admin/wallet-addresses/${selectedAdminWallet.id}/`, payload);
        setSuccess('System receiving address updated successfully.');
      } else {
        await api.post('admin/wallet-addresses/', payload);
        setSuccess('System receiving address added successfully.');
      }
      setSelectedAdminWallet(null);
      setWalletCurrency('BTC');
      setWalletAddressVal('');
      fetchAdminWalletAddresses();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save receiving address. Please check if this currency already exists.');
    } finally {
      setSubmittingWalletAddress(false);
    }
  };

  const handleDeleteWalletAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this receiving address?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`admin/wallet-addresses/${id}/`);
      setSuccess('Receiving address deleted successfully.');
      fetchAdminWalletAddresses();
    } catch (err) {
      setError('Failed to delete receiving address.');
    }
  };

  const startEditWalletAddress = (wa) => {
    setSelectedAdminWallet(wa);
    setWalletCurrency(wa.currency);
    setWalletAddressVal(wa.address);
  };

  const handleEditTransaction = (tx) => {
    setSelectedTransaction(tx);
    setTxEditType(tx.type);
    setTxEditAmount(tx.amount);
    setTxEditCurrency(tx.currency);
    setTxEditDesc(tx.description || '');
    setTxEditStatus(tx.status);
    if (tx.created_at) {
      const date = new Date(tx.created_at);
      const formattedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setTxEditCreatedAt(formattedDate);
    } else {
      setTxEditCreatedAt('');
    }
  };

  const handleUpdateTransaction = async (e) => {
    e.preventDefault();
    if (!txEditAmount || parseFloat(txEditAmount) <= 0) {
      setError('Please provide a valid positive amount.');
      return;
    }
    setSubmittingTxEdit(true);
    setError('');
    setSuccess('');
    try {
      const url = `admin/transactions/${selectedTransaction.id}/`;
      const payload = {
        user: selectedTransaction.user,
        wallet: selectedTransaction.wallet,
        type: txEditType,
        amount: txEditAmount,
        currency: txEditCurrency,
        description: txEditDesc,
        status: txEditStatus,
        created_at: txEditCreatedAt ? new Date(txEditCreatedAt).toISOString() : new Date().toISOString()
      };
      await api.put(url, payload);
      setSuccess('Transaction updated successfully.');
      setSelectedTransaction(null);
      fetchTransactions();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update transaction.');
    } finally {
      setSubmittingTxEdit(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction record? This cannot be undone.')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await api.delete(`admin/transactions/${id}/`);
      setSuccess('Transaction deleted successfully.');
      fetchTransactions();
    } catch (err) {
      setError('Failed to delete transaction.');
    }
  };


  const handleVIPUpgradeAction = async (id, statusVal) => {
    setProcessingId(id);
    setError('');
    setSuccess('');
    try {
      await api.put(`admin/vip-upgrades/${id}/`, { status: statusVal });
      setSuccess(`VIP upgrade request ${statusVal.toLowerCase()} successfully.`);
      fetchVIPUpgrades();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update VIP upgrade status.');
    } finally {
      setProcessingId(null);
    }
  };

  // Toggle freeze user account
  const handleToggleFreeze = async (userId) => {
    try {
      const res = await api.post(`admin/users/${userId}/freeze/`);
      setSuccess(res.data.message);
      fetchUsers();
    } catch (err) {
      setError('Could not toggle freeze status.');
    }
  };

  // Delete user account
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action is permanent and cannot be undone.')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      const res = await api.delete(`admin/users/${userId}/`);
      setSuccess(res.data.message || 'User deleted successfully.');
      fetchUsers();
    } catch (err) {
      setError('Could not delete user account.');
    }
  };

  const handleEditUser = (u) => {
    setSelectedUser(u);
    setEditUserBalance(u.balance);
    setEditUserProfitBalance(u.profit_balance);
    setEditUserActiveInvestment(u.active_investment_override !== null && u.active_investment_override !== undefined ? u.active_investment_override : '');
    setEditUserProfitAccrued(u.profit_accrued_override !== null && u.profit_accrued_override !== undefined ? u.profit_accrued_override : '');
    setEditUserReferralBonus(u.referral_bonus_override !== null && u.referral_bonus_override !== undefined ? u.referral_bonus_override : '');
    setEditUserVipLevel(u.vip_level || '1');
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setSubmittingAdjust(true);
    setError('');
    setSuccess('');
    try {
      const url = `admin/users/${selectedUser.id}/`;
      const payload = {
        balance: editUserBalance,
        profit_balance: editUserProfitBalance,
        active_investment_override: editUserActiveInvestment === '' ? null : editUserActiveInvestment,
        profit_accrued_override: editUserProfitAccrued === '' ? null : editUserProfitAccrued,
        referral_bonus_override: editUserReferralBonus === '' ? null : editUserReferralBonus,
        vip_level: editUserVipLevel
      };
      await api.patch(url, payload);
      setSuccess('User balance fields updated successfully.');
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user balance fields.');
    } finally {
      setSubmittingAdjust(false);
    }
  };


  // Approve/Reject Deposit
  const handleDepositAction = async (id, statusVal) => {
    setProcessingId(id);
    setError('');
    setSuccess('');
    try {
      await api.put(`admin/deposits/${id}/`, {
        status: statusVal,
        admin_notes: adminNotes
      });
      setSuccess(`Deposit request marked as ${statusVal.toLowerCase()}.`);
      setAdminNotes('');
      fetchDeposits();
      fetchStats();
    } catch (err) {
      setError('Failed to update deposit state.');
    } finally {
      setProcessingId(null);
    }
  };

  // Approve/Reject Withdrawal
  const handleWithdrawalAction = async (id, statusVal) => {
    setProcessingId(id);
    setError('');
    setSuccess('');
    try {
      await api.put(`admin/withdrawals/${id}/`, {
        status: statusVal,
        admin_notes: adminNotes
      });
      setSuccess(`Withdrawal request marked as ${statusVal.toLowerCase()}.`);
      setAdminNotes('');
      fetchWithdrawals();
      fetchStats();
    } catch (err) {
      setError('Failed to update withdrawal state.');
    } finally {
      setProcessingId(null);
    }
  };

  // Approve/Reject KYC Document
  const handleKycAction = async (id, statusVal) => {
    setProcessingId(id);
    setError('');
    setSuccess('');
    try {
      await api.put(`admin/kyc/${id}/`, {
        status: statusVal,
        rejection_reason: statusVal === 'REJECTED' ? rejectionReason : ''
      });
      setSuccess(`KYC Document marked as ${statusVal.toLowerCase()}.`);
      setRejectionReason('');
      fetchKycDocs();
      fetchStats();
    } catch (err) {
      setError('Failed to update KYC status.');
    } finally {
      setProcessingId(null);
    }
  };

  // Send broadcast notification
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!bcTitle || !bcMessage) {
      setError('Please fill in broadcast title and message body.');
      return;
    }
    setSubmittingBc(true);
    setError('');
    setSuccess('');
    try {
      await api.post('admin/notifications/broadcast/', {
        title: bcTitle,
        message: bcMessage
      });
      setSuccess('Broadcast notification sent to all accounts.');
      setBcTitle('');
      setBcMessage('');
    } catch (err) {
      setError('Failed to broadcast notification.');
    } finally {
      setSubmittingBc(false);
    }
  };

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-transparent">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyanAccent border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 min-h-[calc(100vh-4rem)] text-left flex flex-col">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="text-red-500" /> PrimeVolt Admin Console
          </h1>
          <p className="text-xs text-gray-400">System oversight, verification reviews, and operations approvals.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2.5 text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-gray-800/40 border border-slate-200 dark:border-gray-800 transition"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-gray-800 p-2 rounded-lg text-left text-xs transition-colors duration-300">
            <span className="text-[10px] text-gray-500 block font-semibold">Operator</span>
            <span className="font-bold text-slate-900 dark:text-white">{adminUser?.full_name} ({adminUser?.role})</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition flex items-center gap-1 text-xs font-bold"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-950/40 border border-red-500/50 p-4 text-xs text-red-200 mb-6">
          ⚠ {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-emerald-950/40 border border-emerald-500/50 p-4 text-xs text-emerald-200 mb-6">
          ✓ {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-gray-800 space-x-2 mb-8 no-scrollbar transition-colors duration-300">
        <button
          onClick={() => setActiveTab('stats')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'stats' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award size={16} /> Metrics overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'users' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users size={16} /> Users Account
        </button>
        <button
          onClick={() => setActiveTab('deposits')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'deposits' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ArrowUpCircle size={16} /> Deposits ({stats?.pending_deposits_count || 0})
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'withdrawals' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ArrowDownCircle size={16} /> Withdrawals ({stats?.pending_withdrawals_count || 0})
        </button>
        <button
          onClick={() => setActiveTab('kyc')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'kyc' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileCheck size={16} /> KYC Verification ({stats?.pending_kyc_count || 0})
        </button>
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'broadcast' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Megaphone size={16} /> Announcement
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'logs' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <History size={16} /> Audit logs
        </button>
        <button
          onClick={() => setActiveTab('vip_upgrades')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'vip_upgrades' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award size={16} /> VIP Upgrades
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'transactions' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Receipt size={16} /> Transactions
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'plans' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Settings size={16} /> Investment Packages
        </button>
        <button
          onClick={() => setActiveTab('system_wallets')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'system_wallets' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <History size={16} /> System Addresses
        </button>
        <button
          onClick={() => setActiveTab('investments')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'investments' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers size={16} /> User Investments
        </button>
        <button
          onClick={() => setActiveTab('automation')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'automation' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldAlert size={16} /> Automation Controls
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'support' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare size={16} /> Support Tickets ({stats?.pending_tickets_count || 0})
        </button>
      </div>

      {/* Tabs Content */}
      <div className="flex-1">

        {/* TAB 1: METRICS OVERVIEW */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-xl">
              <span className="text-[10px] text-slate-500 dark:text-gray-450 uppercase font-semibold">Total Registered Users</span>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">{stats.total_users}</p>
            </div>
            <div className="glass-panel p-6 rounded-xl">
              <span className="text-[10px] text-slate-500 dark:text-gray-450 uppercase font-semibold">Total Funds Deposited</span>
              <p className="text-3xl font-black text-emeraldAccent mt-2">${stats.total_deposits.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            </div>
            <div className="glass-panel p-6 rounded-xl">
              <span className="text-[10px] text-slate-500 dark:text-gray-450 uppercase font-semibold">Total Funds Withdrawn</span>
              <p className="text-3xl font-black text-red-400 mt-2">${stats.total_withdrawals.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            </div>

            <div className="sm:col-span-3 glass-panel p-6 rounded-xl">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Awaiting Queue Summaries</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-xs">
                <div className="bg-slate-100/40 dark:bg-gray-950/20 p-4 border border-slate-200 dark:border-gray-850 rounded transition-colors duration-300">
                  <p className="text-slate-500 dark:text-gray-400">KYC Verifications</p>
                  <p className="text-xl font-bold text-cyanAccent mt-1">{stats.pending_kyc_count}</p>
                </div>
                <div className="bg-slate-100/40 dark:bg-gray-950/20 p-4 border border-slate-200 dark:border-gray-850 rounded transition-colors duration-300">
                  <p className="text-slate-500 dark:text-gray-400">Pending Deposit Proofs</p>
                  <p className="text-xl font-bold text-yellow-500 mt-1">{stats.pending_deposits_count}</p>
                </div>
                <div className="bg-slate-100/40 dark:bg-gray-950/20 p-4 border border-slate-200 dark:border-gray-850 rounded transition-colors duration-300">
                  <p className="text-slate-500 dark:text-gray-400">Pending Withdrawals Requests</p>
                  <p className="text-xl font-bold text-red-400 mt-1">{stats.pending_withdrawals_count}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="glass-panel rounded-xl p-6 overflow-hidden">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">User Accounts & Ledgers</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-gray-855 text-slate-555 dark:text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3">User Details</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Balance</th>
                    <th className="pb-3">KYC Lvl</th>
                    <th className="pb-3">Freeze State</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-gray-855 text-slate-700 dark:text-gray-300">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-100/50 dark:hover:bg-gray-900/10">
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">
                        {u.full_name} <span className="text-[10px] text-gray-500">(@{u.username})</span>
                      </td>
                      <td className="py-3">{u.email}</td>
                      <td className="py-3 font-bold">${parseFloat(u.balance).toFixed(2)}</td>
                      <td className="py-3">Level {u.kyc_level}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.is_frozen ? 'bg-red-500/15 text-red-400' : 'bg-emeraldAccent/15 text-emeraldAccent'
                        }`}>
                          {u.is_frozen ? 'Frozen' : 'Active'}
                        </span>
                      </td>
                      <td className="py-3 flex gap-2">
                        <button
                          onClick={() => handleToggleFreeze(u.id)}
                          className={`p-1.5 rounded transition ${
                            u.is_frozen ? 'bg-emeraldAccent/20 text-emeraldAccent' : 'bg-red-500/20 text-red-400'
                          }`}
                          title={u.is_frozen ? 'Activate' : 'Freeze'}
                        >
                          {u.is_frozen ? <UserCheck size={14} /> : <UserMinus size={14} />}
                        </button>
                        <button
                          onClick={() => handleEditUser(u)}
                          className="p-1.5 bg-cyanAccent/20 text-cyanAccent rounded hover:bg-cyanAccent/30"
                          title="Edit Balances & Status"
                        >
                          <Settings size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                          title="Delete User"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DEPOSIT APPROVALS */}
        {activeTab === 'deposits' && (
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Deposit Queue Review</h3>
            {deposits.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-gray-500 text-center py-8">Deposit confirmation queue is empty.</p>
            ) : (
              <div className="space-y-6">
                {deposits.map((dep) => (
                  <div key={dep.id} className="border border-slate-200 dark:border-gray-800 rounded-lg p-6 bg-slate-100/40 dark:bg-gray-950/20 flex flex-col md:flex-row md:justify-between gap-6 text-xs text-left transition-colors duration-300">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-slate-900 dark:text-white">Deposit #{dep.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          dep.status === 'CONFIRMED' ? 'bg-emeraldAccent/15 text-emeraldAccent' :
                          dep.status === 'REJECTED' ? 'bg-red-500/15 text-red-400' :
                          'bg-yellow-500/15 text-yellow-500'
                        }`}>{dep.status}</span>
                      </div>
                      <p className="text-slate-500 dark:text-gray-400">User ID: <span className="text-slate-900 dark:text-white">@{dep.user}</span></p>
                      <p className="text-slate-500 dark:text-gray-400">Amount: <span className="text-slate-900 dark:text-white font-bold">${parseFloat(dep.amount).toLocaleString()} {dep.currency}</span></p>
                      <p className="text-slate-500 dark:text-gray-400">TX Hash: <span className="text-slate-900 dark:text-white font-mono break-all">{dep.transaction_hash || 'None'}</span></p>
                      <p className="text-slate-500 dark:text-gray-400">Submitted: <span className="text-slate-900 dark:text-white">{new Date(dep.created_at).toLocaleString()}</span></p>
                      
                      {dep.proof_image && (
                        <div className="mt-4">
                          <p className="text-[10px] text-slate-500 dark:text-gray-500 uppercase font-bold mb-1">Uploaded Receipt Proof:</p>
                          <a href={dep.proof_image} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyanAccent hover:underline">
                            <Eye size={12} /> View proof image
                          </a>
                        </div>
                      )}
                    </div>

                    {dep.status === 'PENDING' && (
                      <div className="flex flex-col gap-2 w-full md:w-60">
                        <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase">Operator Remarks</label>
                        <input
                          type="text"
                          placeholder="e.g. Received on Ledger"
                          className="p-2 rounded glass-input text-xs"
                          onChange={(e) => setAdminNotes(e.target.value)}
                        />
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => handleDepositAction(dep.id, 'CONFIRMED')}
                            disabled={processingId === dep.id}
                            className="flex-1 py-2 bg-emeraldAccent text-black font-bold text-xs rounded hover:opacity-90 transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check size={14} /> Confirm
                          </button>
                          <button
                            onClick={() => handleDepositAction(dep.id, 'REJECTED')}
                            disabled={processingId === dep.id}
                            className="flex-1 py-2 bg-red-500 text-white font-bold text-xs rounded hover:opacity-90 transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: WITHDRAWAL APPROVALS */}
        {activeTab === 'withdrawals' && (
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Withdrawal Processing Queue</h3>
            {withdrawals.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-gray-500 text-center py-8">Withdrawal approval queue is empty.</p>
            ) : (
              <div className="space-y-6">
                {withdrawals.map((w) => (
                  <div key={w.id} className="border border-slate-200 dark:border-gray-800 rounded-lg p-6 bg-slate-100/40 dark:bg-gray-950/20 flex flex-col md:flex-row md:justify-between gap-6 text-xs text-left transition-colors duration-300">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-slate-900 dark:text-white">Withdrawal #{w.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          w.status === 'COMPLETED' ? 'bg-emeraldAccent/15 text-emeraldAccent' :
                          w.status === 'REJECTED' ? 'bg-red-500/15 text-red-400' :
                          'bg-yellow-500/15 text-yellow-500'
                        }`}>{w.status}</span>
                      </div>
                      <p className="text-slate-500 dark:text-gray-400">User: <span className="text-slate-900 dark:text-white">@{w.user}</span></p>
                      <p className="text-slate-500 dark:text-gray-400">Payout Amount: <span className="text-slate-900 dark:text-white font-bold">${parseFloat(w.amount).toLocaleString()} {w.currency}</span></p>
                      <p className="text-slate-500 dark:text-gray-400">Destination Address: <span className="text-slate-900 dark:text-white font-mono break-all">{w.withdrawal_address}</span></p>
                      <p className="text-slate-500 dark:text-gray-400">Created: <span className="text-slate-900 dark:text-white">{new Date(w.created_at).toLocaleString()}</span></p>
                    </div>

                    {/* CONFIRMED means user confirmed with OTP on frontend, wait for admin processing */}
                    {['PENDING', 'CONFIRMED', 'PROCESSING'].includes(w.status) && (
                      <div className="flex flex-col gap-2 w-full md:w-60">
                        <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase">Operator Remarks</label>
                        <input
                          type="text"
                          placeholder="e.g. Sent via Binance node"
                          className="p-2 rounded glass-input text-xs"
                          onChange={(e) => setAdminNotes(e.target.value)}
                        />
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => handleWithdrawalAction(w.id, 'COMPLETED')}
                            disabled={processingId === w.id}
                            className="flex-1 py-2 bg-emeraldAccent text-black font-bold text-xs rounded hover:opacity-90 transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check size={14} /> Complete
                          </button>
                          <button
                            onClick={() => handleWithdrawalAction(w.id, 'REJECTED')}
                            disabled={processingId === w.id}
                            className="flex-1 py-2 bg-red-500 text-white font-bold text-xs rounded hover:opacity-90 transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: KYC DOCUMENT APPROVALS */}
        {activeTab === 'kyc' && (
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Identity Verification Queue</h3>
            {kycDocs.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-gray-500 text-center py-8">Verification queue is clean. No pending documents.</p>
            ) : (
              <div className="space-y-6">
                {kycDocs.map((doc) => (
                  <div key={doc.id} className="border border-slate-200 dark:border-gray-800 rounded-lg p-6 bg-slate-100/40 dark:bg-gray-950/20 flex flex-col md:flex-row md:justify-between gap-6 text-xs text-left transition-colors duration-300">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-slate-900 dark:text-white">Doc ID #{doc.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          doc.status === 'APPROVED' ? 'bg-emeraldAccent/15 text-emeraldAccent' :
                          doc.status === 'REJECTED' ? 'bg-red-500/15 text-red-400' :
                          'bg-yellow-500/15 text-yellow-500'
                        }`}>{doc.status}</span>
                      </div>
                      <p className="text-slate-500 dark:text-gray-400">User: <span className="text-slate-900 dark:text-white">@{doc.user}</span></p>
                      <p className="text-slate-500 dark:text-gray-400">Doc Type: <span className="text-slate-900 dark:text-white font-bold">{doc.document_type}</span></p>
                      <p className="text-slate-500 dark:text-gray-400">Serial Number: <span className="text-slate-900 dark:text-white font-semibold">{doc.document_number}</span></p>
                      <p className="text-slate-500 dark:text-gray-400">Issued Country: <span className="text-slate-900 dark:text-white">{doc.issued_country || 'None'}</span></p>
                      <p className="text-slate-500 dark:text-gray-400">Expiry Date: <span className="text-slate-900 dark:text-white">{doc.expiry_date || 'None'}</span></p>
                      <p className="text-slate-500 dark:text-gray-400">Created: <span className="text-slate-900 dark:text-white">{new Date(doc.created_at).toLocaleString()}</span></p>

                      <div className="mt-4">
                        <p className="text-[10px] text-slate-500 dark:text-gray-500 uppercase font-bold mb-1">Doc URL Link:</p>
                        <a href={doc.document_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyanAccent hover:underline">
                          <Eye size={12} /> View physical document URL
                        </a>
                      </div>
                    </div>

                    {doc.status === 'PENDING' && (
                      <div className="flex flex-col gap-2 w-full md:w-60">
                        <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase">Rejection Reason (if rejected)</label>
                        <input
                          type="text"
                          placeholder="e.g. Document blurry or expired"
                          className="p-2 rounded glass-input text-xs"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => handleKycAction(doc.id, 'APPROVED')}
                            disabled={processingId === doc.id}
                            className="flex-1 py-2 bg-emeraldAccent text-black font-bold text-xs rounded hover:opacity-90 transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            onClick={() => handleKycAction(doc.id, 'REJECTED')}
                            disabled={processingId === doc.id || !rejectionReason}
                            className="flex-1 py-2 bg-red-500 text-white font-bold text-xs rounded hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: BROADCAST ANNOUNCEMENT */}
        {activeTab === 'broadcast' && (
          <div className="glass-panel rounded-xl p-6 max-w-xl mx-auto">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Megaphone className="text-red-500" /> Broadcast Alert System
            </h3>
            
            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-gray-400 uppercase font-semibold mb-2">Notification Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule Maintenance Notice"
                  className="w-full p-2.5 rounded glass-input text-xs"
                  value={bcTitle}
                  onChange={(e) => setBcTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-gray-400 uppercase font-semibold mb-2">Broadcast Message Body</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Write clear, professional instructions. This will appear on all users notification feeds instantly..."
                  className="w-full p-2.5 rounded glass-input text-xs"
                  value={bcMessage}
                  onChange={(e) => setBcMessage(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submittingBc}
                className="w-full py-3 bg-red-500 text-white font-bold text-xs rounded hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Megaphone size={16} /> {submittingBc ? 'Sending Broadcast Alert...' : 'Transmit Broadcast Notification'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 7: AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Staff Audit Trail Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-gray-850 text-slate-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3">Action</th>
                    <th className="pb-3">Operator</th>
                    <th className="pb-3">Impacted User</th>
                    <th className="pb-3">Entity Type</th>
                    <th className="pb-3">Values Context</th>
                    <th className="pb-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-gray-850 text-slate-700 dark:text-gray-300">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-100/50 dark:hover:bg-gray-900/10">
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">{log.action}</td>
                      <td className="py-3">{log.admin_name}</td>
                      <td className="py-3">@{log.user_name || 'System'}</td>
                      <td className="py-3">{log.entity_type} (ID: {log.entity_id})</td>
                      <td className="py-3 max-w-[200px] truncate font-mono text-[10px]">{JSON.stringify(log.new_values)}</td>
                      <td className="py-3 text-slate-400 dark:text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: VIP UPGRADES */}
        {activeTab === 'vip_upgrades' && (
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">VIP Level 2 Upgrade Requests</h3>
            {vipUpgrades.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No VIP upgrade requests found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-gray-850 text-slate-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                      <th className="pb-3">User</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Payment Proof</th>
                      <th className="pb-3">Date Submitted</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 dark:divide-gray-850 text-slate-700 dark:text-gray-300">
                    {vipUpgrades.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-100/50 dark:hover:bg-gray-900/10">
                        <td className="py-3">
                          <div className="font-semibold text-slate-900 dark:text-white">{req.user_name || `ID: ${req.user}`}</div>
                          <div className="text-[10px] text-slate-450">{req.user_email}</div>
                        </td>
                        <td className="py-3 font-semibold">${parseFloat(req.amount).toFixed(2)} USDT</td>
                        <td className="py-3">
                          {req.screenshot ? (
                            <a
                              href={`${api.defaults.baseURL.replace('/api/v1/', '')}${req.screenshot}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyanAccent hover:underline flex items-center gap-1 font-semibold"
                            >
                              <Eye size={14} /> View Screenshot
                            </a>
                          ) : (
                            <span className="text-slate-400">No proof uploaded</span>
                          )}
                        </td>
                        <td className="py-3 text-slate-400 dark:text-gray-500">{new Date(req.created_at).toLocaleDateString()}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            req.status === 'APPROVED' ? 'bg-emeraldAccent/15 text-emeraldAccent' : (req.status === 'REJECTED' ? 'bg-red-400/15 text-red-400' : 'bg-yellow-500/15 text-yellow-500')
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3">
                          {req.status === 'PENDING' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleVIPUpgradeAction(req.id, 'APPROVED')}
                                disabled={processingId === req.id}
                                className="px-3 py-1.5 bg-emeraldAccent/20 hover:bg-emeraldAccent text-emeraldAccent hover:text-black font-bold text-[10px] rounded transition disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                              >
                                <Check size={12} /> Approve
                              </button>
                              <button
                                onClick={() => handleVIPUpgradeAction(req.id, 'REJECTED')}
                                disabled={processingId === req.id}
                                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white font-bold text-[10px] rounded transition disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                              >
                                <X size={12} /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-semibold">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 9: TRANSACTIONS LIST */}
        {activeTab === 'transactions' && (
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">User Transactions Ledger</h3>
            {transactions.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-gray-500 text-center py-8">No transaction records found.</p>
            ) : (
              <div className="overflow-x-auto font-sans">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-gray-850 text-slate-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                      <th className="pb-3">Transaction ID</th>
                      <th className="pb-3">User ID</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Currency</th>
                      <th className="pb-3">Description</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Created At</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 dark:divide-gray-850 text-slate-700 dark:text-gray-300">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-100/50 dark:hover:bg-gray-900/10">
                        <td className="py-3 font-semibold text-slate-900 dark:text-white">#{tx.id}</td>
                        <td className="py-3">@{tx.user}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ['DEPOSIT', 'PROFIT', 'REFERRAL_BONUS'].includes(tx.type) ? 'bg-emeraldAccent/15 text-emeraldAccent' : 'bg-red-500/15 text-red-400'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 font-bold">${parseFloat(tx.amount).toFixed(2)}</td>
                        <td className="py-3 font-semibold">{tx.currency}</td>
                        <td className="py-3 truncate max-w-[150px]" title={tx.description}>{tx.description}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.status === 'COMPLETED' ? 'bg-emeraldAccent/15 text-emeraldAccent' :
                            tx.status === 'PENDING' ? 'bg-yellow-500/15 text-yellow-500' :
                            'bg-red-500/15 text-red-400'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400 dark:text-gray-500">{new Date(tx.created_at).toLocaleString()}</td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditTransaction(tx)}
                              className="p-1.5 bg-cyanAccent/20 text-cyanAccent rounded hover:bg-cyanAccent/30"
                              title="Edit/Backdate Transaction"
                            >
                              <Settings size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteTransaction(tx.id)}
                              className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                              title="Delete Transaction"
                            >
                              <UserMinus size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 9: INVESTMENT PLANS MANAGEMENT */}
        {activeTab === 'plans' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create/Edit Form */}
            <div className="lg:col-span-1 glass-panel p-6 rounded-xl h-fit">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                {editingPlan ? 'Edit Investment Plan' : 'Create Investment Plan'}
              </h3>
              <form onSubmit={handleCreateOrUpdatePlan} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Package Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Starter Plan"
                    className="w-full p-2.5 rounded glass-input text-xs font-bold"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Min Deposit ($)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="100.00"
                      className="w-full p-2.5 rounded glass-input text-xs font-bold"
                      value={planMinDeposit}
                      onChange={(e) => setPlanMinDeposit(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Max Deposit ($)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="999.00"
                      className="w-full p-2.5 rounded glass-input text-xs font-bold"
                      value={planMaxDeposit}
                      onChange={(e) => setPlanMaxDeposit(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Daily Profit (%)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="0.50"
                      className="w-full p-2.5 rounded glass-input text-xs font-bold"
                      value={planDailyProfit}
                      onChange={(e) => setPlanDailyProfit(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Duration (Days)</label>
                    <input
                      type="number"
                      required
                      placeholder="30"
                      className="w-full p-2.5 rounded glass-input text-xs font-bold"
                      value={planDuration}
                      onChange={(e) => setPlanDuration(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="compounding"
                    checked={planCompounding}
                    onChange={(e) => setPlanCompounding(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-350 dark:border-gray-800 text-cyanAccent bg-transparent"
                  />
                  <label htmlFor="compounding" className="text-xs font-bold text-slate-705 dark:text-gray-300 select-none cursor-pointer">
                    Enable Compounding Interest
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={submittingPlan}
                    className="flex-1 py-2.5 bg-cyanAccent text-black font-bold text-xs rounded hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                  >
                    {submittingPlan ? 'Saving...' : editingPlan ? 'Update Package' : 'Create Package'}
                  </button>
                  {editingPlan && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPlan(null);
                        setPlanName('');
                        setPlanMinDeposit('');
                        setPlanMaxDeposit('');
                        setPlanDailyProfit('');
                        setPlanDuration('');
                        setPlanCompounding(false);
                      }}
                      className="py-2.5 px-4 border border-slate-200 dark:border-gray-800 text-slate-700 dark:text-gray-400 font-bold text-xs rounded hover:bg-slate-100 dark:hover:bg-gray-800/40 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Plans List Table */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-xl">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Existing Packages</h3>
              {plans.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-12">No investment packages configured.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-gray-800 text-slate-500 dark:text-gray-400 font-bold">
                        <th className="pb-3">Plan Name</th>
                        <th className="pb-3">Deposit Range</th>
                        <th className="pb-3">Daily Yield</th>
                        <th className="pb-3">Duration</th>
                        <th className="pb-3">Compounding</th>
                        <th className="pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-gray-850 text-slate-700 dark:text-gray-300">
                      {plans.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-100/50 dark:hover:bg-gray-900/10">
                          <td className="py-3 font-bold text-slate-900 dark:text-white">{p.name}</td>
                          <td className="py-3 font-semibold">
                            ${parseFloat(p.min_deposit).toLocaleString()} - ${parseFloat(p.max_deposit).toLocaleString()}
                          </td>
                          <td className="py-3 font-bold text-emeraldAccent">{p.daily_profit_percent}%</td>
                          <td className="py-3">{p.duration_days} days</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.compounding ? 'bg-cyanAccent/15 text-cyanAccent' : 'bg-slate-200 dark:bg-gray-800 text-slate-500 dark:text-gray-455'}`}>
                              {p.compounding ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditPlan(p)}
                                className="p-1.5 bg-cyanAccent/20 text-cyanAccent rounded hover:bg-cyanAccent/30"
                                title="Edit Package"
                              >
                                <Settings size={12} />
                              </button>
                              <button
                                onClick={() => handleDeletePlan(p.id)}
                                className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                                title="Delete Package"
                              >
                                <UserMinus size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 10: SYSTEM WALLET ADDRESSES MANAGEMENT */}
        {activeTab === 'system_wallets' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create/Edit Address Form */}
            <div className="lg:col-span-1 glass-panel p-6 rounded-xl h-fit">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                {selectedAdminWallet ? 'Edit Receiving Address' : 'Add Receiving Address'}
              </h3>
              <form onSubmit={handleCreateOrUpdateWalletAddress} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Select Currency</label>
                  <select
                    value={walletCurrency}
                    onChange={(e) => setWalletCurrency(e.target.value)}
                    className="w-full p-2.5 rounded glass-input text-xs font-bold cursor-pointer"
                    disabled={!!selectedAdminWallet}
                  >
                    <option value="BTC">Bitcoin (BTC)</option>
                    <option value="ETH">Ethereum (ETH)</option>
                    <option value="USDT">Tether (USDT)</option>
                    <option value="BNB">Binance Coin (BNB)</option>
                    <option value="SOL">Solana (SOL)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Receiving Address</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter blockchain wallet address"
                    className="w-full p-2.5 rounded glass-input text-xs font-bold"
                    value={walletAddressVal}
                    onChange={(e) => setWalletAddressVal(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={submittingWalletAddress}
                    className="flex-1 py-2.5 bg-cyanAccent text-black font-bold text-xs rounded hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                  >
                    {submittingWalletAddress ? 'Saving...' : selectedAdminWallet ? 'Update Address' : 'Add Address'}
                  </button>
                  {selectedAdminWallet && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAdminWallet(null);
                        setWalletCurrency('BTC');
                        setWalletAddressVal('');
                      }}
                      className="py-2.5 px-4 border border-slate-200 dark:border-gray-800 text-slate-700 dark:text-gray-400 font-bold text-xs rounded hover:bg-slate-100 dark:hover:bg-gray-800/40 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Addresses List Table */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-xl">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Active System Receiving Addresses</h3>
              <p className="text-xs text-gray-400 mb-6 font-medium">These addresses are displayed dynamically across all user accounts when they request deposit details or check their ledger wallets.</p>
              {adminWalletAddresses.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-12">No system receiving addresses configured. Users will see "no wallet address for currency".</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-gray-800 text-slate-500 dark:text-gray-400 font-bold">
                        <th className="pb-3 w-1/4">Currency</th>
                        <th className="pb-3 w-1/2">Receiving Wallet Address</th>
                        <th className="pb-3 w-1/4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-gray-850 text-slate-700 dark:text-gray-300">
                      {adminWalletAddresses.map((wa) => (
                        <tr key={wa.id} className="hover:bg-slate-100/50 dark:hover:bg-gray-900/10">
                          <td className="py-4 font-bold text-slate-900 dark:text-white">{wa.currency}</td>
                          <td className="py-4 font-mono select-all truncate max-w-[250px]" title={wa.address}>
                            {wa.address}
                          </td>
                          <td className="py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditWalletAddress(wa)}
                                className="p-1.5 bg-cyanAccent/20 text-cyanAccent rounded hover:bg-cyanAccent/30"
                                title="Edit Address"
                              >
                                <Settings size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteWalletAddress(wa.id)}
                                className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                                title="Delete Address"
                              >
                                <UserMinus size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 11: USER INVESTMENTS MANAGEMENT */}
        {activeTab === 'investments' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create/Edit Investment Form */}
            <div className="lg:col-span-1 glass-panel p-6 rounded-xl h-fit">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                {editingInvestment ? 'Edit User Investment' : 'Create User Investment'}
              </h3>
              <form onSubmit={handleCreateOrUpdateInvestment} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Select User</label>
                  <select
                    value={invUser}
                    onChange={(e) => setInvUser(e.target.value)}
                    className="w-full p-2.5 rounded glass-input text-xs font-bold cursor-pointer"
                    disabled={!!editingInvestment}
                  >
                    <option value="">-- Choose User --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} (@{u.username})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Select Package</label>
                  <select
                    value={invPlan}
                    onChange={(e) => setInvPlan(e.target.value)}
                    className="w-full p-2.5 rounded glass-input text-xs font-bold cursor-pointer"
                  >
                    <option value="">-- Choose Package --</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.daily_profit_percent}% yield)</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Principal Amount</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="1000.00"
                      className="w-full p-2.5 rounded glass-input text-xs font-bold"
                      value={invAmount}
                      onChange={(e) => setInvAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Currency</label>
                    <input
                      type="text"
                      required
                      placeholder="USDT"
                      className="w-full p-2.5 rounded glass-input text-xs font-bold"
                      value={invCurrency}
                      onChange={(e) => setInvCurrency(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Expected Profit</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="15.00"
                      className="w-full p-2.5 rounded glass-input text-xs font-bold"
                      value={invExpectedProfit}
                      onChange={(e) => setInvExpectedProfit(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Profit Type</label>
                    <select
                      value={invExpectedProfitType}
                      onChange={(e) => setInvExpectedProfitType(e.target.value)}
                      className="w-full p-2.5 rounded glass-input text-xs font-bold cursor-pointer"
                    >
                      <option value="PERCENT">Percentage (%)</option>
                      <option value="ABSOLUTE">Absolute Amount ($)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Payout Frequency</label>
                  <select
                    value={invDistributionFrequency}
                    onChange={(e) => setInvDistributionFrequency(e.target.value)}
                    className="w-full p-2.5 rounded glass-input text-xs font-bold cursor-pointer"
                  >
                    <option value="HOURLY">Hourly</option>
                    <option value="CUSTOM_6H">Every 6 Hours</option>
                    <option value="CUSTOM_12H">Every 12 Hours</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MATURITY">At Maturity</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Start Date</label>
                    <input
                      type="datetime-local"
                      className="w-full p-2.5 rounded glass-input text-xs"
                      value={invStartDate}
                      onChange={(e) => setInvStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">End Date (Optional)</label>
                    <input
                      type="datetime-local"
                      className="w-full p-2.5 rounded glass-input text-xs"
                      value={invEndDate}
                      onChange={(e) => setInvEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={invIsAutomated}
                      onChange={(e) => setInvIsAutomated(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-350 dark:border-gray-800 text-cyanAccent bg-transparent"
                    />
                    <span className="text-xs font-bold text-slate-705 dark:text-gray-300">Automated Yields</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={invAutoReinvest}
                      onChange={(e) => setInvAutoReinvest(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-350 dark:border-gray-800 text-cyanAccent bg-transparent"
                    />
                    <span className="text-xs font-bold text-slate-705 dark:text-gray-300">Auto Reinvest</span>
                  </label>
                </div>

                {editingInvestment && (
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Status</label>
                    <select
                      value={invStatus}
                      onChange={(e) => setInvStatus(e.target.value)}
                      className="w-full p-2.5 rounded glass-input text-xs font-bold cursor-pointer"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="ACTIVE">Active</option>
                      <option value="PAUSED">Paused</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={submittingInvestment}
                    className="flex-1 py-2.5 bg-cyanAccent text-black font-bold text-xs rounded hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                  >
                    {submittingInvestment ? 'Saving...' : editingInvestment ? 'Update Investment' : 'Create Investment'}
                  </button>
                  {editingInvestment && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingInvestment(null);
                        resetInvestmentForm();
                      }}
                      className="py-2.5 px-4 border border-slate-200 dark:border-gray-800 text-slate-700 dark:text-gray-400 font-bold text-xs rounded hover:bg-slate-100 dark:hover:bg-gray-800/40 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Investments List Table */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-xl">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">User Portfolios</h3>
              {adminInvestments.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-12">No user investments recorded.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-gray-800 text-slate-500 dark:text-gray-400 font-bold">
                        <th className="pb-3">User</th>
                        <th className="pb-3">Plan</th>
                        <th className="pb-3">Principal</th>
                        <th className="pb-3">Yield / Expected</th>
                        <th className="pb-3">Schedule</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-gray-850 text-slate-700 dark:text-gray-300">
                      {adminInvestments.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-100/50 dark:hover:bg-gray-900/10">
                          <td className="py-4">
                            <span className="font-bold text-slate-900 dark:text-white block">{inv.username}</span>
                            <span className="text-[10px] text-gray-500 font-mono">INV-{inv.id}</span>
                          </td>
                          <td className="py-4 font-semibold text-slate-900 dark:text-white">
                            {inv.plan_details?.name}
                          </td>
                          <td className="py-4 font-bold text-slate-900 dark:text-white">
                            ${parseFloat(inv.amount).toFixed(2)} {inv.currency}
                          </td>
                          <td className="py-4">
                            <span className="text-emeraldAccent font-bold block">+${parseFloat(inv.profit_accrued).toFixed(4)}</span>
                            <span className="text-[10px] text-slate-500 font-medium">of {inv.expected_profit_type === 'PERCENT' ? `${inv.expected_profit}%` : `$${parseFloat(inv.expected_profit).toFixed(2)}`}</span>
                          </td>
                          <td className="py-4">
                            <span className="block text-[10px] font-semibold text-gray-400">Freq: {inv.distribution_frequency}</span>
                            <span className="text-[9px] text-gray-500 font-medium block">Next: {inv.next_payout_at ? new Date(inv.next_payout_at).toLocaleString() : 'N/A'}</span>
                          </td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              inv.status === 'ACTIVE' ? 'bg-emeraldAccent/15 text-emeraldAccent' :
                              inv.status === 'PAUSED' ? 'bg-amber-500/15 text-amber-500' :
                              inv.status === 'PENDING' ? 'bg-cyanAccent/15 text-cyanAccent' :
                              'bg-slate-200 dark:bg-gray-800 text-slate-500'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="flex flex-wrap gap-1">
                              {inv.status === 'ACTIVE' && (
                                <button
                                  onClick={() => handlePauseInvestment(inv.id)}
                                  className="px-2 py-1 bg-amber-500/20 text-amber-500 rounded font-bold text-[9px] hover:bg-amber-500/30"
                                >
                                  Pause
                                </button>
                              )}
                              {inv.status === 'PAUSED' && (
                                <button
                                  onClick={() => handleResumeInvestment(inv.id)}
                                  className="px-2 py-1 bg-emeraldAccent/20 text-emeraldAccent rounded font-bold text-[9px] hover:bg-emeraldAccent/30"
                                >
                                  Resume
                                </button>
                              )}
                              {(inv.status === 'ACTIVE' || inv.status === 'PAUSED') && (
                                <>
                                  <button
                                    onClick={() => {
                                      const ref = window.confirm('Refund principal amount back to user balance?');
                                      handleCancelInvestment(inv.id, ref);
                                    }}
                                    className="px-2 py-1 bg-red-500/20 text-red-400 rounded font-bold text-[9px] hover:bg-red-500/30"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleTriggerPayout(inv.id)}
                                    className="px-2 py-1 bg-cyanAccent/20 text-cyanAccent rounded font-bold text-[9px] hover:bg-cyanAccent/30"
                                  >
                                    Payout
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => startEditInvestment(inv)}
                                className="p-1 bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-400 rounded hover:opacity-90"
                              >
                                <Settings size={10} />
                              </button>
                              <button
                                onClick={() => handleDeleteInvestment(inv.id)}
                                className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 12: AUTOMATION CONTROLS PANEL */}
        {activeTab === 'automation' && (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-xl border border-slate-200 dark:border-gray-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Automation Switches</h3>
              <p className="text-xs text-gray-400 mb-6 font-medium">Control the automated profit distribution engine. Disabling a switch suspends scheduling events.</p>
              
              <div className="flex items-center justify-between p-4 bg-slate-100/40 dark:bg-gray-950/20 rounded-lg border border-slate-200 dark:border-gray-850">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Global Auto Profit Distribution (Kill-Switch)</h4>
                  <p className="text-[10px] text-gray-500 mt-1">Directly halts or resumes all scheduled profit credit payouts globally across the system.</p>
                </div>
                <button
                  onClick={() => handleToggleGlobalAutomation(!globalAutomationEnabled)}
                  className={`px-4 py-2 rounded text-xs font-black transition cursor-pointer ${
                    globalAutomationEnabled ? 'bg-cyanAccent text-black' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {globalAutomationEnabled ? 'GLOBAL ENABLED' : 'GLOBAL DISABLED'}
                </button>
              </div>
            </div>

            {/* Scheduled payouts list */}
            <div className="glass-panel p-6 rounded-xl border border-slate-200 dark:border-gray-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Upcoming Scheduled Payouts</h3>
              {scheduledPayouts.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-12">No payouts currently scheduled. Make sure user investments are ACTIVE.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-gray-800 text-slate-500 dark:text-gray-400 font-bold">
                        <th className="pb-3">Investment ID</th>
                        <th className="pb-3">User</th>
                        <th className="pb-3">Package</th>
                        <th className="pb-3">Principal</th>
                        <th className="pb-3">Payout Amount</th>
                        <th className="pb-3">Scheduled Time</th>
                        <th className="pb-3">Automation Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-gray-850 text-slate-700 dark:text-gray-300">
                      {scheduledPayouts.map((sp) => (
                        <tr key={sp.id} className="hover:bg-slate-100/50 dark:hover:bg-gray-900/10">
                          <td className="py-3 font-mono text-gray-500">INV-{sp.id}</td>
                          <td className="py-3 font-bold text-slate-900 dark:text-white">
                            <span className="block">{sp.username}</span>
                            <button
                              onClick={() => handleToggleUserAutomation(sp.id, !sp.user_enabled)}
                              className={`text-[9px] underline font-medium ${sp.user_enabled ? 'text-cyanAccent' : 'text-amber-500'}`}
                            >
                              User Automation: {sp.user_enabled ? 'ON' : 'OFF'}
                            </button>
                          </td>
                          <td className="py-3 font-semibold text-slate-900 dark:text-white">{sp.plan_name}</td>
                          <td className="py-3 font-semibold">${sp.amount.toFixed(2)}</td>
                          <td className="py-3 font-bold text-emeraldAccent">${sp.amount_per_payout.toFixed(4)}</td>
                          <td className="py-3 font-mono text-gray-400">{new Date(sp.next_payout_at).toLocaleString()}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              (globalAutomationEnabled && sp.is_automated && !sp.is_paused && sp.user_enabled)
                                ? 'bg-emeraldAccent/15 text-emeraldAccent'
                                : 'bg-red-500/15 text-red-400'
                            }`}>
                              {(globalAutomationEnabled && sp.is_automated && !sp.is_paused && sp.user_enabled) ? 'Ready / Active' : 'Suspended'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[500px]">
            {/* Left column: Ticket List */}
            <div className="glass-panel rounded-xl overflow-hidden flex flex-col max-h-[600px] border border-slate-200 dark:border-gray-800">
              <div className="p-4 border-b border-slate-200 dark:border-gray-850 bg-slate-100/40 dark:bg-gray-950/30 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">User Tickets</span>
                <span className="bg-slate-200 dark:bg-gray-800 text-[10px] text-slate-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-bold">{supportTickets.length}</span>
              </div>
              <div className="overflow-y-auto divide-y divide-slate-150 dark:divide-gray-855 flex-1">
                {supportTickets.length === 0 ? (
                  <div className="text-center py-12 text-xs text-gray-500 px-4">
                    <MessageSquare size={32} className="mx-auto text-slate-450 dark:text-gray-650 mb-2" />
                    No support tickets found.
                  </div>
                ) : (
                  supportTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedAdminTicket(t)}
                      className={`p-4 cursor-pointer text-left transition ${
                        selectedAdminTicket?.id === t.id ? 'bg-slate-100/60 dark:bg-[#1f2937]/35 border-l-2 border-red-500' : 'hover:bg-slate-100/20 dark:hover:bg-gray-900/30'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{t.subject}</span>
                          <span className="text-[9px] text-gray-550 font-semibold">User: {t.user_details?.full_name || `@${t.user_details?.username || t.user}`}</span>
                        </div>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                          t.status === 'RESOLVED' ? 'bg-emeraldAccent/15 text-emeraldAccent' :
                          t.status === 'CLOSED' ? 'bg-gray-850 text-gray-500' :
                          t.status === 'IN_PROGRESS' ? 'bg-cyanAccent/15 text-cyanAccent' :
                          'bg-yellow-500/15 text-yellow-500'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-gray-400 line-clamp-1 mb-2">{t.message}</p>
                      <div className="flex items-center justify-between text-[9px] text-gray-500">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          t.priority === 'CRITICAL' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                          t.priority === 'HIGH' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' :
                          t.priority === 'MEDIUM' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' :
                          'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        }`}>
                          {t.priority}
                        </span>
                        <span>{new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right column: Conversation & Control */}
            <div className="lg:col-span-2 glass-panel rounded-xl overflow-hidden flex flex-col max-h-[600px] border border-slate-200 dark:border-gray-800">
              {selectedAdminTicket ? (
                <>
                  {/* Ticket Header & Status management */}
                  <div className="p-4 border-b border-slate-200 dark:border-gray-855 bg-slate-100/30 dark:bg-gray-950/20 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Ticket: {selectedAdminTicket.subject}</h3>
                      <p className="text-[9px] text-gray-400 font-semibold">
                        User: <span className="text-slate-900 dark:text-white">{selectedAdminTicket.user_details?.full_name} (@{selectedAdminTicket.user_details?.username})</span> | Email: <span className="text-slate-900 dark:text-white">{selectedAdminTicket.user_details?.email}</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedAdminTicket.status}
                        onChange={(e) => handleUpdateTicketStatus(selectedAdminTicket.id, e.target.value)}
                        className="p-1.5 rounded glass-input text-[10px] font-bold"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                      <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${
                        selectedAdminTicket.priority === 'CRITICAL' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                        selectedAdminTicket.priority === 'HIGH' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' :
                        selectedAdminTicket.priority === 'MEDIUM' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' :
                        'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      }`}>
                        {selectedAdminTicket.priority} Priority
                      </span>
                    </div>
                  </div>

                  {/* Message Thread */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20 dark:bg-gray-950/5">
                    {/* User's Original Message */}
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-lg p-3 bg-slate-100 dark:bg-gray-850/80 border border-slate-200 dark:border-gray-850 text-left">
                        <div className="flex items-center gap-1 text-[9px] font-semibold text-cyanAccent mb-1">
                          <User size={10} />
                          <span>{selectedAdminTicket.user_details?.full_name}</span>
                          <span className="text-gray-500 font-normal">| Original Issue</span>
                        </div>
                        <p className="text-xs text-slate-900 dark:text-white whitespace-pre-wrap">{selectedAdminTicket.message}</p>
                        <span className="block text-[8px] text-gray-500 mt-2 text-right">
                          {new Date(selectedAdminTicket.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Replies */}
                    {adminTicketDetails?.messages?.map((msg) => {
                      const isAgent = msg.is_admin;
                      return (
                        <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-lg p-3 text-left ${
                            isAgent 
                              ? 'bg-gradient-to-br from-red-500/5 to-amber-500/5 border border-red-500/30 shadow-sm'
                              : 'bg-white dark:bg-[#111827] border border-slate-250 dark:border-gray-800'
                          }`}>
                            <div className="flex items-center gap-1 text-[9px] font-semibold mb-1">
                              {isAgent ? (
                                <>
                                  <ShieldAlert size={10} className="text-red-400" />
                                  <span className="text-red-400">You (Support)</span>
                                </>
                              ) : (
                                <>
                                  <User size={10} className="text-cyanAccent" />
                                  <span className="text-cyanAccent">{selectedAdminTicket.user_details?.full_name}</span>
                                </>
                              )}
                            </div>
                            <p className="text-xs text-slate-800 dark:text-white whitespace-pre-wrap">{msg.message}</p>
                            <span className="block text-[8px] text-gray-500 mt-2 text-right">
                              {new Date(msg.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={adminChatEndRef} />
                  </div>

                  {/* Reply Input */}
                  <div className="p-4 border-t border-slate-200 dark:border-gray-855 bg-slate-100/30 dark:bg-gray-950/20">
                    <form onSubmit={handleAdminSendReply} className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Type reply message to user..."
                        className="flex-1 p-2.5 rounded glass-input text-xs"
                        value={adminReplyMessage}
                        onChange={(e) => setAdminReplyMessage(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={adminReplying || !adminReplyMessage.trim()}
                        className="bg-red-500 text-white p-2.5 rounded hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center aspect-square cursor-pointer"
                      >
                        <Send size={16} />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-xs text-gray-500 py-12 px-4">
                  <LifeBuoy size={48} className="text-slate-400 dark:text-gray-650 mb-3" />
                  <p className="font-semibold text-slate-900 dark:text-white">No Ticket Selected</p>
                  <p className="text-[10px] text-gray-400 mt-1">Select a ticket from the left panel to review and reply.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* USER EDIT/BALANCE DIALOG */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] border border-slate-200 dark:border-gray-800 rounded-xl shadow-2xl p-6 text-left transition-colors duration-300">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Edit User Balances & Status</h3>
            <p className="text-[11px] text-slate-500 dark:text-gray-400 mb-6">Updating portfolio fields for: <span className="text-slate-900 dark:text-white font-bold">{selectedUser.full_name} (@{selectedUser.username})</span></p>
            
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Available Balance ($)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="w-full p-2.5 rounded glass-input text-xs font-bold"
                    value={editUserBalance}
                    onChange={(e) => setEditUserBalance(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Daily Reward ($)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="w-full p-2.5 rounded glass-input text-xs font-bold"
                    value={editUserProfitBalance}
                    onChange={(e) => setEditUserProfitBalance(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Active Investment ($)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Auto Calculated"
                    className="w-full p-2.5 rounded glass-input text-xs font-bold"
                    value={editUserActiveInvestment}
                    onChange={(e) => setEditUserActiveInvestment(e.target.value)}
                  />
                  <span className="text-[8px] text-gray-500 block mt-1">Leave empty for auto calculation.</span>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Profit Accrued ($)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Auto Calculated"
                    className="w-full p-2.5 rounded glass-input text-xs font-bold"
                    value={editUserProfitAccrued}
                    onChange={(e) => setEditUserProfitAccrued(e.target.value)}
                  />
                  <span className="text-[8px] text-gray-500 block mt-1">Leave empty for auto calculation.</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Referral Bonus ($)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Auto Calculated"
                    className="w-full p-2.5 rounded glass-input text-xs font-bold"
                    value={editUserReferralBonus}
                    onChange={(e) => setEditUserReferralBonus(e.target.value)}
                  />
                  <span className="text-[8px] text-gray-500 block mt-1">Leave empty for auto calculation.</span>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Tier Status</label>
                  <select
                    className="w-full p-2.5 rounded glass-input text-xs font-bold"
                    value={editUserVipLevel}
                    onChange={(e) => setEditUserVipLevel(e.target.value)}
                  >
                    <option value="1">VIP Level 1</option>
                    <option value="2">VIP Level 2</option>
                    <option value="3">VIP Level 3 VIP</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submittingAdjust}
                  className="flex-1 py-2.5 bg-cyanAccent text-black font-bold text-xs rounded hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                >
                  {submittingAdjust ? 'Updating...' : 'Save & Update'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-gray-800 text-slate-700 dark:text-gray-400 font-bold text-xs rounded hover:bg-slate-100 dark:hover:bg-gray-800/40 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSACTION EDIT/BACKDATE DIALOG */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] border border-slate-200 dark:border-gray-800 rounded-xl shadow-2xl p-6 text-left transition-colors duration-300">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Edit & Backdate Transaction</h3>
            <p className="text-[11px] text-slate-500 dark:text-gray-400 mb-6 font-semibold">Updating Transaction record #{selectedTransaction.id} for User ID @{selectedTransaction.user}</p>
            
            <form onSubmit={handleUpdateTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Transaction Type</label>
                  <select
                    className="w-full p-2.5 rounded glass-input text-xs font-bold"
                    value={txEditType}
                    onChange={(e) => setTxEditType(e.target.value)}
                  >
                    <option value="DEPOSIT">Deposit</option>
                    <option value="WITHDRAWAL">Withdrawal</option>
                    <option value="INVESTMENT">Investment</option>
                    <option value="PROFIT">Profit</option>
                    <option value="REFERRAL_BONUS">Referral Bonus</option>
                    <option value="ADMIN_ADJUSTMENT">Admin Adjustment</option>
                    <option value="FEE">Fee</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Status</label>
                  <select
                    className="w-full p-2.5 rounded glass-input text-xs font-bold"
                    value={txEditStatus}
                    onChange={(e) => setTxEditStatus(e.target.value)}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Amount</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="w-full p-2.5 rounded glass-input text-xs font-bold"
                    value={txEditAmount}
                    onChange={(e) => setTxEditAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-2">Currency</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. USDT"
                    className="w-full p-2.5 rounded glass-input text-xs font-bold"
                    value={txEditCurrency}
                    onChange={(e) => setTxEditCurrency(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-gray-455 uppercase mb-2">Backdate/Transaction Date</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full p-2.5 rounded glass-input text-xs font-bold"
                  value={txEditCreatedAt}
                  onChange={(e) => setTxEditCreatedAt(e.target.value)}
                />
                <span className="text-[9px] text-gray-500 mt-1 block">Adjusting this changes the transaction timestamp (backdating).</span>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-gray-455 uppercase mb-2">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Profit adjustment for June"
                  className="w-full p-2.5 rounded glass-input text-xs"
                  value={txEditDesc}
                  onChange={(e) => setTxEditDesc(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submittingTxEdit}
                  className="flex-1 py-2.5 bg-cyanAccent text-black font-bold text-xs rounded hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                >
                  {submittingTxEdit ? 'Saving Changes...' : 'Save & Update'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTransaction(null)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-gray-800 text-slate-700 dark:text-gray-400 font-bold text-xs rounded hover:bg-slate-100 dark:hover:bg-gray-800/40 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
