'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import RegisterForm from '@/components/RegisterForm';
import StampCard from '@/components/StampCard';
import StampAnimation from '@/components/StampAnimation';
import RewardCelebration from '@/components/RewardCelebration';
import { Customer, Reward, Offer, LEVEL_CONFIGS, DEFAULT_OFFERS } from '@/lib/types';
import { playStampSound, playRewardSound, triggerHaptic } from '@/lib/sounds';
import { useLocalStorage } from '@/lib/useLocalStorage';

type StampStatus = 'idle' | 'requesting' | 'waiting' | 'approved' | 'denied';

export default function Home() {
  const initialCustomer = useLocalStorage<Customer | null>(
    'slowbrew_customer',
    (raw) => JSON.parse(raw) as Customer,
    null,
  );
  const initialOffers = useLocalStorage<Offer[]>(
    'slowbrew_offers',
    (raw) => JSON.parse(raw) as Offer[],
    DEFAULT_OFFERS,
  );

  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
  const [offers] = useState<Offer[]>(initialOffers);
  const [justStamped, setJustStamped] = useState(false);
  const [showStampAnim, setShowStampAnim] = useState(false);
  const [stampAnimData, setStampAnimData] = useState<{ icon: string; title: string; level: number } | null>(null);
  const [showRewardCelebration, setShowRewardCelebration] = useState(false);
  const [currentReward, setCurrentReward] = useState<Reward | null>(null);

  // Stamp request flow
  const [stampStatus, setStampStatus] = useState<StampStatus>('idle');
  const [requestToken, setRequestToken] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync with server on load and periodically
  const syncWithServer = useCallback(async (cust: Customer) => {
    try {
      // Push local data to server if needed
      await fetch('/api/customers/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: cust.id, name: cust.name, email: cust.email }),
      });
      // Pull latest from server
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        const serverCustomer = data.customers?.find((c: Customer) => c.id === cust.id);
        if (serverCustomer && serverCustomer.stamps !== cust.stamps) {
          setCustomer(serverCustomer);
          localStorage.setItem('slowbrew_customer', JSON.stringify(serverCustomer));
        }
      }
    } catch { /* offline — keep local data */ }
  }, []);

  // Sync on mount and periodically
  useEffect(() => {
    if (!customer) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    syncWithServer(customer);
    const id = setInterval(() => syncWithServer(customer), 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processApprovedStamp = useCallback(async (serverReward?: Reward | null) => {
    if (!customer) return;

    // Pull latest from server after approval
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        const updated = data.customers?.find((c: Customer) => c.id === customer.id);
        if (updated) {
          setCustomer(updated);
          localStorage.setItem('slowbrew_customer', JSON.stringify(updated));

          const levelConfig = LEVEL_CONFIGS[updated.stamps - 1];
          playStampSound();
          triggerHaptic('medium');
          setStampAnimData({ icon: levelConfig.icon, title: levelConfig.title, level: updated.stamps });
          setShowStampAnim(true);
          setJustStamped(true);

          // Check if a new reward was granted
          const newReward = serverReward || updated.rewards.find(
            (r: Reward) => !r.redeemed && updated.rewards.indexOf(r) === updated.rewards.length - 1,
          );

          setTimeout(() => {
            setShowStampAnim(false);
            if (newReward) {
              setTimeout(() => {
                playRewardSound();
                triggerHaptic('heavy');
                setCurrentReward(newReward);
                setShowRewardCelebration(true);
              }, 300);
            }
          }, 1500);

          setTimeout(() => {
            setJustStamped(false);
            setStampStatus('idle');
          }, 3000);
          return;
        }
      }
    } catch { /* fallback */ }

    // Fallback: just reset status
    setStampStatus('idle');
  }, [customer]);

  // Poll for approval status
  useEffect(() => {
    if (stampStatus !== 'waiting' || !customer) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/stamps/status?customerId=${customer.id}`);
        const data = await res.json();
        if (data.request?.status === 'approved') {
          clearInterval(pollRef.current!);
          setStampStatus('approved');
          processApprovedStamp(data.newReward);
        } else if (data.request?.status === 'denied') {
          clearInterval(pollRef.current!);
          setStampStatus('denied');
          setTimeout(() => setStampStatus('idle'), 2000);
        }
      } catch { /* retry */ }
    }, 2000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [stampStatus, customer, processApprovedStamp]);

  const handleRequestStamp = useCallback(async () => {
    if (!customer || customer.stamps >= 30) return;

    setStampStatus('requesting');
    try {
      const res = await fetch('/api/stamps/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customer.id }),
      });
      const data = await res.json();
      if (data.token) {
        setRequestToken(data.token);
        setStampStatus('waiting');
      } else {
        setStampStatus('idle');
      }
    } catch {
      setStampStatus('idle');
    }
  }, [customer]);

  const handleRefresh = useCallback(async () => {
    if (!customer) return;
    await syncWithServer(customer);
  }, [customer, syncWithServer]);

  const handleSwitchAccount = useCallback(() => {
    localStorage.removeItem('slowbrew_customer');
    setCustomer(null);
    setStampStatus('idle');
    setRequestToken(null);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 text-6xl opacity-5 rotate-12">☕</div>
        <div className="absolute top-40 right-5 text-4xl opacity-5 -rotate-12">🫖</div>
        <div className="absolute bottom-20 left-20 text-5xl opacity-5 rotate-45">☕</div>
        <div className="absolute bottom-40 right-20 text-3xl opacity-5">🍪</div>
        <div className="absolute top-1/2 left-1/3 text-4xl opacity-5">🥐</div>
      </div>

      {/* Main content */}
      <div className="relative z-10 px-5 py-8 pb-20">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold text-amber-800 tracking-wider">SLOW BREW</h1>
          <div className="w-12 h-0.5 bg-amber-400 mx-auto mt-1"></div>
        </div>

        {!customer ? (
          <RegisterForm onRegistered={(c) => setCustomer(c)} />
        ) : (
          <>
            {/* Refresh + Switch Account buttons */}
            <div className="flex justify-between items-center mb-4 max-w-sm mx-auto">
              <button
                onClick={handleRefresh}
                className="text-xs text-amber-600 hover:text-amber-800 transition-colors flex items-center gap-1"
              >
                🔄 Refresh
              </button>
              <button
                onClick={handleSwitchAccount}
                className="text-xs text-amber-600 hover:text-amber-800 transition-colors flex items-center gap-1"
              >
                👤 Switch account
              </button>
            </div>

            <StampCard
              customer={customer}
              offers={offers}
              onRequestStamp={handleRequestStamp}
              justStamped={justStamped}
              stampStatus={stampStatus}
              requestToken={requestToken}
            />
          </>
        )}
      </div>

      {/* Stamp animation overlay */}
      <AnimatePresence>
        {showStampAnim && stampAnimData && (
          <StampAnimation {...stampAnimData} />
        )}
      </AnimatePresence>

      {/* Reward celebration overlay */}
      <AnimatePresence>
        {showRewardCelebration && currentReward && (
          <RewardCelebration
            reward={currentReward}
            levelTitle={LEVEL_CONFIGS[currentReward.level - 1].title}
            onContinue={() => {
              setShowRewardCelebration(false);
              setCurrentReward(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Footer gradient */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-amber-100 to-transparent h-16 pointer-events-none" />
    </main>
  );
}
