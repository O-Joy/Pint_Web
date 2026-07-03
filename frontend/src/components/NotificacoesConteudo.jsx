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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ color: '#39639C', fontWeight: 700, fontSize: 22, margin: 0 }}>Notificações</h2>
          <p style={{ color: '#9ca3af', fontSize: 12, margin: '4px 0 0' }}>
            {naoLidasCount > 0 ? `${naoLidasCount} por ler` : 'Está tudo em dia'}
          </p>
        </div>
        {naoLidasCount > 0 && (
          <button onClick={marcarTodasLidas} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#39639C',
            border: '1px solid #39639C', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            <MdDoneAll /> Marcar todas como lidas
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 10, padding: 4, width: 'fit-content', margin: '16px 0 20px' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 12.5, fontWeight: 600,
            cursor: 'pointer', background: tab === t.id ? '#fff' : 'transparent',
            color: tab === t.id ? '#39639C' : '#9ca3af',
            boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}>
            {t.label}{t.id === 'naoLidas' && naoLidasCount > 0 ? ` (${naoLidasCount})` : ''}
          </button>
        ))}
      </div>

      {/* ── Lista ── */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>A carregar...</p>
      ) : filtradas.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, padding: 50, textAlign: 'center', boxShadow: '0 5px 40px rgba(237,237,237,1)' }}>
          <FiBell style={{ fontSize: 28, color: '#d1d5db', marginBottom: 10 }} />
          <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>
            {tab === 'naoLidas' ? 'Não há notificações por ler.' : 'Ainda não tens notificações.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {ordemGrupos.filter(g => grupos[g]?.length).map(g => (
            <div key={g}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 10px' }}>{g}</p>
              <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 5px 40px rgba(237,237,237,1)', overflow: 'hidden' }}>
                {grupos[g].map((n, i) => {
                  const iconeInfo = ICONE_POR_TIPO[n.tipoNotificacao] || ICONE_DEFEITO
                  return (
                    <div
                      key={n.id}
                      onClick={() => abrirNotificacao(n)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px', cursor: 'pointer',
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

                      {!n.lida && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#39639C', flexShrink: 0, marginTop: 6 }} />}
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {selecionada.lida && (
                <button onClick={() => marcarNaoLida(selecionada.id)} style={{
                  background: '#fff', color: '#39639C', border: '1px solid #39639C', borderRadius: 8,
                  padding: '8px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                }}>
                  Marcar como não lida
                </button>
              )}
              <button onClick={() => setSelecionada(null)} style={{
                background: '#39639C', color: '#fff', border: 'none', borderRadius: 8,
                padding: '8px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
