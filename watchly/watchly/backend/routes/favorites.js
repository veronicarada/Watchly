const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getFavorites, addFavorite, removeFavorite, checkFavorite } = require('../controllers/favoritesController');

router.use(auth); // All routes require authentication

router.get('/', getFavorites);
router.post('/', addFavorite);
router.delete('/:movieId', removeFavorite);
router.get('/check/:movieId', checkFavorite);

module.exports = router;
