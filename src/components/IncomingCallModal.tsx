import React from 'react';
import { motion } from 'framer-motion';

interface IncomingCallModalProps {
  callerName: string;
  callerAvatar?: string;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallModal({ callerName, callerAvatar, onAccept, onDecline }: IncomingCallModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div className="bg-white dark:bg-[#232336] rounded-2xl p-8 w-full max-w-md shadow-lg text-center">
        <div className="w-24 h-24 rounded-full bg-[#EAD7FF] mx-auto mb-6 overflow-hidden">
          {callerAvatar ? (
            <img src={callerAvatar} alt={callerName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-[#A166FF]">
              {callerName[0]}
            </div>
          )}
        </div>
        <h2 className="text-2xl font-bold text-[#1E0E62] dark:text-white mb-2">Входящий звонок</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8">{callerName}</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={onAccept}
            className="px-8 py-3 rounded-full bg-[#A166FF] text-white font-semibold hover:bg-[#8A4FD8] transition"
          >
            Принять
          </button>
          <button
            onClick={onDecline}
            className="px-8 py-3 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 transition"
          >
            Отклонить
          </button>
        </div>
      </div>
    </motion.div>
  );
} 