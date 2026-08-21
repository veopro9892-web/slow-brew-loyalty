'use client';

import { motion } from 'framer-motion';

interface StampAnimationProps {
  icon: string;
  title: string;
  level: number;
}

export default function StampAnimation({ icon, title, level }: StampAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{
          scale: [0, 1.5, 1],
          rotate: [-180, 10, 0],
        }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        {/* Stamp ring */}
        <motion.div
          animate={{
            boxShadow: [
              '0 0 0px rgba(251, 191, 36, 0)',
              '0 0 40px rgba(251, 191, 36, 0.6)',
              '0 0 0px rgba(251, 191, 36, 0)',
            ],
          }}
          transition={{ duration: 1 }}
          className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-600 to-amber-800
                     flex items-center justify-center shadow-2xl"
        >
          <span className="text-5xl">{icon}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4 text-center"
        >
          <p className="text-white text-2xl font-bold drop-shadow-lg">Level {level}!</p>
          <p className="text-amber-200 text-lg font-medium drop-shadow">{title}</p>
        </motion.div>

        {/* Floating particles */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-amber-400"
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
            }}
            animate={{
              x: Math.cos((i / 8) * Math.PI * 2) * 120,
              y: Math.sin((i / 8) * Math.PI * 2) * 120,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
