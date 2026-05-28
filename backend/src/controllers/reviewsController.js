const supabase = require('../config/supabase');

// Obtener todas las reseñas de una película específica con contadores de reacciones
exports.getReviews = async (req, res) => {
    const { movieId } = req.params;
    const currentUserId = req.user?.id || null; // Opcional por si no está logueado

    try {
        // 1. Traemos las reseñas
        const { data: reviews, error: reviewsError } = await supabase
            .from('reviews')
            .select('*')
            .eq('movie_id', movieId)
            .order('created_at', { ascending: false });

        if (reviewsError) throw reviewsError;

        if (reviews.length === 0) return res.json([]);

        // 2. Traemos todas las reacciones asociadas a estas reseñas
        const reviewIds = reviews.map(r => r.id);
        const { data: reactions, error: rxError } = await supabase
            .from('review_reactions')
            .select('review_id, user_id, is_agree')
            .in('review_id', reviewIds);

        if (rxError) throw rxError;

        // 3. Mapeamos los contadores a cada reseña
        const detailedReviews = reviews.map(review => {
            const reviewRx = reactions.filter(rx => rx.review_id === review.id);
            
            const agrees = reviewRx.filter(rx => rx.is_agree === true).length;
            const disagrees = reviewRx.filter(rx => rx.is_agree === false).length;
            
            // Verificamos si el usuario actual interactuó con esta reseña
            const userReaction = reviewRx.find(rx => rx.user_id === currentUserId);

            return {
                ...review,
                agree_count: agrees,
                disagree_count: disagrees,
                user_voted: userReaction ? (userReaction.is_agree ? 'agree' : 'disagree') : null
            };
        });

        return res.json(detailedReviews);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

// Crear una nueva reseña
exports.createReview = async (req, res) => {
    const { movie_id, rating, comment, media_type } = req.body;
    const user_id = req.user ? req.user.id : null;
    const user_email = req.user?.email || null; 
    const user_username = req.user?.username || null;

    if (!user_id) {
        return res.status(401).json({ error: 'No autorizado. Usuario no detectado.' });
    }

    try {
        const { data, error } = await supabase
            .from('reviews')
            .insert([{ 
                movie_id, 
                user_id, 
                user_email,
                user_username, 
                rating, 
                comment,
                media_type: media_type || 'movie'
            }])
            .select();

        if (error) throw error;

        // Devolvemos la reseña con los contadores en 0 por defecto para el frontend
        const newReview = {
            ...data[0],
            agree_count: 0,
            disagree_count: 0,
            user_voted: null
        };

        return res.status(201).json(newReview);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

// Editar una reseña
exports.updateReview = async (req, res) => {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const user_id = req.user?.id;

    if (!user_id) return res.status(401).json({ error: 'No autorizado.' });

    try {
        const { data, error } = await supabase
            .from('reviews')
            .update({ rating, comment })
            .eq('id', reviewId)
            .eq('user_id', user_id)
            .select();

        if (error) throw error;
        if (data.length === 0) return res.status(403).json({ error: 'No tienes permiso o no existe.' });

        return res.json(data[0]);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

// Eliminar una reseña
exports.deleteReview = async (req, res) => {
    const { reviewId } = req.params;
    const user_id = req.user?.id;

    if (!user_id) return res.status(401).json({ error: 'No autorizado.' });

    try {
        const { data, error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', reviewId)
            .eq('user_id', user_id)
            .select();

        if (error) throw error;
        if (data.length === 0) return res.status(403).json({ error: 'No tienes permiso o no existe.' });

        return res.json({ message: 'Reseña eliminada correctamente.' });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

exports.toggleReaction = async (req, res) => {
    const { reviewId } = req.params;
    const { type } = req.body;
    const user_id = req.user?.id;

    if (!user_id) return res.status(401).json({ error: 'Iniciá sesión para votar.' });
    if (type !== 'agree' && type !== 'disagree') return res.status(400).json({ error: 'Tipo inválido.' });

    const is_agree = (type === 'agree');

    try {
        // Verificar que no sea su propia reseña
        const { data: review } = await supabase
            .from('reviews')
            .select('user_id')
            .eq('id', reviewId)
            .single();

        if (review && review.user_id === user_id) {
            return res.status(400).json({ error: 'No puedes reaccionar a tu propia opinión.' });
        }

        // ✅ Usar .maybeSingle() en lugar de .single() — no lanza error si no hay resultado
        const { data: existingRx, error: fetchError } = await supabase
            .from('review_reactions')
            .select('*')
            .eq('review_id', reviewId)
            .eq('user_id', user_id)
            .maybeSingle();

        if (fetchError) throw fetchError;

        if (existingRx) {
            if (existingRx.is_agree === is_agree) {
                // Mismo botón → quitar voto
                const { error } = await supabase
                    .from('review_reactions')
                    .delete()
                    .eq('id', existingRx.id);
                if (error) throw error;
                return res.json({ action: 'removed' });
            } else {
                // Botón opuesto → cambiar voto
                const { error } = await supabase
                    .from('review_reactions')
                    .update({ is_agree })
                    .eq('id', existingRx.id);
                if (error) throw error;
                return res.json({ action: 'changed' });
            }
        } else {
            // Sin voto previo → insertar
            const { error } = await supabase
                .from('review_reactions')
                .insert([{ review_id: reviewId, user_id, is_agree }]);
            if (error) throw error;
            return res.json({ action: 'added' });
        }
    } catch (error) {
        console.error('Error en toggleReaction:', error);
        return res.status(400).json({ error: error.message });
    }
};