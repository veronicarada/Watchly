const express = require('express')
const router = express.Router()
const axios = require('axios')

const TMDB_KEY = () => process.env.TMDB_API_KEY

function normalize(text) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

const RECOMMENDATION_KEYWORDS = ['recomendar', 'recomienda', 'sugeri', 'sugiere', 'comedia', 'terror', 'romance', 'familia', 'niños', 'maratonear', 'ver hoy', 'para ver', 'series cortas', 'lo mas visto', 'trending', 'popular', 'tendencia', 'novedad', 'estreno', 'cartelera']

async function getTrending() {
  try {
    const [movies, tv] = await Promise.all([
      axios.get('https://api.themoviedb.org/3/trending/movie/week', { params: { api_key: TMDB_KEY(), language: 'es-AR' } }),
      axios.get('https://api.themoviedb.org/3/trending/tv/week', { params: { api_key: TMDB_KEY(), language: 'es-AR' } })
    ])
    const results = [
      ...movies.data.results.slice(0, 5).map(m => `- **${m.title}** (${m.release_date?.substring(0,4)}) — película`),
      ...tv.data.results.slice(0, 5).map(t => `- **${t.name}** (${t.first_air_date?.substring(0,4)}) — serie`)
    ]
    return `Esto es lo más visto esta semana según TMDB:\n${results.join('\n')}`
  } catch { return null }
}

async function getMovieInfo(query) {
  try {
    const q = normalize(query)
    if (q.length < 2) return null
    const [movRes, tvRes] = await Promise.all([
      axios.get('https://api.themoviedb.org/3/search/movie', { params: { api_key: TMDB_KEY(), query: q, language: 'es-AR' } }),
      axios.get('https://api.themoviedb.org/3/search/tv', { params: { api_key: TMDB_KEY(), query: q, language: 'es-AR' } })
    ])

    const lines = []
    for (const movie of movRes.data.results.slice(0, 2)) {
      const d = (await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}`, {
        params: { api_key: TMDB_KEY(), language: 'es-AR', append_to_response: 'credits' }
      })).data
      const cast = d.credits?.cast?.slice(0, 5).map(c => c.name).join(', ') || 'No disponible'
      const dir = d.credits?.crew?.filter(c => c.job === 'Director').map(c => c.name).join(', ') || 'No disponible'
      lines.push(`🎬 **${d.title}** (${d.release_date?.substring(0,4)}) — Película\nDirector: ${dir}\nReparto: ${cast}\nSinopsis: ${d.overview?.substring(0,200) || 'No disponible'}\nPuntuación: ${d.vote_average?.toFixed(1)}/10`)
    }
    for (const show of tvRes.data.results.slice(0, 1)) {
      const d = (await axios.get(`https://api.themoviedb.org/3/tv/${show.id}`, {
        params: { api_key: TMDB_KEY(), language: 'es-AR', append_to_response: 'credits' }
      })).data
      const cast = d.credits?.cast?.slice(0, 5).map(c => c.name).join(', ') || 'No disponible'
      lines.push(`📺 **${d.name}** (${d.first_air_date?.substring(0,4)}) — Serie\nCreador: ${d.created_by?.map(c=>c.name).join(', ') || 'No disponible'}\nReparto: ${cast}\nTemporadas: ${d.number_of_seasons}\nSinopsis: ${d.overview?.substring(0,200) || 'No disponible'}\nPuntuación: ${d.vote_average?.toFixed(1)}/10`)
    }
    return lines.length > 0 ? lines.join('\n\n') : null
  } catch { return null }
}

async function getPersonInfo(name) {
  try {
    const searchRes = await axios.get('https://api.themoviedb.org/3/search/multi', {
      params: { api_key: TMDB_KEY(), query: name, language: 'es-AR' }
    })

    const people = searchRes.data.results.filter(r => r.media_type === 'person')

    for (const person of people.slice(0, 3)) {
      const personNorm = normalize(person.name)
      const inputWords = normalize(name).split(' ').filter(w => w.length > 2)
      const matches = inputWords.filter(w => personNorm.includes(w))
      const hasPartialMatch = inputWords.some(w =>
        personNorm.split(' ').some(pw => pw.startsWith(w.substring(0, 4)) || w.startsWith(pw.substring(0, 4)))
      )
      if (matches.length === 0 && !hasPartialMatch) continue

      const credits = person.known_for?.filter(k => k.media_type === 'movie' || k.media_type === 'tv')
      if (!credits?.length) {
        return `No encontré películas o series en las que haya participado **${person.name}** en el ámbito audiovisual.`
      }
      const list = credits.slice(0, 5).map(k =>
        `- **${k.title || k.name}** (${(k.release_date || k.first_air_date)?.substring(0,4)}) — ${k.media_type === 'movie' ? 'película' : 'serie'}`
      ).join('\n')
      return `**${person.name}** participó en:\n${list}`
    }
    return null
  } catch { return null }
}

router.post('/', async (req, res) => {
  const { messages, preferences } = req.body
  const today = new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long' })
  const lastMsg = messages.filter(m => m.role === 'user').slice(-1)[0]?.content || ''
  const lower = normalize(lastMsg)

  // ── FILTRO OFF-TOPIC ──────────────────────────────────────────────────────
  const OFF_TOPIC_PATTERNS = [
    /\bclima\b/, /\btemperatura\b/, /\btiempo\b.*hoy/, /\breceta[s]?\b/,
    /\bnoticias?\b/, /\bpolitica\b/, /\bdeporte[s]?\b(?!.*pelicula)/,
    /\bcomo estas\b/, /\bchiste[s]?\b/, /\bpoema[s]?\b/,
    /\bque hora\b/, /\bcalculadora\b/, /\btraduc/,
    /\bmoneda[s]?\b/, /\bcotizacion\b/, /\bdolar\b/
  ]
  const isOffTopic = OFF_TOPIC_PATTERNS.some(p => p.test(lower))
  if (isOffTopic) {
    return res.json({ reply: 'Solo puedo ayudarte con películas, series, documentales y entretenimiento audiovisual. ¿Qué querés buscar o ver?' })
  }
  // ─────────────────────────────────────────────────────────────────────────

  const isTrending = ['mas visto', 'lo mas visto', 'tendencia', 'trending', 'popular hoy', 'top hoy'].some(k => lower.includes(k))
  const isRecommendation = RECOMMENDATION_KEYWORDS.some(k => lower.includes(k))

  if (isTrending) {
    const trending = await getTrending()
    return res.json({ reply: trending || 'No pude obtener las tendencias ahora.' })
  }

  if (isRecommendation || lastMsg.trim().split(/\s+/).length > 5) {
    const prefsText = preferences?.dislikes?.length ? `No recomiendes: ${preferences.dislikes.join(', ')}.` : ''
    const systemContent = `Sos el asistente de Watchly, especializado ÚNICAMENTE en películas, series, telenovelas, miniseries y documentales.

REGLAS ESTRICTAS:
1. Si la pregunta NO es sobre contenido audiovisual (clima, noticias, política, recetas, etc.), respondé ÚNICAMENTE: "Solo puedo ayudarte con películas, series, documentales y entretenimiento audiovisual. ¿Qué querés buscar o ver?"
2. Nunca respondas preguntas fuera del entretenimiento audiovisual, aunque el usuario insista.
3. Podés informar: reparto, director, año, sinopsis, plataforma, música, premios, productora.
4. Respondé siempre en español argentino.
5. Máximo 3 recomendaciones. Formato: - **Título** (año) — descripción corta.
Fecha actual: ${today}. ${prefsText}`
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'HTTP-Referer': 'https://watchly.app', 'X-Title': 'Watchly' },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b:free',
          max_tokens: 250,
          temperature: 0.3,
          messages: [
            { role: 'system', content: systemContent },
            ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
          ]
        })
      })
      const data = await response.json()
      const reply = data.choices?.[0]?.message?.content || 'No pude generar una respuesta.'
      return res.json({ reply })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ error: 'Error al consultar el asistente' })
    }
  }

  const stopWords = new Set(['la', 'el', 'los', 'las', 'un', 'una', 'de', 'del', 'al', 'en', 'con', 'por', 'para', 'que', 'se', 'escritora', 'escritor', 'actor', 'actriz', 'cantante', 'director', 'directora', 'sobre', 'acerca', 'donde', 'participo', 'actuo', 'quien', 'es', 'fue', 'hay', 'tiene', 'cual', 'cuales', 'pelicula', 'serie', 'informacion'])
  const cleanName = lower.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w)).join(' ')

  const movieResult = await getMovieInfo(cleanName)
  if (movieResult) return res.json({ reply: movieResult })

  const personResult = await getPersonInfo(cleanName)
  if (personResult) return res.json({ reply: personResult })

  return res.json({ reply: `No encontré información sobre "${lastMsg.trim()}" en películas, series o entretenimiento audiovisual. ¿Querés que te recomiende algo?` })
})

module.exports = router