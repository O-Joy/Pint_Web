import { useState, useEffect, useMemo } from 'react'
import api from '../services/api'
import Footer from './Footer'
import { FiCheck, FiX, FiRotateCcw, FiBell } from 'react-icons/fi'
import { MdDoneAll } from 'react-icons/md'

const TABS = [
  { id: 'todas',    label: 'Todas' },
  { id: 'naoLidas', label: 'Não Lidas' },
]

const ICONE_POR_TIPO = {
  aprovacao:    { icon: <FiCheck />,     bg: '#dcfce7', color: '#16a34a' },
  rejeicao:     { icon: <FiX />,         bg: '#fee2e2', color: '#dc2626' },
  retificacao:  { icon: <FiRotateCcw />, bg: '#fef3c7', color: '#d97706' },
  aviso:        { icon: <FiBell />,      bg: '#dbeafe', color: '#1d4ed8' },
}
const ICONE_DEFEITO = { icon: <FiBell />, bg: '#f3f4f6', color: '#6b7280' }

function tempoRelativo(data) {
  const diffMs = Date.now() - new Date(data).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'agora mesmo'
  if (min < 60) return `há ${min} min`
  const horas = Math.floor(min / 60)
  if (horas < 24) return `há ${horas}h`
  const dias = Math.floor(horas / 24)
  if (dias < 7) return `há ${dias}d`
  return new Date(data).toLocaleDateString('pt-PT')
}

function grupoData(data) {
  const d = new Date(data)
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const ontem = new Date(hoje); ontem.setDate(ontem.getDate() - 1)
  const semanaAtras = new Date(hoje); semanaAtras.setDate(semanaAtras.getDate() - 7)
  if (d >= hoje) return 'Hoje'
  if (d >= ontem) return 'Ontem'
  if (d >= semanaAtras) return 'Esta Semana'
  return 'Mais Antigas'
}

export default function NotificacoesConteudo() {
  const [notificacoes, setNotificacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('todas')
  const [selecionada, setSelecionada] = useState(null)

  useEffect(() => { carregar() }, [])

  function carregar() {
    setLoading(true)
    api.get('/notificacoes')
      .then(res => setNotificacoes(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error('[Notificacoes] ERRO:', err.response?.status, err.response?.data || err.message))
      .finally(() => setLoading(false))
  }

  function marcarLida(id) {
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
    setSelecionada(prev => prev && prev.id === id ? { ...prev, lida: true } : prev)
    api.put(`/notificacoes/${id}/lida`).catch(() => carregar())
  }

  function eliminarNotificacao(id) {
    if (!window.confirm('Eliminar esta notificação? Esta ação não pode ser desfeita.')) return
    setNotificacoes(prev => prev.filter(n => n.id !== id))
    setSelecionada(prev => prev && prev.id === id ? null : prev)
    api.delete(`/notificacoes/${id}`).catch(() => carregar())
  }

  function marcarNaoLida(id) {
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: false } : n))
    setSelecionada(prev => prev && prev.id === id ? { ...prev, lida: false } : prev)
    api.put(`/notificacoes/${id}/nao-lida`).catch(() => carregar())
  }

  function marcarTodasLidas() {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })))
    api.put('/notificacoes/marcar-todas-lidas').catch(() => carregar())
  }

  // Abrir o modal de detalhe — se ainda não estava lida, marca-a como lida ao abrir
  function abrirNotificacao(n) {
    setSelecionada(n)
    if (!n.lida) marcarLida(n.id)
  }

  const naoLidasCount = notificacoes.filter(n => !n.lida).length

  const filtradas = notificacoes.filter(n => {
    if (tab === 'naoLidas') return !n.lida
    return true
  })

  const grupos = useMemo(() => {
    const mapa = {}
    filtradas.forEach(n => {
      const g = grupoData(n.data)
      if (!mapa[g]) mapa[g] = []
      mapa[g].push(n)
    })
    return mapa
  }, [filtradas])

  const ordemGrupos = ['Hoje', 'Ontem', 'Esta Semana', 'Mais Antigas']
  const iconeSelecionada = selecionada ? (ICONE_POR_TIPO[selecionada.tipoNotificacao] || ICONE_DEFEITO) : null

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif' }}>

      {/* ── Cabeçalho ── */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-1">
        <div>
          <h2 className="fw-bold mb-0 text-primary" style={{ fontSize: 22 }}>Notificações</h2>
          <p className="text-secondary mb-0" style={{ fontSize: 12, marginTop: 4 }}>
            {naoLidasCount > 0 ? `${naoLidasCount} por ler` : 'Está tudo em dia'}
          </p>
        </div>
        {naoLidasCount > 0 && (
          <button onClick={marcarTodasLidas} className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
            <MdDoneAll /> Marcar todas como lidas
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <ul className="nav nav-pills gap-1 mb-4" style={{ background: '#f3f4f6', borderRadius: 10, padding: 4, width: 'fit-content', marginTop: 16 }}>
        {TABS.map(t => (
          <li className="nav-item" key={t.id}>
            <button onClick={() => setTab(t.id)} className={`nav-link small ${tab === t.id ? 'active' : ''}`}>
              {t.label}{t.id === 'naoLidas' && naoLidasCount > 0 ? ` (${naoLidasCount})` : ''}
            </button>
          </li>
        ))}
      </ul>

      {/* ── Lista ── */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>A carregar...</p>
      ) : filtradas.length === 0 ? (
        <div className="card text-center" style={{ padding: 50 }}>
          <FiBell style={{ fontSize: 28, color: '#d1d5db', marginBottom: 10 }} />
          <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>
            {tab === 'naoLidas' ? 'Não há notificações por ler.' : 'Ainda não tens notificações.'}
          </p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {ordemGrupos.filter(g => grupos[g]?.length).map(g => (
            <div key={g}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 10px' }}>{g}</p>
              <div className="card" style={{ overflow: 'hidden' }}>
                {grupos[g].map((n, i) => {
                  const iconeInfo = ICONE_POR_TIPO[n.tipoNotificacao] || ICONE_DEFEITO
                  return (
                    <div
                      key={n.id}
                      role="button"
                      onClick={() => abrirNotificacao(n)}
                      className="d-flex align-items-start gap-3"
                      style={{
                        padding: '16px 20px', cursor: 'pointer',
                        borderBottom: i !== grupos[g].length - 1 ? '1px solid #f3f4f6' : 'none',
                        background: n.lida ? '#fff' : '#f8fbff',
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, background: iconeInfo.bg, color: iconeInfo.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
                      }}>
                        {iconeInfo.icon}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 13, color: '#1a1a2e', fontWeight: n.lida ? 400 : 600, margin: 0, lineHeight: 1.5,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {n.descricao}
                        </p>
                        <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>{tempoRelativo(n.data)}</p>
                      </div>

                      {!n.lida && <span className="rounded-circle bg-primary flex-shrink-0" style={{ width: 8, height: 8, marginTop: 6 }} />}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

    {/* ── Modal de detalhe ── */}
      {selecionada && (
        <div
          onClick={() => setSelecionada(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 460, position: 'relative' }}
          >
            <button onClick={() => setSelecionada(null)} style={{
              position: 'absolute', top: 16, right: 18, background: 'none', border: 'none',
              fontSize: 20, cursor: 'pointer', color: '#9ca3af', lineHeight: 1,
            }}>
              ×
            </button>

            <div style={{
              width: 44, height: 44, borderRadius: 12, background: iconeSelecionada.bg, color: iconeSelecionada.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 16,
            }}>
              {iconeSelecionada.icon}
            </div>

            <p style={{ fontSize: 14, color: '#1a1a2e', lineHeight: 1.6, margin: '0 0 10px' }}>
              {selecionada.descricao}
            </p>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 24px' }}>
              {new Date(selecionada.data).toLocaleString('pt-PT')}
            </p>

            <div className="d-flex justify-content-between gap-2">
              <button onClick={() => eliminarNotificacao(selecionada.id)} className="btn btn-outline-danger btn-sm">
                Eliminar
              </button>
              <div className="d-flex gap-2">
                {selecionada.lida && (
                  <button onClick={() => marcarNaoLida(selecionada.id)} className="btn btn-outline-primary btn-sm">
                    Marcar como não lida
                  </button>
                )}
                <button onClick={() => setSelecionada(null)} className="btn btn-primary btn-sm">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}