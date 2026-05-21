const supabase = require('../config/supabase');

const getWatched = async (req, res) => {
  try {
    const { data, error } = await supabase.from('watched').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch { res.status(500).json({ error: 'Error al obtener vistas' }); }
};

const addWatched = async (req, res) => {
  const { movie_id, title, poster_path, release_year, vote_average } = req.body;
  if (!movie_id || !title) return res.status(400).json({ error: 'movie_id y title requeridos' });
  try {
    const { data: existing } = await supabase.from('watched').select('id').eq('user_id', req.user.id).eq('movie_id', movie_id).single();
    if (existing) return res.status(409).json({ error: 'Ya está marcada como vista' });
    const { data, error } = await supabase.from('watched').insert([{ user_id: req.user.id, movie_id, title, poster_path, release_year, vote_average }]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al marcar como vista' });
  }
};

const removeWatched = async (req, res) => {
  try {
    const { error } = await supabase.from('watched').delete().eq('user_id', req.user.id).eq('movie_id', req.params.movieId);
    if (error) throw error;
    res.json({ message: 'Eliminada de vistas' });
  } catch { res.status(500).json({ error: 'Error al eliminar de vistas' }); }
};

const checkWatched = async (req, res) => {
  try {
    const { data } = await supabase.from('watched').select('id').eq('user_id', req.user.id).eq('movie_id', req.params.movieId).single();
    res.json({ isWatched: !!data });
  } catch { res.json({ isWatched: false }); }
};

module.exports = { getWatched, addWatched, removeWatched, checkWatched };