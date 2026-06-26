import { useState } from 'react'
import { motion } from 'framer-motion'

const LABELS = ['Terrible', 'Poor', 'Okay', 'Good', 'Amazing']

export default function Feedback({ wisdomId, mood, philosophy, onSubmit }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0 || sending) return
    setSending(true)
    try {
      await onSubmit({ wisdom_id: wisdomId, mood, philosophy, rating, comment: comment.trim() || null })
      setSubmitted(true)
    } finally {
      setSending(false)
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-2"
      >
        <p className="text-green-400 text-sm font-medium">Thank you for your feedback!</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="text-2xl transition-all duration-150 hover:scale-110 focus:outline-none"
            aria-label={`${LABELS[star - 1]} (${star} star${star > 1 ? 's' : ''})`}
          >
            <span className={star <= (hover || rating) ? 'text-yellow-400' : 'text-dark-600'}>
              {star <= (hover || rating) ? '★' : '☆'}
            </span>
          </button>
        ))}
      </div>
      {rating > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2"
        >
          <input
            type="text"
            placeholder="Optional comment..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={200}
            className="input-field text-sm"
          />
          <div className="flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={sending}
              className="btn-primary text-sm px-6 py-2"
            >
              {sending ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
