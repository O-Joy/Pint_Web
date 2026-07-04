import { useState, useEffect, useCallback } from 'react'
import LayoutTM from './components/LayoutTM'
import api from '../../services/api'
import { FiDownload, FiCheckCircle } from 'react-icons/fi'
import { MdMilitaryTech, MdPerson, MdStars, MdAccessTime } from 'react-icons/md'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement, Filler, Tooltip, Legend,
} from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend)

const NIVEIS = ['Todos', 'Júnior', 'Intermédio', 'Sénior', 'Especialista', 'Líder']
const GRAFICO_TABS = [
  { id: 'evolucao', label: 'Evolução' },
  { id: 'area', label: 'Por Área' },
  { id: 'nivelsla', label: 'Por Nível/SLA' },
]
const CORES_AREA = ['#7dd8f0', '#7eecd4']

export default function RelatoriosTM() {
  const [kpis, setKpis] = useState({ badgesAprovados: 0, badgesAprovadosVariacao: 0, taxaAprovacao: 0, consultoresAtivos: 0, mediaSLA: 0 })
  const [evolucao, setEvolucao] = useState([])
  const [porArea, setPorArea] = useState({ labelMesAnterior: '', labelMesAtual: '', areas: [] })
  const [porNivel, setPorNivel] = useState([])
  const [sla, setSla] = useState({ percentagem: 0 })

  const [grafico, setGrafico] = useState('evolucao')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [nivel, setNivel] = useState('Todos')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  

  const [modalValidacoes, setModalValidacoes] = useState(null) // 'excel' | 'pdf' | null
  const [tiposValidacoes, setTiposValidacoes] = useState(['aprovacoes', 'rejeicoes'])

    const mostrarToast = (titulo, subtitulo = '') => {
    setToast({ titulo, subtitulo })
    setTimeout(() => setToast(null), 4000)
    }

  const carregar = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (dataInicio) params.append('dataInicio', dataInicio)
    if (dataFim) params.append('dataFim', dataFim)
    if (nivel && nivel !== 'Todos') params.append('nivel', nivel)
    const qs = params.toString()

    Promise.all([
      api.get('/tm/relatorios/kpis'),
      api.get(`/tm/relatorios/evolucao-mensal?${qs}`),
      api.get(`/tm/relatorios/por-area?${qs}`),
      api.get(`/tm/relatorios/por-nivel?${qs}`),
      api.get(`/tm/relatorios/sla?${qs}`),
    ]).then(([kpisRes, evolRes, areaRes, nivelRes, slaRes]) => {
      setKpis(kpisRes.data || {})
      setEvolucao(Array.isArray(evolRes.data) ? evolRes.data : [])
      setPorArea(areaRes.data?.areas ? areaRes.data : { labelMesAnterior: '', labelMesAtual: '', areas: [] })
      setPorNivel(Array.isArray(nivelRes.data) ? nivelRes.data : [])
      setSla(slaRes.data || { percentagem: 0 })
    }).catch(err => console.error('[RelatoriosTM]', err.response?.data || err.message))
      .finally(() => setLoading(false))
  }, [dataInicio, dataFim, nivel])

  useEffect(() => { carregar() }, [carregar])

  function exportarDados(endpoint, nomeFicheiro, colunas, getCelulas, formato) {
    api.get(endpoint).then(res => {
      const dados = Array.isArray(res.data) ? res.data : []
      if (formato === 'excel') {
        const linhas = dados.map(d => Object.fromEntries(colunas.map((c, i) => [c, getCelulas(d)[i]])))
        const ws = XLSX.utils.json_to_sheet(linhas)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, nomeFicheiro)
        XLSX.writeFile(wb, `${nomeFicheiro}.xlsx`)
      } else {
        const doc = new jsPDF()
        doc.setFontSize(14)
        doc.text(nomeFicheiro.replace(/_/g, ' '), 14, 16)
        autoTable(doc, { startY: 22, head: [colunas], body: dados.map(d => getCelulas(d)), headStyles: { fillColor: [57, 99, 156] }, styles: { fontSize: 9 } })
        doc.save(`${nomeFicheiro}.pdf`)
      }
      mostrarToast('Os dados foram exportados com sucesso!', `${nomeFicheiro.replace(/_/g, ' ')} (${formato.toUpperCase()})`)
    }).catch(err => console.error('[RelatoriosTM] exportar:', err.response?.data || err.message))
  }

  const EXPORTACOES = {
    badges: {
      titulo: 'BADGES', endpoint: '/tm/relatorios/exportar-badges', ficheiro: 'badges_atribuidos',
      colunas: ['Consultor', 'Badge', 'Nível', 'Área', 'Data Atribuição', 'Válido'],
      celulas: d => [d.nomeConsultor, d.nomeBadge, d.nomeNivel, d.nomeArea, new Date(d.dataAtribuicao).toLocaleDateString('pt-PT'), d.valido],
    },
    pedidos: {
      titulo: 'PEDIDOS', endpoint: '/tm/relatorios/exportar-pedidos', ficheiro: 'pedidos',
      colunas: ['Consultor', 'Badge', 'Nível', 'Área', 'Estado', 'Data'],
      celulas: d => [d.nomeConsultor, d.nomeBadge, d.nomeNivel, d.nomeArea, d.idEstadoAtual, new Date(d.dataCriacao).toLocaleDateString('pt-PT')],
    },
    consultores: {
      titulo: 'CONSULTORES', endpoint: '/tm/relatorios/exportar-consultores', ficheiro: 'consultores',
      colunas: ['Nome', 'Área', 'Badges', 'Pontos'],
      celulas: d => [d.nome, d.nomeArea, d.totalBadges, d.totalPontos],
    },
  }

  function exportarValidacoes(formato) {
    const params = new URLSearchParams({ tipos: tiposValidacoes.join(',') })
    api.get(`/tm/relatorios/exportar-validacoes?${params}`).then(res => {
      const dados = Array.isArray(res.data) ? res.data : []
      const colunas = ['Consultor', 'Badge', 'Estado', 'Data', 'Responsável', 'Comentário']
      const celulas = d => [d.nomeConsultor, d.nomeBadge, d.nomeEstado, new Date(d.dataValidacao).toLocaleDateString('pt-PT'), d.responsavel, d.comentario]
      if (formato === 'excel') {
        const linhas = dados.map(d => Object.fromEntries(colunas.map((c, i) => [c, celulas(d)[i]])))
        const ws = XLSX.utils.json_to_sheet(linhas)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Validações')
        XLSX.writeFile(wb, 'validacoes.xlsx')
      } else {
        const doc = new jsPDF()
        doc.setFontSize(14)
        doc.text('Validações', 14, 16)
        autoTable(doc, { startY: 22, head: [colunas], body: dados.map(celulas), headStyles: { fillColor: [57, 99, 156] }, styles: { fontSize: 9 } })
        doc.save('validacoes.pdf')
      }
      setModalValidacoes(null)
      mostrarToast('Validações exportadas com sucesso!', '')
    }).catch(err => console.error('[RelatoriosTM] validacoes:', err.response?.data || err.message))
  }

  function exportarRelatorioAnterior() {
    const hoje = new Date()
    const inicioMesAnt = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
    const fimMesAnt = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
    const params = new URLSearchParams({ dataInicio: inicioMesAnt.toISOString().slice(0, 10), dataFim: fimMesAnt.toISOString().slice(0, 10) })
    api.get(`/tm/relatorios/exportar-pedidos?${params}`).then(res => {
      const dados = Array.isArray(res.data) ? res.data : []
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('Relatório do Mês Anterior', 14, 15)
      doc.setFontSize(10)
      doc.text(`${inicioMesAnt.toLocaleDateString('pt-PT')} — ${fimMesAnt.toLocaleDateString('pt-PT')}`, 14, 22)
      autoTable(doc, {
        startY: 30,
        head: [['Consultor', 'Badge', 'Nível', 'Área', 'Estado', 'Data']],
        body: dados.map(d => [d.nomeConsultor, d.nomeBadge, d.nomeNivel, d.nomeArea, d.idEstadoAtual, new Date(d.dataCriacao).toLocaleDateString('pt-PT')]),
        headStyles: { fillColor: [57, 99, 156] }, styles: { fontSize: 9 },
      })
      doc.save('relatorio_mes_anterior.pdf')
      mostrarToast('Relatório do mês anterior exportado com sucesso!', '')
    }).catch(err => console.error('[RelatoriosTM] anterior:', err.response?.data || err.message))
  }

  function gerarRelatorioGrafico() {
    const doc = new jsPDF()
    doc.setFontSize(14)
    if (grafico === 'evolucao') {
      doc.text('Evolução Mensal de Badges', 14, 16)
      autoTable(doc, { startY: 22, head: [['Mês', 'Badges Aprovados']], body: evolucao.map(e => [e.mes, e.total]), headStyles: { fillColor: [57, 99, 156] }, styles: { fontSize: 9 } })
      doc.save('evolucao_mensal.pdf')
      mostrarToast('Relatório exportado com sucesso!', '')
    } else if (grafico === 'area') {
      doc.text('Badges por Área', 14, 16)
      autoTable(doc, { startY: 22, head: [['Área', porArea.labelMesAnterior, porArea.labelMesAtual]], body: porArea.areas.map(a => [a.nome, a.mesAnterior, a.mesAtual]), headStyles: { fillColor: [57, 99, 156] }, styles: { fontSize: 9 } })
      doc.save('badges_por_area.pdf')
      mostrarToast('Relatório exportado com sucesso!', '')
    } else {
      doc.text('Badges por Nível e SLA', 14, 16)
      autoTable(doc, { startY: 22, head: [['Nível', 'Quantidade', '%']], body: porNivel.map(n => [n.nome, n.count, `${n.percentagem}%`]), headStyles: { fillColor: [57, 99, 156] }, styles: { fontSize: 9 } })
      doc.save('badges_por_nivel_sla.pdf')
      mostrarToast('Relatório exportado com sucesso!', '')
    }
  }

  const cartoesKpi = [
    { icone: <MdMilitaryTech />, valor: kpis.badgesAprovados, label: 'Badges Aprovados', sub: `${kpis.badgesAprovadosVariacao >= 0 ? '+' : ''}${kpis.badgesAprovadosVariacao}% Este Mês` },
    { icone: <MdPerson />, valor: `${kpis.taxaAprovacao}%`, label: 'Taxa de Aprovação' },
    { icone: <MdStars />, valor: kpis.consultoresAtivos, label: 'Consultores Ativos' },
    { icone: <MdAccessTime />, valor: kpis.mediaSLA, label: 'Média SLA' },
  ]

  return (
    <LayoutTM>
      <div style={{ fontFamily: 'Poppins, sans-serif', color: '#333' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <h2 style={{ color: '#39639C', fontWeight: 700, margin: 0 }}>Relatórios</h2>
          <button onClick={exportarRelatorioAnterior} style={btnSecundarioStyle}>
            <FiDownload /> Exportar Relatório Anterior
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {cartoesKpi.map((c, i) => (
            <div key={i} style={cardKpiStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={iconeKpiStyle}>{c.icone}</div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>{c.valor}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, textTransform: 'uppercase' }}>{c.label}</div>
                </div>
              </div>
              {c.sub && <div style={{ fontSize: 10, color: '#39639C', fontWeight: 600, marginTop: 8 }}>{c.sub}</div>}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 10, padding: 4 }}>
            {GRAFICO_TABS.map(t => (
              <button key={t.id} onClick={() => setGrafico(t.id)} style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', fontSize: 12, cursor: 'pointer', fontWeight: 600,
                background: grafico === t.id ? '#fff' : 'transparent', color: grafico === t.id ? '#39639C' : '#6b7280',
                boxShadow: grafico === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}>{t.label.toUpperCase()}</button>
            ))}
          </div>
          <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={inputFiltroStyle} />
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={inputFiltroStyle} />
          <select value={nivel} onChange={e => setNivel(e.target.value)} style={inputFiltroStyle}>
            {NIVEIS.map(n => <option key={n} value={n}>{n === 'Todos' ? 'Nível - Todos' : n}</option>)}
          </select>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#aaa', padding: 30 }}>A carregar...</p>
        ) : grafico === 'evolucao' ? (
          <div style={cardChartStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h4 style={tituloChartStyle}>Evolução Mensal</h4>
                <p style={subtituloChartStyle}>Badges atribuídos em cada mês</p>
              </div>
              <button onClick={gerarRelatorioGrafico} style={btnSecundarioStyle}>Gerar Relatório</button>
            </div>
            {evolucao.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#aaa', padding: '30px 0' }}>Sem dados no período selecionado.</p>
            ) : (
            <div style={{ position: 'relative', height: 280 }}>
                <Line
                data={{
                    labels: evolucao.map(e => e.mes),
                    datasets: [{ data: evolucao.map(e => e.total), borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.12)', tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#fff', pointBorderColor: '#06b6d4', pointBorderWidth: 2 }],
                }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#f0f0f0' }, border: { display: false }, beginAtZero: true } } }}
                />
            </div>
            )}
          </div>
        ) : grafico === 'area' ? (
          <div style={cardChartStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h4 style={tituloChartStyle}>Badges por Área</h4>
                <p style={subtituloChartStyle}>Quantidade de badges aprovados por área</p>
              </div>
              <button onClick={gerarRelatorioGrafico} style={btnSecundarioStyle}>Gerar Relatório</button>
            </div>
            {porArea.areas.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#aaa', padding: '30px 0' }}>Sem dados disponíveis.</p>
            ) : (
            <div style={{ position: 'relative', height: 280 }}>
                <Bar
                data={{
                    labels: porArea.areas.map(a => a.nome),
                    datasets: [
                    { label: porArea.labelMesAnterior, data: porArea.areas.map(a => a.mesAnterior), backgroundColor: CORES_AREA[0], borderRadius: 4, barThickness: 20 },
                    { label: porArea.labelMesAtual, data: porArea.areas.map(a => a.mesAtual), backgroundColor: CORES_AREA[1], borderRadius: 4, barThickness: 20 },
                    ],
                }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', align: 'end', labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8 } } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#f0f0f0' }, border: { display: false }, beginAtZero: true } } }}
                />
            </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div style={cardChartStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h4 style={tituloChartStyle}>Badges por Nível</h4>
                  <p style={subtituloChartStyle}>Percentagem de badges atribuídos por nível</p>
                </div>
                <button onClick={gerarRelatorioGrafico} style={btnSecundarioStyle}>Gerar Relatório</button>
              </div>
              {porNivel.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#aaa', padding: '30px 0' }}>Sem dados disponíveis.</p>
                ) : (
                <div style={{ position: 'relative', height: 240 }}>
                    <Doughnut
                    data={{ labels: porNivel.map(n => `${n.nome} (${n.percentagem}%)`), datasets: [{ data: porNivel.map(n => n.percentagem), backgroundColor: ['#2b3a67', '#39639C', '#7dd8f0', '#a0aec0', '#7eecd4'], borderWidth: 0 }] }}
                    options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8 } } } }}
                    />
                </div>
                )}
            </div>

            <div style={cardChartStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h4 style={tituloChartStyle}>Cumprimento de SLA</h4>
                  <p style={subtituloChartStyle}>% de candidaturas validadas dentro do prazo</p>
                </div>
                <button onClick={gerarRelatorioGrafico} style={btnSecundarioStyle}>Gerar Relatório</button>
              </div>
              <div style={{ position: 'relative', width: 200, height: 200, margin: '10px auto 0' }}>
                <Doughnut
                  data={{ datasets: [{ data: [sla.percentagem, 100 - sla.percentagem], backgroundColor: ['#06b6d4', '#e9ecef'], borderWidth: 0 }] }}
                  options={{ cutout: '75%', plugins: { legend: { display: false }, tooltip: { enabled: false } } }}
                />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>{sla.percentagem}%</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Dentro do<br />Prazo</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 8 }}>
          <h4 style={{ color: '#39639C', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Exportar Dados</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {Object.values(EXPORTACOES).map((e, i) => (
              <div key={i} style={cardExportarStyle}>
                <p style={{ fontWeight: 700, fontSize: 12, color: '#333', letterSpacing: 0.5, marginBottom: 16 }}>{e.titulo}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={() => exportarDados(e.endpoint, e.ficheiro, e.colunas, e.celulas, 'excel')} style={btnExportarStyle}>Exportar Excel</button>
                  <button onClick={() => exportarDados(e.endpoint, e.ficheiro, e.colunas, e.celulas, 'pdf')} style={btnExportarStyle}>Exportar PDF</button>
                </div>
              </div>
            ))}

            <div style={cardExportarStyle}>
              <p style={{ fontWeight: 700, fontSize: 12, color: '#333', letterSpacing: 0.5, marginBottom: 16 }}>VALIDAÇÕES</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => setModalValidacoes('excel')} style={btnExportarStyle}>Exportar Excel</button>
                <button onClick={() => setModalValidacoes('pdf')} style={btnExportarStyle}>Exportar PDF</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalValidacoes && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <button onClick={() => setModalValidacoes(null)} style={fecharStyle}>×</button>
            <h4 style={{ color: '#1a1a2e', marginBottom: 6 }}>Validações</h4>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>Escolhe o tipo de validação que queres exportar:</p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
              {[{ id: 'aprovacoes', label: 'Aprovações' }, { id: 'rejeicoes', label: 'Rejeições' }].map(o => (
                <label key={o.id} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  border: '1px solid #ddd', borderRadius: 8, padding: '10px 0', fontSize: 13, cursor: 'pointer',
                  background: tiposValidacoes.includes(o.id) ? '#eef3fa' : '#fff',
                  color: tiposValidacoes.includes(o.id) ? '#39639C' : '#333', fontWeight: 600,
                }}>
                  <input
                    type="checkbox"
                    checked={tiposValidacoes.includes(o.id)}
                    onChange={() => setTiposValidacoes(prev => prev.includes(o.id) ? prev.filter(t => t !== o.id) : [...prev, o.id])}
                    style={{ display: 'none' }}
                  />
                  {o.label}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setModalValidacoes(null)} style={btnCancelarStyle}>Cancelar</button>
              <button onClick={() => exportarValidacoes(modalValidacoes)} disabled={tiposValidacoes.length === 0} style={btnAprovarStyle}>Exportar</button>
            </div>
          </div>
        </div>
      )}
    {toast && (
        <div style={{
            position: 'fixed', bottom: 24, right: 24, background: '#fff', color: '#1a1a2e',
            padding: '14px 18px', borderRadius: 10, fontSize: 13, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 2000, display: 'flex', alignItems: 'flex-start', gap: 12, maxWidth: 380,
        }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#1a1a2e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            <FiCheckCircle size={13} />
            </div>
            <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{toast.titulo}</div>
            {toast.subtitulo && <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{toast.subtitulo}</div>}
            </div>
            <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
        </div>
    )}

    </LayoutTM>
  )
}

const btnSecundarioStyle = { background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '8px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }
const cardKpiStyle = { background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }
const iconeKpiStyle = { width: 40, height: 40, borderRadius: 10, background: '#e8f0fb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#39639C', fontSize: 18, flexShrink: 0 }
const inputFiltroStyle = { padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, outline: 'none', color: '#555' }
const cardChartStyle = { background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 24 }
const tituloChartStyle = { color: '#39639C', fontWeight: 700, fontSize: 14, margin: 0, textTransform: 'uppercase', letterSpacing: 0.3 }
const subtituloChartStyle = { color: '#9ca3af', fontSize: 11, margin: '4px 0 0' }
const cardExportarStyle = { background: '#fff', borderRadius: 12, padding: '18px 16px', textAlign: 'center', border: '1px solid #f0f0f0', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }
const btnExportarStyle = { background: '#fff', border: '1px solid #39639C', color: '#39639C', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
const modalStyle = { background: '#fff', borderRadius: 14, padding: 28, width: '90%', maxWidth: 380, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', position: 'relative' }
const fecharStyle = { position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }
const btnAprovarStyle = { background: '#39639C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const btnCancelarStyle = { background: '#fff', color: '#333', border: '1px solid #ddd', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }