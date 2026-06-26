import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { moods } from '../utils/constants'

function getMoodEmoji(moodId) {
  const m = moods.find(m => m.id === moodId)
  return m ? m.emoji : '💭'
}

export default function HistoryModal({ isOpen, onClose, history, onOpen, onDelete, onClearAll, loading }) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="relative z-50 w-full max-w-2xl max-h-[80vh] glass-card overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between p-6 border-b border-dark-700/50">
            <h2 className="text-xl font-bold text-white">Wisdom History</h2>
            <div className="flex items-center gap-3">
              {history.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={onClose}
                className="text-dark-400 hover:text-white transition-colors text-xl leading-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">📜</p>
                <p className="text-dark-400">No wisdom generated yet</p>
                <p className="text-dark-500 text-sm mt-1">Generate your first wisdom to see it here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((entry, index) => (
                  <motion.div
                    key={entry.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="glass-card p-4 flex items-start gap-4 group"
                  >
                    <span className="text-2xl flex-shrink-0 mt-1">{getMoodEmoji(entry.mood)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-white font-medium capitalize">{entry.mood}</span>
                        <span className="text-dark-600">•</span>
                        <span className="text-purple-400">{entry.philosophy}</span>
                      </div>
                      <p className="text-dark-400 text-sm mt-1 line-clamp-2">{entry.wisdom_text}</p>
                      <p className="text-dark-600 text-xs mt-1">
                        {entry.created_at ? new Date(entry.created_at).toLocaleString() : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onOpen(entry)}
                        className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                        title="Open wisdom"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => onDelete(entry.id)}
                        className="text-sm text-red-400 hover:text-red-300 transition-colors"
                        title="Delete entry"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
