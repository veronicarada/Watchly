const supabase = require('../config/supabase');

// GET /api/favorites
const getFavorites = async (req, res) => {
  const userId = req.user.id;
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener favoritas' });
  }
};

// POST /api/favorites
const addFavorite = async (req, res) => {
  const userId = req.user.id;
  const { movie_id, title, poster_path, release_year, vote_average, overview } = req.body;

  if (!movie_id || !title) {
    return res.status(400).json({ error: 'movie_id y title son requeridos' });
  }

  try {
    // Check if already exists
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('movie_id', movie_id)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'La película ya está en favoritas' });
    }

    const { data, error } = await supabase
      .from('favorites')
      .insert([{ user_id: userId, movie_id, title, poster_path, release_year, vote_average, overview }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Add favorite error:', err);
    res.status(500).json({ error: 'Error al guardar favorita' });
  }
};

// DELETE /api/favorites/:movieId
const removeFavorite = async (req, res) => {
  const userId = req.user.id;
  const { movieId } = req.params;

  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', movieId);

    if (error) throw error;
    res.json({ message: 'Eliminada de favoritas' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar favorita' });
  }
};

// GET /api/favorites/check/:movieId
const checkFavorite = async (req, res) => {
  const userId = req.user.id;
  const { movieId } = req.params;

  try {
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .single();

    res.json({ isFavorite: !!data });
  } catch (err) {
    res.json({ isFavorite: false });
  }
};

module.exports = { getFavorites, addFavorite, removeFavorite, checkFavorite };
