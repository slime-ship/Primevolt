import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/api';
import { LifeBuoy, Plus, Send, Clock, AlertCircle, MessageSquare, Check, User, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Support = () => {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states for creating ticket
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [creating, setCreating] = useState(false);

  // Form states for chat reply
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchTicketDetails(selectedTicket.id);
      const interval = setInterval(() => {
        fetchTicketDetails(selectedTicket.id, true);
      }, 5000); // Polling for new admin messages every 5s
      return () => clearInterval(interval);
    }
  }, [selectedTicket]);

  useEffect(() => {
    scrollToBottom();
  }, [ticketDetails]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTickets = async () => {
    try {
      const res = await api.get('support/tickets/');
      setTickets(res.data);
      if (res.data.length > 0 && !selectedTicket) {
        setSelectedTicket(res.data[0]);
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch support tickets.');
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (id, isSilent = false) => {
    try {
      const res = await api.get(`support/tickets/${id}/`);
      setTicketDetails(res.data);
    } catch (err) {
      if (!isSilent) {
        setError('Failed to fetch conversation history.');
      }
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject || !message) {
      setError('Please provide a subject and detailed message.');
      return;
    }
    setCreating(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('support/tickets/', { subject, message, priority });
      setSuccess('Support ticket created successfully.');
      setSubject('');
      setMessage('');
      setPriority('MEDIUM');
      setShowCreateModal(false);
      
      // Refresh list and set active
      const updatedRes = await api.get('support/tickets/');
      setTickets(updatedRes.data);
      const newTicket = updatedRes.data.find(t => t.subject === res.data.subject) || res.data;
      setSelectedTicket(newTicket);
    } catch (err) {
      setError('Failed to open a support ticket.');
    } finally {
      setCreating(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setReplying(true);
    setError('');
    try {
      const res = await api.post(`support/tickets/${selectedTicket.id}/messages/`, {
        message: replyMessage
      });
      // Append message locally to avoid scroll jump
      if (ticketDetails) {
        setTicketDetails({
          ...ticketDetails,
          messages: [...ticketDetails.messages, res.data]
        });
      }
      setReplyMessage('');
      
      // Refresh ticket state in list
      fetchTickets();
    } catch (err) {
      setError('Failed to deliver message.');
    } finally {
      setReplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-transparent">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyanAccent border-t-transparent"></div>
      </div>
    );
  }

  const getPriorityStyle = (p) => {
    switch (p) {
      case 'CRITICAL': return 'bg-red-500/15 text-red-400 border border-red-500/30';
      case 'HIGH': return 'bg-orange-500/15 text-orange-400 border border-orange-500/30';
      case 'MEDIUM': return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30';
      default: return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
    }
  };

  const getStatusStyle = (s) => {
    switch (s) {
      case 'RESOLVED': return 'bg-emeraldAccent/15 text-emeraldAccent';
      case 'CLOSED': return 'bg-gray-800 text-gray-500';
      case 'IN_PROGRESS': return 'bg-cyanAccent/15 text-cyanAccent';
      default: return 'bg-yellow-500/15 text-yellow-500';
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 min-h-[calc(100vh-4rem)] flex flex-col text-left">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <LifeBuoy className="text-cyanAccent animate-pulse" /> {t('Support Operations Center')}
          </h1>
          <p className="text-xs text-gray-400">{t('Initiate tickets and chat directly with our financial support specialists.')}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-cyanAccent to-emeraldAccent text-black px-4 py-2 rounded text-xs font-bold hover:opacity-90 transition"
        >
          <Plus size={16} /> {t('New Support Ticket')}
        </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-[500px]">
        {/* Ticket List column */}
        <div className="glass-panel rounded-xl overflow-hidden flex flex-col max-h-[600px] border border-slate-200 dark:border-gray-800">
          <div className="p-4 border-b border-slate-200 dark:border-gray-850 bg-slate-100/40 dark:bg-gray-950/30 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('Your Support Tickets')}</span>
            <span className="bg-slate-200 dark:bg-gray-800 text-[10px] text-slate-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-bold">{tickets.length}</span>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-150 dark:divide-gray-850 flex-1">
            {tickets.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-500 px-4">
                <MessageSquare size={32} className="mx-auto text-slate-450 dark:text-gray-650 mb-2" />
                {t('No tickets filed. Click \'New Support Ticket\' to start a session.')}
              </div>
            ) : (
              tickets.map((tItem) => (
                <div
                  key={tItem.id}
                  onClick={() => setSelectedTicket(tItem)}
                  className={`p-4 cursor-pointer text-left transition ${
                    selectedTicket?.id === tItem.id ? 'bg-slate-100/60 dark:bg-[#1f2937]/35 border-l-2 border-cyanAccent' : 'hover:bg-slate-100/20 dark:hover:bg-gray-900/30'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{tItem.subject}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${getStatusStyle(tItem.status)}`}>
                      {tItem.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-gray-400 line-clamp-1 mb-2">{tItem.message}</p>
                  <div className="flex items-center justify-between text-[9px] text-gray-500">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${getPriorityStyle(tItem.priority)}`}>
                      {tItem.priority}
                    </span>
                    <span>{new Date(tItem.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Conversation details column */}
        <div className="lg:col-span-2 glass-panel rounded-xl overflow-hidden flex flex-col max-h-[600px] border border-slate-200 dark:border-gray-800">
          {selectedTicket ? (
            <>
              {/* Ticket header status banner */}
              <div className="p-4 border-b border-slate-200 dark:border-gray-850 bg-slate-100/30 dark:bg-gray-950/20 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">{t('Ticket: ')}{selectedTicket.subject}</h3>
                  <p className="text-[9px] text-gray-400">{t('Created: ')}{new Date(selectedTicket.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${getPriorityStyle(selectedTicket.priority)}`}>
                    {selectedTicket.priority} {t('Priority')}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${getStatusStyle(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>

              {/* Scrollable messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20 dark:bg-gray-950/5">
                {/* Initial Ticket Message */}
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg p-3 bg-slate-100 dark:bg-gray-850/80 border border-slate-200 dark:border-gray-850 text-left">
                    <div className="flex items-center gap-1 text-[9px] font-semibold text-cyanAccent mb-1">
                      <User size={10} />
                      <span>{selectedTicket.user_details?.full_name || 'You'}</span>
                      <span className="text-gray-500 font-normal">| OP</span>
                    </div>
                    <p className="text-xs text-slate-900 dark:text-white whitespace-pre-wrap">{selectedTicket.message}</p>
                    <span className="block text-[8px] text-gray-500 mt-2 text-right">
                      {new Date(selectedTicket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Reply list */}
                {ticketDetails?.messages?.map((msg) => {
                  const isAgent = msg.is_admin;
                  return (
                    <div key={msg.id} className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] rounded-lg p-3 text-left ${
                        isAgent 
                          ? 'bg-white dark:bg-[#111827] border border-cyanAccent/30 shadow-sm' 
                          : 'bg-gradient-to-br from-cyanAccent/5 to-emeraldAccent/5 border border-slate-200 dark:border-gray-800'
                      }`}>
                        <div className="flex items-center gap-1 text-[9px] font-semibold mb-1">
                          {isAgent ? (
                            <>
                              <ShieldAlert size={10} className="text-emeraldAccent" />
                              <span className="text-emeraldAccent">{t('Support Specialist')}</span>
                            </>
                          ) : (
                            <>
                              <User size={10} className="text-cyanAccent" />
                              <span className="text-cyanAccent">{msg.sender_name || 'You'}</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-slate-800 dark:text-white whitespace-pre-wrap">{msg.message}</p>
                        <span className="block text-[8px] text-gray-500 mt-2 text-right">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input panel */}
              <div className="p-4 border-t border-slate-200 dark:border-gray-850 bg-slate-100/30 dark:bg-gray-950/20">
                {selectedTicket.status === 'CLOSED' && (
                  <p className="text-[10px] text-yellow-500 mb-2">⚠ {t('This ticket is closed. Typing a reply will automatically reopen this support thread.')}</p>
                )}
                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder={t('Type your message to support...')}
                    className="flex-1 p-2.5 rounded glass-input text-xs"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={replying || !replyMessage.trim()}
                    className="bg-cyanAccent text-black p-2.5 rounded hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center aspect-square"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-xs text-gray-500 py-12 px-4">
              <LifeBuoy size={48} className="text-slate-400 dark:text-gray-650 mb-3" />
              <p className="font-semibold text-slate-900 dark:text-white">{t('No Ticket Selected')}</p>
              <p className="text-[10px] text-gray-400 mt-1">{t('Select a ticket from the left panel or start a new support thread.')}</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE TICKET DIALOG MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-gray-850 rounded-xl shadow-2xl p-6 text-left">
            <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-4">{t('File Support Request Ticket')}</h3>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">{t('Subject / Core Issue')}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deposit proof upload failed"
                  className="w-full p-2.5 rounded glass-input text-xs"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">{t('Priority Level')}</label>
                <select
                  className="w-full p-2.5 rounded glass-input text-xs"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="LOW">{t('Low - General Question')}</option>
                  <option value="MEDIUM">{t('Medium - Technical Problem')}</option>
                  <option value="HIGH">{t('High - Transaction Hold')}</option>
                  <option value="CRITICAL">{t('Critical - Compromised Account')}</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">{t('Detailed Description')}</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Please state transaction hashes, steps, or screenshots links where possible..."
                  className="w-full p-2.5 rounded glass-input text-xs"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-250 dark:border-gray-850 text-slate-700 dark:text-white rounded text-xs hover:bg-slate-100 dark:hover:bg-gray-850 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-gradient-to-r from-cyanAccent to-emeraldAccent text-black rounded text-xs font-bold hover:opacity-90 transition"
                >
                  {creating ? 'Opening Session...' : 'Submit Support Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;
