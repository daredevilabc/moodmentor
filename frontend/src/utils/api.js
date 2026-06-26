import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const generateWisdom = async (mood, philosophy) => {
  const response = await api.post('/generate-wisdom', { mood, philosophy })
  return response.data
}

export const getHistory = async () => {
  const response = await api.get('/history')
  return response.data
}

export const deleteHistoryEntry = async (id) => {
  const response = await api.delete(`/history/${id}`)
  return response.data
}

export const clearHistory = async () => {
  const response = await api.delete('/history')
  return response.data
}

export const addFavorite = async (wisdomId, mood, philosophy, wisdomText) => {
  const response = await api.post('/favorites', {
    wisdom_id: wisdomId,
    mood,
    philosophy,
    wisdom_text: wisdomText,
  })
  return response.data
}

export const removeFavorite = async (wisdomId) => {
  const response = await api.delete('/favorites', { params: { wisdom_id: wisdomId } })
  return response.data
}

export const getFavorites = async () => {
  const response = await api.get('/favorites')
  return response.data
}

export const checkFavorite = async (wisdomId) => {
  const response = await api.get('/favorites/check', { params: { wisdom_id: wisdomId } })
  return response.data
}

export const submitFeedback = async ({ wisdom_id, mood, philosophy, rating, comment }) => {
  const response = await api.post('/feedback', { wisdom_id, mood, philosophy, rating, comment })
  return response.data
}

export default api
