import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LOADING_MESSAGES = [
  {
    type: "Mindfulness Tip",
    text: "Take a deep breath. Inhale for 4 seconds, hold for 4, exhale for 4.",
    icon: "🧘"
  },
  {
    type: "Philosophical Thought",
    text: "Stoics believe that we suffer more often in imagination than in reality.",
    icon: "🏛️"
  },
  {
    type: "Zen Wisdom",
    text: "The quiet mind is able to hear the subtle guidance of the universe.",
    icon: "🌸"
  },
  {
    type: "Daily Reminder",
    text: "You cannot control external events, only your response to them.",
    icon: "✨"
  },
  {
    type: "Historical Tidbit",
    text: "Marcus Aurelius wrote his 'Meditations' while on military campaign, reminding himself to stay calm.",
    icon: "📜"
  },
  {
    type: "Did you know?",
    text: "Buddhism teaches that change is the only constant. Embracing impermanence brings peace.",
    icon: "☸️"
  },
  {
    type: "Self-Reflection",
    text: "What is one small thing you can be grateful for in this exact moment?",
    icon: "🌱"
  },
  {
    type: "Samurai Code",
    text: "Bushido teaches that a mind undisturbed by external events is the ultimate shield.",
    icon: "⚔️"
  }
]

const emojis = ['🌅', '✨', '🌟', '💫', '🌙', '⭐', '🌊', '🔥']

export default function LoadingAnimation() {
  const [index, setIndex] = useState(0)
  const randomEmoji = useMemo(() => emojis[Math.floor(Math.random() * emojis.length)], [])

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % LOADING_MESSAGES.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const currentMessage = LOADING_MESSAGES[index]

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative"
      >
        <motion.div
          className="w-24 h-24 rounded-full bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 p-1"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-full h-full rounded-full bg-dark-950 flex items-center justify-center">
            <motion.span
              className="text-4xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {currentMessage.icon || randomEmoji}
            </motion.span>
          </div>
        </motion.div>

        <motion.div
          className="absolute -top-2 -right-2 w-8 h-8"
          animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-lg">✨</span>
        </motion.div>

        <motion.div
          className="absolute -bottom-1 -left-2 w-6 h-6"
          animate={{ y: [0, 6, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        >
          <span className="text-sm">⭐</span>
        </motion.div>
      </motion.div>

      <div className="w-full max-w-md min-h-[160px] flex flex-col items-center justify-center px-6 py-5 rounded-2xl glass-card border border-dark-700/30 text-center shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-dark-800">
          <motion.div 
            key={index}
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 4, ease: "linear" }}
            className="h-full bg-gradient-to-r from-primary-500 to-purple-500"
          />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="space-y-3"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-semibold uppercase tracking-wider">
              <span>{currentMessage.icon}</span>
              <span>{currentMessage.type}</span>
            </span>
            <p className="text-lg text-white/90 leading-relaxed font-medium">
              {currentMessage.text}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.div
        className="flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-center gap-1">
          <motion.span
            className="w-2.5 h-2.5 bg-primary-400 rounded-full"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
          />
          <motion.span
            className="w-2.5 h-2.5 bg-purple-400 rounded-full"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
          />
          <motion.span
            className="w-2.5 h-2.5 bg-pink-400 rounded-full"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
          />
        </div>
        <p className="text-dark-500 text-xs tracking-wider uppercase">
          Generating your wisdom...
        </p>
      </motion.div>
    </div>
  )
}
