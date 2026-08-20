import { useEffect, useState } from 'react'
import { sb } from '../supabaseClient'

export default function MedicalProfile({ userId }){
  const [foodsAllowed, setFoodsAllowed] = useState('')
  const [foodsAvoid, setFoodsAvoid] = useState('')
  const [medicalNotes, setMedicalNotes] = useState('')
  const [msg, setMsg] = useState({ text: '', ok: true })
  const [photoMsg, setPhotoMsg] = useState({ text: '', ok: true })
  const [file, setFile] = useState(null)

  useEffect(() => { load() }, [userId])

  const load = async () => {
    try{
      const { data } = await sb.from('profile').select('*').eq('user_id', userId).maybeSingle()
      setFoodsAllowed(data?.foods_allowed || '')
      setFoodsAvoid(data?.foods_avoid || '')
      setMedicalNotes(data?.medical_notes || '')
    }catch(e){ /* perfil vacío está bien */ }
  }

  const save = async () => {
    try{
      const { error } = await sb.from('profile').upsert({
        user_id: userId, foods_allowed: foodsAllowed, foods_avoid: foodsAvoid,
        medical_notes: medicalNotes, updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      if(error) throw error
      setMsg({ text: 'Guardado ✓ — se usará en tus próximas sugerencias', ok: true })
      setTimeout(() => setMsg({ text: '', ok: true }), 3000)
    }catch(e){
      setMsg({ text: 'No se guardó: ' + e.message, ok: false })
    }
  }

  const analyzePhoto = async () => {
    if(!file){ setPhotoMsg({ text: 'Primero selecciona una foto', ok: false }); return }
    if(file.size > 5 * 1024 * 1024){ setPhotoMsg({ text: 'La foto es muy pesada (máx 5MB)', ok: false }); return }
    setPhotoMsg({ text: 'Leyendo la imagen…', ok: true })
    try{
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader()
        r.onload = () => res(r.result.split(',')[1])
        r.onerror = () => rej(new Error('No se pudo leer el archivo'))
        r.readAsDataURL(file)
      })
      const resp = await fetch('/.netlify/functions/extract-food-list', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType: file.type || 'image/jpeg' })
      })
      if(!resp.ok) throw new Error('función no disponible (revisa que esté desplegada y con ANTHROPIC_API_KEY configurada)')
      const result = await resp.json()
      if(result.error){ setPhotoMsg({ text: result.error, ok: false }); return }
      if(result.foodsAllowed) setFoodsAllowed(prev => prev ? prev + ', ' + result.foodsAllowed : result.foodsAllowed)
      if(result.foodsAvoid) setFoodsAvoid(prev => prev ? prev + ', ' + result.foodsAvoid : result.foodsAvoid)
      if(result.medicalNotes) setMedicalNotes(prev => prev ? prev + '. ' + result.medicalNotes : result.medicalNotes)
      setPhotoMsg({ text: 'Listo — revisa los campos y dale "Guardar mi lista médica"', ok: true })
    }catch(e){
      setPhotoMsg({ text: 'No se pudo analizar: ' + e.message, ok: false })
    }
  }

  return (
    <section className="card">
      <h2><span className="dot" style={{ background: 'var(--sage)' }}></span>Mi lista médica</h2>
      <p style={{ fontSize: 12, color: 'var(--cream-dim)', marginBottom: 12 }}>
        Lo que tu doctora te indicó. Esto se guarda una sola vez y se usa para que las sugerencias nunca contradigan lo que ella te dijo.
      </p>

      <div className="medical-photo-box">
        <label>📷 ¿Tienes una foto de la indicación de tu doctora?</label>
        <input type="file" accept="image/*" style={{ fontSize: 12, color: 'var(--cream-dim)', marginBottom: 8, width: '100%' }} onChange={e => setFile(e.target.files[0])} />
        <button className="btn-secondary" style={{ width: '100%' }} onClick={analyzePhoto}>Analizar foto y rellenar campos</button>
        <div className={'save-msg ' + (photoMsg.ok ? 'ok' : 'err')} style={{ fontSize: 12 }}>{photoMsg.text}</div>
      </div>

      <div className="field" style={{ marginBottom: 12 }}>
        <label>Alimentos permitidos / recomendados</label>
        <textarea style={{ minHeight: 70 }} placeholder="ej. proteína magra, verduras de hoja verde, avena..." value={foodsAllowed} onChange={e => setFoodsAllowed(e.target.value)} />
      </div>
      <div className="field" style={{ marginBottom: 12 }}>
        <label>Alimentos a evitar</label>
        <textarea style={{ minHeight: 70 }} placeholder="ej. gluten, lácteos, azúcar refinada..." value={foodsAvoid} onChange={e => setFoodsAvoid(e.target.value)} />
      </div>
      <div className="field" style={{ marginBottom: 12 }}>
        <label>Otras notas médicas (opcional)</label>
        <textarea placeholder="cualquier otra indicación de tu doctora..." value={medicalNotes} onChange={e => setMedicalNotes(e.target.value)} />
      </div>
      <button className="btn-plum" style={{ width: '100%' }} onClick={save}>Guardar mi lista médica</button>
      <div className={'save-msg ' + (msg.ok ? 'ok' : 'err')} style={{ fontSize: 12 }}>{msg.text}</div>
    </section>
  )
}
