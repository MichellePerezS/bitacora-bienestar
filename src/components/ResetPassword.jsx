import { useState } from 'react'
import { sb } from '../supabaseClient'

export default function ResetPassword({ onDone }){
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState({ text: '', ok: false })

  const submit = async () => {
    if(password.length < 6){
      setMsg({ text: 'La contraseña debe tener al menos 6 caracteres', ok: false })
      return
    }
    if(password !== confirm){
      setMsg({ text: 'Las dos contraseñas no coinciden', ok: false })
      return
    }
    setMsg({ text: 'Guardando…', ok: true })
    const { error } = await sb.auth.updateUser({ password })
    if(error){
      setMsg({ text: error.message, ok: false })
      return
    }
    setMsg({ text: 'Contraseña actualizada ✓', ok: true })
    setTimeout(onDone, 1200)
  }

  return (
    <div className="wrap" style={{ maxWidth: 420, paddingTop: 10 }}>
      <section className="card">
        <h2 style={{ justifyContent: 'center', marginBottom: 20 }}>
          <span className="dot" style={{ background: 'var(--gold)' }}></span>
          Crea tu contraseña nueva
        </h2>
        <div className="field" style={{ marginBottom: 12 }}>
          <label>Contraseña nueva</label>
          <input type="password" placeholder="mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Repite la contraseña</label>
          <input type="password" placeholder="mínimo 6 caracteres" value={confirm} onChange={e => setConfirm(e.target.value)} />
        </div>
        <button className="btn-secondary" style={{ width: '100%', padding: 13 }} onClick={submit}>Guardar contraseña</button>
        <div className={'save-msg ' + (msg.ok ? 'ok' : 'err')}>{msg.text}</div>
      </section>
    </div>
  )
}
