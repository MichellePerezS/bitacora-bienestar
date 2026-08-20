import { useState } from 'react'
import { sb } from '../supabaseClient'

export default function HistoryPanel({ userId }){
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState(null)

  const toggle = async () => {
    if(open){ setOpen(false); return }
    setOpen(true)
    try{
      const { data, error } = await sb.from('entries').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(14)
      if(error) throw error
      setRows(data || [])
    }catch(e){
      setRows([])
    }
  }

  return (
    <>
      <div className="link-toggle"><a onClick={toggle}>{open ? 'Ocultar historial ↑' : 'Ver mi historial →'}</a></div>
      {open && (
        <div className="card">
          {rows === null && <div className="loading">Cargando…</div>}
          {rows && rows.length === 0 && <div className="loading">Aún no tienes registros guardados.</div>}
          {rows && rows.map(e => {
            const parts = []
            if(e.weight) parts.push('Peso: ' + e.weight + 'kg')
            if(e.mood) parts.push('Ánimo: ' + e.mood + '/5')
            if(e.sleep_hours) parts.push('Sueño: ' + e.sleep_hours + 'h')
            if(e.exercise_done) parts.push('Ejercicio ✓')
            return (
              <div className="history-entry" key={e.date}>
                <div className="h-date">{e.date}</div>
                <div className="h-line">{parts.join(' · ') || 'Sin detalles'}</div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
