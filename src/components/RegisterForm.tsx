'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { createCustomer } from '@/lib/storage';
import { Customer } from '@/lib/types';
import { playClickSound, triggerHaptic } from '@/lib/sounds';

interface RegisterFormProps {
  onRegistered: (customer: Customer) => void;
}

export default function RegisterForm({ onRegistered }: RegisterFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'name' | 'phone' | 'email'>('name');
  const [error, setError] = useState('');

  const handleNameNext = () => {
    if (name.trim().length < 2) {
      setError('Please enter your name');
      return;
    }
    setError('');
    playClickSound();
    triggerHaptic('light');
    setStep('phone');
  };

  const handlePhoneNext = () => {
    // Phone is optional — just move to email
    setError('');
    playClickSound();
    triggerHaptic('light');
    setStep('email');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return;
    }
    setError('');
    playClickSound();
    triggerHaptic('medium');

    const phoneValue = phone.trim() || undefined;

    // Try server first, fall back to local
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), phone: phoneValue }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('slowbrew_customer', JSON.stringify(data.customer));
        onRegistered(data.customer);
        return;
      }
    } catch { /* offline — use local */ }

    const customer = createCustomer(name.trim(), email.trim().toLowerCase());
    if (phoneValue) customer.phone = phoneValue;
    onRegistered(customer);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-sm mx-auto"
    >
      {/* Coffee cup logo */}
      <motion.div
        className="text-center mb-8"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <div className="text-7xl mb-4">☕</div>
        <h1 className="text-3xl font-bold text-amber-900">Welcome to</h1>
        <h2 className="text-4xl font-extrabold text-amber-800 mt-1">Slow Brew</h2>
        <p className="text-amber-700/70 mt-3 text-sm">
          Join our loyalty club and earn free treats!
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 'name' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-2">
                What&apos;s your name?
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                autoFocus
                className="w-full px-4 py-3 rounded-2xl border-2 border-amber-200
                           bg-white/80 text-amber-900 placeholder-amber-400
                           focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200
                           transition-all text-lg"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleNameNext())}
              />
            </div>
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm">
                {error}
              </motion.p>
            )}
            <motion.button
              type="button"
              onClick={handleNameNext}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              className="w-full py-3 rounded-2xl bg-amber-800 text-white font-semibold text-lg
                         hover:bg-amber-700 transition-colors shadow-lg shadow-amber-900/20"
            >
              Next →
            </motion.button>
          </motion.div>
        )}

        {step === 'phone' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <p className="text-amber-800 font-medium">
              Hey {name}! 👋
            </p>
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-2">
                Phone number <span className="text-amber-500 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                autoFocus
                className="w-full px-4 py-3 rounded-2xl border-2 border-amber-200
                           bg-white/80 text-amber-900 placeholder-amber-400
                           focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200
                           transition-all text-lg"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handlePhoneNext())}
              />
            </div>
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm">
                {error}
              </motion.p>
            )}
            <div className="flex gap-3">
              <motion.button
                type="button"
                onClick={() => { setStep('name'); setError(''); }}
                whileTap={{ scale: 0.95 }}
                className="py-3 px-5 rounded-2xl border-2 border-amber-300 text-amber-800 font-medium
                           hover:bg-amber-50 transition-colors"
              >
                ←
              </motion.button>
              <motion.button
                type="button"
                onClick={handlePhoneNext}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                className="flex-1 py-3 rounded-2xl bg-amber-800 text-white font-semibold text-lg
                           hover:bg-amber-700 transition-colors shadow-lg shadow-amber-900/20"
              >
                {phone.trim() ? 'Next →' : 'Skip →'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 'email' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <p className="text-amber-800 font-medium">
              Almost there, {name}! 🎉
            </p>
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-2">
                Your email for rewards
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoFocus
                className="w-full px-4 py-3 rounded-2xl border-2 border-amber-200
                           bg-white/80 text-amber-900 placeholder-amber-400
                           focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200
                           transition-all text-lg"
              />
            </div>
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm">
                {error}
              </motion.p>
            )}
            <div className="flex gap-3">
              <motion.button
                type="button"
                onClick={() => { setStep('phone'); setError(''); }}
                whileTap={{ scale: 0.95 }}
                className="py-3 px-5 rounded-2xl border-2 border-amber-300 text-amber-800 font-medium
                           hover:bg-amber-50 transition-colors"
              >
                ←
              </motion.button>
              <motion.button
                type="submit"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                className="flex-1 py-3 rounded-2xl bg-amber-800 text-white font-semibold text-lg
                           hover:bg-amber-700 transition-colors shadow-lg shadow-amber-900/20"
              >
                Start Collecting ☕
              </motion.button>
            </div>
          </motion.div>
        )}
      </form>

      {/* Info cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 space-y-3"
      >
        <div className="flex items-center gap-3 bg-white/60 rounded-xl p-3">
          <span className="text-2xl">🎯</span>
          <div>
            <p className="text-sm font-medium text-amber-900">30 Levels to conquer</p>
            <p className="text-xs text-amber-700/70">Each visit = 1 stamp</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white/60 rounded-xl p-3">
          <span className="text-2xl">🎁</span>
          <div>
            <p className="text-sm font-medium text-amber-900">Unlock rewards as you go</p>
            <p className="text-xs text-amber-700/70">Free treats waiting at milestone levels!</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
