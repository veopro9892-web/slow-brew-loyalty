'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createCustomer } from '@/lib/storage';
import { Customer } from '@/lib/types';
import { playClickSound, triggerHaptic } from '@/lib/sounds';

interface RegisterFormProps {
  onRegistered: (customer: Customer) => void;
}

const stepIndicators = ['name', 'phone', 'email'] as const;

export default function RegisterForm({ onRegistered }: RegisterFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'name' | 'phone' | 'email'>('name');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStepIndex = stepIndicators.indexOf(step);

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
    setIsSubmitting(true);
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
      {/* Coffee cup logo with glow */}
      <motion.div
        className="text-center mb-8"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <motion.div
          className="text-7xl mb-4 inline-block"
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          ☕
        </motion.div>
        <h1 className="text-3xl font-heading font-bold text-amber-900">Welcome to</h1>
        <h2 className="text-4xl font-heading font-extrabold text-gradient-amber mt-1">Slow Brew</h2>
        <p className="text-amber-700/70 mt-3 text-sm font-body">
          Join our loyalty club and earn free treats!
        </p>
      </motion.div>

      {/* Step indicator */}
      <div className="flex justify-center gap-2 mb-6">
        {stepIndicators.map((s, i) => (
          <motion.div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < currentStepIndex
                ? 'w-8 bg-amber-600'
                : i === currentStepIndex
                  ? 'w-10 bg-amber-500'
                  : 'w-4 bg-amber-200'
            }`}
            layoutId={`step-${s}`}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence mode="wait">
          {step === 'name' && (
            <motion.div
              key="name"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="glass-amber rounded-3xl p-6 shadow-depth-md">
                <label className="block text-sm font-medium text-amber-800 mb-3">
                  What&apos;s your name?
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  autoFocus
                  autoComplete="name"
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-amber-300/50
                             bg-white/60 text-amber-900 placeholder-amber-400/60
                             focus:border-amber-500 focus:ring-4 focus:ring-amber-200/40
                             transition-all text-lg font-body"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleNameNext())}
                />
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm font-medium px-1"
                >
                  {error}
                </motion.p>
              )}
              <motion.button
                type="button"
                onClick={handleNameNext}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-700 to-amber-800
                           text-white font-heading font-semibold text-lg
                           hover:from-amber-600 hover:to-amber-700 transition-all
                           shadow-depth-md hover:shadow-depth-lg"
              >
                Next →
              </motion.button>
            </motion.div>
          )}

          {step === 'phone' && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="glass-amber rounded-3xl p-6 shadow-depth-md">
                <p className="text-amber-800 font-heading font-medium text-lg mb-3">
                  Hey {name}! 👋
                </p>
                <label className="block text-sm font-medium text-amber-800 mb-3">
                  Phone number <span className="text-amber-500/70 font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  autoFocus
                  autoComplete="tel"
                  inputMode="tel"
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-amber-300/50
                             bg-white/60 text-amber-900 placeholder-amber-400/60
                             focus:border-amber-500 focus:ring-4 focus:ring-amber-200/40
                             transition-all text-lg font-body"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handlePhoneNext())}
                />
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm font-medium px-1"
                >
                  {error}
                </motion.p>
              )}
              <div className="flex gap-3">
                <motion.button
                  type="button"
                  onClick={() => { setStep('name'); setError(''); }}
                  whileTap={{ scale: 0.95 }}
                  className="py-3.5 px-5 rounded-2xl border-2 border-amber-300 text-amber-800
                             font-medium hover:bg-amber-100/50 transition-colors"
                >
                  ←
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handlePhoneNext}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.01 }}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-700 to-amber-800
                             text-white font-heading font-semibold text-lg
                             hover:from-amber-600 hover:to-amber-700 transition-all
                             shadow-depth-md hover:shadow-depth-lg"
                >
                  {phone.trim() ? 'Next →' : 'Skip →'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="glass-amber rounded-3xl p-6 shadow-depth-md">
                <p className="text-amber-800 font-heading font-medium text-lg mb-3">
                  Almost there, {name}! 🎉
                </p>
                <label className="block text-sm font-medium text-amber-800 mb-3">
                  Your email for rewards
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  autoFocus
                  autoComplete="email"
                  inputMode="email"
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-amber-300/50
                             bg-white/60 text-amber-900 placeholder-amber-400/60
                             focus:border-amber-500 focus:ring-4 focus:ring-amber-200/40
                             transition-all text-lg font-body"
                />
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm font-medium px-1"
                >
                  {error}
                </motion.p>
              )}
              <div className="flex gap-3">
                <motion.button
                  type="button"
                  onClick={() => { setStep('phone'); setError(''); }}
                  whileTap={{ scale: 0.95 }}
                  className="py-3.5 px-5 rounded-2xl border-2 border-amber-300 text-amber-800
                             font-medium hover:bg-amber-100/50 transition-colors"
                >
                  ←
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-700 to-amber-800
                             text-white font-heading font-semibold text-lg
                             hover:from-amber-600 hover:to-amber-700 transition-all
                             shadow-depth-md hover:shadow-depth-lg
                             disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="inline-block"
                      >
                        ☕
                      </motion.span>
                      Brewing...
                    </span>
                  ) : (
                    'Start Collecting ☕'
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Info cards with glassmorphism */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 space-y-3"
      >
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="glass-amber flex items-center gap-3 rounded-2xl p-4 shadow-depth-sm"
        >
          <span className="text-2xl">🎯</span>
          <div>
            <p className="text-sm font-heading font-medium text-amber-900">30 Levels to conquer</p>
            <p className="text-xs text-amber-700/70 font-body">Each visit = 1 stamp</p>
          </div>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="glass-amber flex items-center gap-3 rounded-2xl p-4 shadow-depth-sm"
        >
          <span className="text-2xl">🎁</span>
          <div>
            <p className="text-sm font-heading font-medium text-amber-900">Unlock rewards as you go</p>
            <p className="text-xs text-amber-700/70 font-body">Free treats waiting at milestone levels!</p>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
