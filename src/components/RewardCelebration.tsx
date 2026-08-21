'use client';

import { motion } from 'framer-motion';
import { Reward } from '@/lib/types';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface RewardCelebrationProps {
  reward: Reward;
  levelTitle: string;
  onContinue: () => void;
}

export default function RewardCelebration({ reward, levelTitle, onContinue }: RewardCelebrationProps) {
  useEffect(() => {
    // Fire confetti!
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#92400e', '#f59e0b', '#fbbf24', '#fef3c7'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#92400e', '#f59e0b', '#fbbf24', '#fef3c7'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Big burst
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#92400e', '#f59e0b', '#fbbf24', '#fef3c7', '#ffffff'],
      });
    }, 500);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="bg-gradient-to-b from-yellow-50 via-amber-50 to-white rounded-3xl p-8
                   max-w-sm w-full shadow-2xl border-2 border-yellow-300 text-center"
      >
        {/* Glow effect */}
        <motion.div
          animate={{
            boxShadow: [
              '0 0 20px rgba(251, 191, 36, 0.3)',
              '0 0 60px rgba(251, 191, 36, 0.6)',
              '0 0 20px rgba(251, 191, 36, 0.3)',
            ],
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="rounded-3xl"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-7xl mb-4"
          >
            🎉
          </motion.div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-extrabold text-amber-900 mb-2"
        >
          {reward.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-amber-700 mb-1 text-sm"
        >
          Level {reward.level} — {levelTitle}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-amber-800 mb-6"
        >
          {reward.description}
        </motion.p>

        {/* Voucher Code */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: 'spring' }}
          className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-2xl p-4 mb-6
                     border-2 border-dashed border-amber-400"
        >
          <p className="text-xs text-amber-600 mb-1">Your Voucher Code</p>
          <p className="text-2xl font-mono font-bold text-amber-900 tracking-widest">
            {reward.code}
          </p>
          <p className="text-xs text-amber-600 mt-1">Show this at the counter</p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={onContinue}
          whileTap={{ scale: 0.95 }}
          className="w-full py-3 rounded-2xl bg-amber-800 text-white font-semibold
                     hover:bg-amber-700 transition-colors shadow-lg"
        >
          Awesome! Continue ☕
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
