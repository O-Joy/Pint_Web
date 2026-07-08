import { useState, useEffect } from 'react'
import LayoutSL from './components/LayoutSL'
import api, { FILES_URL } from '../../services/api'
import Footer from '../../components/Footer'
import { FiSearch, FiChevronLeft, FiChevronRight, FiChevronDown, FiChevronUp, FiFlag } from 'react-icons/fi'
import { FaBolt } from 'react-icons/fa'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { desenharLogoSoftinsa } from '../../utils/pdfLogo'
import CardBadge from '../../components/CardBadge'

const POR_PAGINA = 8

const corEstadoHistorico = {
  'Aprovada':           { bg: '#dcfce7', color: '#16a34a' },
  'Rejeitada':          { bg: '#fee2e2', color: '#dc2626' },
  'Em Validação SLL':   { bg: '#dbeafe', color: '#1d4ed8' },
  'Em Validação TM':    { bg: '#e0e7ff', color: '#4338ca' },
  'Em Retificação SLL': { bg: '#fef3c7', color: '#d97706' },
  'Submetido':          { bg: '#f3f4f6', color: '#6b7280' },
}

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
  const [aberto, setAberto]             = useState(null) // índice do requisito expandido no acordeão
  const [certificadoMarcado, setCertificadoMarcado] = useState(false)

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
    setSelecionado(badge)
    setRequisitos([])
    setAberto(null)
    setCertificadoMarcado(false)
    if (badge.especial) return // especiais não têm requisitos — mostra só descrição + certificado
    setLoadingReq(true)
    api.get(`/sl/badges/${badge.id}/requisitos`)
      .then(res => setRequisitos(Array.isArray(res.data) ? res.data : []))
      .catch(() => setRequisitos([]))
      .finally(() => setLoadingReq(false))
  }

  function fecharModal() { setSelecionado(null); setRequisitos([]); setAberto(null); setCertificadoMarcado(false) }

  // Gera um certificado genérico do badge em PDF (pré-visualização — o certificado real é emitido quando o badge é atribuído)
  async function gerarCertificado(badge) {
    const doc = new jsPDF({ orientation: 'landscape' })
    const largura = doc.internal.pageSize.getWidth()
    doc.setFillColor(57, 99, 156)
    doc.rect(0, 0, largura, 12, 'F')
    // logótipo centrado, numa chapa branca para se destacar da barra azul
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(largura / 2 - 24, 18, 48, 14, 2, 2, 'F')
    await desenharLogoSoftinsa(doc, { x: largura / 2 - 20, y: 21, altura: 8, comLinha: false })
    doc.setFontSize(22)
    doc.setTextColor(26, 26, 46)
    doc.text('Certificado de Badge', largura / 2, 48, { align: 'center' })
    doc.setFontSize(16)
    doc.text(badge.nome, largura / 2, 62, { align: 'center' })
    doc.setFontSize(11)
    doc.setTextColor(107, 114, 128)
    doc.text(badge.descricao || '', largura / 2, 74, { align: 'center', maxWidth: largura - 60 })
    doc.text(`${badge.pontos ?? 0} pontos · Emitido pela Softinsa`, largura / 2, 95, { align: 'center' })
    doc.text(new Date().toLocaleDateString('pt-PT'), largura / 2, 103, { align: 'center' })
    doc.save(`certificado_${badge.nome.replace(/\s+/g, '_')}.pdf`)
  }

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

  // Histórico filtrado por tab (idEstadoAtual: 5 = Aprovada/Obtido; 1-4 = ainda em processo)
  const historicoFiltrado = historico.filter(h => {
    if (tabHistorico === 'OBTIDOS')    return h.idEstadoAtual === 5
    if (tabHistorico === 'EM PROCESSO') return h.idEstadoAtual !== 5 && h.idEstadoAtual !== 6
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

  async function exportarPDF() {
    const doc = new jsPDF()
    const y = await desenharLogoSoftinsa(doc)
    doc.setFontSize(14)
    doc.text('Badges - Service Line', 14, y)
    autoTable(doc, {
      startY: y + 8,
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
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-1">
          <div>
            <h2 className="fw-bold mb-0 text-primary" style={{ fontSize: 22 }}>Badges</h2>
            <p className="text-secondary small mt-1 mb-0">{regularesFiltrados.length + especiaisFiltrados.length} badges disponíveis</p>
          </div>
          <div className="d-flex gap-2">
            <button onClick={exportarExcel} className="btn btn-outline-primary btn-sm">Exportar Excel</button>
            <button onClick={exportarPDF} className="btn btn-outline-primary btn-sm">Exportar PDF</button>
          </div>
        </div>

        {/* ── Filtros ── */}
        <div className="row g-2" style={{ margin: '16px 0' }}>
          <div className="col-12 col-md-6">
            <div className="input-group">
              <span className="input-group-text"><FiSearch className="text-secondary" /></span>
              <input value={filtro} onChange={e => { setFiltro(e.target.value); setPagina(1) }} placeholder="Pesquisar badges,..." className="form-control" />
            </div>
          </div>
          <div className="col-6 col-md-3">
            <select value={filtroNivel} onChange={e => { setFiltroNivel(e.target.value); setPagina(1) }} className="form-select">
              <option value="todos">Todos os badges</option>
              {niveis.map((n, i) => <option key={i} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-3">
            <select value={filtroSL} onChange={e => { setFiltroSL(e.target.value); setPagina(1) }} className="form-select">
              <option value="todas">Todas Service Lines</option>
              {servicelines.map((s, i) => <option key={i} value={s}>{s}</option>)}
            </select>
          </div>
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
                    <CardBadge key={b.id} b={b} onInfo={() => abrirModal(b)} />
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
                  {especiaisFiltrados.map(b => <CardBadge key={b.id} b={b} especial onInfo={() => abrirModal(b)} />)}
                </div>
              )}
            </div>

            {/* ── Histórico ── */}
            {historico.length > 0 && (
              <div>
                <h3 style={{ color: '#39639C', fontWeight: 700, fontSize: 18, margin: '0 0 14px' }}>Histórico</h3>
                <ul className="nav nav-pills gap-1 mb-3" style={{ background: '#f3f4f6', borderRadius: 10, padding: 4, width: 'fit-content' }}>
                  {['TODOS', 'OBTIDOS', 'EM PROCESSO'].map(t => (
                    <li className="nav-item" key={t}>
                      <button onClick={() => setTabHistorico(t)} className={`nav-link small ${tabHistorico === t ? 'active' : ''}`}>
                        {t}
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="card">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead>
                        <tr>
                          {['Badge', 'Área', 'Nível', 'Consultor', 'Estado'].map((h, i) => <th key={i}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {historicoFiltrado.map((h, i) => (
                          <tr key={i}>
                            <td style={{ color: '#1a1a2e' }}>{h.nomeBadge}</td>
                            <td className="text-secondary">{h.nomeArea}</td>
                            <td className="text-secondary">{h.nomeNivel}</td>
                            <td className="text-secondary">{h.nomeConsultor}</td>
                            <td>
                              <span style={{
                                background: corEstadoHistorico[h.nomeEstado]?.bg ?? '#f3f4f6',
                                color: corEstadoHistorico[h.nomeEstado]?.color ?? '#6b7280',
                                borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                              }}>
                                {h.nomeEstado || '-'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <Footer />
      </div>

      {/* ════════ MODAL INFORMAÇÕES DO BADGE ════════ */}
      {selecionado && (
        <Overlay onClose={fecharModal}>
          <div className="modal-box" style={{ maxWidth: 500 }}>
            <button onClick={fecharModal} className="modal-close-btn">×</button>

            {/* Cabeçalho: ícone + nome + tag de nível/especial */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: 10, background: '#eef3fa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {selecionado.urlImagem
                  ? <img src={`${FILES_URL}/${selecionado.urlImagem}`} alt={selecionado.nome} style={{ width: 48, height: 48, objectFit: 'contain' }} />
                  : <span style={{ fontSize: 26 }}>{selecionado.especial ? '⭐' : '🏅'}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h3 style={{ fontWeight: 700, fontSize: 17, color: '#1a1a2e', margin: 0 }}>{selecionado.nome}</h3>
                  <span style={{
                    background: selecionado.especial ? '#f3f4f6' : '#FFF3E0',
                    color: selecionado.especial ? '#6b7280' : '#F57C00',
                    borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600,
                  }}>
                    {selecionado.especial ? 'Especial' : (selecionado.nomeNivel || '-')}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#6b7280', margin: '6px 0 0', lineHeight: 1.5 }}>{selecionado.descricao || 'Sem descrição.'}</p>
              </div>
            </div>

            {/* Breadcrumb + pontos */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 0', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', marginBottom: 18 }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                {[selecionado.nomeServiceLine, selecionado.nomeArea].filter(Boolean).join(' · ') || 'Badge Especial'}
              </span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#11a9d6', fontWeight: 700, fontSize: 13 }}>
                  <FaBolt /> {selecionado.pontos ?? 0} pontos
                </div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>Definido Pelo Administrador</div>
              </div>
            </div>

            {selecionado.especial ? (
              /* ── Badge Especial: sem requisitos, botão de certificado ── */
              <div className="form-check d-flex align-items-center gap-2 border rounded p-2" style={{ paddingLeft: '2.5em' }}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={certificadoMarcado}
                  onChange={() => { setCertificadoMarcado(true); gerarCertificado(selecionado) }}
                />
                <label className="form-check-label small fw-medium" style={{ color: '#374151' }}>Descarregar Certificado</label>
              </div>
            ) : (
              /* ── Badge Regular: acordeão de requisitos ── */
              <>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: '0 0 10px' }}>Requisitos:</p>
                {loadingReq ? (
                  <p style={{ fontSize: 12, color: '#9ca3af' }}>A carregar...</p>
                ) : requisitos.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#9ca3af' }}>Sem requisitos definidos.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {requisitos.map((r, i) => {
                      const expandido = aberto === i
                      return (
                        <div key={r.id ?? i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                          <button
                            onClick={() => setAberto(expandido ? null : i)}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                              padding: '10px 14px', background: '#fff', border: 'none', cursor: 'pointer', textAlign: 'left',
                            }}
                          >
                            <span style={{
                              width: 22, height: 22, borderRadius: 6, background: '#fee2e2', color: '#dc2626',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11,
                            }}>
                              <FiFlag />
                            </span>
                            <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: '#1a1a2e' }}>
                              Requisito {r.nome}
                            </span>
                            {expandido ? <FiChevronUp color="#9ca3af" /> : <FiChevronDown color="#9ca3af" />}
                          </button>
                          {expandido && (
                            <div style={{ padding: '0 14px 14px 46px', fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                              {r.descricao || 'Sem descrição definida para este requisito.'}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {/* Rodapé: validade */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 14, borderTop: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>
                {selecionado.validadeDias
                  ? `Válido por ${selecionado.validadeDias} dias após atribuição`
                  : 'Sem prazo de expiração'}
              </span>
              <span style={{
                width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
                background: selecionado.validadeDias ? '#f0b429' : '#22c55e',
              }} />
            </div>
          </div>
        </Overlay>
      )}
    </LayoutSL>
  )
}

function Overlay({ children, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  )
}


const btnPag     = { display: 'flex', alignItems: 'center', gap: 4, background: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 14, color: '#374151', cursor: 'pointer', boxShadow: '0 2px 12px rgba(237,237,237,1)' }