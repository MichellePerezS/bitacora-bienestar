// Netlify Function: /.netlify/functions/analyze
// Recibe { entries: [...] } y devuelve { text: "..." }
// Necesita la variable de entorno ANTHROPIC_API_KEY configurada en Netlify
// (Site settings > Environment variables). Nunca pongas la key en el frontend.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY no configurada en Netlify' }) };
  }

  let entries;
  try {
    entries = JSON.parse(event.body).entries;
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body inválido' }) };
  }

  const prompt = `Eres una acompañante cálida y observadora, no una terapeuta ni médica. Aquí están los registros diarios de bienestar de una persona con hipotiroidismo y SOP (últimos ${entries.length} días, formato JSON):

${JSON.stringify(entries, null, 1)}

Escribe en español, tono cercano e informal (como una amiga que presta atención), 3-4 párrafos cortos máximo:
1. Qué patrones notas entre ánimo, sueño, ejercicio y piel/cabello (solo si hay datos suficientes, no inventes)
2. Algo positivo/constante que valga la pena reconocer
3. Una sugerencia amable y concreta, sin ser prescriptiva ni dar consejos médicos
4. Si ves algo que valdría la pena comentar con su médico (cambios raros, patrones de sueño muy bajos, etc.) dilo con calma, sin alarmar

No des recomendaciones de calorías, dietas restrictivas ni cifras de peso objetivo. No diagnostiques nada.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
    const text = (data.content || []).map(b => b.text || '').join('\n') || 'No se pudo generar el análisis.';
    return { statusCode: 200, body: JSON.stringify({ text }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
