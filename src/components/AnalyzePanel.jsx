import { useState } from 'react'
import { sb } from '../supabaseClient'

export default function AnalyzePanel({ userId }){
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  const toggle = async () => {
    if(open){ setOpen(false); return }
    setOpen(true)
    setLoading(true)
    setError('')
    try{
      const { data: rows } = await sb.from('entries').select('*').eq('user_id', userId).order('date', { ascending: true }).limit(14)
      if(!rows || rows.length < 3){
        setError('Necesito al menos 3 días registrados para encontrar patrones. Sigue llenando tu bitácora 🌙')
        setLoading(false)
        return
      }
      const resp = await fetch('/.netlify/functions/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: rows })
      })
      if(!resp.ok) throw new Error('función no disponible (revisa que esté desplegada y con ANTHROPIC_API_KEY configurada)')
      const data = await resp.json()
      setText(data.text)
    }catch(e){
      setError('No se pudo generar el análisis: ' + e.message)
    }
    setLoading(false)
  }

  return (
    <>
      <div className="link-toggle"><a onClick={toggle}>{open ? '✨ Ocultar análisis ↑' : '✨ Pedir análisis a la IA →'}</a></div>
      {open && (
        <div className="card">
          {loading && <div className="loading">Leyendo tus últimos días…</div>}
          {!loading && error && <div className="loading">{error}</div>}
          {!loading && text && (
            <>
              <h2 style={{ marginBottom: 10 }}><span className="dot" style={{ background: 'var(--gold)' }}></span>Lo que veo en tus últimos días</h2>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: 14, color: 'var(--cream-dim)' }}>{text}</div>
            </>
          )}
        </div>
      )}
    </>
  )
}
