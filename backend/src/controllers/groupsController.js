const supabase = require('../config/supabase');

const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return 'WATCH-' + Array.from({length: 3}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const createGroup = async (req, res) => {
  try {
    const { data, error } = await supabase.from('groups').insert([{ code: generateCode(), created_by: req.user.id, members: [req.user.id], votes: {} }]).select().single();
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
    const { data, error } = await supabase.from('groups').select('*').eq('code', req.params.code).single();
    if (error || !data) return res.status(404).json({ error: 'Sala no encontrada' });
    res.json(data);
  } catch { res.status(500).json({ error: 'Error al obtener grupo' }); }
};

const voteMovie = async (req, res) => {
  const { movie_id, vote } = req.body;
  try {
    const { data: group } = await supabase.from('groups').select('*').eq('code', req.params.code).single();
    if (!group) return res.status(404).json({ error: 'Sala no encontrada' });
    const votes = group.votes || {};
    if (!votes[movie_id]) votes[movie_id] = {};
    votes[movie_id][req.user.id] = vote;
    await supabase.from('groups').update({ votes }).eq('code', req.params.code);
    const allVotedYes = (group.members || []).every(m => votes[movie_id][m] === 'yes');
    res.json({ votes: votes[movie_id], match: allVotedYes });
  } catch { res.status(500).json({ error: 'Error al votar' }); }
};

module.exports = { createGroup, joinGroup, getGroup, voteMovie };
