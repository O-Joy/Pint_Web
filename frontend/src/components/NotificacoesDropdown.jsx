import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { FILES_URL } from '../services/api'
import { FiX, FiCheck, FiCircle } from 'react-icons/fi'
import { getPerfil } from '../utils/auth'

const ROTA_NOTIFICACOES_POR_PERFIL = {
  consultor: '/consultor/notificacoes',
  talent_manager: '/talent/notificacoes',
  sl_leader: '/serviceline/notificacoes',
  administrador: '/admin/notificacoes',
}

function urlFotoCompleto(urlFoto) {
  if (!urlFoto) return null
  return urlFoto.startsWith('http') ? urlFoto : `${FILES_URL}/{urlFoto}`
}

function tempoOuData(data) {
  const d = new Date(data)
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  if (d >= hoje) return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })
}

export default function NotificacoesDropdown({ onClose }) {
  const navigate = useNavigate()
  const ref = useRef(null)
  const [notificacoes, setNotificacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [apenasNaoLidas, setApenasNaoLidas] = useState(false)

  useEffect(() => {
    carregar()
    function handleClickFora(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, []) // eslint-disable-line

  function carregar() {
    setLoading(true)
    api.get('/notificacoes')
      .then(res => setNotificacoes(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  function toggleLida(n) {
    const novoEstado = !n.lida
    setNotificacoes(prev => prev.map(x => x.id === n.id ? { ...x, lida: novoEstado } : x))
    api.put(`/notificacoes/${n.id}/${novoEstado ? 'lida' : 'nao-lida'}`).catch(() => carregar())
  }

  const listadas = apenasNaoLidas ? notificacoes.filter(n => !n.lida) : notificacoes

  return (
    <div ref={ref} style={{
      position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 420, maxWidth: '92vw',
      background: '#fff', borderRadius: 16, boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
      zIndex: 500, overflow: 'hidden', fontFamily: 'Poppins, sans-serif',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', borderBottom: '1px solid #f0f0f0' }}>
        <h4 style={{ color: '#39639C', fontWeight: 700, fontSize: 16, margin: 0 }}>Centro De Notificações</h4>
        <FiX role="button" onClick={onClose} color="#9ca3af" style={{ cursor: 'pointer' }} />
      </div>

      <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 8, padding: 3, margin: '12px 18px' }}>
        {[{ id: false, label: 'Todas' }, { id: true, label: 'Não Lidas' }].map(op => (
          <button
            key={String(op.id)}
            onClick={() => setApenasNaoLidas(op.id)}
            style={{
              flex: 1, border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
              background: apenasNaoLidas === op.id ? '#fff' : 'transparent',
              color: apenasNaoLidas === op.id ? '#39639C' : '#9ca3af',
              boxShadow: apenasNaoLidas === op.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {op.label}
          </button>
        ))}
      </div>

      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#aaa', padding: 30, fontSize: 13 }}>A carregar...</p>
        ) : listadas.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#aaa', padding: 30, fontSize: 13 }}>
            {apenasNaoLidas ? 'Não há notificações por ler.' : 'Ainda não tens notificações.'}
          </p>
        ) : listadas.map((n, i) => (
          <div key={n.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px',
            borderBottom: i !== listadas.length - 1 ? '1px solid #f5f5f5' : 'none',
            background: n.lida ? '#fff' : '#f8fbff',
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: n.lida ? '#9ca3af' : '#39639C', width: 40, flexShrink: 0, marginTop: 3 }}>
              {n.lida ? 'Vista' : 'Nova'}
            </span>

            {n.lida ? (
              <FiCircle
                role="button"
                title="Marcar como não lida"
                onClick={() => toggleLida(n)}
                color="#9ca3af"
                style={{ cursor: 'pointer', flexShrink: 0, marginTop: 3 }}
              />
            ) : (
              <FiCheck
                role="button"
                title="Marcar como lida"
                onClick={() => toggleLida(n)}
                color="#39639C"
                style={{ cursor: 'pointer', flexShrink: 0, marginTop: 3 }}
              />
            )}

            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#e2e8f0', flexShrink: 0, overflow: 'hidden' }}>
              {n.remetenteFoto && (
                <img src={urlFotoCompleto(n.remetenteFoto)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#39639C' }}>{n.remetenteNome || 'Sistema'}</span>
                <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{tempoOuData(n.data)}</span>
              </div>
              <p style={{ fontSize: 12, color: '#4b5563', margin: '2px 0 0', lineHeight: 1.4 }}>{n.descricao}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '10px 18px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
        <button
          onClick={() => { onClose(); navigate(ROTA_NOTIFICACOES_POR_PERFIL[getPerfil()] || '/consultor/notificacoes') }}
          style={{ background: 'none', border: 'none', color: '#39639C', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          Ver todas as notificações
        </button>
      </div>
    </div>
  )
}