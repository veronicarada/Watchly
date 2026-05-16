const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const reviewsController = require('../controllers/reviewsController');

// GET /api/reviews/:movieId -> Cualquiera puede verlas
router.get('/:movieId', reviewsController.getReviews);

// POST /api/reviews -> Solo usuarios autenticados
router.post('/', authMiddleware, reviewsController.createReview);

module.exports = router;