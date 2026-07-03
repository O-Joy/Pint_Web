// src/views/serviceline/Relatorios.jsx
// Página de Relatórios do Service Line Leader — KPIs, gráficos e exportação de dados.

import { useState, useEffect, useCallback } from 'react'
import LayoutSL from './components/LayoutSL'
import api from '../../services/api'
import Footer from '../../components/Footer'
import { FiDownload, FiCalendar } from 'react-icons/fi'
import { MdMilitaryTech, MdPerson, MdStars, MdAccessTime } from 'react-icons/md'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Line, Pie, Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement, Filler, Tooltip, Legend,
} from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend)

const NIVEIS = ['Todos', 'Júnior', 'Intermédio', 'Sénior', 'Especialista', 'Líder de Conhecimento']

const GRAFICO_TABS = [
  { id: 'evolucao', label: 'Evolução' },
  { id: 'area',     label: 'Por Área' },
  { id: 'nivelsla', label: 'Por Nível/SLA' },
]

const CORES_AREA = ['#7dd8f0', '#7eecd4']

export default function Relatorios() {
  const [kpis, setKpis] = useState({ badgesAprovados: 0, badgesAprovadosVariacao: 0, taxaAprovacao: 0, consultoresComBadge: 0, mediaSLA: 0, mediaSLAVariacao: 0 })
  const [evolucao, setEvolucao] = useState([])
  const [porArea, setPorArea] = useState({ labelMesAnterior: '', labelMesAtual: '', areas: [] })
  const [porNivel, setPorNivel] = useState([])
  const [sla, setSla] = useState({ percentagem: 0 })

  const [grafico, setGrafico] = useState('evolucao')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [nivel, setNivel] = useState('Todos')
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (dataInicio) params.append('dataInicio', dataInicio)
    if (dataFim)    params.append('dataFim', dataFim)
    if (nivel && nivel !== 'Todos') params.append('nivel', nivel)
    const qs = params.toString()

    Promise.all([
      api.get('/sl/relatorios/kpis'),
      api.get(`/sl/relatorios/evolucao-mensal?${qs}`),
      api.get(`/sl/relatorios/por-area?${qs}`),
      api.get(`/sl/relatorios/por-nivel?${qs}`),
      api.get(`/sl/relatorios/sla?${qs}`),
    ]).then(([kpisRes, evolRes, areaRes, nivelRes, slaRes]) => {
      setKpis(kpisRes.data || {})
      setEvolucao(Array.isArray(evolRes.data) ? evolRes.data : [])
      setPorArea(areaRes.data && areaRes.data.areas ? areaRes.data : { labelMesAnterior: '', labelMesAtual: '', areas: [] })
      setPorNivel(Array.isArray(nivelRes.data) ? nivelRes.data : [])
      setSla(slaRes.data || { percentagem: 0 })
    }).catch(err => console.error('[Relatorios] ERRO:', err.response?.status, err.response?.data || err.message))
      .finally(() => setLoading(false))
  }, [dataInicio, dataFim, nivel])

  useEffect(() => { carregar() }, [carregar])

  // ── Exportação genérica de um endpoint de dados (Excel/PDF) ──
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
        autoTable(doc, {
          startY: 22,
          head: [colunas],
          body: dados.map(d => getCelulas(d)),
          headStyles: { fillColor: [57, 99, 156] },
          styles: { fontSize: 9 },
        })
        doc.save(`${nomeFicheiro}.pdf`)
      }
    }).catch(err => console.error('[Relatorios] exportar:', err.response?.data || err.message))
  }

  const EXPORTACOES = {
    badges: {
      titulo: 'BADGES', endpoint: '/sl/relatorios/exportar-badges', ficheiro: 'badges_atribuidos',
      colunas: ['Consultor', 'Badge', 'Nível', 'Área', 'Data Atribuição', 'Válido'],
      celulas: d => [d.nomeConsultor, d.nomeBadge, d.nomeNivel, d.nomeArea, new Date(d.dataAtribuicao).toLocaleDateString('pt-PT'), d.valido],
    },
    pedidos: {
      titulo: 'PEDIDOS', endpoint: '/sl/relatorios/exportar-pedidos', ficheiro: 'pedidos',
      colunas: ['Consultor', 'Badge', 'Nível', 'Área', 'Estado', 'Data'],
      celulas: d => [d.nomeConsultor, d.nomeBadge, d.nomeNivel, d.nomeArea, d.nomeEstado, new Date(d.dataCriacao).toLocaleDateString('pt-PT')],
    },
    consultores: {
      titulo: 'CONSULTORES', endpoint: '/sl/relatorios/exportar-consultores', ficheiro: 'consultores',
      colunas: ['Nome', 'Email', 'Área', 'Badges', 'Pontos'],
      celulas: d => [d.nome, d.email, d.nomeArea, d.totalBadges, d.totalPontos],
    },
    validacoes: {
      titulo: 'VALIDAÇÕES', endpoint: '/sl/relatorios/exportar-validacoes', ficheiro: 'validacoes',
      colunas: ['Consultor', 'Badge', 'Estado', 'Data', 'Responsável', 'Comentário'],
      celulas: d => [d.nomeConsultor, d.nomeBadge, d.nomeEstado, new Date(d.dataValidacao).toLocaleDateString('pt-PT'), d.responsavel, d.comentario],
    },
  }

  // ── Exportar Relatório Anterior — snapshot em PDF do mês passado ──
  function exportarRelatorioAnterior() {
    const hoje = new Date()
    const inicioMesAnt = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
    const fimMesAnt = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
    const params = new URLSearchParams({
      dataInicio: inicioMesAnt.toISOString().slice(0, 10),
      dataFim: fimMesAnt.toISOString().slice(0, 10),
    })
    api.get(`/sl/relatorios/candidaturas?${params}`).then(res => {
      const dados = Array.isArray(res.data) ? res.data : []
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('Relatório do Mês Anterior', 14, 15)
      doc.setFontSize(10)
      doc.text(`${inicioMesAnt.toLocaleDateString('pt-PT')} — ${fimMesAnt.toLocaleDateString('pt-PT')}`, 14, 22)
      autoTable(doc, {
        startY: 30,
        head: [['Consultor', 'Badge', 'Nível', 'Área', 'Estado', 'Data']],
        body: dados.map(d => [d.nomeConsultor, d.nomeBadge, d.nomeNivel, d.nomeArea, d.nomeEstado, new Date(d.dataCriacao).toLocaleDateString('pt-PT')]),
        headStyles: { fillColor: [57, 99, 156] },
        styles: { fontSize: 9 },
      })
      doc.save('relatorio_mes_anterior.pdf')
    }).catch(err => console.error('[Relatorios] anterior:', err.response?.data || err.message))
  }

  // ── "Gerar Relatório" por gráfico — exporta os dados subjacentes em PDF ──
  function gerarRelatorioGrafico() {
    const doc = new jsPDF()
    doc.setFontSize(14)
    if (grafico === 'evolucao') {
      doc.text('Evolução Mensal de Badges', 14, 16)
      autoTable(doc, { startY: 22, head: [['Mês', 'Badges Atribuídos']], body: evolucao.map(e => [e.mes, e.total]), headStyles: { fillColor: [57, 99, 156] }, styles: { fontSize: 9 } })
      doc.save('evolucao_mensal.pdf')
    } else if (grafico === 'area') {
      doc.text('Badges por Área', 14, 16)
      autoTable(doc, {
        startY: 22,
        head: [['Área', porArea.labelMesAnterior, porArea.labelMesAtual]],
        body: porArea.areas.map(a => [a.nome, a.mesAnterior, a.mesAtual]),
        headStyles: { fillColor: [57, 99, 156] }, styles: { fontSize: 9 },
      })
      doc.save('badges_por_area.pdf')
    } else {
      doc.text('Badges por Nível e Cumprimento de SLA', 14, 16)
      autoTable(doc, { startY: 22, head: [['Nível', 'Badges', '%']], body: porNivel.map(n => [n.nome, n.count, `${n.percentagem}%`]), headStyles: { fillColor: [57, 99, 156] }, styles: { fontSize: 9 } })
      doc.text(`Cumprimento de SLA: ${sla.percentagem}%`, 14, doc.lastAutoTable.finalY + 10)
      doc.save('nivel_sla.pdf')
    }
  }

  const corVariacao = (v) => (v > 0 ? '#16a34a' : v < 0 ? '#dc2626' : '#9ca3af')
  const KPI_CARDS = [
    {
      icon: <MdMilitaryTech />, valor: kpis.badgesAprovados, label: 'BADGES APROVADOS',
      nota: `${kpis.badgesAprovadosVariacao > 0 ? '+' : ''}${kpis.badgesAprovadosVariacao}% este mês`,
      corNota: corVariacao(kpis.badgesAprovadosVariacao),
    },
    { icon: <MdPerson />, valor: `${kpis.taxaAprovacao}%`, label: 'TAXA DE APROVAÇÃO', nota: null },
    { icon: <MdStars />, valor: kpis.consultoresComBadge, label: 'CONSULTORES COM PELO MENOS 1 BADGE', nota: null },
    {
      icon: <MdAccessTime />, valor: kpis.mediaSLA, label: 'MÉDIA SLA (HORAS)',
      nota: kpis.mediaSLAVariacao !== 0 ? `${kpis.mediaSLAVariacao > 0 ? '+' : ''}${kpis.mediaSLAVariacao}h esta semana` : null,
      corNota: corVariacao(-kpis.mediaSLAVariacao),
    },
  ]

  return (
    <LayoutSL>
      <div style={{ fontFamily: 'Poppins, sans-serif' }}>

        {/* ── Cabeçalho ── */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <h2 className="fw-bold mb-0 text-primary" style={{ fontSize: 22 }}>Relatórios</h2>
          <button onClick={exportarRelatorioAnterior} className="btn btn-outline-primary btn-sm">
            Exportar Relatório Anterior
          </button>
        </div>

        {/* ── KPIs ── */}
        <div className="row g-3" style={{ marginBottom: 20 }}>
          {KPI_CARDS.map((c, i) => (
            <div key={i} className="col-12 col-sm-6 col-lg-3">
            <div className="card h-100">
              <div className="card-body d-flex align-items-center gap-3">
              <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0 text-primary"
                style={{ width: 42, height: 42, background: '#e8f0fb', fontSize: 20 }}>
                {c.icon}
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>{c.valor}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, fontWeight: 600, letterSpacing: 0.3 }}>{c.label}</div>
                {c.nota && <div style={{ fontSize: 11, color: c.corNota, marginTop: 2, fontWeight: 600 }}>{c.nota}</div>}
              </div>
              </div>
            </div>
            </div>
          ))}
        </div>

        {/* ── Tabs de gráfico + filtros ── */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
          <ul className="nav nav-pills gap-1" style={{ background: '#f3f4f6', borderRadius: 10, padding: 4, width: 'fit-content' }}>
            {GRAFICO_TABS.map(t => (
              <li className="nav-item" key={t.id}>
                <button onClick={() => setGrafico(t.id)} className={`nav-link small text-uppercase ${grafico === t.id ? 'active' : ''}`} style={{ letterSpacing: 0.3 }}>
                  {t.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="d-flex gap-2 flex-wrap">
            <div className="input-group" style={{ width: 'auto' }}>
              <span className="input-group-text"><FiCalendar className="text-secondary" /></span>
              <input type="date" className="form-control" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
              <span className="input-group-text">–</span>
              <input type="date" className="form-control" value={dataFim} onChange={e => setDataFim(e.target.value)} />
            </div>
            <select value={nivel} onChange={e => setNivel(e.target.value)} className="form-select" style={{ width: 'auto' }}>
              {NIVEIS.map(n => <option key={n} value={n}>{n === 'Todos' ? 'Nível - Todos' : n}</option>)}
            </select>
          </div>
        </div>

        {/* ── Gráfico(s) ── */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>A carregar...</div>
        ) : grafico === 'evolucao' ? (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h4 style={{ color: '#39639C', fontWeight: 700, fontSize: 14, margin: 0, textTransform: 'uppercase', letterSpacing: 0.3 }}>Evolução Mensal</h4>
                <p style={{ color: '#9ca3af', fontSize: 11, margin: '4px 0 0' }}>Badges atribuídos na sua Service Line em cada mês</p>
              </div>
              <button onClick={gerarRelatorioGrafico} className="btn btn-outline-primary btn-sm flex-shrink-0">Gerar Relatório</button>
            </div>
            {evolucao.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#aaa', padding: '30px 0' }}>Sem dados no período selecionado.</p>
            ) : (
              <Line
                data={{
                  labels: evolucao.map(e => e.mes),
                  datasets: [{
                    data: evolucao.map(e => e.total),
                    borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.12)',
                    tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#fff', pointBorderColor: '#06b6d4', pointBorderWidth: 2,
                  }],
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                    y: { grid: { color: '#f0f0f0' }, border: { display: false }, ticks: { font: { size: 11 } }, beginAtZero: true },
                  },
                }}
              />
            )}
            </div>
          </div>
        ) : grafico === 'area' ? (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h4 style={{ color: '#39639C', fontWeight: 700, fontSize: 14, margin: 0, textTransform: 'uppercase', letterSpacing: 0.3 }}>Badges por Área</h4>
                <p style={{ color: '#9ca3af', fontSize: 11, margin: '4px 0 0' }}>Quantidade de badges que tem cada área na sua Service Line</p>
              </div>
              <button onClick={gerarRelatorioGrafico} className="btn btn-outline-primary btn-sm flex-shrink-0">Gerar Relatório</button>
            </div>
            {porArea.areas.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#aaa', padding: '30px 0' }}>Sem dados disponíveis.</p>
            ) : (
              <Bar
                data={{
                  labels: porArea.areas.map(a => a.nome),
                  datasets: [
                    { label: porArea.labelMesAnterior, data: porArea.areas.map(a => a.mesAnterior), backgroundColor: CORES_AREA[0], borderRadius: 4, barThickness: 20 },
                    { label: porArea.labelMesAtual,     data: porArea.areas.map(a => a.mesAtual),     backgroundColor: CORES_AREA[1], borderRadius: 4, barThickness: 20 },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top', align: 'end', labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8, font: { size: 11 } } },
                  },
                  scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                    y: { grid: { color: '#f0f0f0' }, border: { display: false }, ticks: { font: { size: 11 } }, beginAtZero: true },
                  },
                }}
              />
            )}
            </div>
          </div>
        ) : (
          <div className="row g-4" style={{ marginBottom: 24 }}>
            <div className="col-12 col-lg-6">
            <div className="card h-100">
              <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h4 style={{ color: '#39639C', fontWeight: 700, fontSize: 14, margin: 0, textTransform: 'uppercase', letterSpacing: 0.3 }}>Badges por Nível</h4>
                  <p style={{ color: '#9ca3af', fontSize: 11, margin: '4px 0 0' }}>Percentagem de badges disponíveis em cada nível na sua Service Line</p>
                </div>
                <button onClick={gerarRelatorioGrafico} className="btn btn-outline-primary btn-sm flex-shrink-0">Gerar Relatório</button>
              </div>
              {porNivel.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#aaa', padding: '30px 0' }}>Sem dados disponíveis.</p>
              ) : (
                <Pie
                  data={{
                    labels: porNivel.map(n => `${n.nome} (${n.percentagem}%)`),
                    datasets: [{
                      data: porNivel.map(n => n.percentagem),
                      backgroundColor: ['#2b3a67', '#39639C', '#7dd8f0', '#a0aec0', '#7eecd4'],
                      borderWidth: 0,
                    }],
                  }}
                  options={{
                    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8, font: { size: 11 } } } },
                  }}
                />
              )}
              </div>
            </div>
            </div>

            <div className="col-12 col-lg-6">
            <div className="card h-100">
              <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h4 style={{ color: '#39639C', fontWeight: 700, fontSize: 14, margin: 0, textTransform: 'uppercase', letterSpacing: 0.3 }}>Cumprimento de SLA</h4>
                  <p style={{ color: '#9ca3af', fontSize: 11, margin: '4px 0 0' }}>Percentagem de badges atribuídos dentro do prazo na sua Service Line</p>
                </div>
                <button onClick={gerarRelatorioGrafico} className="btn btn-outline-primary btn-sm flex-shrink-0">Gerar Relatório</button>
              </div>
              <div style={{ position: 'relative', width: 220, height: 220, margin: '10px auto 0' }}>
                <Doughnut
                  data={{
                    datasets: [{
                      data: [sla.percentagem, 100 - sla.percentagem],
                      backgroundColor: ['#06b6d4', '#e9ecef'],
                      borderWidth: 0,
                    }],
                  }}
                  options={{ cutout: '75%', plugins: { legend: { display: false }, tooltip: { enabled: false } } }}
                />
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1a2e' }}>{sla.percentagem}%</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Dentro do Prazo<br />SLA</div>
                </div>
              </div>
            </div>
            </div>
            </div>
          </div>
        )}

        {/* ── Exportar Dados ── */}
        <div style={{ marginTop: 8 }}>
          <h4 style={{ color: '#39639C', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Exportar Dados</h4>
          <div className="row g-3">
            {Object.values(EXPORTACOES).map((e, i) => (
              <div key={i} className="col-12 col-sm-6 col-lg-3">
              <div className="card text-center">
                <div className="card-body">
                <p style={{ fontWeight: 700, fontSize: 12, color: '#333', letterSpacing: 0.5, marginBottom: 16 }}>{e.titulo}</p>
                <div className="d-flex flex-column gap-2">
                  <button onClick={() => exportarDados(e.endpoint, e.ficheiro, e.colunas, e.celulas, 'excel')} className="btn btn-outline-primary btn-sm">
                    <FiDownload className="me-1" /> Exportar Excel
                  </button>
                  <button onClick={() => exportarDados(e.endpoint, e.ficheiro, e.colunas, e.celulas, 'pdf')} className="btn btn-outline-primary btn-sm">
                    <FiDownload className="me-1" /> Exportar PDF
                  </button>
                </div>
                </div>
              </div>
              </div>
            ))}
          </div>
        </div>

        <Footer />
      </div>
    </LayoutSL>
  )
}
