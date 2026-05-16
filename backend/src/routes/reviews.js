const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const reviewsController = require('../controllers/reviewsController');

// GET /api/reviews/:movieId -> Cualquiera puede verlas
router.get('/:movieId', reviewsController.getReviews);

// POST /api/reviews -> Solo usuarios autenticados
router.post('/', requireAuth, reviewsController.createReview);

module.exports = router;