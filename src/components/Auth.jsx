import { useState } from 'react'
import { sb } from '../supabaseClient'

export default function Auth({ onLoggedIn }){
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState({ text: '', ok: false })

  const submit = async () => {
    if(!email || password.length < 6){
      setMsg({ text: 'Escribe un email válido y contraseña de al menos 6 caracteres', ok: false })
      return
    }
    setMsg({ text: 'Un momento…', ok: true })
    const { data, error } = isSignUp
      ? await sb.auth.signUp({ email, password })
      : await sb.auth.signInWithPassword({ email, password })
    if(error){
      setMsg({ text: error.message, ok: false })
      return
    }
    if(isSignUp && !data.session){
      setMsg({ text: 'Cuenta creada. Revisa tu email para confirmar, luego inicia sesión.', ok: true })
      return
    }
    onLoggedIn(data.user)
  }

  return (
    <div className="wrap" style={{ maxWidth: 420, paddingTop: 10 }}>
      <section className="card">
        <h2 style={{ justifyContent: 'center', marginBottom: 20 }}>
          <span className="dot" style={{ background: 'var(--gold)' }}></span>
          {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
        </h2>
        <div className="field" style={{ marginBottom: 12 }}>
          <label>Email</label>
          <input type="text" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Contraseña</label>
          <input type="password" placeholder="mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button className="btn-secondary" style={{ width: '100%', padding: 13 }} onClick={submit}>
          {isSignUp ? 'Crear cuenta' : 'Entrar'}
        </button>
        <div className="link-toggle" style={{ marginTop: 14 }}>
          <a onClick={() => { setIsSignUp(!isSignUp); setMsg({ text: '', ok: false }) }}>
            {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿Primera vez? Crea tu cuenta'}
          </a>
        </div>
        <div className={'save-msg ' + (msg.ok ? 'ok' : 'err')}>{msg.text}</div>
      </section>
    </div>
  )
}
