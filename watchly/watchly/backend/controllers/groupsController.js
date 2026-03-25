const supabase = require('../config/supabase');

// Generates unique room code
const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'WATCH-';
  for (let i = 0; i < 3; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

// POST /api/groups/create
const createGroup = async (req, res) => {
  const userId = req.user.id;
  const code = generateCode();

  try {
    const { data, error } = await supabase
      .from('groups')
      .insert([{ code, created_by: userId, members: [userId], votes: {} }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear grupo' });
  }
};

// POST /api/groups/join
const joinGroup = async (req, res) => {
  const userId = req.user.id;
  const { code } = req.body;

  try {
    const { data: group, error } = await supabase
      .from('groups')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !group) return res.status(404).json({ error: 'Sala no encontrada' });

    const members = group.members || [];
    if (!members.includes(userId)) {
      members.push(userId);
      await supabase.from('groups').update({ members }).eq('id', group.id);
    }

    res.json({ ...group, members });
  } catch (err) {
    res.status(500).json({ error: 'Error al unirse al grupo' });
  }
};

// POST /api/groups/:code/vote
const voteMovie = async (req, res) => {
  const userId = req.user.id;
  const { code } = req.params;
  const { movie_id, vote } = req.body; // vote: 'yes' | 'no'

  try {
    const { data: group } = await supabase
      .from('groups')
      .select('*')
      .eq('code', code)
      .single();

    if (!group) return res.status(404).json({ error: 'Sala no encontrada' });

    const votes = group.votes || {};
    if (!votes[movie_id]) votes[movie_id] = {};
    votes[movie_id][userId] = vote;

    await supabase.from('groups').update({ votes }).eq('code', code);

    // Check if everyone voted yes
    const members = group.members || [];
    const movieVotes = votes[movie_id];
    const allVotedYes = members.every(m => movieVotes[m] === 'yes');

    res.json({ votes: movieVotes, match: allVotedYes });
  } catch (err) {
    res.status(500).json({ error: 'Error al votar' });
  }
};

// GET /api/groups/:code
const getGroup = async (req, res) => {
  const { code } = req.params;
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('code', code)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Sala no encontrada' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener grupo' });
  }
};

module.exports = { createGroup, joinGroup, voteMovie, getGroup };
