import { useEffect, useState } from 'react'
import { sb } from './supabaseClient'
import Auth from './components/Auth'
import ResetPassword from './components/ResetPassword'
import MoonCard from './components/MoonCard'
import EntryForm from './components/EntryForm'
import MedicalProfile from './components/MedicalProfile'
import RecommendPanel from './components/RecommendPanel'
import AnalyzePanel from './components/AnalyzePanel'
import HistoryPanel from './components/HistoryPanel'

function todayStr(){ return new Date().toISOString().split('T')[0] }
function fmtDate(d){ return d.toISOString().split('T')[0] }

const SECTIONS = [
  { id: 'hoy', icon: '🌙', label: 'Hoy' },
  { id: 'historial', icon: '📖', label: 'Historial' },
  { id: 'perfil', icon: '🩺', label: 'Perfil' },
  { id: 'sugerencias', icon: '🌸', label: 'Sugerencias' },
  { id: 'analisis', icon: '🔮', label: 'Análisis' },
]

export default function App(){
  const [user, setUser] = useState(null)
  const [recovery, setRecovery] = useState(false)
  const [section, setSection] = useState('hoy')
  const [date, setDate] = useState(todayStr())
  const [msg, setMsg] = useState({ text: '', ok: true })
  const [weightHint, setWeightHint] = useState('')

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      if(data.session) setUser(data.session.user)
    })
    // Cuando alguien entra desde el link de "recuperar contraseña" de su email,
    // Supabase dispara este evento en vez de un login normal.
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if(event === 'PASSWORD_RECOVERY') setRecovery(true)
      if(session) setUser(session.user)
      if(event === 'SIGNED_OUT'){ setUser(null); setRecovery(false) }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if(user) refreshWeightHint()
  }, [user])

  const showMsg = (text, ok) => {
    setMsg({ text, ok })
    setTimeout(() => setMsg({ text: '', ok: true }), 2500)
  }

  const refreshWeightHint = async () => {
    try{
      const { data } = await sb.from('entries').select('date,weight')
        .eq('user_id', user.id).not('weight', 'is', null)
        .order('date', { ascending: false }).limit(1)
      if(!data || data.length === 0){ setWeightHint(''); return }
      const last = new Date(data[0].date + 'T00:00:00')
      const days = Math.round((new Date(todayStr() + 'T00:00:00') - last) / 86400000)
      setWeightHint(days >= 7 ? `hace ${days} días que no lo registras` : '')
    }catch(e){ /* silencioso */ }
  }

  const logout = async () => {
    await sb.auth.signOut()
    setUser(null)
  }

  const shiftDay = (delta) => {
    const d = new Date(date + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    setDate(fmtDate(d))
  }

  return (
    <>
      <div className="stars"></div>
      <header>
        <div className="eyebrow">Diario nocturno</div>
        <h1>Bitácora de Bienestar</h1>
        <p>{user ? user.email : 'Un registro suave, no una exigencia'}</p>
      </header>

      {recovery && user && <ResetPassword onDone={() => setRecovery(false)} />}

      {!recovery && !user && <Auth onLoggedIn={setUser} />}

      {!recovery && user && (
        <div className="wrap">
          <nav className="main-nav">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                className={'main-nav-btn' + (section === s.id ? ' active' : '')}
                onClick={() => setSection(s.id)}
              >
                <span className="main-nav-icon">{s.icon}</span>
                <span className="main-nav-label">{s.label}</span>
              </button>
            ))}
          </nav>

          {section === 'hoy' && (
            <>
              <MoonCard userId={user.id} onMsg={showMsg} />

              <div className="date-row">
                <button className="nav-btn" onClick={() => shiftDay(-1)}>‹</button>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} />
                <button className="nav-btn" onClick={() => shiftDay(1)}>›</button>
              </div>

              <EntryForm userId={user.id} date={date} onMsg={showMsg} weightHint={weightHint} refreshWeightHint={refreshWeightHint} />
            </>
          )}

          {section === 'historial' && <HistoryPanel userId={user.id} />}
          {section === 'perfil' && <MedicalProfile userId={user.id} />}
          {section === 'sugerencias' && <RecommendPanel userId={user.id} />}
          {section === 'analisis' && <AnalyzePanel userId={user.id} />}

          <div className="link-toggle"><a onClick={logout}>Cerrar sesión</a></div>
        </div>
      )}

      {msg.text && (
        <div className="save-bar" style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}>
          <div className={'save-msg ' + (msg.ok ? 'ok' : 'err')}>{msg.text}</div>
        </div>
      )}
    </>
  )
}
