const supabase = require('../config/supabase');

const getPromos = async (req, res) => {
  try {
    // Buscamos solo las promociones activas ordenadas por ID
    const { data, error } = await supabase
      .from('kiosquito_promos')
      .select('*')
      .eq('active', true)
      .order('id', { ascending: true });

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error al obtener promos del Kiosquito:', error.message);
    return res.status(500).json({ error: 'Error interno del servidor al cargar el Kiosquito' });
  }
};

module.exports = {
  getPromos
};