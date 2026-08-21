'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Customer, Offer, LEVEL_CONFIGS } from '@/lib/types';
import { useState } from 'react';

interface StampCardProps {
  customer: Customer;
  offers: Offer[];
  onRequestStamp: () => void;
  justStamped: boolean;
  stampStatus: 'idle' | 'requesting' | 'waiting' | 'approved' | 'denied';
  requestToken: string | null;
}

export default function StampCard({ customer, offers, onRequestStamp, justStamped, stampStatus, requestToken }: StampCardProps) {
  const [showRewards, setShowRewards] = useState(false);
  const currentLevel = customer.stamps;
  const offersByLevel = new Map(offers.map(o => [o.level, o]));
  const nextOffer = offers.find(o => o.level > currentLevel);
  const stampsToNext = nextOffer ? nextOffer.level - currentLevel : 0;
  const overallProgress = (currentLevel / 30) * 100;

  // Current card page (8 stamps per page)
  const currentPage = Math.floor(currentLevel / 8);
  const pageStart = currentPage * 8;
  const pageStamps = LEVEL_CONFIGS.slice(pageStart, pageStart + 8);

  return (
    <div className="w-full max-w-sm mx-auto space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="text-amber-700/70 text-sm font-body">Welcome back,</p>
        <h1 className="text-2xl font-heading font-bold text-amber-900">{customer.name}!</h1>
      </motion.div>

      {/* Level Badge */}
      <motion.div
        className="relative mx-auto w-32 h-32"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        {/* Circular progress */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#fde68a" strokeWidth="6" />
          <motion.circle
            cx="50" cy="50" r="42" fill="none"
            stroke="#92400e" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 42}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - overallProgress / 100) }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl">
            {currentLevel > 0 ? LEVEL_CONFIGS[currentLevel - 1].icon : '☕'}
          </span>
          <span className="text-xl font-heading font-bold text-amber-900">Lv.{currentLevel}</span>
          <span className="text-[10px] text-amber-700/70 font-body">
            {currentLevel > 0 ? LEVEL_CONFIGS[currentLevel - 1].title : 'New Brewer'}
          </span>
        </div>
      </motion.div>

      {/* Next reward indicator */}
      {nextOffer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center glass-amber rounded-2xl p-4 shadow-depth-sm"
        >
          <p className="text-xs text-amber-700/70 font-body">Next reward in</p>
          <p className="text-2xl font-heading font-bold text-amber-800">{stampsToNext} visit{stampsToNext > 1 ? 's' : ''}</p>
          <p className="text-sm text-amber-700 font-body">
            {nextOffer.icon} {nextOffer.title}
          </p>
        </motion.div>
      )}

      {currentLevel >= 30 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-gradient-to-r from-yellow-100 via-amber-100 to-yellow-100 rounded-2xl p-4 border-2 border-yellow-400"
        >
          <p className="text-2xl">🏆</p>
          <p className="text-lg font-bold text-amber-900">You&apos;re a Legend!</p>
          <p className="text-sm text-amber-700">All 30 levels completed!</p>
        </motion.div>
      )}

      {/* Stamp Card - current page */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-5 shadow-depth-lg"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-heading font-semibold text-amber-800">
            Card {currentPage + 1} of 4
          </h3>
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
            {Math.min(currentLevel - pageStart, 8)}/8
          </span>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {pageStamps.map((config, idx) => {
            const stampIndex = pageStart + idx;
            const isCollected = stampIndex < currentLevel;
            const isNext = stampIndex === currentLevel;
            const isJustCollected = justStamped && stampIndex === currentLevel - 1;
            const levelOffer = offersByLevel.get(config.level);

            return (
              <motion.div
                key={config.level}
                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center
                  ${isCollected
                    ? levelOffer
                      ? 'bg-gradient-to-br from-yellow-300 to-amber-400 shadow-lg shadow-yellow-400/30'
                      : 'bg-gradient-to-br from-amber-700 to-amber-800 shadow-md'
                    : isNext
                      ? 'bg-amber-100 border-2 border-dashed border-amber-400'
                      : 'bg-amber-50 border border-amber-200'
                  }`}
                animate={isJustCollected ? {
                  scale: [1, 1.3, 1],
                  rotate: [0, -10, 10, 0],
                } : {}}
                transition={{ duration: 0.5 }}
              >
                <span className={`text-xl ${isCollected ? '' : 'grayscale opacity-30'}`}>
                  {levelOffer ? levelOffer.icon : config.icon}
                </span>
                <span className={`text-[9px] font-medium mt-0.5 ${isCollected ? 'text-white' : 'text-amber-400'}`}>
                  Lv.{config.level}
                </span>
                {isNext && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full
                               flex items-center justify-center"
                  >
                    <span className="text-white text-[8px]">+1</span>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Page dots */}
        <div className="flex justify-center gap-2 mt-4">
          {[0, 1, 2, 3].map(page => (
            <div
              key={page}
              className={`w-2 h-2 rounded-full transition-colors ${
                page === currentPage ? 'bg-amber-700' :
                page < currentPage ? 'bg-amber-400' : 'bg-amber-200'
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* Stamp Action Button */}
      {currentLevel < 30 && (
        <div>
          {justStamped ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full py-4 rounded-2xl font-bold text-lg bg-green-500 text-white shadow-xl shadow-green-500/30 text-center"
            >
              ✅ Stamp Collected!
            </motion.div>
          ) : stampStatus === 'waiting' ? (
            <div className="w-full py-4 rounded-2xl font-heading font-bold text-lg glass-dark text-white text-center space-y-2">
              <div>⏳ Waiting for barista approval...</div>
              <div className="bg-white/10 rounded-xl px-4 py-3 border-2 border-dashed border-white/20">
                <p className="text-xs text-white/60 mb-1 font-body">Show this code to the barista:</p>
                <p className="text-3xl font-mono font-bold text-amber-300 tracking-[0.3em]">{requestToken}</p>
              </div>
            </div>
          ) : stampStatus === 'requesting' ? (
            <div className="w-full py-4 rounded-2xl font-heading font-bold text-lg glass text-amber-600/60 text-center">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="inline-block mr-2"
              >
                ☕
              </motion.span>
              Sending request...
            </div>
          ) : stampStatus === 'denied' ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full py-4 rounded-2xl font-bold text-lg bg-red-100 text-red-700 shadow-lg text-center"
            >
              ❌ Request denied by barista
            </motion.div>
          ) : (
            <motion.button
              onClick={onRequestStamp}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              className="w-full py-4 rounded-2xl font-heading font-bold text-lg
                         bg-gradient-to-r from-amber-700 to-amber-800 text-white
                         shadow-depth-lg hover:shadow-depth-xl hover:from-amber-600 hover:to-amber-700
                         transition-all active:shadow-depth-sm"
            >
              <span className="flex items-center justify-center gap-2">
                ☕ Request Stamp
              </span>
            </motion.button>
          )}
        </div>
      )}

      {/* My Rewards button */}
      <motion.button
        onClick={() => setShowRewards(!showRewards)}
        whileTap={{ scale: 0.97 }}
        className="w-full py-3 rounded-2xl glass-amber text-amber-800 font-heading font-medium
                   shadow-depth-sm hover:shadow-depth-md transition-all flex items-center justify-center gap-2"
      >
        🎁 My Rewards ({customer.rewards.length})
        <motion.span animate={{ rotate: showRewards ? 180 : 0 }}>▼</motion.span>
      </motion.button>

      {/* Rewards list */}
      <AnimatePresence>
        {showRewards && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            {customer.rewards.length === 0 ? (
              <p className="text-center text-amber-600 text-sm py-4">
                No rewards yet. Keep visiting! 🚀
              </p>
            ) : (
              customer.rewards.map(reward => (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`rounded-2xl p-4 ${
                    reward.redeemed
                      ? 'bg-gray-100 border border-gray-200'
                      : 'bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`font-bold ${reward.redeemed ? 'text-gray-400 line-through' : 'text-amber-900'}`}>
                        {reward.title}
                      </p>
                      <p className={`text-sm ${reward.redeemed ? 'text-gray-400' : 'text-amber-700'}`}>
                        {reward.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <code className={`text-sm font-mono px-2 py-1 rounded ${
                      reward.redeemed ? 'bg-gray-200 text-gray-400' : 'bg-amber-200 text-amber-900'
                    }`}>
                      {reward.code}
                    </code>
                    <span className={`text-xs ${reward.redeemed ? 'text-gray-400' : 'text-green-600 font-medium'}`}>
                      {reward.redeemed ? '✓ Used' : '● Active'}
                    </span>
                  </div>
                </motion.div>
              ))
            )}

            {/* Upcoming rewards */}
            <div className="pt-2">
              <p className="text-xs font-medium text-amber-600 mb-2">Upcoming Rewards</p>
              {offers.filter(o => o.level > currentLevel).map(offer => (
                <div key={offer.level} className="flex items-center gap-3 py-2 opacity-50">
                  <span className="text-xl grayscale">{offer.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-amber-800">Lv.{offer.level} — {offer.title}</p>
                    <p className="text-xs text-amber-600">{offer.level - currentLevel} more visits</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress milestones */}
      <div className="glass-amber rounded-2xl p-4 shadow-depth-sm">
        <h3 className="text-sm font-heading font-semibold text-amber-800 mb-3">Journey Progress</h3>
        <div className="relative">
          <div className="h-3 bg-amber-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-800 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          {/* Reward markers */}
          <div className="relative mt-1">
            {offers.map(offer => (
              <div
                key={offer.level}
                className="absolute -top-5 transform -translate-x-1/2"
                style={{ left: `${(offer.level / 30) * 100}%` }}
              >
                <div className={`text-sm ${offer.level <= currentLevel ? '' : 'grayscale opacity-40'}`}>
                  {offer.icon}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-[10px] text-amber-600">
            <span>Lv.1</span>
            <span>Lv.30</span>
          </div>
        </div>
      </div>
    </div>
  );
}
