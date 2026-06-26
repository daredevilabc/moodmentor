import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MoodSelector from './components/MoodSelector'
import PhilosophySelector from './components/PhilosophySelector'
import WisdomCard from './components/WisdomCard'
import LoadingAnimation from './components/LoadingAnimation'
import ToastContainer, { useToast } from './components/Toast'
import HistoryModal from './components/HistoryModal'
import FavoritesModal from './components/FavoritesModal'
import { moods, philosophies } from './utils/constants'
import { generateWisdom, getHistory, deleteHistoryEntry, clearHistory, addFavorite, removeFavorite, checkFavorite, submitFeedback, getFavorites } from './utils/api'

const STORAGE_KEY = 'moodmentor_selections'

function loadSelections() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        mood: parsed.mood || null,
        philosophy: parsed.philosophy || null,
        wisdomData: parsed.wisdomData || null,
      }
    }
  } catch {
    // ignore parse errors
  }
  return { mood: null, philosophy: null, wisdomData: null }
}

function saveSelections(mood, philosophy, wisdomData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mood, philosophy, wisdomData }))
  } catch {
    // ignore quota errors
  }
}

function clearSelections() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

function App() {
  const initial = loadSelections()
  const [selectedMood, setSelectedMood] = useState(initial.mood)
  const [selectedPhilosophy, setSelectedPhilosophy] = useState(initial.philosophy)
  const [wisdomData, setWisdomData] = useState(initial.wisdomData)
  const [step, setStep] = useState(initial.mood && initial.philosophy && initial.wisdomData ? 3 : initial.mood ? 2 : 1)
  const [loading, setLoading] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriteId, setFavoriteId] = useState(null)
  const [history, setHistory] = useState([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [favorites, setFavorites] = useState([])
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [favoritesLoading, setFavoritesLoading] = useState(false)
  const { toasts, showToast, removeToast } = useToast()

  useEffect(() => {
    saveSelections(selectedMood, selectedPhilosophy, wisdomData)
  }, [selectedMood, selectedPhilosophy, wisdomData])

  const checkFavoriteStatus = useCallback(async (wisdomId) => {
    if (!wisdomId) {
      setIsFavorited(false)
      setFavoriteId(null)
      return
    }
    try {
      const result = await checkFavorite(wisdomId)
      setIsFavorited(result.favorited)
      setFavoriteId(result.favorited ? result.id : null)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (wisdomData) {
      checkFavoriteStatus(wisdomData.id)
    }
  }, [wisdomData, checkFavoriteStatus])

  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true)
      const data = await getHistory()
      setHistory(data)
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  const fetchFavorites = useCallback(async () => {
    try {
      setFavoritesLoading(true)
      const data = await getFavorites()
      setFavorites(data)
    } catch {
      // ignore
    } finally {
      setFavoritesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory()
    fetchFavorites()
  }, [fetchHistory, fetchFavorites])

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood)
    setStep(2)
  }

  const handlePhilosophySelect = (philosophy) => {
    setSelectedPhilosophy(philosophy)
  }

  const handleGenerateWisdom = async () => {
    if (!selectedMood || !selectedPhilosophy) return
    setLoading(true)
    setError(null)
    try {
      const data = await generateWisdom(selectedMood, selectedPhilosophy)
      setWisdomData(data)
      setStep(3)
      checkFavoriteStatus(data.id)
      fetchHistory()
    } catch (err) {
      setError(err.message || 'Failed to generate wisdom. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = async () => {
    if (!selectedMood || !selectedPhilosophy) return
    setRegenerating(true)
    try {
      const data = await generateWisdom(selectedMood, selectedPhilosophy)
      setWisdomData(data)
      checkFavoriteStatus(data.id)
      fetchHistory()
      showToast('New wisdom generated!', 'success')
    } catch (err) {
      showToast('Failed to generate new wisdom', 'error')
    } finally {
      setRegenerating(false)
    }
  }

  const handleRestart = () => {
    clearSelections()
    setStep(1)
    setSelectedMood(null)
    setSelectedPhilosophy(null)
    setWisdomData(null)
    setError(null)
    setIsFavorited(false)
    setFavoriteId(null)
  }

  const handleBackToMood = () => {
    setStep(1)
    setSelectedMood(null)
  }

  const handleBackToPhilosophy = () => {
    setStep(2)
    setSelectedPhilosophy(null)
  }

  const handleToggleFavorite = async () => {
    if (!wisdomData) return
    try {
      if (isFavorited) {
        await removeFavorite(wisdomData.id)
        setIsFavorited(false)
        setFavoriteId(null)
        setFavorites(prev => prev.filter(f => f.wisdom_id !== wisdomData.id))
        showToast('Removed from favorites', 'info')
      } else {
        const result = await addFavorite(wisdomData.id, wisdomData.mood, wisdomData.philosophy, wisdomData.wisdom)
        setIsFavorited(true)
        setFavoriteId(result.id)
        fetchFavorites()
        showToast('Added to favorites!', 'success')
      }
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update favorite', 'error')
    }
  }

  const handleFeedback = async ({ wisdom_id, mood, philosophy, rating, comment }) => {
    try {
      await submitFeedback({ wisdom_id, mood, philosophy, rating, comment })
      showToast('Feedback submitted, thank you!', 'success')
      return true
    } catch {
      showToast('Failed to submit feedback', 'error')
      throw new Error('Failed to submit feedback')
    }
  }

  const handleOpenHistory = async () => {
    await fetchHistory()
    setHistoryOpen(true)
  }

  const handleOpenHistoryEntry = (entry) => {
    setWisdomData({
      id: entry.id,
      mood: entry.mood,
      philosophy: entry.philosophy,
      wisdom: entry.wisdom_text,
      sources: entry.sources,
    })
    setSelectedMood(entry.mood)
    setSelectedPhilosophy(entry.philosophy)
    setStep(3)
    checkFavoriteStatus(entry.id)
    setHistoryOpen(false)
  }

  const handleDeleteEntry = async (id) => {
    try {
      await deleteHistoryEntry(id)
      setHistory(prev => prev.filter(e => e.id !== id))
      showToast('Entry deleted', 'info')
    } catch {
      showToast('Failed to delete entry', 'error')
    }
  }

  const handleClearAll = async () => {
    try {
      await clearHistory()
      setHistory([])
      showToast('History cleared', 'info')
    } catch {
      showToast('Failed to clear history', 'error')
    }
  }

  const handleOpenFavorites = async () => {
    await fetchFavorites()
    setFavoritesOpen(true)
  }

  const handleOpenFavoriteEntry = (entry) => {
    setWisdomData({
      id: entry.wisdom_id,
      mood: entry.mood,
      philosophy: entry.philosophy,
      wisdom: entry.wisdom_text,
      sources: null,
    })
    setSelectedMood(entry.mood)
    setSelectedPhilosophy(entry.philosophy)
    setStep(3)
    checkFavoriteStatus(entry.wisdom_id)
    setFavoritesOpen(false)
  }

  const handleRemoveFavoriteEntry = async (wisdomId) => {
    try {
      await removeFavorite(wisdomId)
      setFavorites(prev => prev.filter(f => f.wisdom_id !== wisdomId && f.id !== wisdomId))
      if (wisdomData && wisdomData.id === wisdomId) {
        setIsFavorited(false)
        setFavoriteId(null)
      }
      showToast('Removed from favorites', 'info')
    } catch {
      showToast('Failed to remove from favorites', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-500/10 via-transparent to-transparent" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float animate-delay-100" />

        <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="mood"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-4xl"
              >
                <MoodSelector
                  moods={moods}
                  onSelect={handleMoodSelect}
                  selectedMood={selectedMood}
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="philosophy"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-4xl"
              >
                <PhilosophySelector
                  philosophies={philosophies}
                  selectedMood={selectedMood}
                  selectedPhilosophy={selectedPhilosophy}
                  onSelect={handlePhilosophySelect}
                  onGenerate={handleGenerateWisdom}
                  onBack={handleBackToMood}
                  disabled={!selectedPhilosophy}
                  loading={loading}
                  error={error}
                />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="wisdom"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-3xl"
              >
                {loading || (regenerating && !wisdomData) ? (
                  <LoadingAnimation />
                ) : (
                  <WisdomCard
                    data={wisdomData}
                    onRestart={handleRestart}
                    onBack={handleBackToPhilosophy}
                    error={error}
                    onRegenerate={handleRegenerate}
                    regenerating={regenerating}
                    showToast={showToast}
                    isFavorited={isFavorited}
                    onToggleFavorite={handleToggleFavorite}
                    onFeedback={handleFeedback}
                    onOpenHistory={handleOpenHistory}
                    historyCount={history.length}
                    onOpenFavorites={handleOpenFavorites}
                    favoritesCount={favorites.length}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <HistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onOpen={handleOpenHistoryEntry}
        onDelete={handleDeleteEntry}
        onClearAll={handleClearAll}
        loading={historyLoading}
      />

      <FavoritesModal
        isOpen={favoritesOpen}
        onClose={() => setFavoritesOpen(false)}
        favorites={favorites}
        onOpen={handleOpenFavoriteEntry}
        onDelete={handleRemoveFavoriteEntry}
        loading={favoritesLoading}
      />
    </div>
  )
}

export default App
