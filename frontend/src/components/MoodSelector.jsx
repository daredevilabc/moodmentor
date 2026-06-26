import { motion } from 'framer-motion'

export default function MoodSelector({ moods, onSelect, selectedMood }) {
  const handleKeyDown = (e, moodId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(moodId)
    }
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium">
          Step 1 of 3
        </span>
        <h1 id="mood-heading" className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          How are you feeling
          <br />
          <span className="gradient-text">today?</span>
        </h1>
        <p className="text-dark-400 text-lg max-w-2xl mx-auto">
          Choose the emotion that best describes your current state. 
          Your mood will guide the wisdom you receive.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        role="radiogroup"
        aria-labelledby="mood-heading"
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
      >
        {moods.map((mood, index) => (
          <motion.button
            key={mood.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.05 * index, duration: 0.4, type: 'spring', stiffness: 100 }}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(mood.id)}
            onKeyDown={(e) => handleKeyDown(e, mood.id)}
            role="radio"
            aria-checked={selectedMood === mood.id}
            tabIndex={selectedMood === mood.id ? 0 : -1}
            className={`relative group glass-card glass-card-hover p-6 text-left overflow-hidden ${mood.bg} ${selectedMood === mood.id ? 'ring-2 ring-primary-500' : ''}`}
            style={{ '--mood-gradient': `linear-gradient(135deg, ${mood.color.replace('to', ',')})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-4 right-4 w-16 h-16 rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-300 blur-xl" style={{ background: `var(--mood-gradient)` }} />
            
            <div className="relative z-10 flex items-baseline gap-3 mb-4">
              <span className="text-4xl md:text-5xl" role="img" aria-label={mood.label}>
                {mood.emoji}
              </span>
              <span className="text-2xl font-bold text-white">{mood.label}</span>
            </div>
            
            <div className="relative z-10 h-1.5 bg-dark-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.2 + 0.05 * index, duration: 0.5 }}
                className="h-full rounded-full"
                style={{ background: `var(--mood-gradient)` }}
              />
            </div>
            
            <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
              <span className="text-xs text-dark-400 uppercase tracking-wider">
                Tap to select
              </span>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  )
}