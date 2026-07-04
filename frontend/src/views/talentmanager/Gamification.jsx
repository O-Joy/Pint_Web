import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LayoutTM from './components/LayoutTM'
import api from '../../services/api'
import { FiSearch, FiDownload, FiCheckCircle } from 'react-icons/fi'
import { MdInsertChartOutlined } from 'react-icons/md'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

const StatCard = ({ title, children }) => {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '1px', borderRadius: '10px',
        background: 'linear-gradient(135deg, #00647A 0%, #9CEDFF 36%, #008EAD 62%, #B1D2D9 91%)',
        boxShadow: isHovered ? '0px 10px 25px rgba(0, 0, 0, 0.35)' : '0px 0px 15px rgba(0, 0, 0, 0.25)',
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all 0.3s ease-in-out', cursor: 'default',
      }}
    >
      <div style={{ background: '#ffffff', borderRadius: '9px', padding: '16px', height: '100%' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textAlign: 'center', marginBottom: 16, textTransform: 'uppercase' }}>
          {title}
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Gamification() {
  const navigate = useNavigate()
  const [consultores, setConsultores] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [estatisticas, setEstatisticas] = useState({
    crescimentoMedio: 0, novosConsultoresMes: 0, badgesAprovadosVariacao: 0,
    maiorSubida: [], menorProgresso: [], maiorConsistencia: [], progressoPorArea: [],
  })
  const [toast, setToast] = useState(null)
  const mostrarToast = (titulo, subtitulo = '') => {
   setToast({ titulo, subtitulo })
   setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    api.get('/tm/gamification/todos')
      .then(res => setConsultores(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error('[Gamification TM]', err))
      .finally(() => setLoading(false))

    api.get('/tm/gamification/estatisticas')
      .then(res => setEstatisticas(res.data || {}))
      .catch(err => console.error('[Gamification TM] estatísticas:', err))
  }, [])

  const ranking = consultores.map((c, i) => ({ ...c, posicao: i + 1 }))
  const top3 = ranking.length >= 3 ? ranking.slice(0, 3) : [
    { nome: 'Consultor 1', totalPontos: 0 }, { nome: 'Consultor 2', totalPontos: 0 }, { nome: 'Consultor 3', totalPontos: 0 },
  ]

  const melhorPontuacao = ranking.length > 0 ? ranking[0].totalPontos : 0
  const totalBadgesAprovados = ranking.reduce((acc, c) => acc + (c.totalBadges || 0), 0)

  const rankingFiltrado = ranking.filter(c => c.nome?.toLowerCase().includes(filtro.toLowerCase()))

  const exportarExcel = () => {
    const dados = rankingFiltrado.map(c => ({ 'Posição': c.posicao, 'Consultor': c.nome, 'Pontos': c.totalPontos }))
    const ws = XLSX.utils.json_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Gamification')
    XLSX.writeFile(wb, 'gamification_ranking.xlsx')
    mostrarToast('Os dados foram exportados com sucesso!', 'gamification_ranking.xlsx')
  }

  const exportarPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Gamification - Talent Manager', 14, 15)
    autoTable(doc, {
      startY: 25,
      head: [['Posição', 'Consultor', 'Pontos']],
      body: rankingFiltrado.map(c => [c.posicao, c.nome, c.totalPontos]),
      styles: { fontSize: 10 }, headStyles: { fillColor: [57, 99, 156] },
    })
    doc.save('gamification_ranking.pdf')
    mostrarToast('Os dados foram exportados com sucesso!', 'gamification_ranking.pdf')
  }

  return (
    <LayoutTM>
      <div style={{ fontFamily: 'Poppins, sans-serif', color: '#333' }}>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="fw-bold mb-0 text-primary text-uppercase" style={{ fontSize: 22 }}>Gamification</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={exportarExcel} style={btnStyle}><FiDownload /> Exportar Excel</button>
            <button onClick={exportarPDF} style={btnStyle}><FiDownload /> Exportar PDF</button>
          </div>
        </div>

        <div className="input-group mb-4" style={{ width: 400, maxWidth: '100%' }}>
          <span className="input-group-text"><FiSearch className="text-secondary" /></span>
          <input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Pesquisar Consultor..." className="form-control" />
        </div>

        <div className="row g-3" style={{ marginBottom: 24 }}>
          {[
            { label: 'MELHOR PONTUAÇÃO', valor: melhorPontuacao, sub: null },
            { label: 'CRESCIMENTO MÉDIO', valor: `${estatisticas.crescimentoMedio}%`, sub: null },
            { label: 'TOTAL CONSULTORES', valor: consultores.length, sub: `+${estatisticas.novosConsultoresMes} ESTE MÊS` },
            { label: 'BADGES APROVADOS', valor: totalBadgesAprovados, sub: `${estatisticas.badgesAprovadosVariacao > 0 ? '+' : ''}${estatisticas.badgesAprovadosVariacao}% ESTE MÊS` },
          ].map((kpi, i) => (
            <div key={i} className="col-12 col-sm-6 col-lg-3">
              <div className="card h-100">
                <div className="card-body d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0 text-primary" style={{ width: 40, height: 40, background: '#f0f4f8', fontSize: 20 }}>
                    <MdInsertChartOutlined />
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>{kpi.valor}</div>
                    <div style={{ fontSize: 10, color: '#666', fontWeight: 600 }}>{kpi.label}</div>
                    {kpi.sub && <div style={{ fontSize: 9, color: '#a0a0a0', marginTop: 2 }}>{kpi.sub}</div>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-4" style={{ marginBottom: 24 }}>
          <div className="col-12 col-lg-6">
            <div className="card h-100">
              <div className="card-body">
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#39639C', marginBottom: 40 }}>TOP 3</h4>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '8px', height: '170px', paddingBottom: '16px' }}>

                  <div style={{ position: 'relative', width: '130px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ position: 'absolute', top: '-20px', width: '44px', height: '44px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff', zIndex: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.05)', fontSize: 14, fontWeight: 'bold', color: '#475569' }}>
                      {top3[1]?.nome?.[0] || '2'}
                    </div>
                    <div style={{ width: '100%', height: '100px', background: 'linear-gradient(180deg, rgba(186, 230, 253, 0.4) 0%, rgba(56, 189, 248, 0.8) 100%)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '16px', boxShadow: '0 4px 15px rgba(56, 189, 248, 0.2)', position: 'relative' }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: '#1e293b', textAlign: 'center', padding: '0 8px', lineHeight: 1.2 }}>{top3[1]?.nome}</span>
                      <span style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>2</span>
                      <div style={{ position: 'absolute', bottom: '-12px', background: '#0284c7', color: '#fff', padding: '4px 16px', borderRadius: '16px', fontSize: '11px', fontWeight: 'bold' }}>
                        {top3[1]?.totalPontos} pts
                      </div>
                    </div>
                  </div>

                  <div style={{ position: 'relative', width: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 5 }}>
                    <div style={{ position: 'absolute', top: '-24px', width: '52px', height: '52px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #fff', zIndex: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.05)', fontSize: 16, fontWeight: 'bold', color: '#475569' }}>
                      {top3[0]?.nome?.[0] || '1'}
                    </div>
                    <div style={{ width: '100%', height: '130px', background: 'linear-gradient(180deg, rgba(167, 243, 208, 0.4) 0%, rgba(52, 211, 153, 0.8) 100%)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '20px', boxShadow: '0 4px 20px rgba(52, 211, 153, 0.3)', position: 'relative' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b', textAlign: 'center', padding: '0 8px', lineHeight: 1.2 }}>{top3[0]?.nome}</span>
                      <span style={{ fontSize: '30px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>1</span>
                      <div style={{ position: 'absolute', bottom: '-14px', background: '#16a34a', color: '#fff', padding: '6px 20px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}>
                        {top3[0]?.totalPontos} pts
                      </div>
                    </div>
                  </div>

                  <div style={{ position: 'relative', width: '130px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ position: 'absolute', top: '-20px', width: '44px', height: '44px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff', zIndex: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.05)', fontSize: 14, fontWeight: 'bold', color: '#475569' }}>
                      {top3[2]?.nome?.[0] || '3'}
                    </div>
                    <div style={{ width: '100%', height: '85px', background: 'linear-gradient(180deg, rgba(199, 210, 254, 0.4) 0%, rgba(129, 140, 248, 0.8) 100%)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '16px', boxShadow: '0 4px 15px rgba(129, 140, 248, 0.2)', position: 'relative' }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: '#1e293b', textAlign: 'center', padding: '0 8px', lineHeight: 1.2 }}>{top3[2]?.nome}</span>
                      <span style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>3</span>
                      <div style={{ position: 'absolute', bottom: '-12px', background: '#4f46e5', color: '#fff', padding: '4px 16px', borderRadius: '16px', fontSize: '11px', fontWeight: 'bold' }}>
                        {top3[2]?.totalPontos} pts
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="card h-100">
              <div className="card-body">
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#39639C', marginBottom: 16 }}>Total de Pontos na sua área</h4>
                <div style={{ height: 180 }}>
                  <Line
                    data={{
                      labels: estatisticas.evolucaoPontos?.map(e => e.mes.toUpperCase()) || [],
                      datasets: [{
                        label: 'Pontos', data: estatisticas.evolucaoPontos?.map(e => e.total) || [],
                        borderColor: '#06b6d4', backgroundColor: '#06b6d4', tension: 0.4,
                        pointRadius: 5, pointBackgroundColor: '#fff', pointBorderWidth: 2, borderWidth: 2,
                      }],
                    }}
                    options={{
                      responsive: true, maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { grid: { borderDash: [4, 4], color: '#f1f5f9' }, ticks: { font: { size: 10 }, color: '#94a3b8' } },
                        y: { grid: { borderDash: [4, 4], color: '#f1f5f9' }, ticks: { font: { size: 10 }, color: '#94a3b8' } },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: 24 }}>

          <div className="card">
            <div className="card-body">
              {loading ? (
                <p style={{ textAlign: 'center', color: '#aaa' }}>A carregar ranking...</p>
              ) : rankingFiltrado.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#aaa' }}>Nenhum consultor encontrado.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th className="text-center">Posição</th>
                        <th>Consultor</th>
                        <th className="text-end">Pontos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankingFiltrado.map((c) => (
                        <tr key={c.idUtilizador} onClick={() => navigate(`/talent/consultores/${c.idUtilizador}`)} style={{ cursor: 'pointer' }}>
                          <td className="text-center fw-bold text-primary">{c.posicao}º</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#64748b' }}>
                                {c.nome?.[0]}
                              </div>
                              <span>{c.nome}</span>
                            </div>
                          </td>
                          <td className="text-end text-secondary">{c.totalPontos} pts</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#39639C', margin: '0 0 -8px 0', textTransform: 'uppercase' }}>Outras Estatísticas</h4>

            <StatCard title="TOP 3: MAIOR SUBIDA ESTE MÊS">
              {(estatisticas.maiorSubida?.length ? estatisticas.maiorSubida : top3).map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '8px 0', borderBottom: i !== 2 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, color: '#39639C' }}>{i + 1}º</span>
                    <span style={{ color: '#333' }}>{c.nome}</span>
                  </div>
                  <span style={{ color: '#22c55e', fontWeight: 600 }}>+{c.pontosMesAtual ?? 0}</span>
                </div>
              ))}
            </StatCard>

            <StatCard title="TOP 3: MENOR PROGRESSO ESTE MÊS">
              {(estatisticas.menorProgresso?.length ? estatisticas.menorProgresso : top3).map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '8px 0', borderBottom: i !== 2 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#e2e8f0', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.nome?.[0]}</div>
                    <span style={{ color: '#333' }}>{c.nome}</span>
                  </div>
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>+{c.pontosMesAtual ?? 0}</span>
                </div>
              ))}
            </StatCard>

            <StatCard title="TOP 3: CONSISTÊNCIA DE EQUIPA">
              {(estatisticas.maiorConsistencia?.length ? estatisticas.maiorConsistencia : top3).map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '8px 0', borderBottom: i !== 2 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, color: '#39639C' }}>{i + 1}º</span>
                    <span style={{ color: '#333' }}>{c.nome}</span>
                  </div>
                  <div style={{ textAlign: 'center', lineHeight: 1 }}>
                    <span style={{ color: '#06b6d4', fontWeight: 600 }}>{c.streak ?? 0}</span><br />
                    <span style={{ fontSize: 8, color: '#94a3b8' }}>Meses</span>
                  </div>
                </div>
              ))}
            </StatCard>

            <StatCard title="PROGRESSO DA EQUIPA POR ÁREA">
              {(estatisticas.progressoPorArea?.length ? estatisticas.progressoPorArea : []).map((a, i) => (
                <div key={i} style={{ marginBottom: i !== (estatisticas.progressoPorArea.length - 1) ? 14 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 6 }}>
                    <span style={{ color: '#333', fontWeight: 500 }}>{i + 1}º {a.nomeArea}</span>
                    <span style={{ color: '#94a3b8', fontWeight: 500 }}>{a.totalPontos} PTS</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 4 }}>
                    <div style={{ width: `${a.percentagem}%`, height: '100%', background: '#06b6d4', borderRadius: 4 }}></div>
                  </div>
                </div>
              ))}
              {!estatisticas.progressoPorArea?.length && <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Sem dados disponíveis.</p>}
            </StatCard>

          </div>
        </div>
      </div>
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
const btnStyle = { background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '8px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }