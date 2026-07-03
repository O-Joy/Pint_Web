// src/views/serviceline/Gamification.jsx
import { useState, useEffect } from 'react'
import LayoutSL from './components/LayoutSL'
import api from '../../services/api'
import Footer from '../../components/Footer'
import { FiDownload, FiSearch } from 'react-icons/fi'
import { MdInsertChartOutlined } from 'react-icons/md'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Line } from 'react-chartjs-2'
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Tooltip, 
  Legend 
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

// ── COMPONENTE AUXILIAR PARA OS CARTÕES COM GRADIENTE E HOVER ──
const StatCard = ({ title, children }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '1px', // Espessura da borda
        borderRadius: '10px',
        // Gradiente linear exato do Figma 
        background: 'linear-gradient(135deg, #00647A 0%, #9CEDFF 36%, #008EAD 62%, #B1D2D9 91%)',
        // Sombra base e sombra do Hover
        boxShadow: isHovered ? '0px 10px 25px rgba(0, 0, 0, 0.35)' // Aumenta a sombra por baixo
        : '0px 0px 15px rgba(0, 0, 0, 0.25)', // Sombra default do Figma
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)', // Efeito de levantar
        transition: 'all 0.3s ease-in-out',
        cursor: 'default'
      }}
    >
      <div style={{
        background: '#ffffff',
        borderRadius: '9px', // 10px da borda exterior - 1px de espessura
        padding: '16px',
        height: '100%'
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textAlign: 'center', marginBottom: 16, textTransform: 'uppercase' }}>
          {title}
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Gamification() {
  const [consultores, setConsultores] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [estatisticas, setEstatisticas] = useState({
    crescimentoMedio: 0, novosConsultoresMes: 0, badgesAprovadosVariacao: 0,
    maiorSubida: [], menorProgresso: [], maiorConsistencia: [], progressoPorArea: [],
  })

    useEffect(() => {
        api.get('/sl/gamification/todos') // <- Mudei aqui!
        .then(res => setConsultores(Array.isArray(res.data) ? res.data : []))
        .catch((err) => console.error("Erro ao carregar ranking global:", err)) // Adicionei um console.error para te ajudar a ver erros caso a rota falhe
        .finally(() => setLoading(false))

        api.get('/sl/gamification/estatisticas')
        .then(res => setEstatisticas(res.data || {}))
        .catch((err) => console.error("Erro ao carregar estatísticas de gamification:", err))
    }, [])

  const ranking = consultores.map((c, i) => {
    const evolucaoSimulada = i % 2 === 0 ? 3 : -1; 
    return { ...c, posicao: i + 1, evolucao: evolucaoSimulada }
  })

  // Garantir que temos 3 posições mesmo que a API demore ou não devolva
  const top3 = ranking.length >= 3 ? ranking.slice(0, 3) : [
    { nome: 'Consultor 1', totalPontos: 0 },
    { nome: 'Consultor 2', totalPontos: 0 },
    { nome: 'Consultor 3', totalPontos: 0 }
  ]
  
  const melhorPontuacao = ranking.length > 0 ? ranking[0].totalPontos : 0
  const totalBadgesAprovados = ranking.reduce((acc, c) => acc + (c.totalBadges || 0), 0)

  const rankingFiltrado = ranking.filter(c => c.nome?.toLowerCase().includes(filtro.toLowerCase()))

  const exportarExcel = () => {
    const dados = rankingFiltrado.map(c => ({
      'Posição': c.posicao,
      'Consultor': c.nome,
      'Pontos': c.totalPontos,
      'Evolução': c.evolucao
    }))
    const ws = XLSX.utils.json_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Gamification')
    XLSX.writeFile(wb, 'gamification_ranking.xlsx')
  }

  const exportarPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Gamification - Ranking Service Line', 14, 15)
    autoTable(doc, {
      startY: 25,
      head: [['Posição', 'Consultor', 'Pontos', 'Evolução']],
      body: rankingFiltrado.map(c => [c.posicao, c.nome, c.totalPontos, c.evolucao]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [57, 99, 156] },
    })
    doc.save('gamification_ranking.pdf')
  }

  return (
    <LayoutSL>
      <div style={{ fontFamily: 'Poppins, sans-serif', color: '#333' }}>
        
        {/* ── HEADER E PESQUISA ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ color: '#39639C', fontWeight: 700,fontSize: '22px', margin: 0, textTransform: 'uppercase' }}>Gamification</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={exportarExcel} style={{ background: '#fff', color: '#39639C', border: '1px solid #39639C', borderRadius: 8, padding: '8px 16px', fontSize: 12, cursor: 'pointer' }}>
              Exportar Excel
            </button>
            <button onClick={exportarPDF} style={{ background: '#fff', color: '#39639C', border: '1px solid #39639C', borderRadius: 8, padding: '8px 16px', fontSize: 12, cursor: 'pointer' }}>
              Exportar PDF
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 10, padding: '9px 14px', width: 400, maxWidth: '100%', marginBottom: 24, boxShadow: '0 5px 40px rgba(237,237,237,1)' }}>
          <FiSearch style={{ color: '#9ca3af', flexShrink: 0 }} />
          <input
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            placeholder="Pesquisar Consultor..."
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13 }}
          />
        </div>

        {/* ── KPIs ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'MELHOR PONTUAÇÃO', valor: melhorPontuacao, sub: null },
            { label: 'CRESCIMENTO MÉDIO', valor: `${estatisticas.crescimentoMedio}%`, sub: null },
            { label: 'TOTAL CONSULTORES', valor: consultores.length, sub: `+${estatisticas.novosConsultoresMes} ESTE MÊS` },
            { label: 'BADGES APROVADOS', valor: totalBadgesAprovados, sub: `${estatisticas.badgesAprovadosVariacao > 0 ? '+' : ''}${estatisticas.badgesAprovadosVariacao}% ESTE MÊS` },
          ].map((kpi, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '20px', display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #f0f0f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ width: 40, height: 40, background: '#f0f4f8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#39639C', fontSize: 20 }}>
                <MdInsertChartOutlined />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>{kpi.valor}</div>
                <div style={{ fontSize: 10, color: '#666', fontWeight: 600 }}>{kpi.label}</div>
                {kpi.sub && <div style={{ fontSize: 9, color: '#a0a0a0', marginTop: 2 }}>{kpi.sub}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* ── PÓDIO TOP 3 E GRÁFICO ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          
          {/* Pódio Top 3 Exato */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #f0f0f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#39639C', marginBottom: 40 }}>TOP 3</h4>
            
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '8px', height: '170px', paddingBottom: '16px' }}>
              
              {/* 2º LUGAR */}
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

              {/* 1º LUGAR */}
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

              {/* 3º LUGAR */}
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

          {/* Gráfico */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #f0f0f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#39639C', marginBottom: 16 }}>Total de Pontos na sua área</h4>
            <div style={{ height: 180 }}>
              <Line 
                data={{
                  labels: estatisticas.evolucaoPontos?.map(e => e.mes.toUpperCase()) || [],
                  datasets: [{
                    label: 'Pontos',
                    data: estatisticas.evolucaoPontos?.map(e => e.total) || [],
                    borderColor: '#06b6d4',
                    backgroundColor: '#06b6d4',
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: '#fff',
                    pointBorderWidth: 2,
                    borderWidth: 2
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { borderDash: [4, 4], color: '#f1f5f9' }, ticks: { font: { size: 10 }, color: '#94a3b8' } },
                    y: { grid: { borderDash: [4, 4], color: '#f1f5f9' }, ticks: { font: { size: 10 }, color: '#94a3b8', stepSize: 2000 } }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* ── TABELA DE RANKING E ESTATÍSTICAS LATERAIS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: 24 }}>
          
          {/* Tabela */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '24px', border: '1px solid #f0f0f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
             {loading ? (
                <p style={{ textAlign: 'center', color: '#aaa' }}>A carregar ranking...</p>
              ) : rankingFiltrado.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#aaa' }}>Nenhum consultor encontrado.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <th style={{ padding: '12px 8px', textAlign: 'center', color: '#1e293b', fontWeight: 600 }}>Posição</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', color: '#1e293b', fontWeight: 600 }}>Consultor</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', color: '#1e293b', fontWeight: 600 }}>Pontos</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', color: '#1e293b', fontWeight: 600 }}>Evolução</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingFiltrado.map((c) => (
                      <tr 
                        key={c.idUtilizador} 
                        style={{ 
                          borderBottom: '1px solid #f9f9f9', 
                          // Se for da equipa, pinta de cinzento claro, senão fundo normal (branco)
                          background: c.isMinhaSL ? '#f1f5f9' : '#fff' 
                        }}
                      >
                        <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700, color: '#39639C' }}>
                          {c.posicao}º
                        </td>
                        <td style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ 
                            width: 24, height: 24, borderRadius: '50%', 
                            background: c.isMinhaSL ? '#cbd5e1' : '#e2e8f0', // Avatar um pouco mais escuro se for da equipa
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            fontSize: 10, color: '#64748b' 
                          }}>
                            {c.nome?.[0]}
                          </div>
                          <span style={{ 
                            fontWeight: c.isMinhaSL ? 600 : 400, 
                            color: c.isMinhaSL ? '#39639C' : '#1e293b' 
                          }}>
                            {c.nome}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', color: '#64748b' }}>
                          {c.totalPontos} pts
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 600, color: c.evolucao > 0 ? '#22c55e' : '#ef4444' }}>
                          {c.evolucao > 0 ? `+${c.evolucao}` : c.evolucao}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>

          {/* Outras Estatísticas com StatCard Animado e com Gradientes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#39639C', margin: '0 0 -8px 0', textTransform: 'uppercase' }}>Outras Estatísticas</h4>
            
            {/* Top 3 Maior Subida */}
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

            {/* Top 3 Menor Progresso */}
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

             {/* Top 3 Consistência */}
             <StatCard title="TOP 3: CONSISTÊNCIA DE EQUIPA">
              {(estatisticas.maiorConsistencia?.length ? estatisticas.maiorConsistencia : top3).map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '8px 0', borderBottom: i !== 2 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, color: '#39639C' }}>{i + 1}º</span>
                    <span style={{ color: '#333' }}>{c.nome}</span>
                  </div>
                  <div style={{ textAlign: 'center', lineHeight: 1 }}>
                    <span style={{ color: '#06b6d4', fontWeight: 600 }}>{c.streak ?? 0}</span><br/>
                    <span style={{ fontSize: 8, color: '#94a3b8' }}>Meses</span>
                  </div>
                </div>
              ))}
            </StatCard>

            {/* Progresso da Equipa por Área */}
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
              {!estatisticas.progressoPorArea?.length && (
                <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Sem dados disponíveis.</p>
              )}
            </StatCard>

          </div>
        </div>

        <Footer />
      </div>
    </LayoutSL>
  )
}