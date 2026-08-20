# Bitácora de Bienestar (versión React)

Migrada de un solo `index.html` a componentes React con Vite, para que sea más fácil de mantener y ampliar.

## Estructura

```
src/
  App.jsx                    — arma todo, maneja sesión y fecha activa
  supabaseClient.js          — configuración de Supabase (tus claves ya están puestas)
  index.css                  — estilos globales (tema nocturno)
  components/
    Auth.jsx                 — login/registro
    MoonCard.jsx              — tarjeta del ciclo (empezó/continúa/no hay)
    EntryForm.jsx             — formulario diario completo
    MedicalProfile.jsx        — tu lista médica + análisis de foto
    RecommendPanel.jsx        — sugerencias con pestañas (ejercicio/comida/ánimo)
    AnalyzePanel.jsx          — análisis con IA de tus últimos días
    HistoryPanel.jsx          — historial
    Scale.jsx / TagGroup.jsx  — componentes reutilizables (escalas 1-5, etiquetas)
netlify/functions/           — sin cambios, siguen igual que antes
schema.sql                   — sin cambios, es el mismo de siempre
```

## Cómo correrlo en tu computadora (opcional, para ver cambios antes de subir)

```
npm install
npm run dev
```
Abre la URL que te da (típicamente http://localhost:5173)

## Desplegar

Como ya tienes el repo conectado a Netlify con auto-deploy, solo necesitas:

```
git add .
git commit -m "migracion a React"
git push
```

Netlify va a detectar el `netlify.toml`, correr `npm run build` solo, y publicar la carpeta `dist/`. No necesitas cambiar nada en la configuración de Netlify — ya está todo en el archivo `netlify.toml`.

Las variables de entorno (`ANTHROPIC_API_KEY` si la agregaste) siguen funcionando igual, no se tocan.

## Si quieres seguir editando

Cada sección de la bitácora es su propio archivo en `components/` — por ejemplo, si quieres cambiar solo la parte del sueño, abres `EntryForm.jsx` y buscas esa sección. Ya no es un solo archivo gigante.
