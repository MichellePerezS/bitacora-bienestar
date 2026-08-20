import { useEffect, useState } from 'react'
import { sb } from '../supabaseClient'
import Scale from './Scale'
import TagGroup from './TagGroup'

const exercisePlan = {
  1: "Lunes — Descanso activo: mobility/recovery 10-15 min o caminata suave",
  2: "Martes — Cardio ligero: caminata/cardio bajo impacto 20-25 min",
  3: "Miércoles — Fuerza piernas y glúteos, 20-25 min",
  4: "Jueves — Descanso o estiramiento 10 min",
  5: "Viernes — Fuerza core y tren superior, 20 min",
  6: "Sábado — Cardio moderado, trote/caminata suave 15-20 min",
  0: "Domingo — Libre: paddleboard, caminar con el perro, lo que disfrutes"
}

const scale5 = [1,2,3,4,5].map(v => ({ v, label: String(v) }))
const moodScaleOpts = [
  { v:1, label:'😞' }, { v:2, label:'😕' }, { v:3, label:'😐' }, { v:4, label:'🙂' }, { v:5, label:'😄' }
]

const emptyEntry = {
  weight: '', waist: '', mood: null, energy: null, sleepHours: '', sleepQuality: null,
  skinTags: [], skinNote: '', exerciseDone: false, exerciseNote: '',
  eatingScore: null, eatingNote: '', diaryNote: '', flow: null, symptoms: []
}

function rowToEntry(row){
  if(!row) return { ...emptyEntry }
  return {
    weight: row.weight ?? '', waist: row.waist ?? '', mood: row.mood, energy: row.energy,
    sleepHours: row.sleep_hours ?? '', sleepQuality: row.sleep_quality,
    skinTags: row.skin_tags || [], skinNote: row.skin_note || '',
    exerciseDone: !!row.exercise_done, exerciseNote: row.exercise_note || '',
    eatingScore: row.eating_score, eatingNote: row.eating_note || '', diaryNote: row.diary_note || '',
    flow: row.flow, symptoms: row.symptoms || []
  }
}

export default function EntryForm({ userId, date, onMsg, weightHint, refreshWeightHint }){
  const [entry, setEntry] = useState({ ...emptyEntry })
  const [loading, setLoading] = useState(true)
  const [weightOpen, setWeightOpen] = useState(false)

  useEffect(() => { load() }, [date])

  const load = async () => {
    setLoading(true)
    try{
      const { data } = await sb.from('entries').select('*').eq('user_id', userId).eq('date', date).maybeSingle()
      setEntry(rowToEntry(data))
    }catch(e){
      setEntry({ ...emptyEntry })
    }
    setLoading(false)
  }

  const set = (field, value) => setEntry(prev => ({ ...prev, [field]: value }))

  const save = async () => {
    const row = {
      user_id: userId, date,
      weight: entry.weight || null, waist: entry.waist || null,
      mood: entry.mood, energy: entry.energy,
      sleep_hours: entry.sleepHours || null, sleep_quality: entry.sleepQuality,
      skin_tags: entry.skinTags, skin_note: entry.skinNote,
      exercise_done: entry.exerciseDone, exercise_note: entry.exerciseNote,
      eating_score: entry.eatingScore, eating_note: entry.eatingNote, diary_note: entry.diaryNote,
      flow: entry.flow, symptoms: entry.symptoms
    }
    try{
      const { error } = await sb.from('entries').upsert(row, { onConflict: 'user_id,date' })
      if(error) throw error
      onMsg('Guardado ✓', true)
      refreshWeightHint()
    }catch(e){
      onMsg('No se guardó: ' + e.message, false)
    }
  }

  const remove = async () => {
    if(!confirm('¿Seguro que quieres borrar el registro del ' + date + '? No se puede deshacer.')) return
    try{
      const { error } = await sb.from('entries').delete().eq('user_id', userId).eq('date', date)
      if(error) throw error
      setEntry({ ...emptyEntry })
      onMsg('Registro borrado ✓', true)
      refreshWeightHint()
    }catch(e){
      onMsg('No se pudo borrar: ' + e.message, false)
    }
  }

  if(loading) return <div className="loading">Cargando tu bitácora…</div>

  const weekday = new Date(date + 'T00:00:00').getDay()

  return (
    <>
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setWeightOpen(!weightOpen)}>
          <h2 style={{ marginBottom: 0 }}>
            <span className="dot" style={{ background: 'var(--gold)' }}></span>
            Peso y medidas
            {weightHint && <span style={{ fontSize: 11, color: 'var(--cream-dim)', fontWeight: 400, marginLeft: 6 }}>({weightHint})</span>}
          </h2>
          <span style={{ color: 'var(--cream-dim)' }}>{weightOpen ? '－' : '＋'}</span>
        </div>
        {weightOpen && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 12, color: 'var(--cream-dim)', marginBottom: 10 }}>No hace falta registrarlo cada día — cuando tú quieras.</p>
            <div className="field-row">
              <div className="field">
                <label>Peso (kg)</label>
                <input type="number" step="0.1" placeholder="ej. 62.5" value={entry.weight} onChange={e => set('weight', e.target.value)} />
              </div>
              <div className="field">
                <label>Cintura (cm) — opcional</label>
                <input type="number" step="0.1" placeholder="ej. 78" value={entry.waist} onChange={e => set('waist', e.target.value)} />
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <h2><span className="dot" style={{ background: 'var(--sage)' }}></span>Ánimo y energía</h2>
        <div className="field">
          <label>Ánimo</label>
          <Scale options={moodScaleOpts} value={entry.mood} onChange={v => set('mood', v)} />
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>Energía (1–5)</label>
          <Scale options={scale5} value={entry.energy} onChange={v => set('energy', v)} />
        </div>
      </section>

      <section className="card">
        <h2><span className="dot" style={{ background: 'var(--plum)' }}></span>Sueño</h2>
        <div className="field-row">
          <div className="field">
            <label>Horas dormidas</label>
            <input type="number" step="0.5" placeholder="ej. 7" value={entry.sleepHours} onChange={e => set('sleepHours', e.target.value)} />
          </div>
          <div className="field">
            <label>Calidad (1–5)</label>
            <Scale options={scale5} value={entry.sleepQuality} onChange={v => set('sleepQuality', v)} />
          </div>
        </div>
      </section>

      <section className="card">
        <h2><span className="dot" style={{ background: 'var(--rose)' }}></span>Piel y cabello</h2>
        <TagGroup
          tags={['piel radiante','piel grasa','acné','piel seca','cabello graso','caída de cabello','cabello brillante']}
          active={entry.skinTags} multi onChange={v => set('skinTags', v)}
          hint="Toca para marcar — puedes elegir varias"
        />
        <div className="field" style={{ marginTop: 12 }}>
          <label>Nota rápida</label>
          <textarea placeholder="algo que notaste hoy..." value={entry.skinNote} onChange={e => set('skinNote', e.target.value)} />
        </div>
      </section>

      <section className="card">
        <h2><span className="dot" style={{ background: 'var(--gold)' }}></span>Ejercicio</h2>
        <div className="exercise-suggest">Plan sugerido: {exercisePlan[weekday]}</div>
        <div className="check-row">
          <input type="checkbox" id="exerciseDone" checked={entry.exerciseDone} onChange={e => set('exerciseDone', e.target.checked)} />
          <label htmlFor="exerciseDone">Hice actividad física hoy</label>
        </div>
        <div className="field">
          <label>Nota (qué hiciste, cómo te sentiste)</label>
          <textarea placeholder="ej. 20 min fuerza piernas, se sintió bien" value={entry.exerciseNote} onChange={e => set('exerciseNote', e.target.value)} />
        </div>
      </section>

      <section className="card">
        <h2><span className="dot" style={{ background: 'var(--sage)' }}></span>Alimentación general</h2>
        <div className="field">
          <label>¿Qué tan equilibrado comiste hoy? (1–5, no es sobre calorías)</label>
          <Scale options={scale5} value={entry.eatingScore} onChange={v => set('eatingScore', v)} />
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>Nota (opcional)</label>
          <textarea placeholder="ej. tomé bastante agua, poco desayuno..." value={entry.eatingNote} onChange={e => set('eatingNote', e.target.value)} />
        </div>
      </section>

      <section className="card">
        <h2><span className="dot" style={{ background: 'var(--rose)' }}></span>Ciclo (SOP)</h2>
        <div className="field">
          <label>Flujo hoy</label>
          <TagGroup tags={['ninguno','ligero','moderado','abundante']} active={entry.flow} onChange={v => set('flow', v)} hint="Toca para marcar — elige solo una" />
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>Síntomas</label>
          <TagGroup
            tags={['cólicos','hinchazón','antojos','cambios de ánimo','dolor de cabeza']}
            active={entry.symptoms} multi onChange={v => set('symptoms', v)}
            hint="Toca para marcar — puedes elegir varias"
          />
        </div>
      </section>

      <section className="card">
        <h2><span className="dot" style={{ background: 'var(--gold)' }}></span>Diario del día</h2>
        <div className="field">
          <label>Cuéntame cómo estuvo tu día — lo que hiciste, cómo te sentiste, cualquier cosa</label>
          <textarea style={{ minHeight: 90 }} placeholder="hoy me sentí..." value={entry.diaryNote} onChange={e => set('diaryNote', e.target.value)} />
        </div>
      </section>

      <div className="save-bar">
        <button className="primary" onClick={save}>Guardar registro de hoy</button>
        <button className="danger" onClick={remove}>Borrar registro de este día</button>
      </div>
    </>
  )
}
