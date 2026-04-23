// favorites.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getFavorites, addFavorite, removeFavorite, checkFavorite } = require('../controllers/favoritesController');
router.use(auth);
router.get('/', getFavorites);
router.post('/', addFavorite);
router.delete('/:movieId', removeFavorite);
router.get('/check/:movieId', checkFavorite);
module.exports = router;
