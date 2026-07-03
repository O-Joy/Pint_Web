// Página de Definições — partilhada por todos os perfis.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUtilizador, atualizarUtilizadorLocal } from '../utils/auth'
import api from '../services/api'
import Sidebar, { icons } from './Sidebar'
import Topbar from './Topbar'

const NAV_ITEMS = {
  consultor: [
    { label: 'Dashboard', path: '/consultor/dashboard', icon: icons.dashboard },
    { label: 'Badges', path: '/consultor/badges', icon: icons.badges },
    { label: 'Pedidos', path: '/consultor/pedidos', icon: icons.pedidos },
    { label: 'Objetivos', path: '/consultor/objetivos', icon: icons.objetivos },
    { label: 'Gamification', path: '/consultor/gamification', icon: icons.gamification },
  ],
  talent_manager: [
    { label: 'Dashboard', path: '/talent/dashboard', icon: icons.dashboard },
    { label: 'Validações', path: '/talent/validacoes', icon: icons.validacoes },
  ],
  sl_leader: [
    { label: 'Dashboard', path: '/serviceline/dashboard', icon: icons.dashboard },
  ],
  administrador: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: icons.dashboard },
    { label: 'Utilizadores', path: '/admin/utilizadores', icon: icons.utilizadores },
  ],
}

const PERFIL_LABELS = {
  consultor: 'Consultor',
  talent_manager: 'Talent Manager',
  sl_leader: 'Service Line Leader',
  administrador: 'Administrador',
}

const SECCOES = [
  { id: 'perfil', label: 'Editar Perfil' },
  { id: 'password', label: 'Password' },
  { id: 'privacidade', label: 'Política de Privacidade' },
]

export default function Definicoes() {
  const navigate = useNavigate()
  const utilizadorLocal = getUtilizador()
  const perfil = utilizadorLocal?.perfil || 'consultor'
  const navItems = NAV_ITEMS[perfil] || []
  const perfilLabel = PERFIL_LABELS[perfil] || ''

  const [seccaoAtiva, setSeccaoAtiva] = useState('perfil')
  const [areas, setAreas] = useState([])

  const [form, setForm] = useState({ urlFoto: '', telefone: '', urlLinkedin: '', idArea: '' })
  const [passwordForm, setPasswordForm] = useState({ passwordAtual: '', novaPassword: '', confirmarPassword: '' })
  const [politicaPrivacidade, setPoliticaPrivacidade] = useState('')
  const [aCarregarPolitica, setACarregarPolitica] = useState(false)
  const [aGuardarPolitica, setAGuardarPolitica] = useState(false)
  const [aEnviarFoto, setAEnviarFoto] = useState(false)
  const [erroFoto, setErroFoto] = useState('')
  const [aGuardar, setAGuardar] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  // Área -> editável para consultor e TM
  const podeEditarArea = perfil === 'consultor' || perfil === 'talent_manager'

  useEffect(() => {
    api.get('/perfil/me')
      .then((res) => {
        setForm({
          urlFoto: res.data?.urlFoto || '',
          telefone: res.data?.telefone || '',
          urlLinkedin: res.data?.urlLinkedin || '',
          idArea: res.data?.idArea || '',
        })
      })
      .catch((err) => console.error('[Definicoes]', err))

    if (podeEditarArea) {
      api.get('/areas').then((res) => setAreas(Array.isArray(res.data) ? res.data : [])).catch(() => {})
    }
  }, [podeEditarArea])

  const escolherFoto = async (e) => {
    const ficheiro = e.target.files?.[0]
    if (!ficheiro) return

    setErroFoto('')
    setAEnviarFoto(true)
    try {
      const dados = new FormData()
      dados.append('foto', ficheiro)
      const res = await api.post('/perfil/foto', dados)
      setForm((f) => ({ ...f, urlFoto: res.data?.urlFoto || f.urlFoto }))
      if (res.data?.urlFoto) atualizarUtilizadorLocal({ urlFoto: res.data.urlFoto })
    } catch (err) {
      setErroFoto(err?.response?.data?.error || 'Não foi possível enviar a foto.')
    } finally {
      setAEnviarFoto(false)
      e.target.value = ''
    }
  }

  const guardarPerfil = async () => {
    setErro('')
    setSucesso('')
    setAGuardar(true)
    try {
      await api.put('/perfil/me', {
        telefone: form.telefone,
        urlLinkedin: form.urlLinkedin,
        ...(podeEditarArea ? { idArea: form.idArea ? Number(form.idArea) : null } : {}),
      })
      setSucesso('Perfil atualizado com sucesso!')
    } catch (err) {
      setErro(err?.response?.data?.error || 'Não foi possível guardar as alterações.')
    } finally {
      setAGuardar(false)
    }
  }

  const guardarPassword = async () => {
    setErro('')
    setSucesso('')

    if (!passwordForm.passwordAtual || !passwordForm.novaPassword || !passwordForm.confirmarPassword) {
      setErro('Preenche os 3 campos.')
      return
    }
    if (passwordForm.novaPassword !== passwordForm.confirmarPassword) {
      setErro('A nova password e a confirmação não coincidem.')
      return
    }
    if (passwordForm.novaPassword.length < 6) {
      setErro('A nova password deve ter pelo menos 6 caracteres.')
      return
    }

    setAGuardar(true)
    try {
      await api.put('/perfil/password', {
        passwordAtual: passwordForm.passwordAtual,
        novaPassword: passwordForm.novaPassword,
      })
      setPasswordForm({ passwordAtual: '', novaPassword: '', confirmarPassword: '' })
      setSucesso('Password alterada com sucesso!')
    } catch (err) {
      setErro(err?.response?.data?.error || 'Não foi possível alterar a password.')
    } finally {
      setAGuardar(false)
    }
  }

  const trocarSeccao = (id) => {
    setSeccaoAtiva(id)
    setErro('')
    setSucesso('')
    if (id === 'privacidade' && !politicaPrivacidade) {
      setACarregarPolitica(true)
      api.get('/auth/politica-privacidade')
        .then((res) => setPoliticaPrivacidade(res.data?.conteudo || ''))
        .catch((err) => console.error('[Definicoes politica]', err))
        .finally(() => setACarregarPolitica(false))
    }
  }

  const guardarPoliticaPrivacidade = async () => {
    setErro('')
    setSucesso('')
    setAGuardarPolitica(true)
    try {
      await api.put('/admin/politica-privacidade', { conteudo: politicaPrivacidade })
      setSucesso('Política de privacidade atualizada com sucesso!')
    } catch (err) {
      setErro(err?.response?.data?.error || 'Não foi possível guardar a política de privacidade.')
    } finally {
      setAGuardarPolitica(false)
    }
  }

  return (
    <div className="pg-layout">
      <div className="pg-top"><Topbar /></div>

      <div className="container-fluid pg-body">
        <div className="row h-100">
          <div className="col-auto d-none d-md-flex p-0">
            <Sidebar navItems={navItems} perfil={perfilLabel} />
          </div>

          <div className="col">
            <main className="pg-content">
              <div style={{ padding: '1.5rem', maxWidth: 720, margin: '0 auto' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                  <button onClick={() => navigate('/perfil')} style={{ background: 'none', border: 'none', color: '#39639C', fontSize: 20, cursor: 'pointer' }}>←</button>
                  <h2 style={{ color: '#39639C', fontWeight: 700, margin: 0 }}>Definições</h2>
                </div>

                {/* Separadores */}
                <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 10, padding: 4, marginBottom: 24, width: 'fit-content' }}>
                  {SECCOES.map((s) => (
                    <button key={s.id} onClick={() => trocarSeccao(s.id)} style={{
                      padding: '8px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      background: seccaoAtiva === s.id ? '#fff' : 'transparent',
                      color: seccaoAtiva === s.id ? '#39639C' : '#6b7280',
                      boxShadow: seccaoAtiva === s.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    }}>
                      {s.label}
                    </button>
                  ))}
                </div>

                <div style={{ background: '#fff', borderRadius: 14, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>

                  {/* ── Editar Perfil ── */}
                  {seccaoAtiva === 'perfil' && (
                    <>
                      <label style={campoLabel}>Foto</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                        <div style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', background: '#e8f0fb', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {form.urlFoto
                            ? <img src={form.urlFoto.startsWith('http') ? form.urlFoto : `http://localhost:3001/${form.urlFoto}`} alt="Foto de perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ color: '#9ca3af', fontSize: 11 }}>Sem foto</span>}
                        </div>
                        <label htmlFor="input-foto-perfil" style={{ cursor: aEnviarFoto ? 'wait' : 'pointer', fontSize: 12.5, fontWeight: 600, color: '#39639C', border: '1px solid #39639C', borderRadius: 20, padding: '6px 14px' }}>
                          {aEnviarFoto ? 'A enviar...' : 'Escolher do dispositivo'}
                        </label>
                        <input
                          id="input-foto-perfil"
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,image/webp,image/gif"
                          style={{ display: 'none' }}
                          disabled={aEnviarFoto}
                          onChange={escolherFoto}
                        />
                      </div>
                      {erroFoto && <div style={{ ...mensagemErro, marginTop: 0 }}>{erroFoto}</div>}
                      <div style={{ marginBottom: 8 }} />

                      <label style={campoLabel}>Telefone</label>
                      <input type="text" value={form.telefone}
                        onChange={(e) => setForm({ ...form, telefone: e.target.value })} style={campoInput} />

                      <label style={campoLabel}>LinkedIn</label>
                      <input type="text" value={form.urlLinkedin} placeholder="https://linkedin.com/in/..."
                        onChange={(e) => setForm({ ...form, urlLinkedin: e.target.value })} style={campoInput} />

                      {podeEditarArea && (
                        <>
                          <label style={campoLabel}>Área</label>
                          <select value={form.idArea} onChange={(e) => setForm({ ...form, idArea: e.target.value })} style={{ ...campoInput, color: '#555' }}>
                            <option value="">— Sem área —</option>
                            {areas.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                          </select>
                        </>
                      )}

                      {erro && <div style={mensagemErro}>{erro}</div>}
                      {sucesso && <div style={mensagemSucesso}>{sucesso}</div>}

                      <button onClick={guardarPerfil} disabled={aGuardar} style={botaoPrimario(aGuardar)}>
                        {aGuardar ? 'A guardar...' : 'Guardar Alterações'}
                      </button>
                    </>
                  )}

                  {/* ── Password ── */}
                  {seccaoAtiva === 'password' && (
                    <>
                      <label style={campoLabel}>Password Atual</label>
                      <input type="password" value={passwordForm.passwordAtual}
                        onChange={(e) => setPasswordForm({ ...passwordForm, passwordAtual: e.target.value })} style={campoInput} />

                      <label style={campoLabel}>Nova Password</label>
                      <input type="password" value={passwordForm.novaPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, novaPassword: e.target.value })} style={campoInput} />

                      <label style={campoLabel}>Confirmar Nova Password</label>
                      <input type="password" value={passwordForm.confirmarPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmarPassword: e.target.value })} style={campoInput} />

                      {erro && <div style={mensagemErro}>{erro}</div>}
                      {sucesso && <div style={mensagemSucesso}>{sucesso}</div>}

                      <button onClick={guardarPassword} disabled={aGuardar} style={botaoPrimario(aGuardar)}>
                        {aGuardar ? 'A guardar...' : 'Alterar Password'}
                      </button>
                    </>
                  )}

                  {/* ── Política de Privacidade ── */}
                  {seccaoAtiva === 'privacidade' && (
                    <div style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.7 }}>
                      {aCarregarPolitica ? (
                        <p style={{ color: '#aaa' }}>A carregar...</p>
                      ) : perfil === 'administrador' ? (
                        <>
                          <label style={campoLabel}>Texto da Política de Privacidade</label>
                          <textarea
                            value={politicaPrivacidade}
                            onChange={(e) => setPoliticaPrivacidade(e.target.value)}
                            rows={10}
                            style={{ ...campoInput, resize: 'vertical', fontFamily: 'inherit' }}
                          />
                          {erro && <div style={mensagemErro}>{erro}</div>}
                          {sucesso && <div style={mensagemSucesso}>{sucesso}</div>}
                          <button onClick={guardarPoliticaPrivacidade} disabled={aGuardarPolitica} style={botaoPrimario(aGuardarPolitica)}>
                            {aGuardarPolitica ? 'A guardar...' : 'Guardar Política'}
                          </button>
                        </>
                      ) : (
                        <p>{politicaPrivacidade || 'Política de privacidade não disponível de momento.'}</p>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}

const campoLabel = { fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }
const campoInput = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, marginBottom: 16, outline: 'none' }
const mensagemErro = { color: '#e74c3c', fontSize: 12, marginBottom: 12 }
const mensagemSucesso = { color: '#2ecc71', fontSize: 12, marginBottom: 12 }
const botaoPrimario = (aGuardar) => ({
  background: '#39639C', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px',
  fontSize: 13, fontWeight: 600, cursor: aGuardar ? 'default' : 'pointer', opacity: aGuardar ? 0.7 : 1,
})
