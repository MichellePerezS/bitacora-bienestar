// Netlify Function: /.netlify/functions/recommend
// Recibe { entries: [...], cycleDay: number|null } y devuelve { exercise, food, mood }
// Necesita ANTHROPIC_API_KEY configurada en Netlify (Site settings > Environment variables)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY no configurada en Netlify' }) };
  }

  let entries, cycleDay, foodsAllowed, foodsAvoid, medicalNotes;
  try {
    const body = JSON.parse(event.body);
    entries = body.entries;
    cycleDay = body.cycleDay;
    foodsAllowed = body.foodsAllowed || '';
    foodsAvoid = body.foodsAvoid || '';
    medicalNotes = body.medicalNotes || '';
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body inválido' }) };
  }

  const hasMedicalList = foodsAllowed.trim() || foodsAvoid.trim();

  const prompt = `Eres una acompañante de bienestar cálida, no una médica ni nutricionista. La persona es una mujer con hipotiroidismo y SOP (síndrome de ovario poliquístico). Aquí sus últimos registros (JSON): ${JSON.stringify(entries, null, 1)}
${cycleDay ? `Va en el día ${cycleDay} de su ciclo.` : ''}

${hasMedicalList ? `Su doctora le dio esta lista médica personal — es OBLIGATORIO respetarla, tiene prioridad sobre cualquier sugerencia genérica tuya:
Alimentos permitidos/recomendados por su doctora: ${foodsAllowed || '(no especificado)'}
Alimentos que su doctora le dijo que evite: ${foodsAvoid || '(no especificado)'}
Notas médicas adicionales: ${medicalNotes || '(ninguna)'}

Al sugerir alimentación, SOLO menciona opciones dentro de "permitidos" o compatibles con ellos. NUNCA sugieras nada de la lista de "evitar", ni algo que la contradiga. Si no tienes suficiente información en su lista para dar una sugerencia concreta, dilo y recomienda que confirme con su doctora en vez de inventar.` : 'No ha compartido una lista médica de su doctora todavía, así que sé especialmente general y cautelosa en alimentación, y sugiere que si tiene indicaciones médicas específicas las agregue a su perfil.'}

Responde SOLO con un JSON válido (sin texto antes ni después, sin markdown) con esta forma exacta:
{
  "exercise": "2-3 frases con sugerencia de movimiento para hoy, considerando su energía/ánimo reciente y fase del ciclo si aplica. Nunca prescribas cargas ni intensidades extremas.",
  "food": "2-3 frases con ideas de alimentación, respetando estrictamente su lista médica si la dio. PROHIBIDO dar calorías, macros, gramos, o cualquier cifra numérica de dieta. Si su patrón de alimentación reciente se ve restrictivo o irregular, sugiere suavemente hablar con un profesional en vez de dar más indicaciones.",
  "mood": "2-3 frases de autocuidado/ánimo, cálidas y validantes, sin diagnosticar nada ni asumir causas.",
  "flag": "si algo en los datos (sueño muy bajo sostenido, ánimo muy bajo sostenido, patrones alimentarios preocupantes) amerita mencionar que hable con un profesional, dilo aquí en 1 frase calmada. Si no hay nada que señalar, deja este campo como cadena vacía."
}`;

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
        messages: [{ role: 'user', content: prompt }]
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
