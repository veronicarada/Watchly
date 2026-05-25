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

/**
 * @swagger
 * /reviews/{movieId}:
 *   get:
 *     summary: Obtener reseñas de una película
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de reseñas
 */
router.get('/:movieId', optionalAuth, reviewsController.getReviews);

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Crear una reseña
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               movie_id:
 *                 type: integer
 *               rating:
 *                 type: integer
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reseña creada
 */
router.post('/', authMiddleware, reviewsController.createReview);

/**
 * @swagger
 * /reviews/{reviewId}:
 *   put:
 *     summary: Editar una reseña propia
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reseña actualizada
 *   delete:
 *     summary: Eliminar una reseña propia
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reseña eliminada
 */
router.put('/:reviewId', authMiddleware, reviewsController.updateReview);
router.delete('/:reviewId', authMiddleware, reviewsController.deleteReview);

/**
 * @swagger
 * /reviews/{reviewId}/react:
 *   post:
 *     summary: Reaccionar a una reseña (like/dislike)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [like, dislike]
 *     responses:
 *       200:
 *         description: Reacción registrada
 */
router.post('/:reviewId/react', authMiddleware, reviewsController.toggleReaction);
module.exports = router;