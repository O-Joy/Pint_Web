// src/views/serviceline/Validacoes.jsx
// Página de Validações do Service Line Leader.
// Lista candidaturas "Em Validação SLL" (estado 3) da sua Service Line.
// Permite: ver detalhe (histórico + evidências + requisitos), Validar, Rejeitar e Devolver.
// Inclui filtros (pesquisa/nível/tabs), exportação Excel/PDF, modais de confirmação e toasts.

import { useState, useEffect } from 'react'
import LayoutSL from './components/LayoutSL'
import api from '../../services/api'
import Footer from '../../components/Footer'
import { FiSearch, FiEye } from 'react-icons/fi'
import { FaReply, FaPaperPlane } from 'react-icons/fa'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Validacoes() {
  // ── Estado da lista ──
  const [candidaturas, setCandidaturas] = useState([])
  const [loading, setLoading] = useState(true)

  // ── Filtros ──
  const [filtro, setFiltro] = useState('')
  const [filtroNivel, setFiltroNivel] = useState('todos')
  const [tab, setTab] = useState('todos') // todos | aprovados | rejeitados

  // ── Detalhe (modal lateral / central) ──
  const [selecionada, setSelecionada] = useState(null)
  const [historico, setHistorico] = useState([])
  const [evidencias, setEvidencias] = useState([])
  const [comentario, setComentario] = useState('')

  // ── Modal de confirmação: { tipo: 'validar'|'rejeitar'|'devolver' } ──
  const [confirmacao, setConfirmacao] = useState(null)

  // ── Toast de feedback ──
  const [toast, setToast] = useState(null)

  // Carrega candidaturas ao montar
  useEffect(() => {
    carregar()
  }, [])

  function carregar() {
    setLoading(true)
    // relCandidaturas devolve TODAS as candidaturas da SL (pendentes, aprovadas e rejeitadas),
    // o que permite às tabs TODOS/APROVADOS/REJEITADOS filtrarem de facto.
    api.get('/sl/relatorios/candidaturas')
      .then(res => setCandidaturas(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error('[Validacoes] ERRO:', err.response?.status, err.response?.data || err.message))
      .finally(() => setLoading(false))
  }

  // Mostra toast por 3 segundos
  function mostrarToast(mensagem, tipo = 'sucesso') {
    setToast({ mensagem, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  // Abre o detalhe de uma candidatura e carrega histórico + evidências
  function abrirDetalhe(c) {
    setSelecionada(c)
    setComentario('')
    api.get(`/sl/candidatura/${c.numCandidatura}/historico`)
      .then(res => setHistorico(Array.isArray(res.data) ? res.data : []))
      .catch(() => setHistorico([]))
    api.get(`/sl/candidatura/${c.numCandidatura}/evidencias`)
      .then(res => setEvidencias(Array.isArray(res.data) ? res.data : []))
      .catch(() => setEvidencias([]))
  }

  function fecharDetalhe() {
    setSelecionada(null)
    setHistorico([])
    setEvidencias([])
    setComentario('')
  }

  // ── Ações ──
  function validar() {
    api.put(`/sl/candidatura/${selecionada.numCandidatura}/aprovar`)
      .then(() => {
        mostrarToast(`Candidatura ${selecionada.numCandidatura} validada com sucesso!`)
        fecharDetalhe(); setConfirmacao(null); carregar()
      })
      .catch(() => mostrarToast('Erro ao validar candidatura.', 'erro'))
  }

  function rejeitar() {
    api.put(`/sl/candidatura/${selecionada.numCandidatura}/rejeitar`, { comentario })
      .then(() => {
        mostrarToast(`Candidatura ${selecionada.numCandidatura} rejeitada com sucesso!`)
        fecharDetalhe(); setConfirmacao(null); carregar()
      })
      .catch(() => mostrarToast('Erro ao rejeitar candidatura.', 'erro'))
  }

  function devolver() {
    api.put(`/sl/candidatura/${selecionada.numCandidatura}/devolver`, { comentario })
      .then(() => {
        mostrarToast(`Candidatura ${selecionada.numCandidatura} devolvida ao consultor!`)
        fecharDetalhe(); setConfirmacao(null); carregar()
      })
      .catch(() => mostrarToast('Erro ao devolver candidatura.', 'erro'))
  }

  // ── Filtragem ──
  const niveis = [...new Set(candidaturas.map(c => c.nomeNivel).filter(Boolean))]

  // Contagem de pendentes (Em Validação SLL) — independente do tab selecionado, para o subtítulo
  const pendentesCount = candidaturas.filter(c => c.idEstadoAtual === 3).length

  const filtradas = candidaturas.filter(c => {
    const termo = filtro.toLowerCase()
    const matchTermo =
      c.nomeConsultor?.toLowerCase().includes(termo) ||
      c.nomeBadge?.toLowerCase().includes(termo) ||
      String(c.numCandidatura).includes(termo)
    const matchNivel = filtroNivel === 'todos' || c.nomeNivel === filtroNivel
    const matchTab =
      tab === 'todos' ? true :
      tab === 'aprovados' ? c.idEstadoAtual === 5 :
      tab === 'rejeitados' ? c.idEstadoAtual === 6 : true
    return matchTermo && matchNivel && matchTab
  })

  // Horas decorridas desde a submissão (só faz sentido para candidaturas ainda pendentes)
  function horasDecorridas(dataCriacao) {
    const horas = Math.round((Date.now() - new Date(dataCriacao).getTime()) / (1000 * 60 * 60))
    return horas
  }

  // ── Exportações ──
  function exportarExcel() {
    const dados = filtradas.map(c => ({
      'ID Candidatura': c.numCandidatura,
      'Consultor': c.nomeConsultor,
      'Badge': c.nomeBadge,
      'Nível': c.nomeNivel,
      'Data Submissão': new Date(c.dataCriacao).toLocaleDateString('pt-PT'),
      'Estado': c.nomeEstado,
    }))
    const ws = XLSX.utils.json_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Validações')
    XLSX.writeFile(wb, 'validacoes.xlsx')
  }

  function exportarPDF() {
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text('Validações - Service Line', 14, 16)
    autoTable(doc, {
      startY: 22,
      head: [['ID', 'Consultor', 'Badge', 'Nível', 'Data', 'Estado']],
      body: filtradas.map(c => [
        c.numCandidatura, c.nomeConsultor, c.nomeBadge, c.nomeNivel,
        new Date(c.dataCriacao).toLocaleDateString('pt-PT'), c.nomeEstado,
      ]),
      headStyles: { fillColor: [57, 99, 156] },
    })
    doc.save('validacoes.pdf')
  }

  return (
    <LayoutSL>
      <div style={{ fontFamily: 'Poppins, sans-serif' }}>

        {/* ── Cabeçalho ── */}
        <div className="d-flex justify-content-between align-items-start mb-1">
          <div>
            <h2 className="fw-bold mb-0 text-primary" style={{ fontSize: 22 }}>Validações</h2>
            <p className="fw-semibold mb-0 text-primary" style={{ fontSize: 14, marginTop: 4 }}>Pedidos Pendentes</p>
            <p className="text-secondary mb-0" style={{ fontSize: 12, marginTop: 2 }}>{pendentesCount} PEDIDOS</p>
          </div>
          <div className="d-flex gap-2">
            <button onClick={exportarExcel} className="btn btn-outline-primary btn-sm">Exportar Excel</button>
            <button onClick={exportarPDF} className="btn btn-outline-primary btn-sm">Exportar PDF</button>
          </div>
        </div>

        {/* ── Filtros ── */}
        <div className="d-flex align-items-center gap-2 flex-wrap" style={{ margin: '16px 0' }}>
          <div className="input-group" style={{ flex: 1, minWidth: 240 }}>
            <span className="input-group-text"><FiSearch className="text-secondary" /></span>
            <input
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              placeholder="Pesquisar Consultor, Badge, Requisito..."
              className="form-control"
            />
          </div>

          <select value={filtroNivel} onChange={e => setFiltroNivel(e.target.value)} className="form-select" style={{ width: 'auto' }}>
            <option value="todos">Nível - Todos</option>
            {niveis.map((n, i) => <option key={i} value={n}>{n}</option>)}
          </select>

          <ul className="nav nav-pills gap-1" style={{ background: '#f3f4f6', borderRadius: 8, padding: 3 }}>
            {[
              { id: 'todos', label: 'TODOS' },
              { id: 'aprovados', label: 'APROVADOS' },
              { id: 'rejeitados', label: 'REJEITADOS' },
            ].map(t => (
              <li className="nav-item" key={t.id}>
                <button onClick={() => setTab(t.id)} className={`nav-link small ${tab === t.id ? 'active' : ''}`}>
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Tabela ── */}
        <div className="card">
          <div className="table-responsive">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>A carregar...</div>
          ) : filtradas.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
              {tab === 'todos' ? 'Não há candidaturas para mostrar.' : `Não há candidaturas ${tab} de momento.`}
            </div>
          ) : (
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  {['ID Candidatura', 'Consultor', 'Badge', 'Nível', 'Data Submissão', 'SLA', 'Estado', 'Ações'].map((h, i) => (
                    <th key={i} className="text-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.map((c, i) => {
                  const pendente = c.idEstadoAtual === 3
                  const acionavel = c.idEstadoAtual === 3 || c.idEstadoAtual === 4
                  const horas = pendente ? horasDecorridas(c.dataCriacao) : null
                  const corSla = horas === null ? '#9ca3af' : horas <= 48 ? '#06A120' : horas <= 72 ? '#f59e0b' : '#AE0003'
                  return (
                    <tr key={c.numCandidatura}>
                      <td className="text-secondary">{c.numCandidatura}</td>
                      <td className="fw-medium" style={{ color: '#1a1a2e' }}>{c.nomeConsultor}</td>
                      <td className="text-primary">{c.nomeBadge}</td>
                      <td className="text-secondary">{c.nomeNivel}</td>
                      <td className="text-secondary">{new Date(c.dataCriacao).toLocaleDateString('pt-PT')}</td>
                      <td>
                        <span style={{ color: corSla, fontWeight: 600 }}>{horas === null ? '—' : `${horas}h ●`}</span>
                      </td>
                      <td>
                        <span style={{
                          background: corEstado[c.nomeEstado]?.bg ?? '#f3f4f6',
                          color: corEstado[c.nomeEstado]?.color ?? '#6b7280',
                          borderRadius: 12, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                        }}>
                          {c.nomeEstado}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <FiEye title="Ver detalhe" onClick={() => abrirDetalhe(c)} style={{ cursor: 'pointer', color: '#39639C', fontSize: 16 }} />
                          {acionavel && (
                            <>
                              <FaReply title="Devolver" onClick={() => { abrirDetalhe(c); setTimeout(() => setConfirmacao({ tipo: 'devolver' }), 50) }} style={{ cursor: 'pointer', color: '#f59e0b', fontSize: 15 }} />
                              <FaPaperPlane title="Validar" onClick={() => { abrirDetalhe(c); setTimeout(() => setConfirmacao({ tipo: 'validar' }), 50) }} style={{ cursor: 'pointer', color: '#39639C', fontSize: 15 }} />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          </div>
        </div>

        <Footer />
      </div>

      {selecionada && !confirmacao && (
        <Overlay onClose={fecharDetalhe}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 560, maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={fecharDetalhe} style={fecharBtn}>×</button>
            <h3 style={{ color: '#1a1a2e', fontWeight: 700, fontSize: 18, margin: '0 0 18px' }}>
              Nº Candidatura: {selecionada.numCandidatura}
            </h3>

            {/* Info consultor + badge */}
            <div className="row g-3" style={{ marginBottom: 18 }}>
              <div className="col-6">
              <div style={infoBox}>
                <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>Consultor:</div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{selecionada.nomeConsultor}</div>
              </div>
              </div>
              <div className="col-6">
              <div style={infoBox}>
                <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>Badge + Nível</div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#39639C' }}>{selecionada.nomeBadge} {selecionada.nomeNivel}</div>
              </div>
              </div>
            </div>

            {/* Histórico */}
            <p style={subTitulo}>Histórico:</p>
            {historico.length === 0 ? (
              <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>Sem histórico disponível.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
                {historico.map((h, i) => (
                  <li key={i} style={{ fontSize: 12, color: '#4b5563', marginBottom: 6, paddingLeft: 14, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: '#39639C' }}>•</span>
                    <strong>{h.nomeEstado}</strong> — {new Date(h.dataAlteracao).toLocaleDateString('pt-PT')}
                    {h.comentario && <span style={{ fontStyle: 'italic' }}> — "{h.comentario}"</span>}
                  </li>
                ))}
              </ul>
            )}

            {/* Requisitos / Evidências */}
            <p style={subTitulo}>Requisitos:</p>
            {evidencias.length === 0 ? (
              <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>Nenhuma evidência submetida.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {evidencias.map((e, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px' }}>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{e.nomeRequisito}</span>
                    <a href={`http://localhost:3001/${e.pathFicheiro}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#39639C', textDecoration: 'underline' }}>
                      Ver evidência
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* Feedback */}
            <p style={subTitulo}>Feedback:</p>
            <textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              placeholder="Adicione um comentário..."
              className="form-control mb-3"
              style={{ minHeight: 70, resize: 'vertical', boxShadow: 'none', border: '1px solid #d1d5db' }}
            />

            {/* Botões de ação */}
            <div className="d-flex justify-content-end gap-2">
              <button onClick={() => setConfirmacao({ tipo: 'devolver' })} className="btn btn-outline-primary btn-sm">Devolver</button>
              <button onClick={() => setConfirmacao({ tipo: 'rejeitar' })} className="btn btn-danger btn-sm">Rejeitar</button>
              <button onClick={() => setConfirmacao({ tipo: 'validar' })} className="btn btn-success btn-sm">Validar</button>
            </div>
          </div>
        </Overlay>
      )}

      {confirmacao && (
        <Overlay onClose={() => setConfirmacao(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420, position: 'relative' }}>
            <button onClick={() => setConfirmacao(null)} style={fecharBtn}>×</button>
            <h3 style={{ fontWeight: 700, fontSize: 17, margin: '0 0 8px' }}>Tem a certeza?</h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 22px' }}>
              {confirmacao.tipo === 'validar'  && `Esta ação não pode ser revertida. A candidatura ${selecionada?.numCandidatura} será aceite e será encaminhada para o consultor.`}
              {confirmacao.tipo === 'rejeitar' && `Esta ação não pode ser revertida. A candidatura ${selecionada?.numCandidatura} será rejeitada e o consultor será notificado.`}
              {confirmacao.tipo === 'devolver' && `Esta ação não pode ser revertida. A candidatura ${selecionada?.numCandidatura} será devolvida para o consultor.`}
            </p>
            <div className="d-flex justify-content-end gap-2">
              <button onClick={() => setConfirmacao(null)} className="btn btn-light btn-sm">Cancelar</button>
              {confirmacao.tipo === 'validar'  && <button onClick={validar} className="btn btn-success btn-sm">Validar</button>}
              {confirmacao.tipo === 'rejeitar' && <button onClick={rejeitar} className="btn btn-danger btn-sm">Rejeitar</button>}
              {confirmacao.tipo === 'devolver' && <button onClick={devolver} className="btn btn-warning btn-sm text-white">Devolver</button>}
            </div>
          </div>
        </Overlay>
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: '#fff', borderRadius: 10, padding: '12px 18px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 10,
          borderLeft: `4px solid ${toast.tipo === 'sucesso' ? '#06A120' : '#AE0003'}`,
        }}>
          <span style={{ color: toast.tipo === 'sucesso' ? '#06A120' : '#AE0003', fontSize: 18 }}>
            {toast.tipo === 'sucesso' ? '✓' : '✕'}
          </span>
          <span style={{ fontSize: 13, color: '#1a1a2e' }}>{toast.mensagem}</span>
        </div>
      )}
    </LayoutSL>
  )
}

// ── Componente overlay reutilizável ──
function Overlay({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998 }}
    >
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  )
}

// ── Estilos reutilizados ──
const infoBox = { background: '#f9fafb', borderRadius: 8, padding: '10px 12px' }
const subTitulo = { fontSize: 12, fontWeight: 600, color: '#374151', margin: '0 0 8px' }
const fecharBtn = { position: 'absolute', top: 16, right: 18, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }

const corEstado = {
  'Aprovada':           { bg: '#dcfce7', color: '#16a34a' },
  'Rejeitada':          { bg: '#fee2e2', color: '#dc2626' },
  'Em Validação SLL':   { bg: '#dbeafe', color: '#1d4ed8' },
  'Em Validação TM':    { bg: '#e0e7ff', color: '#4338ca' },
  'Em Retificação SLL': { bg: '#fef3c7', color: '#d97706' },
  'Submetido':          { bg: '#f3f4f6', color: '#6b7280' },
}