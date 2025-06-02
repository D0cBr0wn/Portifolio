import express from 'express'
import { authenticateToken } from '../middleware/authMiddleware'
import {
  createVenue,
  deleteVenue,
  getAllVenues,
  updateVenue
} from '../controllers/venueController'

export default (router: express.Router) => {
  router.get('/venues', getAllVenues)
  router.post('/venues', authenticateToken, createVenue)
  router.put('/venues/:id', authenticateToken, updateVenue)
  router.delete('/venues/:id', authenticateToken, deleteVenue)
}
