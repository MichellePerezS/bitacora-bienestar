import { useEffect, useState } from 'react'
import { sb } from '../supabaseClient'

function todayStr(){ return new Date().toISOString().split('T')[0] }

export default function MoonCard({ userId, onMsg }){
  const [starts, setStarts] = useState([])
  const [ends, setEnds] = useState([])

  const load = async () => {
    try{
      const { data: s } = await sb.from('period_starts').select('date').eq('user_id', userId)
      const { data: e } = await sb.from('period_ends').select('date').eq('user_id', userId)
      setStarts((s || []).map(r => r.date))
      setEnds((e || []).map(r => r.date))
    }catch(err){ /* silencioso */ }
  }

  useEffect(() => { load() }, [userId])

  const isActive = () => {
    if(starts.length === 0) return false
    const lastStart = [...starts].sort().reverse()[0]
    return ends.filter(d => d > lastStart).length === 0
  }

  const active = isActive()

  const cycleText = () => {
    if(starts.length === 0) return 'Sin datos aún'
    const sorted = [...starts].sort()
    const last = new Date(sorted[sorted.length - 1] + 'T00:00:00')
    const today = new Date(todayStr() + 'T00:00:00')
    const diffDays = Math.round((today - last) / 86400000)
    return active
      ? (diffDays === 0 ? 'Día 1 de tu período' : 'Día ' + (diffDays + 1) + ' de tu período')
      : 'Día ' + (diffDays + 1) + ' del ciclo (sin período activo)'
  }

  const moonStyle = () => {
    if(starts.length === 0) return {}
    const sorted = [...starts].sort()
    const last = new Date(sorted[sorted.length - 1] + 'T00:00:00')
    const diffDays = Math.round((new Date(todayStr() + 'T00:00:00') - last) / 86400000)
    const phase = (diffDays % 28) / 28
    const shadowPos = 35 + phase * 40
    return { background: `radial-gradient(circle at ${shadowPos}% 35%, #FBEFD9, var(--gold) 55%, #B98A45 100%)` }
  }

  const markStart = async () => {
    const t = todayStr()
    try{
      await sb.from('period_starts').upsert({ user_id: userId, date: t }, { onConflict: 'user_id,date' })
      setStarts(prev => prev.includes(t) ? prev : [...prev, t])
      onMsg('Registrado el inicio de tu período 🌙', true)
    }catch(e){ onMsg('No se pudo registrar: ' + e.message, false) }
  }

  const markEnd = async () => {
    const t = todayStr()
    try{
      await sb.from('period_ends').upsert({ user_id: userId, date: t }, { onConflict: 'user_id,date' })
      setEnds(prev => prev.includes(t) ? prev : [...prev, t])
      onMsg('Listo, marcado como sin período 🌙', true)
    }catch(e){ onMsg('No se pudo registrar: ' + e.message, false) }
  }

  const markContinue = () => onMsg('Anotado, sigue tu período 🌙', true)

  return (
    <div className="moon-card">
      <div className="moon-visual" style={moonStyle()}></div>
      <div className="moon-info">
        <div className="label">Ciclo</div>
        <div className="value">{cycleText()}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <button className="period-btn" style={{ background: 'var(--rose)', color: 'var(--navy-deep)', opacity: active ? 0.5 : 1 }} onClick={markStart}>Empezó hoy</button>
          {active && <button className="period-btn" style={{ background: 'rgba(232,135,156,0.2)', color: 'var(--rose)', border: '1px solid var(--rose)' }} onClick={markContinue}>Continúa</button>}
          {active && <button className="period-btn" style={{ background: 'transparent', color: 'var(--cream-dim)', border: '1px solid var(--line)' }} onClick={markEnd}>No hay período</button>}
        </div>
      </div>
    </div>
  )
}
