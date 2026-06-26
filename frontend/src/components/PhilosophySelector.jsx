import { motion } from 'framer-motion'

export default function PhilosophySelector({ philosophies, selectedMood, selectedPhilosophy, onSelect, onGenerate, onBack, disabled, loading, error }) {
  const handleKeyDown = (e, philosophyId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(philosophyId)
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
          Step 2 of 3
        </span>
        <h1 id="philosophy-heading" className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          Choose your
          <br />
          <span className="gradient-text">philosophy</span>
        </h1>
        <p className="text-dark-400 text-lg max-w-2xl mx-auto">
          Select the wisdom tradition that resonates with you.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        role="radiogroup"
        aria-labelledby="philosophy-heading"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {philosophies.map((philosophy, index) => (
          <motion.button
            key={philosophy.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.05 * index, duration: 0.4, type: 'spring', stiffness: 100 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(philosophy.id)}
            onKeyDown={(e) => handleKeyDown(e, philosophy.id)}
            role="radio"
            aria-checked={selectedPhilosophy === philosophy.id}
            tabIndex={selectedPhilosophy === philosophy.id ? 0 : -1}
            className={`relative group glass-card glass-card-hover p-6 text-left overflow-hidden ${
              philosophy.id === selectedPhilosophy ? 'ring-2 ring-primary-500' : ''
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex items-start gap-4">
              <span className="text-3xl" role="img" aria-label={philosophy.label}>
                {philosophy.icon}
              </span>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white group-hover:gradient-text transition-all duration-300">
                  {philosophy.label}
                </h3>
                <p className="text-dark-400 text-sm mt-1">
                  {philosophy.description}
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 mt-1 flex items-center justify-center transition-all duration-300 ${
                philosophy.id === selectedPhilosophy ? 'border-primary-500 bg-primary-500/20' : 'border-dark-500'
              }`}>
                {philosophy.id === selectedPhilosophy && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2.5 h-2.5 rounded-full bg-primary-400"
                  />
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="flex items-center justify-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
        >
          <span>⚠️</span>
          <span>{error}</span>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-center gap-4 pt-4"
      >
        <button onClick={onBack} disabled={loading} className="btn-secondary flex items-center gap-2">
          ← Back
        </button>
        <button
          onClick={onGenerate}
          disabled={disabled || loading}
          className="btn-primary flex items-center gap-2"
        >
          {loading ? 'Generating...' : 'Generate Wisdom →'}
        </button>
      </motion.div>
    </div>
  )
}
