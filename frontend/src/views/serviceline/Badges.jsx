// src/views/serviceline/Badges.jsx
// Design baseado no Figma — cards clean com imagem, paginação, filtros, especiais e histórico

import { useState, useEffect } from 'react'
import LayoutSL from './components/LayoutSL'
import api from '../../services/api'
import { FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { FaBolt } from 'react-icons/fa'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import CardBadge from '../../components/CardBadge'

const POR_PAGINA = 8

export default function Badges() {
  const [regulares, setRegulares]   = useState([])
  const [especiais, setEspeciais]   = useState([])
  const [loading, setLoading]       = useState(true)

  // Filtros
  const [filtro, setFiltro]               = useState('')
  const [filtroNivel, setFiltroNivel]     = useState('todos')
  const [filtroSL, setFiltroSL]           = useState('todas')

  // Paginação
  const [pagina, setPagina] = useState(1)

  // Modal
  const [selecionado, setSelecionado]   = useState(null)
  const [requisitos, setRequisitos]     = useState([])
  const [loadingReq, setLoadingReq]     = useState(false)

  // Histórico
  const [historico, setHistorico]       = useState([])
  const [tabHistorico, setTabHistorico] = useState('TODOS')

  useEffect(() => {
    api.get('/sl/badges')
      .then(res => {
        setRegulares(Array.isArray(res.data.regulares) ? res.data.regulares : [])
        setEspeciais(Array.isArray(res.data.especiais) ? res.data.especiais : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    api.get('/sl/relatorios/candidaturas')
      .then(res => setHistorico(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
  }, [])

  function abrirModal(badge) {
    if (badge.especial) return // especiais não têm requisitos
    setSelecionado(badge)
    setRequisitos([])
    setLoadingReq(true)
    api.get(`/sl/badges/${badge.id}/requisitos`)
      .then(res => setRequisitos(Array.isArray(res.data) ? res.data : []))
      .catch(() => setRequisitos([]))
      .finally(() => setLoadingReq(false))
  }

  function fecharModal() { setSelecionado(null); setRequisitos([]) }

  // Listas de valores únicos para filtros
  const servicelines = [...new Set(regulares.map(b => b.nomeServiceLine).filter(Boolean))]
  const niveis = [...new Set(regulares.map(b => b.nomeNivel).filter(Boolean))]

  // Filtragem regulares
  const regularesFiltrados = regulares.filter(b => {
    const termo = filtro.toLowerCase()
    const matchTermo = b.nome?.toLowerCase().includes(termo) || b.descricao?.toLowerCase().includes(termo)
    const matchNivel = filtroNivel === 'todos' || b.nomeNivel === filtroNivel
    const matchSL    = filtroSL === 'todas' || b.nomeServiceLine === filtroSL
    return matchTermo && matchNivel && matchSL
  })

  // Paginação
  const totalPaginas = Math.ceil(regularesFiltrados.length / POR_PAGINA)
  const paginaAtual  = regularesFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  // Especiais filtrados só por termo
  const especiaisFiltrados = especiais.filter(b => {
    const termo = filtro.toLowerCase()
    return b.nome?.toLowerCase().includes(termo) || b.descricao?.toLowerCase().includes(termo)
  })

  // Histórico filtrado por tab
  const historicoFiltrado = historico.filter(h => {
    if (tabHistorico === 'OBTIDOS')    return h.estado === 'Obtido'
    if (tabHistorico === 'EM PROCESSO') return h.estado !== 'Obtido'
    return true
  })

  // Exportações
  function exportarExcel() {
    const ws = XLSX.utils.json_to_sheet([
      ...regularesFiltrados.map(b => ({ Tipo: 'Regular', Nome: b.nome, Nível: b.nomeNivel, 'Service Line': b.nomeServiceLine ?? '', Pontos: b.pontos ?? 0 })),
      ...especiaisFiltrados.map(b => ({ Tipo: 'Especial', Nome: b.nome, Nível: '-', 'Service Line': '-', Pontos: b.pontos ?? 0 })),
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Badges')
    XLSX.writeFile(wb, 'badges_sl.xlsx')
  }

  function exportarPDF() {
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text('Badges - Service Line', 14, 16)
    autoTable(doc, {
      startY: 22,
      head: [['Tipo', 'Nome', 'Nível', 'Service Line', 'Pontos']],
      body: [
        ...regularesFiltrados.map(b => ['Regular', b.nome, b.nomeNivel, b.nomeServiceLine ?? '-', b.pontos ?? 0]),
        ...especiaisFiltrados.map(b => ['Especial', b.nome, '-', '-', b.pontos ?? 0]),
      ],
      headStyles: { fillColor: [57, 99, 156] },
    })
    doc.save('badges_sl.pdf')
  }

  return (
    <LayoutSL>
      <div style={{ fontFamily: 'Poppins, sans-serif' }}>

        {/* ── Cabeçalho ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h2 style={{ color: '#39639C', fontWeight: 700, fontSize: 22, margin: 0 }}>Badges</h2>
            <p style={{ color: '#9ca3af', fontSize: 13, margin: '4px 0 0' }}>{regularesFiltrados.length + especiaisFiltrados.length} badges disponíveis</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={exportarExcel} style={btnExport}>Exportar Excel</button>
            <button onClick={exportarPDF} style={btnExport}>Exportar PDF</button>
          </div>
        </div>

        {/* ── Filtros ── */}
        <div style={{ display: 'flex', gap: 10, margin: '16px 0', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 10, padding: '9px 14px', boxShadow: '0 5px 40px rgba(237,237,237,1)' }}>
            <FiSearch style={{ color: '#9ca3af', flexShrink: 0 }} />
            <input value={filtro} onChange={e => { setFiltro(e.target.value); setPagina(1) }} placeholder="Pesquisar badges,..." style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13 }} />
          </div>
          <select value={filtroNivel} onChange={e => { setFiltroNivel(e.target.value); setPagina(1) }} style={selectStyle}>
            <option value="todos">Todos os badges</option>
            {niveis.map((n, i) => <option key={i} value={n}>{n}</option>)}
          </select>
          <select value={filtroSL} onChange={e => { setFiltroSL(e.target.value); setPagina(1) }} style={selectStyle}>
            <option value="todas">Todas Service Lines</option>
            {servicelines.map((s, i) => <option key={i} value={s}>{s}</option>)}
          </select>
        </div>

        {/* ── Cards Regulares ── */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>A carregar...</div>
        ) : (
          <>
            {regularesFiltrados.length === 0 ? (
              <div style={{ padding: '20px 0', color: '#9ca3af', fontSize: 14 }}>Nenhum badge encontrado.</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 20 }}>
                  {paginaAtual.map(b => (
                    <CardBadge key={b.id} b={b} onInformacoes={() => abrirModal(b)} />
                  ))}
                </div>

                {/* Paginação */}
                {totalPaginas > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 32 }}>
                    <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} style={btnPag}>
                      <FiChevronLeft /> Anterior
                    </button>
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
                      <button key={n} onClick={() => setPagina(n)} style={{ ...btnPag, background: pagina === n ? '#39639C' : '#fff', color: pagina === n ? '#fff' : '#374151', fontWeight: pagina === n ? 700 : 400 }}>
                        {n}
                      </button>
                    ))}
                    <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas} style={btnPag}>
                      Seguinte <FiChevronRight />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── Badges Especiais ── */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ color: '#39639C', fontWeight: 700, fontSize: 18, margin: '0 0 4px' }}>Badges Especiais</h3>
              <p style={{ color: '#9ca3af', fontSize: 13, margin: '0 0 16px' }}>{especiaisFiltrados.length} badges disponíveis</p>
              {especiaisFiltrados.length === 0 ? (
                <div style={{ color: '#9ca3af', fontSize: 14 }}>Nenhum badge especial disponível.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                  {especiaisFiltrados.map(b => <CardBadge key={b.id} b={b} especial />)}
                </div>
              )}
            </div>

            {/* ── Histórico ── */}
            {historico.length > 0 && (
              <div>
                <h3 style={{ color: '#39639C', fontWeight: 700, fontSize: 18, margin: '0 0 14px' }}>Histórico</h3>
                <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                  {['TODOS', 'OBTIDOS', 'EM PROCESSO'].map(t => (
                    <button key={t} onClick={() => setTabHistorico(t)} style={{ ...btnTab, background: tabHistorico === t ? '#fff' : 'transparent', color: tabHistorico === t ? '#39639C' : '#9ca3af', boxShadow: tabHistorico === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                      {t}
                    </button>
                  ))}
                </div>
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                        {['Badge', 'Área', 'Nível', 'Consultor', 'Estado'].map((h, i) => (
                          <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {historicoFiltrado.map((h, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f9f9f9' }}>
                          <td style={{ padding: '11px 16px', color: '#1a1a2e' }}>{h.nomeBadge}</td>
                          <td style={{ padding: '11px 16px', color: '#6b7280' }}>{h.nomeArea}</td>
                          <td style={{ padding: '11px 16px', color: '#6b7280' }}>{h.nomeNivel}</td>
                          <td style={{ padding: '11px 16px', color: '#6b7280' }}>{h.nomeConsultor}</td>
                          <td style={{ padding: '11px 16px' }}>
                            <span style={{ color: h.estado === 'Obtido' ? '#06A120' : '#6b7280', fontWeight: h.estado === 'Obtido' ? 600 : 400 }}>{h.estado}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        <div style={{ textAlign: 'right', marginTop: 16, fontSize: 11, color: '#aaa' }}>Política de Privacidade e RGPD</div>
      </div>

      {/* ════════ MODAL REQUISITOS ════════ */}
      {selecionado && (
        <Overlay onClose={fecharModal}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 500, maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={fecharModal} style={fecharBtn}>×</button>
            <h3 style={{ fontWeight: 700, fontSize: 18, color: '#1a1a2e', margin: '0 0 4px' }}>{selecionado.nome}</h3>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 18px' }}>{selecionado.descricao}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <div style={infoBox}>
                <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>Nível</div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{selecionado.nomeNivel || '-'}</div>
              </div>
              <div style={infoBox}>
                <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>Pontos</div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#11a9d6', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FaBolt /> {selecionado.pontos ?? 0}
                </div>
              </div>
            </div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: '0 0 10px' }}>Requisitos:</p>
            {loadingReq ? (
              <p style={{ fontSize: 12, color: '#9ca3af' }}>A carregar...</p>
            ) : requisitos.length === 0 ? (
              <p style={{ fontSize: 12, color: '#9ca3af' }}>Sem requisitos definidos.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {requisitos.map((r, i) => (
                  <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a2e', marginBottom: 4 }}>{i + 1}. {r.nome}</div>
                    {r.descricao && <div style={{ fontSize: 12, color: '#6b7280' }}>{r.descricao}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Overlay>
      )}
    </LayoutSL>
  )
}

function Overlay({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998 }}>
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  )
}

const btnExport  = { background: '#fff', border: '1.5px solid #39639C', borderRadius: 12, padding: '8px 20px', fontSize: 13, fontWeight: 500, color: '#39639C', cursor: 'pointer' }
const selectStyle = { background: '#fff', border: 'none', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: '#374151', outline: 'none', cursor: 'pointer', boxShadow: '0 5px 40px rgba(237,237,237,1)' }
const infoBox    = { background: '#f9fafb', borderRadius: 8, padding: '10px 12px' }
const fecharBtn  = { position: 'absolute', top: 16, right: 18, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }
const btnPag     = { display: 'flex', alignItems: 'center', gap: 4, background: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 14, color: '#374151', cursor: 'pointer', boxShadow: '0 2px 12px rgba(237,237,237,1)' }
const btnTab     = { border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }