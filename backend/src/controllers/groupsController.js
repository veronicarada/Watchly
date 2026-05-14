const supabase = require('../config/supabase');

const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return 'WATCH-' + Array.from({length: 3}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const createGroup = async (req, res) => {
  try {
    const { data, error } = await supabase.from('groups')
      .insert([{ 
        code: generateCode(), 
        created_by: req.user.id, 
        members: [req.user.id], 
        votes: {},
        active_movie_id: null // Empezamos sin película activa
      }])
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch { res.status(500).json({ error: 'Error al crear grupo' }); }
};

const joinGroup = async (req, res) => {
  const { code } = req.body;
  try {
    const { data: group } = await supabase.from('groups').select('*').eq('code', code.toUpperCase()).single();
    if (!group) return res.status(404).json({ error: 'Sala no encontrada' });
    const members = group.members || [];
    if (!members.includes(req.user.id)) {
      members.push(req.user.id);
      await supabase.from('groups').update({ members }).eq('id', group.id);
    }
    res.json({ ...group, members });
  } catch { res.status(500).json({ error: 'Error al unirse al grupo' }); }
};

const getGroup = async (req, res) => {
  try {
    const { data, error } = await supabase.from('groups').select('*').eq('code', req.params.code.toUpperCase()).single();
    if (error || !data) return res.status(404).json({ error: 'Sala no encontrada' });
    res.json(data);
  } catch { res.status(500).json({ error: 'Error al obtener grupo' }); }
};

const voteMovie = async (req, res) => {
  const { movie_id, vote } = req.body;
  try {
    const { data: group } = await supabase.from('groups').select('*').eq('code', req.params.code.toUpperCase()).single();
    if (!group) return res.status(404).json({ error: 'Sala no encontrada' });

    const votes = group.votes || {};
    if (!votes[movie_id]) votes[movie_id] = {};
    
    // Registramos el voto del usuario actual
    votes[movie_id][req.user.id] = vote;

    let updateData = { votes };
    let match = false;

    // Lógica de Match o Siguiente Película
    const members = group.members || [];
    const currentVotes = Object.values(votes[movie_id]);
    
    // 1. Si alguien vota 'no' (PASO), la película se descarta para todos
    if (vote === 'no') {
      updateData.active_movie_id = null; // Esto obligará al frontend a pedir otra
    } 
    // 2. Si todos votan 'yes', hay MATCH
    else {
      const yesCount = currentVotes.filter(v => v === 'yes').length;
      if (yesCount >= members.length) {
        match = true;
      }
    }

    await supabase.from('groups').update(updateData).eq('code', req.params.code.toUpperCase());
    
    res.json({ votes: votes[movie_id], match });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Error al votar' }); 
  }
};

// Nueva función para sincronizar la película que todos ven
const setActiveMovie = async (req, res) => {
  const { movie_id } = req.body;
  try {
    await supabase.from('groups')
      .update({ active_movie_id: movie_id })
      .eq('code', req.params.code.toUpperCase());
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Error al cambiar película' }); }
};

module.exports = { createGroup, joinGroup, getGroup, voteMovie, setActiveMovie };