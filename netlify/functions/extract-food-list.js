// Netlify Function: /.netlify/functions/extract-food-list
// Recibe { imageBase64, mediaType } y devuelve { foodsAllowed, foodsAvoid, medicalNotes }
// Necesita ANTHROPIC_API_KEY configurada en Netlify

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY no configurada en Netlify' }) };
  }

  let imageBase64, mediaType;
  try {
    const body = JSON.parse(event.body);
    imageBase64 = body.imageBase64;
    mediaType = body.mediaType || 'image/jpeg';
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body inválido' }) };
  }

  if (!imageBase64) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Falta la imagen' }) };
  }

  const prompt = `Esta imagen es una lista o indicación médica/nutricional que una doctora le dio a su paciente. Léela con cuidado y extrae la información.

Responde SOLO con un JSON válido (sin texto antes ni después, sin markdown) con esta forma exacta:
{
  "foodsAllowed": "lista de alimentos permitidos/recomendados que aparecen en la imagen, separados por comas. Si no hay, cadena vacía.",
  "foodsAvoid": "lista de alimentos a evitar que aparecen en la imagen, separados por comas. Si no hay, cadena vacía.",
  "medicalNotes": "cualquier otra indicación relevante que no encaje en las dos categorías anteriores (cantidades, horarios, suplementos, etc). Si no hay, cadena vacía."
}

Si la imagen no es legible o no parece ser una indicación médica/nutricional, responde con los tres campos vacíos y agrega un campo "error": "no se pudo leer la imagen" al JSON.
No inventes contenido que no esté claramente en la imagen.`;

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
        max_tokens: 700,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });
    const data = await response.json();
    const raw = (data.content || []).map(b => b.text || '').join('\n');
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return { statusCode: 200, body: JSON.stringify(parsed) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
