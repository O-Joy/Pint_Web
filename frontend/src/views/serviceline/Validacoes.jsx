// src/views/serviceline/Validacoes.jsx
// Página de Validações do Service Line Leader.
// Lista candidaturas "Em Validação SLL" (estado 3) da sua Service Line.
// Permite: ver detalhe (histórico + evidências + requisitos), Validar, Rejeitar e Devolver.
// Inclui filtros (pesquisa/nível/tabs), exportação Excel/PDF, modais de confirmação e toasts.

import { useState, useEffect } from 'react'
import LayoutSL from './components/LayoutSL'
import api from '../../services/api'
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
    api.get('/sl/candidaturas-em-validacao')
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

  const filtradas = candidaturas.filter(c => {
    const termo = filtro.toLowerCase()
    const matchTermo =
      c.nomeConsultor?.toLowerCase().includes(termo) ||
      c.nomeBadge?.toLowerCase().includes(termo) ||
      String(c.numCandidatura).includes(termo)
    const matchNivel = filtroNivel === 'todos' || c.nomeNivel === filtroNivel
    return matchTermo && matchNivel
  })

  // ── Exportações ──
  function exportarExcel() {
    const dados = filtradas.map(c => ({
      'ID Candidatura': c.numCandidatura,
      'Consultor': c.nomeConsultor,
      'Badge': c.nomeBadge,
      'Nível': c.nomeNivel,
      'Data Submissão': new Date(c.dataCriacao).toLocaleDateString('pt-PT'),
      'Estado': 'Em Validação',
    }))
    const ws = XLSX.utils.json_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Validações')
    XLSX.writeFile(wb, 'validacoes_pendentes.xlsx')
  }

  function exportarPDF() {
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text('Pedidos Pendentes - Validações', 14, 16)
    autoTable(doc, {
      startY: 22,
      head: [['ID', 'Consultor', 'Badge', 'Nível', 'Data', 'Estado']],
      body: filtradas.map(c => [
        c.numCandidatura, c.nomeConsultor, c.nomeBadge, c.nomeNivel,
        new Date(c.dataCriacao).toLocaleDateString('pt-PT'), 'Em Validação',
      ]),
      headStyles: { fillColor: [57, 99, 156] },
    })
    doc.save('validacoes_pendentes.pdf')
  }

  return (
    <LayoutSL>
      <div style={{ fontFamily: 'Poppins, sans-serif' }}>

        {/* ── Cabeçalho ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <h2 style={{ color: '#39639C', fontWeight: 700, fontSize: 22, margin: 0 }}>Validações</h2>
            <p style={{ color: '#39639C', fontWeight: 600, fontSize: 14, margin: '4px 0 0' }}>Pedidos Pendentes</p>
            <p style={{ color: '#9ca3af', fontSize: 12, margin: '2px 0 0' }}>{filtradas.length} PEDIDOS</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={exportarExcel} style={btnExport}>Exportar Excel</button>
            <button onClick={exportarPDF} style={btnExport}>Exportar PDF</button>
          </div>
        </div>

        {/* ── Filtros ── */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '16px 0', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 12px' }}>
            <FiSearch style={{ color: '#9ca3af' }} />
            <input
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              placeholder="Pesquisar Consultor, Badge, Requisito..."
              style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13 }}
            />
          </div>

          <select value={filtroNivel} onChange={e => setFiltroNivel(e.target.value)} style={selectStyle}>
            <option value="todos">Nível - Todos</option>
            {niveis.map((n, i) => <option key={i} value={n}>{n}</option>)}
          </select>

          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 8, padding: 3 }}>
            {[
              { id: 'todos', label: 'TODOS' },
              { id: 'aprovados', label: 'APROVADOS' },
              { id: 'rejeitados', label: 'REJEITADOS' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: tab === t.id ? '#fff' : 'transparent',
                  color: tab === t.id ? '#39639C' : '#6b7280',
                  boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tabela ── */}
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 0px 0px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>A carregar...</div>
          ) : filtradas.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
              Não há candidaturas para validar de momento.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['ID Candidatura', 'Consultor', 'Badge', 'Nível', 'Data Submissão', 'SLA', 'Estado', 'Ações'].map((h, i) => (
                    <th key={i} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 11.5, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.map((c, i) => (
                  <tr key={c.numCandidatura} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '11px 14px', color: '#6b7280' }}>{c.numCandidatura}</td>
                    <td style={{ padding: '11px 14px', fontWeight: 500, color: '#1a1a2e' }}>{c.nomeConsultor}</td>
                    <td style={{ padding: '11px 14px', color: '#39639C' }}>{c.nomeBadge}</td>
                    <td style={{ padding: '11px 14px', color: '#6b7280' }}>{c.nomeNivel}</td>
                    <td style={{ padding: '11px 14px', color: '#6b7280' }}>{new Date(c.dataCriacao).toLocaleDateString('pt-PT')}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ color: '#06A120', fontWeight: 600 }}>48h ●</span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 12, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Em Validação
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <FiEye title="Ver detalhe" onClick={() => abrirDetalhe(c)} style={{ cursor: 'pointer', color: '#39639C', fontSize: 16 }} />
                        <FaReply title="Devolver" onClick={() => { abrirDetalhe(c); setTimeout(() => setConfirmacao({ tipo: 'devolver' }), 50) }} style={{ cursor: 'pointer', color: '#f59e0b', fontSize: 15 }} />
                        <FaPaperPlane title="Validar" onClick={() => { abrirDetalhe(c); setTimeout(() => setConfirmacao({ tipo: 'validar' }), 50) }} style={{ cursor: 'pointer', color: '#39639C', fontSize: 15 }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ textAlign: 'right', marginTop: 12, fontSize: 11, color: '#aaa' }}>Política de Privacidade e RGPD</div>
      </div>

      {/* ════════ MODAL DE DETALHE ════════ */}
      {selecionada && !confirmacao && (
        <Overlay onClose={fecharDetalhe}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 560, maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={fecharDetalhe} style={fecharBtn}>×</button>
            <h3 style={{ color: '#1a1a2e', fontWeight: 700, fontSize: 18, margin: '0 0 18px' }}>
              Nº Candidatura: {selecionada.numCandidatura}
            </h3>

            {/* Info consultor + badge */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
              <div style={infoBox}>
                <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>Consultor:</div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{selecionada.nomeConsultor}</div>
              </div>
              <div style={infoBox}>
                <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>Badge + Nível</div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#39639C' }}>{selecionada.nomeBadge} {selecionada.nomeNivel}</div>
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
              style={{ width: '100%', minHeight: 70, borderRadius: 8, border: '1px solid #d1d5db', padding: '8px 10px', fontSize: 12, resize: 'vertical', outline: 'none', marginBottom: 18, fontFamily: 'inherit' }}
            />

            {/* Botões de ação */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setConfirmacao({ tipo: 'devolver' })} style={{ ...acaoBtn, border: '1px solid #39639C', background: '#fff', color: '#39639C' }}>Devolver</button>
              <button onClick={() => setConfirmacao({ tipo: 'rejeitar' })} style={{ ...acaoBtn, background: '#AE0003', color: '#fff' }}>Rejeitar</button>
              <button onClick={() => setConfirmacao({ tipo: 'validar' })} style={{ ...acaoBtn, background: '#06A120', color: '#fff' }}>Validar</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ════════ MODAL DE CONFIRMAÇÃO ════════ */}
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setConfirmacao(null)} style={{ ...acaoBtn, background: '#f3f4f6', color: '#6b7280' }}>Cancelar</button>
              {confirmacao.tipo === 'validar'  && <button onClick={validar} style={{ ...acaoBtn, background: '#06A120', color: '#fff' }}>Validar</button>}
              {confirmacao.tipo === 'rejeitar' && <button onClick={rejeitar} style={{ ...acaoBtn, background: '#AE0003', color: '#fff' }}>Rejeitar</button>}
              {confirmacao.tipo === 'devolver' && <button onClick={devolver} style={{ ...acaoBtn, background: '#f59e0b', color: '#fff' }}>Devolver</button>}
            </div>
          </div>
        </Overlay>
      )}

      {/* ════════ TOAST ════════ */}
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
const btnExport = { background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 500, color: '#39639C', cursor: 'pointer' }
const selectStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: '#374151', outline: 'none', cursor: 'pointer' }
const infoBox = { background: '#f9fafb', borderRadius: 8, padding: '10px 12px' }
const subTitulo = { fontSize: 12, fontWeight: 600, color: '#374151', margin: '0 0 8px' }
const acaoBtn = { border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }
const fecharBtn = { position: 'absolute', top: 16, right: 18, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }