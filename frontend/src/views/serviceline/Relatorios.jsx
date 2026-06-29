// src/views/serviceline/Relatorios.jsx
// Página de Relatórios do Service Line Leader
// Requisitos 10-14 do enunciado: candidaturas, badges, consultores, aprovações — com filtros e exportação Excel/PDF

import { useState, useEffect } from 'react'
import LayoutSL from './components/LayoutSL'
import api from '../../services/api'
import { FiDownload, FiFilter } from 'react-icons/fi'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const TABS = [
  { id: 'candidaturas', label: 'Pedidos' },
  { id: 'badges',       label: 'Badges Atribuídos' },
  { id: 'consultores',  label: 'Consultores' },
  { id: 'aprovacoes',   label: 'Aprovações' },
]

const ESTADOS = [
  { id: '', label: 'Todos os estados' },
  { id: '1', label: 'Submetido' },
  { id: '2', label: 'Em Validação TM' },
  { id: '3', label: 'Em Validação SLL' },
  { id: '4', label: 'Em Retificação' },
  { id: '5', label: 'Aprovada' },
  { id: '6', label: 'Rejeitada' },
]

const corEstado = {
  'Aprovada':          { bg: '#dcfce7', color: '#16a34a' },
  'Rejeitada':         { bg: '#fee2e2', color: '#dc2626' },
  'Em Validação SLL':  { bg: '#dbeafe', color: '#1d4ed8' },
  'Em Validação TM':   { bg: '#e0e7ff', color: '#4338ca' },
  'Em Retificação SLL':{ bg: '#fef3c7', color: '#d97706' },
  'Submetido':         { bg: '#f3f4f6', color: '#6b7280' },
}

export default function Relatorios() {
  const [tab, setTab]           = useState('candidaturas')
  const [dados, setDados]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim]       = useState('')
  const [estado, setEstado]         = useState('')
  const [filtro, setFiltro]         = useState('')

  useEffect(() => { carregar() }, [tab])

  function carregar() {
    setLoading(true)
    setDados([])
    const params = new URLSearchParams()
    if (dataInicio) params.append('dataInicio', dataInicio)
    if (dataFim)    params.append('dataFim', dataFim)
    if (estado)     params.append('estado', estado)

    const endpoint = tab === 'candidaturas' ? `/sl/relatorios/candidaturas?${params}`
      : tab === 'badges'      ? '/sl/relatorios/exportar-badges'
      : tab === 'consultores' ? '/sl/relatorios/exportar-consultores'
      : '/sl/relatorios/exportar-aprovacoes'

    api.get(endpoint)
      .then(res => setDados(Array.isArray(res.data) ? res.data : []))
      .catch(() => setDados([]))
      .finally(() => setLoading(false))
  }

  // Filtragem local por texto
  const dadosFiltrados = dados.filter(d => {
    const termo = filtro.toLowerCase()
    return Object.values(d).some(v => String(v).toLowerCase().includes(termo))
  })

  // ── Configuração das colunas por tab ──
  const colunas = {
    candidaturas: ['ID', 'Consultor', 'Badge', 'Nível', 'Área', 'Estado', 'Data'],
    badges:       ['ID', 'Consultor', 'Badge', 'Nível', 'Área', 'Data Atribuição', 'Válido'],
    consultores:  ['Nome', 'Email', 'Área', 'Badges', 'Pontos'],
    aprovacoes:   ['ID', 'Consultor', 'Badge', 'Nível', 'Data Aprovação', 'Comentário'],
  }

  function getCelulas(d) {
    if (tab === 'candidaturas') return [
      d.numCandidatura,
      d.nomeConsultor,
      d.nomeBadge,
      d.nomeNivel,
      d.nomeArea,
      d.nomeEstado,
      new Date(d.dataCriacao).toLocaleDateString('pt-PT'),
    ]
    if (tab === 'badges') return [
      d.idBadgeUtilizador,
      d.nomeConsultor,
      d.nomeBadge,
      d.nomeNivel,
      d.nomeArea,
      new Date(d.dataAtribuicao).toLocaleDateString('pt-PT'),
      d.valido,
    ]
    if (tab === 'consultores') return [d.nome, d.email, d.nomeArea, d.totalBadges, d.totalPontos]
    if (tab === 'aprovacoes') return [
      d.numCandidatura,
      d.nomeConsultor,
      d.nomeBadge,
      d.nomeNivel,
      new Date(d.dataAprovacao).toLocaleDateString('pt-PT'),
      d.comentario,
    ]
    return []
  }

  // ── Exportações ──
  function exportarExcel() {
    const cabecalho = colunas[tab]
    const linhas = dadosFiltrados.map(d => {
      const celulas = getCelulas(d)
      return Object.fromEntries(cabecalho.map((c, i) => [c, celulas[i]]))
    })
    const ws = XLSX.utils.json_to_sheet(linhas)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, tab)
    XLSX.writeFile(wb, `relatorio_${tab}.xlsx`)
  }

  function exportarPDF() {
    const doc = new jsPDF()
    const titulo = TABS.find(t => t.id === tab)?.label ?? tab
    doc.setFontSize(14)
    doc.text(`Relatório — ${titulo}`, 14, 16)
    autoTable(doc, {
      startY: 22,
      head: [colunas[tab]],
      body: dadosFiltrados.map(d => getCelulas(d)),
      headStyles: { fillColor: [57, 99, 156] },
      styles: { fontSize: 9 },
    })
    doc.save(`relatorio_${tab}.pdf`)
  }

  return (
    <LayoutSL>
      <div style={{ fontFamily: 'Poppins, sans-serif' }}>

        {/* ── Cabeçalho ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h2 style={{ color: '#39639C', fontWeight: 700, fontSize: 22, margin: 0 }}>Relatórios</h2>
            <p style={{ color: '#9ca3af', fontSize: 13, margin: '4px 0 0' }}>{dadosFiltrados.length} registos</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={exportarExcel} style={btnExport}>
              <FiDownload style={{ marginRight: 5 }} /> Exportar Excel
            </button>
            <button onClick={exportarPDF} style={btnExport}>
              <FiDownload style={{ marginRight: 5 }} /> Exportar PDF
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f3f4f6', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setFiltro('') }} style={{
              border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
              background: tab === t.id ? '#fff' : 'transparent',
              color: tab === t.id ? '#39639C' : '#9ca3af',
              boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Filtros ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            placeholder="Pesquisar..."
            style={{ flex: 1, minWidth: 0, border: 'none', borderRadius: 10, padding: '9px 14px', fontSize: 13, boxShadow: '0 5px 40px rgba(237,237,237,1)', outline: 'none' }}
          />

          {tab === 'candidaturas' && (
            <>
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
                style={{ border: 'none', borderRadius: 10, padding: '9px 12px', fontSize: 13, boxShadow: '0 5px 40px rgba(237,237,237,1)', outline: 'none', color: dataInicio ? '#374151' : '#9ca3af' }} />
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
                style={{ border: 'none', borderRadius: 10, padding: '9px 12px', fontSize: 13, boxShadow: '0 5px 40px rgba(237,237,237,1)', outline: 'none', color: dataFim ? '#374151' : '#9ca3af' }} />
              <select value={estado} onChange={e => setEstado(e.target.value)} style={{ border: 'none', borderRadius: 10, padding: '9px 12px', fontSize: 13, boxShadow: '0 5px 40px rgba(237,237,237,1)', outline: 'none', color: '#374151' }}>
                {ESTADOS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
              <button onClick={carregar} style={{ background: '#39639C', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiFilter /> Filtrar
              </button>
            </>
          )}
        </div>

        {/* ── Tabela ── */}
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 5px 40px rgba(237,237,237,1)', overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>A carregar...</div>
          ) : dadosFiltrados.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Sem dados disponíveis.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f0f0f0' }}>
                  {colunas[tab].map((col, i) => (
                    <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dadosFiltrados.map((d, i) => {
                  const celulas = getCelulas(d)
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f9f9f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      {celulas.map((cel, j) => (
                        <td key={j} style={{ padding: '11px 16px', color: '#374151' }}>
                          {/* Tag colorida para estado */}
                          {tab === 'candidaturas' && j === 5 ? (
                            <span style={{
                              background: corEstado[cel]?.bg ?? '#f3f4f6',
                              color: corEstado[cel]?.color ?? '#6b7280',
                              borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                            }}>{cel}</span>
                          ) : tab === 'badges' && j === 6 ? (
                            <span style={{ color: cel === 'Sim' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{cel}</span>
                          ) : (
                            <span style={{ color: j === 0 ? '#6b7280' : '#374151' }}>{cel}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ textAlign: 'right', marginTop: 12, fontSize: 11, color: '#aaa' }}>Política de Privacidade e RGPD</div>
      </div>
    </LayoutSL>
  )
}

const btnExport = {
  display: 'flex', alignItems: 'center',
  background: '#fff', border: '1.5px solid #39639C',
  borderRadius: 12, padding: '8px 16px',
  fontSize: 13, fontWeight: 500, color: '#39639C', cursor: 'pointer',
}