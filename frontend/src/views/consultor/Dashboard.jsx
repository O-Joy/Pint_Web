import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import Topbar from '../../components/Topbar'
import Sidebar, { icons } from '../../components/Sidebar'
import AcoesRapidas from '../../components/AcoesRapidas'
import api from '../../services/api'
import { getUtilizador } from '../../utils/auth'
import { LuTarget } from 'react-icons/lu'
import { FaClipboardList, FaMedal, FaStar, FaAward } from 'react-icons/fa'
import { BiSolidBadge } from "react-icons/bi";

ChartJS.register(ArcElement, Tooltip, Legend)

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/consultor/dashboard', icon: icons.dashboard },
  { label: 'Badges', path: '/consultor/badges', icon: icons.badges },
  { label: 'Pedidos', path: '/consultor/pedidos', icon: icons.pedidos },
  { label: 'Objetivos', path: '/consultor/objetivos', icon: icons.objetivos },
  { label: 'Gamification', path: '/consultor/gamification', icon: icons.gamification },
]

// Cartões de "Ações Rápidas" — o que cada página do menu contém
const CARDS_ACOES_RAPIDAS = [
  {
    descricao: 'Nesta página está presente',
    items: ['Badges Disponíveis', 'Badges a Expirar', 'Os teus Badges'],
    botao: 'Badges',
    path: '/consultor/badges',
  },
  {
    descricao: 'Nesta página está presente',
    items: ['Candidaturas Pendentes', 'Histórico de Candidaturas'],
    botao: 'Candidaturas',
    path: '/consultor/pedidos',
  },
  {
    descricao: 'Nesta página está presente',
    items: ['Objetivos em Curso', 'Estatísticas de Progresso', 'Histórico de Objetivos'],
    botao: 'Objetivos',
    path: '/consultor/objetivos',
  },
  {
    descricao: 'Nesta página está presente',
    items: ['Ranking Completo Gamification', 'O teu Desempenho Gamification'],
    botao: 'Gamification',
    path: '/consultor/gamification',
  },
]

export default function DashboardConsultor() {
  const navigate = useNavigate()
  const utilizador = getUtilizador()

  const [resumo, setResumo] = useState(null)
  const [objetivosResumo, setObjetivosResumo] = useState(null)
  const [badgesRecomendados, setBadgesRecomendados] = useState([])
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/resumo'),
      api.get('/dashboard/objetivos-resumo'),
      api.get('/dashboard/badges-recomendados'),
      api.get('/ranking'),
    ])
      .then(([resResumo, resObjetivos, resBadges, resRanking]) => {
        setResumo(resResumo.data)
        setObjetivosResumo(resObjetivos.data)
        setBadgesRecomendados(Array.isArray(resBadges.data) ? resBadges.data : [])
        setRanking(Array.isArray(resRanking.data) ? resRanking.data : [])
      })
      .catch((err) => console.error('[DashboardConsultor]', err))
      .finally(() => setLoading(false))
  }, [])

  // Top 3 do ranking geral — para o pódio
  const top3 = ranking.slice(0, 3)
  // Posições seguintes — para a mini-tabela "Ranking"
  const restoRanking = ranking.slice(3, 6)
  // A posição/pontos do próprio consultor autenticado
  const meuDesempenho = ranking.find(r => r.idUtilizador === utilizador?.id)

  const cartoesResumo = [
    { icone: <FaClipboardList />, valor: resumo?.pedidosEmCurso ?? 0, label: 'Pedidos Pendentes' },
    { icone: <FaMedal />, valor: resumo?.badgesConquistados ?? 0, label: 'Badges Conquistados' },
    { icone: <FaStar />, valor: resumo?.badgesEspeciais ?? 0, label: 'Badges Especiais' },
    { icone: <LuTarget />, valor: resumo?.objetivosAlcancados ?? 0, label: 'Objetivos Alcançados' },
  ]

  // Ordem visual do pódio: 2º / 1º / 3º (o do meio é o mais alto)
  const podio = [
    { dados: top3[1], posicao: 2, altura: 65 },
    { dados: top3[0], posicao: 1, altura: 92 },
    { dados: top3[2], posicao: 3, altura: 45 },
  ]

  return (
    <div className="pg-layout">
      <div className="pg-top">
        <Topbar />
      </div>

      <div className="container-fluid pg-body">
        <div className="row h-100">

          <div className="col-auto d-none d-md-flex p-0">
            <Sidebar navItems={NAV_ITEMS} perfil="Consultor" />
          </div>

          <div className="col">
            <main className="pg-content">
              <div className="dashboard-wrapper">

                <h2 className="dashboard-titulo">Resumo da minha Atividade</h2>

                {loading ? (
                  <p className="dashboard-vazio">A carregar...</p>
                ) : (
                  <>
                    {/* Cards de resumo */}
                    <div className="row g-3 dashboard-resumo">
                      {cartoesResumo.map((c, i) => (
                        <div key={i} className="col-6 col-lg-3">
                          <div className="dashboard-resumo-card">
                            <span className="dashboard-resumo-icone">{c.icone}</span>
                            <div>
                              <div className="dashboard-resumo-valor">{c.valor}</div>
                              <div className="dashboard-resumo-label">{c.label}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Objetivos | Gamification | O teu desempenho */}
                    <div className="row g-3 dashboard-linha-meio">

                      {/* Objetivos */}
                      <div className="col-12 col-lg-5">
                        <div className="dashboard-card h-100">
                          <h3 className="dashboard-card-titulo">Objetivos</h3>

                          <div className="dashboard-objetivos-topo">
                            <div className="dashboard-donut">
                              <Doughnut
                                data={{
                                  datasets: [{
                                    data: [
                                      objetivosResumo?.progressoLearningPath ?? 0,
                                      100 - (objetivosResumo?.progressoLearningPath ?? 0),
                                    ],
                                    backgroundColor: ['#39639C', '#e9ecef'],
                                    borderWidth: 0,
                                  }],
                                }}
                                options={{
                                  cutout: '72%',
                                  plugins: { legend: { display: false }, tooltip: { enabled: false } },
                                }}
                              />
                              <div className="dashboard-donut-centro">{objetivosResumo?.progressoLearningPath ?? 0}%</div>
                            </div>
                            <div className="dashboard-objetivos-info">
                              <p>{objetivosResumo?.areasCompletas ?? 0} Áreas Completas</p>
                              <p>{objetivosResumo?.serviceLinesConcluidas ?? 0} Service Line{objetivosResumo?.serviceLinesConcluidas === 1 ? '' : 's'} Concluída{objetivosResumo?.serviceLinesConcluidas === 1 ? '' : 's'}</p>
                            </div>
                          </div>
                          <p className="dashboard-donut-legenda">Progresso na Learning Path</p>

                          <p className="dashboard-subtitulo">Objetivos em progresso</p>
                          <div className="row g-3">
                            {objetivosResumo?.objetivosEmProgresso?.length ? (
                              objetivosResumo.objetivosEmProgresso.map((obj) => (
                                <div key={obj.id} className="col-12 col-sm-6">
                                  <div className="objetivo-progresso-item">
                                    <p className="objetivo-progresso-titulo">{obj.titulo}</p>
                                    <div className="objetivo-progresso-barra">
                                      <div className="objetivo-progresso-barra-fill" style={{ width: `${obj.percentagem}%` }} />
                                    </div>
                                    <div className="objetivo-progresso-rodape">
                                      <span>{obj.formato === 'posicao' ? `${obj.atual ?? '—'}º · meta Top ${obj.meta}` : `${obj.atual}/${obj.meta}`}</span>
                                      <span>Termina a {new Date(obj.dataFim).toLocaleDateString('pt-PT')}</span>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="dashboard-vazio">Sem objetivos em curso.</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Gamification — pódio */}
                      <div className="col-12 col-lg-4">
                        <div className="dashboard-card h-100">
                          <h3 className="dashboard-card-titulo">Gamification</h3>
                          <div className="dashboard-podio">
                            {podio.map((p) => (
                              <div key={p.posicao} className="dashboard-podio-coluna">
                                <div className="dashboard-podio-avatar">{p.dados?.nome?.[0] ?? '?'}</div>
                                <p className="dashboard-podio-nome">{p.dados?.nome ?? '—'}</p>
                                <p className="dashboard-podio-pontos">{p.dados?.totalPontos ?? 0} pts</p>
                                <div className="dashboard-podio-barra" style={{ height: p.altura }} />
                                <p className="dashboard-podio-posicao">{p.posicao}º</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* O teu desempenho */}
                      <div className="col-12 col-lg-3">
                        <div className="dashboard-card h-100">
                          <p className="dashboard-subtitulo">O teu desempenho</p>
                          <div className="dashboard-desempenho-card">
                            <span>{meuDesempenho?.posicao ?? '—'}ª Posição</span>
                            <span className="dashboard-desempenho-pontos">{meuDesempenho?.totalPontos ?? 0} Pontos</span>
                          </div>

                          <p className="dashboard-subtitulo">Ranking</p>
                          <table className="dashboard-ranking-tabela">
                            <thead>
                              <tr>
                                <th>Posição</th>
                                <th>Consultor</th>
                                <th>Pontuação</th>
                              </tr>
                            </thead>
                            <tbody>
                              {restoRanking.map((r) => (
                                <tr key={r.idUtilizador}>
                                  <td>{r.posicao}º</td>
                                  <td>{r.nome}</td>
                                  <td>{r.totalPontos} pts</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <button className="dashboard-verlink" onClick={() => navigate('/consultor/gamification')}>
                            View All
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Badges recomendados */}
                    <div className="dashboard-secao">
                      <div className="dashboard-secao-cabecalho">
                        <h3 className="dashboard-card-titulo">Badges recomendados</h3>
                        <button className="dashboard-verlink" onClick={() => navigate('/consultor/badges')}>
                          View All
                        </button>
                      </div>
                      <div className="row g-3">
                        {badgesRecomendados.length ? badgesRecomendados.map((b) => (
                          <div key={b.id} className="col-6 col-lg-3">
                            <div className="badge-recomendado-card" onClick={() => navigate('/consultor/badges')}>
                              <div className="badge-recomendado-icone">
                                {b.urlImagem
                                  ? <img src={`http://localhost:3001/${b.urlImagem}`} alt={b.nome} />
                                  : <BiSolidBadge  />}
                              </div>
                              <div className="badge-recomendado-info">
                                <p className="badge-recomendado-nome">{b.nome}</p>
                                <p className="badge-recomendado-nivel">{b.nomeNivel || '—'}</p>
                              </div>
                              <span className="badge-recomendado-requisitos">{b.numRequisitos}</span>
                              <span className="badge-recomendado-seta">›</span>
                            </div>
                          </div>
                        )) : (
                          <p className="dashboard-vazio">Sem badges recomendados de momento.</p>
                        )}
                      </div>
                    </div>

                    {/* Ações Rápidas */}
                    <AcoesRapidas cards={CARDS_ACOES_RAPIDAS} />
                  </>
                )}

              </div>
            </main>
          </div>

        </div>
      </div>
    </div>
  )
}