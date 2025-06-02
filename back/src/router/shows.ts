import express from 'express'
import { authenticateToken } from '../middleware/authMiddleware'
import {
  createShow,
  deleteShow,
  getAllShows,
  updateShow
} from '../controllers/showController'

export default (router: express.Router) => {
  router.get('/shows', getAllShows)
  router.post('/shows', authenticateToken, createShow)
  router.put('/shows/:id', authenticateToken, updateShow)
  router.delete('/shows/:id', authenticateToken, deleteShow)
}
