const supabase = require('../config/supabase');

// Obtener todas las reseñas de una película específica
exports.getReviews = async (req, res) => {
    const { movieId } = req.params;

    try {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('movie_id', movieId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return res.json(data);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

// Crear una nueva reseña
exports.createReview = async (req, res) => {
    const { movie_id, rating, comment } = req.body;
    
    // Obtenemos los datos del usuario logueado gracias al middleware auth
    const user_id = req.user.id;
    const user_email = req.user.email; 

    try {
        const { data, error } = await supabase
            .from('reviews')
            .insert([{ movie_id, user_id, user_email, rating, comment }])
            .select();

        if (error) throw error;

        return res.status(201).json(data[0]);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};