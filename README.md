# Bitácora de Bienestar — despliegue

## 1. Crear el backend en Supabase (gratis)

1. Ve a https://supabase.com → crea una cuenta → "New project"
2. Cuando esté listo, entra a **SQL Editor** → pega el contenido de `schema.sql` de esta carpeta → **Run**
3. Ve a **Project Settings > API** y copia:
   - `Project URL`
   - `anon public` key

## 2. Configurar el frontend

Abre `index.html`, busca estas líneas casi al final del archivo (dentro del `<script>`) y pon tus datos:

```js
const SUPABASE_URL = "TU_SUPABASE_URL_AQUI";
const SUPABASE_ANON_KEY = "TU_SUPABASE_ANON_KEY_AQUI";
```

La `anon key` es pública por diseño (así funciona Supabase), la seguridad real la da el Row Level Security que ya quedó activado en `schema.sql` — solo tú puedes leer o escribir tus propias filas, aunque alguien más tenga la URL.

## 3. (Opcional) Activar el análisis con IA y las sugerencias

Si quieres los botones "✨ Pedir análisis a la IA" y "🌸 Sugerencias para ti hoy":

1. Necesitas una API key de Anthropic: https://console.anthropic.com/settings/keys
2. En Netlify, después de desplegar (paso 4): **Site settings > Environment variables** → agrega `ANTHROPIC_API_KEY` con tu key
3. Las funciones ya están listas en `netlify/functions/analyze.js`, `netlify/functions/recommend.js` y `netlify/functions/extract-food-list.js` — Netlify las detecta solas

Si no quieres configurar esto todavía, no pasa nada: el resto de la app funciona igual, esos botones solo mostrarán un error.

**Sobre la foto de tu doctora:** en la sección "Mi lista médica" puedes subir una foto y se analiza automáticamente para rellenar los campos de permitidos/evitar/notas — siempre revisa lo que rellena antes de guardar, por si acaso.

**Importante sobre las sugerencias:** están diseñadas a propósito para NUNCA dar cifras de calorías, macros o dietas restrictivas — solo ideas generales de movimiento, alimentación equilibrada y autocuidado. No reemplazan a tu médico o nutricionista, especialmente por el hipotiroidismo y el SOP.

## 4. Subir a Netlify

**Opción fácil (arrastrar y soltar):**
1. Ve a https://app.netlify.com/drop
2. Arrastra la carpeta completa `bitacora-web` (con `index.html` y la carpeta `netlify/functions`)
3. Listo, te da una URL tipo `nombre-random.netlify.app`

**Opción con GitHub (recomendada a futuro, permite actualizar con git push):**
1. Sube esta carpeta a un repo de GitHub
2. En Netlify: "Add new site" → "Import an existing project" → conecta el repo
3. Build command: (vacío) — Publish directory: `.`

## 5. Crear tu cuenta

Abre la URL que te dio Netlify → "¿Primera vez? Crea tu cuenta" → confirma el email que te llega de Supabase → inicia sesión.

## Notas de privacidad

- Tus datos (peso, ciclo, ánimo, etc.) viven en tu base de datos de Supabase, no en ningún servidor de Anthropic
- Row Level Security significa que ni siquiera con acceso a la base de datos cruda alguien puede ver tus filas sin tu sesión
- Puedes exportar o borrar todo desde el Table Editor de Supabase cuando quieras
