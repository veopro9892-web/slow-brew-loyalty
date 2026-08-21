'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Customer, Offer, DEFAULT_LEVEL_OFFER_ICON } from '@/lib/types';
import { StampRequest } from '@/lib/stamp-request';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

let toastId = 0;

export default function AdminPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [pin, setPin] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Offer form
  const [editingLevel, setEditingLevel] = useState<number | null>(null);
  const [draft, setDraft] = useState({ level: '', title: '', description: '', icon: '' });
  const [formError, setFormError] = useState('');

  // Pending stamp requests
  const [pendingRequests, setPendingRequests] = useState<StampRequest[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers');
      if (!res.ok) return;
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch { /* ignore */ }
  }, []);

  const loadOffers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/offers');
      if (!res.ok) return;
      const data = await res.json();
      setOffers(data.offers || []);
    } catch { /* ignore */ }
  }, []);

  const loadPending = useCallback(async () => {
    try {
      const res = await fetch('/api/stamps/pending');
      if (!res.ok) return;
      const data = await res.json();
      setPendingRequests(data.requests || []);
    } catch { /* ignore */ }
  }, []);

  const loadData = useCallback(() => {
    loadCustomers();
    loadOffers();
    loadPending();
  }, [loadCustomers, loadOffers, loadPending]);

  // Auto-refresh pending requests
  useEffect(() => {
    if (!authenticated) return;
    const id = setInterval(loadPending, 3000);
    return () => clearInterval(id);
  }, [authenticated, loadPending]);

  // --- Admin Auth ---
  const handleLogin = async () => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        setAuthenticated(true);
        loadData();
      } else {
        showToast('Invalid PIN', 'error');
      }
    } catch {
      showToast('Login failed', 'error');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthenticated(false);
    setCustomers([]);
    setOffers([]);
    setPendingRequests([]);
  };

  // --- Stamp Requests ---
  const handleApprove = async (token: string) => {
    const res = await fetch('/api/stamps/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: 'approve' }),
    });
    if (res.ok) {
      showToast('Stamp approved!');
      loadPending();
      loadCustomers();
    } else {
      showToast('Failed to approve', 'error');
    }
  };

  const handleDeny = async (token: string) => {
    await fetch('/api/stamps/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: 'deny' }),
    });
    showToast('Request denied');
    loadPending();
  };

  // --- Customer Management ---
  const handleAdjustStamps = async (customerId: string, delta: number) => {
    const res = await fetch('/api/customers/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, delta }),
    });
    if (res.ok) {
      const data = await res.json();
      showToast(delta > 0 ? '+1 stamp added' : '−1 stamp removed');
      if (data.newReward) {
        showToast(`🎉 Reward unlocked: ${data.newReward.title}`);
      }
      loadCustomers();
      // Update selected customer view
      if (selectedCustomer?.id === customerId && data.customer) {
        setSelectedCustomer(data.customer);
      }
    } else {
      showToast('Failed to adjust stamps', 'error');
    }
  };

  const handleRedeemReward = async (customerId: string, rewardId: string) => {
    const res = await fetch('/api/customers/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, rewardId }),
    });
    if (res.ok) {
      const data = await res.json();
      showToast('Reward redeemed!');
      loadCustomers();
      if (data.customer) setSelectedCustomer(data.customer);
    } else {
      showToast('Failed to redeem', 'error');
    }
  };

  // --- Offers ---
  const handleSaveOffer = async () => {
    const level = Number(draft.level);
    if (!Number.isInteger(level) || level < 1 || level > 30) {
      setFormError('Level must be 1–30.');
      return;
    }
    if (!draft.title.trim() || !draft.description.trim()) {
      setFormError('Title and description required.');
      return;
    }
    if (editingLevel === -1 && offers.some(o => o.level === level)) {
      setFormError(`Level ${level} already has an offer.`);
      return;
    }
    const res = await fetch('/api/admin/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offer: {
          level,
          title: draft.title.trim(),
          description: draft.description.trim(),
          icon: draft.icon.trim() || DEFAULT_LEVEL_OFFER_ICON,
        },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setOffers(data.offers);
      setEditingLevel(null);
      setDraft({ level: '', title: '', description: '', icon: '' });
      showToast('Offer saved!');
    }
  };

  const handleDeleteOffer = async (level: number) => {
    if (!confirm(`Delete offer at level ${level}?`)) return;
    const res = await fetch('/api/admin/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', level }),
    });
    if (res.ok) {
      const data = await res.json();
      setOffers(data.offers);
      if (editingLevel === level) setEditingLevel(null);
      showToast('Offer deleted');
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const nextReward = (stamps: number) => offers.find(o => o.level > stamps);

  // --- Login Screen ---
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-3xl p-8 max-w-sm w-full border border-gray-700"
        >
          <div className="text-center mb-6">
            <span className="text-4xl">🔐</span>
            <h1 className="text-2xl font-bold text-white mt-2">Admin Panel</h1>
            <p className="text-gray-400 text-sm">Slow Brew Loyalty</p>
          </div>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            className="w-full px-4 py-3 rounded-xl bg-gray-700 text-white border border-gray-600
                       focus:border-amber-500 focus:outline-none text-center text-2xl tracking-[0.5em]"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button
            onClick={handleLogin}
            className="w-full mt-4 py-3 rounded-xl bg-amber-700 text-white font-semibold
                       hover:bg-amber-600 transition-colors"
          >
            Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-5">
      <div className="max-w-2xl mx-auto">
        {/* Toast notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          <AnimatePresence>
            {toasts.map(toast => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className={`px-4 py-2 rounded-xl text-sm font-medium shadow-lg ${
                  toast.type === 'success'
                    ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
                }`}
              >
                {toast.message}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">☕ Slow Brew Admin</h1>
            <p className="text-gray-400 text-sm">{customers.length} total customers</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-gray-700 text-gray-300 text-sm
                       hover:bg-gray-600 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Pending Stamp Requests */}
        {pendingRequests.length > 0 && (
          <div className="bg-gray-800 rounded-2xl p-4 border-2 border-amber-600 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🔔</span>
              <h2 className="text-white font-semibold">Pending Stamp Requests</h2>
              <span className="ml-auto bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingRequests.length}
              </span>
            </div>
            <div className="space-y-2">
              {pendingRequests.map(req => (
                <div
                  key={req.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-900 border border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-700 flex items-center justify-center
                                    text-white font-bold text-sm">
                      {req.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{req.customerName}</p>
                      <p className="text-amber-400 font-mono text-lg font-bold tracking-wider">{req.token}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(req.token)}
                      className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-bold
                                 hover:bg-green-500 transition-colors"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleDeny(req.token)}
                      className="px-4 py-2 rounded-xl bg-red-900/60 text-red-300 text-sm font-bold
                                 hover:bg-red-900 transition-colors"
                    >
                      ✗
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
            <p className="text-gray-400 text-xs">Total Customers</p>
            <p className="text-2xl font-bold text-white">{customers.length}</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
            <p className="text-gray-400 text-xs">Total Visits</p>
            <p className="text-2xl font-bold text-amber-400">
              {customers.reduce((sum, c) => sum + c.stamps, 0)}
            </p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
            <p className="text-gray-400 text-xs">Active Rewards</p>
            <p className="text-2xl font-bold text-green-400">
              {customers.reduce((sum, c) => sum + c.rewards.filter(r => !r.redeemed).length, 0)}
            </p>
          </div>
        </div>

        {/* Offers management */}
        <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-white font-semibold">🎁 Offers</h2>
              <p className="text-gray-500 text-xs">Rewards unlock as customers reach each level</p>
            </div>
            {editingLevel === null && (
              <button
                onClick={() => {
                  const taken = new Set(offers.map(o => o.level));
                  let firstFree = 1;
                  while (firstFree <= 30 && taken.has(firstFree)) firstFree++;
                  setDraft({ level: firstFree <= 30 ? String(firstFree) : '', title: '', description: '', icon: '' });
                  setFormError('');
                  setEditingLevel(-1);
                }}
                className="px-3 py-2 rounded-xl bg-amber-700 text-white text-sm font-medium
                           hover:bg-amber-600 transition-colors"
              >
                ＋ Add
              </button>
            )}
          </div>

          <AnimatePresence>
            {editingLevel !== null && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-gray-900 rounded-xl p-4 mb-3 border border-gray-700 space-y-3">
                  <p className="text-sm font-medium text-amber-300">
                    {editingLevel === -1 ? 'New offer' : `Editing level ${editingLevel}`}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Level</label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={draft.level}
                        disabled={editingLevel !== -1}
                        onChange={(e) => setDraft({ ...draft, level: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-600
                                   focus:border-amber-500 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Icon (emoji)</label>
                      <input
                        type="text"
                        value={draft.icon}
                        placeholder={DEFAULT_LEVEL_OFFER_ICON}
                        onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-600
                                   focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Title</label>
                    <input
                      type="text"
                      value={draft.title}
                      placeholder="Free Cookie!"
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-600
                                 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Description</label>
                    <textarea
                      value={draft.description}
                      placeholder="Enjoy a free cookie with your next visit!"
                      rows={2}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-600
                                 focus:border-amber-500 focus:outline-none resize-none"
                    />
                  </div>
                  {formError && <p className="text-red-400 text-xs">{formError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveOffer}
                      className="flex-1 py-2 rounded-lg bg-amber-700 text-white text-sm font-medium
                                 hover:bg-amber-600 transition-colors"
                    >
                      {editingLevel === -1 ? 'Add offer' : 'Save changes'}
                    </button>
                    <button
                      onClick={() => { setEditingLevel(null); setDraft({ level: '', title: '', description: '', icon: '' }); }}
                      className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 text-sm
                                 hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {offers.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No offers yet.</p>
          ) : (
            <div className="space-y-2">
              {offers.map(offer => (
                <div
                  key={offer.level}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-900 border border-gray-700"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl shrink-0">{offer.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        <span className="text-amber-400">Lv.{offer.level}</span> — {offer.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{offer.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setDraft({ level: String(offer.level), title: offer.title, description: offer.description, icon: offer.icon });
                        setEditingLevel(offer.level);
                      }}
                      className="px-3 py-1 rounded-lg bg-gray-700 text-gray-200 text-xs font-medium
                                 hover:bg-gray-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteOffer(offer.level)}
                      className="px-3 py-1 rounded-lg bg-red-900/60 text-red-300 text-xs font-medium
                                 hover:bg-red-900 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer list */}
        <div className="space-y-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700
                         focus:border-amber-500 focus:outline-none text-sm placeholder-gray-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl">{searchQuery ? '🔍' : '📋'}</span>
              <p className="text-gray-400 mt-2">{searchQuery ? 'No matching customers' : 'No customers yet'}</p>
            </div>
          ) : (
            filteredCustomers.map(customer => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedCustomer(
                  selectedCustomer?.id === customer.id ? null : customer
                )}
                className="bg-gray-800 rounded-2xl p-4 border border-gray-700
                           cursor-pointer hover:border-amber-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-800 flex items-center justify-center
                                    text-white font-bold text-sm">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{customer.name}</p>
                      <p className="text-gray-500 text-xs">{customer.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdjustStamps(customer.id, -1);
                      }}
                      disabled={customer.stamps <= 0}
                      className="w-8 h-8 rounded-lg bg-gray-700 text-white font-bold text-sm
                                 hover:bg-red-800 transition-colors disabled:opacity-30 disabled:hover:bg-gray-700"
                    >
                      −
                    </button>
                    <div className="text-center min-w-[3rem]">
                      <p className="text-amber-400 font-bold">Lv.{customer.stamps}</p>
                      <p className="text-gray-500 text-[10px]">
                        {customer.rewards.filter(r => !r.redeemed).length} rewards
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdjustStamps(customer.id, 1);
                      }}
                      disabled={customer.stamps >= 30}
                      className="w-8 h-8 rounded-lg bg-gray-700 text-white font-bold text-sm
                                 hover:bg-green-800 transition-colors disabled:opacity-30 disabled:hover:bg-gray-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Expanded view */}
                {selectedCustomer?.id === customer.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-gray-700 space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Joined</p>
                        <p className="text-gray-300">{new Date(customer.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Last Visit</p>
                        <p className="text-gray-300">{new Date(customer.lastVisit).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{customer.stamps}/30</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-600 rounded-full transition-all"
                          style={{ width: `${(customer.stamps / 30) * 100}%` }}
                        />
                      </div>
                    </div>

                    {customer.rewards.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-400">Rewards</p>
                        {customer.rewards.map(reward => (
                          <div
                            key={reward.id}
                            className={`flex items-center justify-between p-3 rounded-xl ${
                              reward.redeemed ? 'bg-gray-700/50' : 'bg-amber-900/30 border border-amber-700'
                            }`}
                          >
                            <div>
                              <p className={`text-sm font-medium ${reward.redeemed ? 'text-gray-500' : 'text-amber-300'}`}>
                                {reward.title}
                              </p>
                              <code className={`text-xs font-mono ${reward.redeemed ? 'text-gray-600' : 'text-amber-400'}`}>
                                {reward.code}
                              </code>
                            </div>
                            {!reward.redeemed ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRedeemReward(customer.id, reward.id);
                                }}
                                className="px-3 py-1 rounded-lg bg-green-600 text-white text-xs font-medium
                                           hover:bg-green-500 transition-colors"
                              >
                                Redeem
                              </button>
                            ) : (
                              <span className="text-xs text-gray-500">✓ Redeemed</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {(() => {
                      const next = nextReward(customer.stamps);
                      return next ? (
                        <div className="text-xs text-gray-500">
                          Next reward: {next.title} (in {next.level - customer.stamps} visit{next.level - customer.stamps > 1 ? 's' : ''})
                        </div>
                      ) : null;
                    })()}
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
