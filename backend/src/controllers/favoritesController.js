const supabase = require('../config/supabase');

const getFavorites = async (req, res) => {
  try {
    const { data, error } = await supabase.from('favorites').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch { res.status(500).json({ error: 'Error al obtener favoritas' }); }
};

const addFavorite = async (req, res) => {
  const { movie_id, title, poster_path, release_year, vote_average, overview } = req.body;
  if (!movie_id || !title) return res.status(400).json({ error: 'movie_id y title requeridos' });
  try {
    const { data: existing } = await supabase.from('favorites').select('id').eq('user_id', req.user.id).eq('movie_id', movie_id).single();
    if (existing) return res.status(409).json({ error: 'Ya está en favoritas' });
    const { data, error } = await supabase.from('favorites').insert([{ user_id: req.user.id, movie_id, title, poster_path, release_year, vote_average, overview }]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar favorita' });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const { error } = await supabase.from('favorites').delete().eq('user_id', req.user.id).eq('movie_id', req.params.movieId);
    if (error) throw error;
    res.json({ message: 'Eliminada de favoritas' });
  } catch { res.status(500).json({ error: 'Error al eliminar favorita' }); }
};

const checkFavorite = async (req, res) => {
  try {
    const { data } = await supabase.from('favorites').select('id').eq('user_id', req.user.id).eq('movie_id', req.params.movieId).single();
    res.json({ isFavorite: !!data });
  } catch { res.json({ isFavorite: false }); }
};

module.exports = { getFavorites, addFavorite, removeFavorite, checkFavorite };
