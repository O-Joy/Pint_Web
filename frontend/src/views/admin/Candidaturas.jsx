import { useState, useEffect } from 'react'
import LayoutAdmin from './components/LayoutAdmin'
import api, { FILES_URL } from '../../services/api'
import { FiSearch, FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const corEstado = {
  'Aprovada':           { bg: '#dcfce7', color: '#16a34a' },
  'Rejeitada':          { bg: '#fee2e2', color: '#dc2626' },
  'Em Validação SLL':   { bg: '#dbeafe', color: '#1d4ed8' },
  'Em Validação TM':    { bg: '#e0e7ff', color: '#4338ca' },
  'Em Retificação SLL': { bg: '#fef3c7', color: '#d97706' },
  'Em Retificação TM':  { bg: '#fef3c7', color: '#d97706' },
  'Submetido':          { bg: '#f3f4f6', color: '#6b7280' },
}

function Overlay({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998 }}>
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  )
}

const infoBox   = { background: '#f9fafb', borderRadius: 8, padding: '10px 12px' }
const subTit    = { fontSize: 12, fontWeight: 600, color: '#374151', margin: '0 0 8px' }
const fecharBtn = { position: 'absolute', top: 16, right: 18, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }

export default function AdminCandidaturas() {
  const [candidaturas, setCandidaturas] = useState([])
  const [loading, setLoading]           = useState(true)
  const [filtro, setFiltro]             = useState('')
  const [filtroNivel, setFiltroNivel]   = useState('todos')
  const [tab, setTab]                   = useState('todos')
  const [selecionada, setSelecionada]   = useState(null)
  const [historico, setHistorico]       = useState([])
  const [evidencias, setEvidencias]     = useState([])
  const [comentario, setComentario]     = useState('')
  const [confirmacao, setConfirmacao]   = useState(null)
  const [toast, setToast]               = useState(null)

  useEffect(() => { carregar() }, [])

  function carregar() {
    setLoading(true)
    api.get('/admin/candidaturas')
      .then(res => setCandidaturas(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error('[AdminCandidaturas]', err))
      .finally(() => setLoading(false))
  }

  function mostrarToast(mensagem, tipo = 'sucesso') {
    setToast({ mensagem, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  function abrirDetalhe(c) {
    setSelecionada(c)
    setComentario('')
    api.get(`/admin/candidaturas/${c.numCandidatura}`)
      .then(res => {
        setHistorico(res.data.historico || [])
        setEvidencias(res.data.evidencias || [])
      })
      .catch(() => { setHistorico([]); setEvidencias([]) })
  }

  function fecharDetalhe() {
    setSelecionada(null); setHistorico([]); setEvidencias([]); setComentario('')
  }

  function validar() {
    api.put(`/admin/candidaturas/${selecionada.numCandidatura}/estado`, {
      idEstado: selecionada.idEstadoAtual === 1 ? 3 : 5, comentario,
    })
      .then(() => { mostrarToast(`Candidatura ${selecionada.numCandidatura} validada!`); fecharDetalhe(); setConfirmacao(null); carregar() })
      .catch(() => mostrarToast('Erro ao validar.', 'erro'))
  }

  function rejeitar() {
    api.put(`/admin/candidaturas/${selecionada.numCandidatura}/estado`, { idEstado: 6, comentario })
      .then(() => { mostrarToast(`Candidatura ${selecionada.numCandidatura} rejeitada.`); fecharDetalhe(); setConfirmacao(null); carregar() })
      .catch(() => mostrarToast('Erro ao rejeitar.', 'erro'))
  }

  function devolver() {
    api.put(`/admin/candidaturas/${selecionada.numCandidatura}/estado`, {
      idEstado: selecionada.idEstadoAtual === 1 ? 2 : 4, comentario,
    })
      .then(() => { mostrarToast(`Candidatura ${selecionada.numCandidatura} devolvida.`); fecharDetalhe(); setConfirmacao(null); carregar() })
      .catch(() => mostrarToast('Erro ao devolver.', 'erro'))
  }

  const niveis    = [...new Set(candidaturas.map(c => c.nomeBadge).filter(Boolean))]
  const pendentes = candidaturas.filter(c => [1, 3].includes(c.idEstadoAtual)).length

  const filtradas = candidaturas.filter(c => {
    const termo      = filtro.toLowerCase()
    const matchTermo = c.nomeCandidato?.toLowerCase().includes(termo) || c.nomeBadge?.toLowerCase().includes(termo) || String(c.numCandidatura).includes(termo)
    const matchNivel = filtroNivel === 'todos' || c.nomeBadge === filtroNivel
    const matchTab   = tab === 'todos' ? true : tab === 'aprovados' ? c.idEstadoAtual === 5 : tab === 'rejeitados' ? c.idEstadoAtual === 6 : true
    return matchTermo && matchNivel && matchTab
  })

  function horasDecorridas(data) {
    return Math.round((Date.now() - new Date(data).getTime()) / 3600000)
  }

  function exportarExcel() {
    const dados = filtradas.map(c => ({ 'ID': c.numCandidatura, 'Consultor': c.nomeCandidato, 'Badge': c.nomeBadge, 'Data': new Date(c.dataCriacao).toLocaleDateString('pt-PT'), 'Estado': c.nomeEstado }))
    const ws = XLSX.utils.json_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Candidaturas')
    XLSX.writeFile(wb, 'candidaturas.xlsx')
  }

  function exportarPDF() {
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text('Candidaturas - Administrador', 14, 16)
    autoTable(doc, {
      startY: 22,
      head: [['ID', 'Consultor', 'Badge', 'Data', 'Estado']],
      body: filtradas.map(c => [c.numCandidatura, c.nomeCandidato, c.nomeBadge, new Date(c.dataCriacao).toLocaleDateString('pt-PT'), c.nomeEstado]),
      headStyles: { fillColor: [57, 99, 156] },
    })
    doc.save('candidaturas.pdf')
  }

  const acionavel = c => [1, 3].includes(c.idEstadoAtual)

  return (
    <LayoutAdmin>
      <div style={{ fontFamily: 'Poppins, sans-serif' }}>

        {/* Cabeçalho */}
        <div className="d-flex justify-content-between align-items-start mb-1">
          <div>
            <h2 className="fw-bold mb-0 text-primary" style={{ fontSize: 22 }}>Candidaturas</h2>
            <p className="fw-semibold mb-0 text-primary" style={{ fontSize: 14, marginTop: 4 }}>Todos os Pedidos</p>
            <p className="text-secondary mb-0" style={{ fontSize: 12, marginTop: 2 }}>{pendentes} PEDIDOS PENDENTES</p>
          </div>
          <div className="d-flex gap-2">
            <button onClick={exportarExcel} className="btn btn-outline-primary btn-sm">Exportar Excel</button>
            <button onClick={exportarPDF}   className="btn btn-outline-primary btn-sm">Exportar PDF</button>
          </div>
        </div>

        {/* Filtros */}
        <div className="d-flex align-items-center gap-2 flex-wrap" style={{ margin: '16px 0' }}>
          <div className="input-group" style={{ flex: 1, minWidth: 240 }}>
            <span className="input-group-text"><FiSearch className="text-secondary" /></span>
            <input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Pesquisar Consultor, Badge, Requisito..." className="form-control" />
          </div>
          <select value={filtroNivel} onChange={e => setFiltroNivel(e.target.value)} className="form-select" style={{ width: 'auto' }}>
            <option value="todos">Nível - Todos</option>
            {niveis.map((n, i) => <option key={i} value={n}>{n}</option>)}
          </select>
          <ul className="nav nav-pills gap-1" style={{ background: '#f3f4f6', borderRadius: 8, padding: 3 }}>
            {[{ id: 'todos', label: 'TODOS' }, { id: 'aprovados', label: 'APROVADOS' }, { id: 'rejeitados', label: 'REJEITADOS' }].map(t => (
              <li className="nav-item" key={t.id}>
                <button onClick={() => setTab(t.id)} className={`nav-link small ${tab === t.id ? 'active' : ''}`}>{t.label}</button>
              </li>
            ))}
          </ul>
        </div>

        {/* Tabela */}
        <div className="card">
          <div className="table-responsive">
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>A carregar...</div>
            ) : filtradas.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>Não há candidaturas para mostrar.</div>
            ) : (
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    {['ID Candidatura', 'Consultor', 'Badge', 'Data Submissão', 'SLA', 'Estado', 'Ações'].map((h, i) => (
                      <th key={i} className="text-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map(c => {
                    const pendente = [1, 3].includes(c.idEstadoAtual)
                    const horas    = pendente ? horasDecorridas(c.dataCriacao) : null
                    const corSla   = horas === null ? '#9ca3af' : horas <= 48 ? '#06A120' : horas <= 72 ? '#f59e0b' : '#AE0003'
                    return (
                      <tr key={c.numCandidatura}>
                        <td className="text-secondary">{c.numCandidatura}</td>
                        <td className="fw-medium" style={{ color: '#1a1a2e' }}>{c.nomeCandidato}</td>
                        <td className="text-primary">{c.nomeBadge}</td>
                        <td className="text-secondary">{new Date(c.dataCriacao).toLocaleDateString('pt-PT')}</td>
                        <td><span style={{ color: corSla, fontWeight: 600 }}>{horas === null ? '—' : `${horas}h ●`}</span></td>
                        <td>
                          <span style={{ background: corEstado[c.nomeEstado]?.bg ?? '#f3f4f6', color: corEstado[c.nomeEstado]?.color ?? '#6b7280', borderRadius: 12, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {c.nomeEstado}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <FiEye onClick={() => abrirDetalhe(c)} style={{ cursor: 'pointer', color: '#6b7280', fontSize: 16 }} title="Ver detalhe" />
                            {acionavel(c) && (<>
                              <FiEdit2 onClick={() => { abrirDetalhe(c); setTimeout(() => setConfirmacao({ tipo: 'devolver' }), 50) }} style={{ cursor: 'pointer', color: '#39639C', fontSize: 15 }} title="Devolver" />
                              <FiTrash2 onClick={() => { abrirDetalhe(c); setTimeout(() => setConfirmacao({ tipo: 'rejeitar' }), 50) }} style={{ cursor: 'pointer', color: '#dc3545', fontSize: 15 }} title="Rejeitar" />
                            </>)}
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
      </div>

      {/* Modal detalhe */}
      {selecionada && !confirmacao && (
        <Overlay onClose={fecharDetalhe}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 560, maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={fecharDetalhe} style={fecharBtn}>×</button>
            <h3 style={{ color: '#1a1a2e', fontWeight: 700, fontSize: 18, margin: '0 0 18px' }}>
              Nº Candidatura: {selecionada.numCandidatura}
            </h3>

            <div className="row g-3" style={{ marginBottom: 18 }}>
              <div className="col-6">
                <div style={infoBox}>
                  <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>Consultor:</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{selecionada.nomeCandidato}</div>
                </div>
              </div>
              <div className="col-6">
                <div style={infoBox}>
                  <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>Badge</div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#39639C' }}>{selecionada.nomeBadge}</div>
                </div>
              </div>
            </div>

            <p style={subTit}>Histórico:</p>
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

            <p style={subTit}>Requisitos:</p>
            {evidencias.length === 0 ? (
              <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>Nenhuma evidência submetida.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {evidencias.map((e, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px' }}>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>Requisito #{e.idRequisito}</span>
                    {e.pathFicheiro && (
                      <a href={`${FILES_URL}${e.pathFicheiro}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#39639C', textDecoration: 'underline' }}>
                        Ver evidência
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p style={subTit}>Feedback:</p>
            <textarea value={comentario} onChange={e => setComentario(e.target.value)} placeholder="Adicione um comentário..." className="form-control mb-3"
              style={{ minHeight: 70, resize: 'vertical', boxShadow: 'none', border: '1px solid #d1d5db' }} />

            {acionavel(selecionada) && (
              <div className="d-flex justify-content-end gap-2">
                <button onClick={() => setConfirmacao({ tipo: 'devolver' })} className="btn btn-outline-primary btn-sm">Devolver</button>
                <button onClick={() => setConfirmacao({ tipo: 'rejeitar' })} className="btn btn-danger btn-sm">Rejeitar</button>
                <button onClick={() => setConfirmacao({ tipo: 'validar' })}  className="btn btn-success btn-sm">Validar</button>
              </div>
            )}
          </div>
        </Overlay>
      )}

      {/* Modal confirmação */}
      {confirmacao && (
        <Overlay onClose={() => setConfirmacao(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420, position: 'relative' }}>
            <button onClick={() => setConfirmacao(null)} style={fecharBtn}>×</button>
            <h3 style={{ fontWeight: 700, fontSize: 17, margin: '0 0 8px' }}>Tem a certeza?</h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 22px' }}>
              {confirmacao.tipo === 'validar'  && `A candidatura ${selecionada?.numCandidatura} será avançada no fluxo.`}
              {confirmacao.tipo === 'rejeitar' && `A candidatura ${selecionada?.numCandidatura} será rejeitada definitivamente.`}
              {confirmacao.tipo === 'devolver' && `A candidatura ${selecionada?.numCandidatura} será devolvida para retificação.`}
            </p>
            <div className="d-flex justify-content-end gap-2">
              <button onClick={() => setConfirmacao(null)} className="btn btn-light btn-sm">Cancelar</button>
              {confirmacao.tipo === 'validar'  && <button onClick={validar}  className="btn btn-success btn-sm">Validar</button>}
              {confirmacao.tipo === 'rejeitar' && <button onClick={rejeitar} className="btn btn-danger btn-sm">Rejeitar</button>}
              {confirmacao.tipo === 'devolver' && <button onClick={devolver} className="btn btn-warning btn-sm text-white">Devolver</button>}
            </div>
          </div>
        </Overlay>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#fff', borderRadius: 10, padding: '12px 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `4px solid ${toast.tipo === 'sucesso' ? '#06A120' : '#AE0003'}` }}>
          <span style={{ color: toast.tipo === 'sucesso' ? '#06A120' : '#AE0003', fontSize: 18 }}>{toast.tipo === 'sucesso' ? '✓' : '✕'}</span>
          <span style={{ fontSize: 13, color: '#1a1a2e' }}>{toast.mensagem}</span>
        </div>
      )}
    </LayoutAdmin>
  )
}