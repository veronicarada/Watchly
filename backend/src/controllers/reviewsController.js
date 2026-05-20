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
// Crear una nueva reseña (SOLUCIÓN DEFINITIVA)
exports.createReview = async (req, res) => {
    const { movie_id, rating, comment, media_type } = req.body;
    
    // Validamos de forma segura: si req.user existe, toma el id. Si no, dará undefined.
    const user_id = req.user ? req.user.id : null;
    
    // USAMOS ?. (Optional Chaining) para que si el email no viene en req.user, 
    // valga null en vez de romper la aplicación con un TypeError.
    const user_email = req.user?.email || null; 

    // Validación extra por seguridad en tu backend
    if (!user_id) {
        return res.status(401).json({ error: 'No autorizado. Usuario no detectado.' });
    }

    try {
        const { data, error } = await supabase
            .from('reviews')
            .insert([{ 
                movie_id, 
                user_id, 
                user_email, // Enviará el correo si existe, o null si no
                rating, 
                comment,
                media_type: media_type || 'movie'
            }])
            .select();

        if (error) throw error;

        return res.status(201).json(data[0]);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};