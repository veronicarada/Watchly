const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const reviewsController = require('../controllers/reviewsController');

// GET /api/reviews/:movieId -> Cualquiera puede verlas
// DESPUÉS
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    require('../middleware/auth')(req, res, next);
  } else {
    next();
  }
};

router.get('/:movieId', optionalAuth, reviewsController.getReviews);

// POST /api/reviews -> Solo usuarios autenticados
router.post('/', authMiddleware, reviewsController.createReview);
router.put('/:reviewId', authMiddleware, reviewsController.updateReview);
// DELETE /api/reviews/:reviewId -> Solo el dueño elimina
router.delete('/:reviewId', authMiddleware, reviewsController.deleteReview);
router.post('/:reviewId/react', authMiddleware, reviewsController.toggleReaction);

module.exports = router;