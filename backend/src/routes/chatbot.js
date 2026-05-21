const express = require('express')
const router = express.Router()

router.post('/', async (req, res) => {
  const { messages, preferences } = req.body

  const today = new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long' })

  const prefsText = preferences
    ? `\nPreferencias del usuario: le gustan ${preferences.likes?.join(', ') || 'variado'} y NO le gustan ${preferences.dislikes?.join(', ') || 'nada en particular'}.`
    : ''

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: 'google/gemma-3-4b-it:free',
        messages: [
          {
            role: 'system',
            content: `Sos un asistente experto en entretenimiento dentro de Watchly, una app para descubrir contenido audiovisual.
Respondé siempre en español, de forma amigable y concisa.
La fecha actual es ${today}. Usá esta fecha como referencia para todo.
Podés ayudar con:
1. PELÍCULAS: reparto, director, año, curiosidades, historia, premios, cartelera actual, últimos lanzamientos.
2. SERIES Y MINISERIES: temporadas, personajes, plataformas, curiosidades, últimas temporadas.
3. DOCUMENTALES: temática, director, plataformas donde verlos.
4. TELENOVELAS Y REALITY SHOWS: información general, dónde verlos.
5. RECOMENDACIONES: sugerí contenido según géneros, estado de ánimo, director favorito o preferencias del usuario.
Cuando recomiendes, usá este formato limpio:
- Título (año) — Una línea de descripción corta.
No uses asteriscos ni markdown. Solo texto plano y guiones.
Cuando el usuario pregunte por tendencias, lo más visto, novedades o estrenos recientes, recomendá el contenido más popular y reciente que conozcas hasta la fecha actual.
Si el usuario menciona que algo no le gusta, recordalo para no recomendarlo.${prefsText}
Si te preguntan algo que no tiene que ver con entretenimiento audiovisual, deciles amablemente que solo podés ayudar con esos temas.`
          },
          ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
        ]
      })
    })

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'No pude generar una respuesta.'
    res.json({ reply })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al consultar el asistente' })
  }
})

module.exports = router