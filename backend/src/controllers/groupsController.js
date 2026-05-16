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
        active_movie_id: null,
        status: 'proposing', // Nueva sala empieza en fase de propuesta
        proposals: []        // Array vacío de sugerencias
      }])
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch { res.status(500).json({ error: 'Error al crear grupo' }); }
};

// Para que un miembro proponga una película
const proposeMovie = async (req, res) => {
  const { movie_id, title, poster_path } = req.body;
  const { code } = req.params;

  try {
    const { data: group } = await supabase.from('groups').select('*').eq('code', code.toUpperCase()).single();
    if (!group) return res.status(404).json({ error: 'Sala no encontrada' });

    const proposals = group.proposals || [];
    
    // CONTROL EN TERMINAL: Vamos a ver qué está leyendo el backend
    const myProposals = proposals.filter(p => p.user_id === req.user.id);
    console.log(`[Watchly] El usuario ${req.user.id} ya tiene ${myProposals.length} propuestas en la sala.`);

    // CAMBIO CRÍTICO: Bloquear SOLO si ya llegó a las 3 propuestas
    if (myProposals.length >= 3) {
      return res.status(400).json({ error: 'Ya alcanzaste el límite de 3 propuestas' });
    }

    proposals.push({
      user_id: req.user.id,
      movie_id,
      title,
      poster_path
    });

    const { data, error } = await supabase.from('groups')
      .update({ proposals })
      .eq('code', code.toUpperCase())
      .select().single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("[Watchly Error]", err);
    res.status(500).json({ error: 'Error al enviar propuesta' });
  }
};

// Para cambiar el estado de la sala (ej: de 'proposing' a 'voting' o 'finished')
const updateStatus = async (req, res) => {
  const { status } = req.body; // 'proposing', 'voting', o 'finished'
  const { code } = req.params;

  try {
    const { data, error } = await supabase.from('groups')
      .update({ status })
      .eq('code', code.toUpperCase())
      .select().single();

    if (error) throw error;
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
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
    
    const votes = group.votes || {};
    if (!votes[movie_id]) votes[movie_id] = {};
    votes[movie_id][req.user.id] = vote;

    let updateData = { votes };
    
    if (vote === 'no') {
      updateData.active_movie_id = null;
    }

    // Si hay MATCH (todos votaron 'yes'), la app puede pasar a 'finished' automáticamente
    const allVotedYes = group.members.every(m => votes[movie_id][m] === 'yes');
    if (allVotedYes) {
      updateData.status = 'finished';
      updateData.active_movie_id = movie_id;
    }

    await supabase.from('groups').update(updateData).eq('code', req.params.code.toUpperCase());
    
    res.json({ votes: votes[movie_id], match: allVotedYes });
  } catch (err) {
    res.status(500).json({ error: 'Error al votar' });
  }
};

const setActiveMovie = async (req, res) => {
  const { movie_id } = req.body;
  try {
    await supabase.from('groups')
      .update({ active_movie_id: movie_id })
      .eq('code', req.params.code.toUpperCase());
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Error al cambiar película' }); }
};

// Para resolver empates de forma aleatoria ("Elegir por mí")
const resolveTieBreaker = async (req, res) => {
  const { code } = req.params;

  try {
    const { data: group } = await supabase.from('groups').select('*').eq('code', code.toUpperCase()).single();
    if (!group) return res.status(404).json({ error: 'Sala no encontrada' });

    const votes = group.votes || {};
    const proposals = group.proposals || [];
    
    if (proposals.length === 0) {
      return res.status(400).json({ error: 'No hay películas propuestas para desempatar' });
    }

    // 1. Contar cuántos votos "yes" tiene cada película propuesta
    const voteCounts = {};
    proposals.forEach(p => {
      const movieVotes = votes[p.movie_id] || {};
      const yesCount = Object.values(movieVotes).filter(v => v === 'yes').length;
      voteCounts[p.movie_id] = yesCount;
    });

    // 2. Encontrar el número máximo de votos acumulados
    const maxVotes = Math.max(...Object.values(voteCounts));

    // 3. Filtrar cuáles películas alcanzaron ese máximo (las empatadas)
    const tiedMovieIds = Object.keys(voteCounts).filter(movieId => voteCounts[movieId] === maxVotes);

    // 4. Elegir una al azar de la lista de empatadas
    const randomMovieId = tiedMovieIds[Math.floor(Math.random() * tiedMovieIds.length)];

    // 5. Modificar la sala con la película ganadora definitiva y finalizar el estado
    const { data, error } = await supabase.from('groups')
      .update({ 
        active_movie_id: parseInt(randomMovieId),
        status: 'finished'
      })
      .eq('code', code.toUpperCase())
      .select().single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al ejecutar el desempate' });
  }
};

module.exports = { 
  createGroup, 
  joinGroup, 
  getGroup, 
  voteMovie, 
  setActiveMovie,
  proposeMovie, 
  updateStatus,
  resolveTieBreaker
};