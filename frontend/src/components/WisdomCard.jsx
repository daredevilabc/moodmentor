import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { moods } from '../utils/constants'
import Feedback from './Feedback'
import { exportWisdomCard, EXPORT_THEMES } from '../utils/exporter'

function getMoodData(moodId) {
  return moods.find(m => m.id === moodId) || moods[0]
}

export default function WisdomCard({
  data, onRestart, onBack, onRegenerate, regenerating, showToast,
  isFavorited, onToggleFavorite, onFeedback, onOpenHistory, historyCount,
  onOpenFavorites, favoritesCount, error,
}) {
  const [copied, setCopied] = useState(false)
  const [animKey, setAnimKey] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [showExporter, setShowExporter] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('dark-obsidian')

  if (error && !data) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        role="alert"
        className="glass-card p-8 text-center space-y-6"
      >
        <div className="text-6xl" aria-hidden="true">😕</div>
        <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
        <p className="text-dark-400">{error}</p>
        <button onClick={onRestart} className="btn-primary">
          Try Again
        </button>
      </motion.div>
    )
  }

  if (!data) return null

  const moodData = getMoodData(data.mood)

  const handleRegenerate = async () => {
    if (regenerating || refreshing) return
    setRefreshing(true)
    setAnimKey(k => k + 1)
    try {
      await onRegenerate()
    } finally {
      setRefreshing(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.wisdom)
      setCopied(true)
      showToast('Copied to clipboard!', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('Failed to copy', 'error')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Wisdom from MoodMentor',
          text: data.wisdom,
        })
        showToast('Shared!', 'success')
      } catch {
        // user cancelled
      }
    } else {
      handleCopy()
    }
  }

  const handleExport = () => {
    try {
      exportWisdomCard(
        data.wisdom,
        moodData.label,
        moodData.emoji,
        data.philosophy,
        selectedTheme
      )
      showToast('Image card downloaded!', 'success')
      setShowExporter(false)
    } catch {
      showToast('Failed to export image card', 'error')
    }
  }

  return (
    <motion.div
      key={animKey}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      role="region"
      aria-label="Generated wisdom"
      className="space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center space-y-2"
      >
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium">
          Step 3 of 3
        </span>
        <h1 className="text-3xl md:text-4xl font-bold">
          Your <span className="gradient-text">Wisdom</span>
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
        className="glass-card p-8 md:p-10 relative overflow-hidden"
      >
        <div className={`absolute inset-0 opacity-5 ${moodData.bg}`} />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-primary-500/10 to-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl" aria-hidden="true">{moodData.emoji}</span>
            <span className="text-dark-400 text-sm font-medium uppercase tracking-wider">
              {moodData.label}
            </span>
            <span className="text-dark-600" aria-hidden="true">•</span>
            <span className="text-purple-400 text-sm font-medium">
              {data.philosophy}
            </span>
          </div>

          <div className="relative">
            <span className="absolute -top-2 -left-2 text-4xl text-primary-500/20 select-none" aria-hidden="true">"</span>
            <motion.p
              key={data.wisdom}
              initial={refreshing ? { opacity: 0, y: 10 } : undefined}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-xl md:text-2xl text-white/90 leading-relaxed text-center font-medium px-6"
            >
              {data.wisdom}
            </motion.p>
            <span className="absolute -bottom-4 -right-2 text-4xl text-primary-500/20 select-none" aria-hidden="true">"</span>
          </div>

          <div className="flex items-center justify-center gap-2 text-dark-500 text-xs">
            <span>Inspired by today's context</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6 space-y-4"
      >
        <Feedback
          wisdomId={data.id}
          mood={data.mood}
          philosophy={data.philosophy}
          onSubmit={onFeedback}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="flex items-center justify-center gap-3 flex-wrap"
      >
        <button
          onClick={onToggleFavorite}
          className={`btn-secondary flex items-center gap-2 text-lg transition-all duration-300 ${
            isFavorited ? 'text-red-400 border-red-500/30' : ''
          }`}
          title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <span className={isFavorited ? 'scale-110' : ''}>{isFavorited ? '❤️' : '🤍'}</span>
        </button>
        <button
          onClick={handleCopy}
          className="btn-secondary flex items-center gap-2"
          title="Copy to clipboard"
        >
          <span>{copied ? '✓' : '📋'}</span>
          <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
        </button>
        <button
          onClick={handleShare}
          className="btn-secondary flex items-center gap-2"
          title={navigator.share ? 'Share' : 'Copy to clipboard'}
        >
          <span>📤</span>
          <span className="text-sm">Share</span>
        </button>
        <button
          onClick={() => setShowExporter(prev => !prev)}
          className={`btn-secondary flex items-center gap-2 transition-all duration-300 ${
            showExporter ? 'border-primary-500 text-primary-400 bg-primary-500/5' : ''
          }`}
          title="Export as Image Card"
        >
          <span>🖼️</span>
          <span className="text-sm">Export</span>
        </button>
      </motion.div>

      <AnimatePresence>
        {showExporter && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="glass-card p-5 space-y-4 overflow-hidden border border-primary-500/20"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
                Select Card Background
              </h4>
              <button 
                onClick={() => setShowExporter(false)}
                className="text-dark-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {EXPORT_THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`relative p-3 rounded-xl border text-center transition-all duration-200 group overflow-hidden ${
                    selectedTheme === theme.id 
                      ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-500' 
                      : 'border-dark-600 bg-dark-800/40 hover:border-dark-500'
                  }`}
                >
                  <div 
                    className="w-full h-8 rounded-lg mb-2 bg-gradient-to-br"
                    style={{ background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})` }}
                  />
                  <span className="text-xs font-medium text-white truncate block">
                    {theme.name}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={handleExport}
                className="btn-primary py-2.5 px-6 text-sm flex items-center gap-2"
              >
                <span>📥</span>
                <span>Download PNG Card</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col items-center gap-3"
      >
        <button
          onClick={handleRegenerate}
          disabled={regenerating || refreshing}
          className="btn-primary flex items-center gap-2 min-w-[240px] justify-center"
        >
          {regenerating || refreshing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <span>🔄</span>
              <span>Generate Another Quote</span>
            </>
          )}
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="flex items-center justify-center gap-4"
      >
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          ← Change Philosophy
        </button>
        <button onClick={onRestart} className="btn-secondary flex items-center gap-2">
          Start Over
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-6 flex-wrap"
      >
        <button
          onClick={onOpenHistory}
          className="text-sm text-dark-400 hover:text-primary-400 transition-colors flex items-center gap-1.5"
        >
          <span>📜</span>
          <span>View History {historyCount > 0 && `(${historyCount})`}</span>
        </button>

        <span className="text-dark-600">|</span>

        <button
          onClick={onOpenFavorites}
          className="text-sm text-dark-400 hover:text-primary-400 transition-colors flex items-center gap-1.5"
        >
          <span>❤️</span>
          <span>View Favorites {favoritesCount > 0 && `(${favoritesCount})`}</span>
        </button>
      </motion.div>
    </motion.div>
  )
}
