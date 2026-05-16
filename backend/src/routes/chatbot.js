const express = require('express')
const router = express.Router()

router.post('/', async (req, res) => {
  const { messages } = req.body

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3-super-120b-a12b:free',
        messages: [
          {
            role: 'system',
            content: `Sos un asistente experto en cine dentro de Watchly, una app para descubrir películas.
Respondé siempre en español, de forma amigable y concisa.
Podés ayudar con dos cosas:
1. INFORMACIÓN DE PELÍCULAS: reparto, director, año, curiosidades, historia, premios, etc.
2. RECOMENDACIONES: sugerí películas según gustos o estado de ánimo del usuario.
Si te preguntan algo que no tiene que ver con cine, deciles amablemente que solo podés ayudar con temas de películas.`
          },
          ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
        ]
      })
    })

    const data = await response.json()
    console.log('Respuesta OpenRouter:', JSON.stringify(data, null, 2))
    const reply = data.choices?.[0]?.message?.content || 'No pude generar una respuesta.'
    res.json({ reply })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al consultar el asistente' })
  }
})

module.exports = router