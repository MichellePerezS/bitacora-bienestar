import { useState } from 'react'
import { sb } from '../supabaseClient'

function todayStr(){ return new Date().toISOString().split('T')[0] }

export default function RecommendPanel({ userId }){
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rec, setRec] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('exercise')

  const toggle = async () => {
    if(open){ setOpen(false); return }
    setOpen(true)
    setLoading(true)
    setError('')
    setTab('exercise')
    try{
      const { data: rows } = await sb.from('entries').select('*').eq('user_id', userId).order('date', { ascending: true }).limit(10)
      const { data: starts } = await sb.from('period_starts').select('date').eq('user_id', userId)
      let cycleDay = null
      if(starts && starts.length){
        const sorted = starts.map(r => r.date).sort()
        const last = new Date(sorted[sorted.length - 1] + 'T00:00:00')
        cycleDay = Math.round((new Date(todayStr() + 'T00:00:00') - last) / 86400000) + 1
      }
      const { data: profile } = await sb.from('profile').select('*').eq('user_id', userId).maybeSingle()
      const resp = await fetch('/.netlify/functions/recommend', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: rows || [], cycleDay,
          foodsAllowed: profile?.foods_allowed || '', foodsAvoid: profile?.foods_avoid || '', medicalNotes: profile?.medical_notes || ''
        })
      })
      if(!resp.ok) throw new Error('función no disponible (revisa que esté desplegada y con ANTHROPIC_API_KEY configurada)')
      setRec(await resp.json())
    }catch(e){
      setError('No se pudo generar la sugerencia: ' + e.message)
    }
    setLoading(false)
  }

  const tabs = [
    { id: 'exercise', label: '🏃 Ejercicio' },
    { id: 'food', label: '🍽️ Comida' },
    { id: 'mood', label: '💛 Ánimo' }
  ]

  return (
    <>
      <div className="link-toggle"><a onClick={toggle}>{open ? '🌸 Ocultar sugerencias ↑' : '🌸 Sugerencias para ti hoy →'}</a></div>
      {open && (
        <div className="card">
          {loading && <div className="loading">Revisando tus últimos días…</div>}
          {!loading && error && <div className="loading">{error}</div>}
          {!loading && rec && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {tabs.map(t => (
                  <button key={t.id} className={'rec-tab' + (tab === t.id ? ' active' : '')} onClick={() => setTab(t.id)}>{t.label}</button>
                ))}
              </div>
              <p style={{ fontSize: 14, color: 'var(--cream-dim)', lineHeight: 1.6 }}>{rec[tab] || ''}</p>
              {rec.flag && <p style={{ fontSize: 13, color: 'var(--gold)', marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 12 }}>💛 {rec.flag}</p>}
              <p style={{ fontSize: 11, color: 'var(--cream-dim)', opacity: 0.6, marginTop: 16 }}>
                Estas son sugerencias generales, no un plan médico ni nutricional. Para algo específico a tu hipotiroidismo/SOP, consulta a tu médico o nutricionista.
              </p>
            </>
          )}
        </div>
      )}
    </>
  )
}
