import { useState, useEffect } from 'react'
import Topbar from '../../components/Topbar'
import Sidebar, { icons } from '../../components/Sidebar'
import CardBadge from '../../components/CardBadge'
import api from '../../services/api'
import { getUtilizador } from '../../utils/auth'
import { FiSearch, FiUploadCloud } from 'react-icons/fi'
import { FaBolt, FaCheckCircle } from 'react-icons/fa'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/consultor/dashboard', icon: icons.dashboard },
  { label: 'Badges', path: '/consultor/badges', icon: icons.badges },
  { label: 'Pedidos', path: '/consultor/pedidos', icon: icons.pedidos },
  { label: 'Objetivos', path: '/consultor/objetivos', icon: icons.objetivos },
  { label: 'Gamification', path: '/consultor/gamification', icon: icons.gamification },
]

const POR_PAGINA = 8

// tempo a partir de uma data de expiração
function formatarTempoRestante(dataExpiracao) {
  if (!dataExpiracao) return null
  const diffMs = new Date(dataExpiracao) - new Date()
  if (diffMs <= 0) return null
  const totalMinutos = Math.floor(diffMs / 60000)
  const horas = Math.floor(totalMinutos / 60)
  const minutos = totalMinutos % 60
  return `Expira em: ${horas} horas e ${minutos} minutos`
}

// Verde = válido /Laranja = válido mas expira em menos de 72h / Vermelho = inválido/expirado
function corIndicadorValidade(badge) {
  if (!badge.valido) return '#e74c3c'
  if (badge.dataExpiracao) {
    const horasRestantes = (new Date(badge.dataExpiracao) - new Date()) / 3_600_000
    if (horasRestantes > 0 && horasRestantes <= 72) return '#f39c12'
  }
  return '#2ecc71'
}

function BarraPesquisa({ valor, onChange, placeholder }) {
  return (
    <div style={{ position: 'relative', flex: 2, minWidth: 200 }}>
      <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
      <input
        placeholder={placeholder}
        value={valor}
        onChange={onChange}
        style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, outline: 'none' }}
      />
    </div>
  )
}

function Paginacao({ pagina, totalPaginas, onMudarPagina }) {
  if (totalPaginas <= 1) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
      <button onClick={() => onMudarPagina(Math.max(1, pagina - 1))} disabled={pagina === 1}
        style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 13 }}>
        Anterior
      </button>
      {Array.from({ length: totalPaginas }, (_, i) => (
        <button key={i} onClick={() => onMudarPagina(i + 1)}
          style={{
            width: 32, height: 32, borderRadius: 6, border: '1px solid #ddd',
            background: pagina === i + 1 ? '#39639C' : '#fff',
            color: pagina === i + 1 ? '#fff' : '#333', cursor: 'pointer', fontSize: 13,
          }}>
          {i + 1}
        </button>
      ))}
      <button onClick={() => onMudarPagina(Math.min(totalPaginas, pagina + 1))} disabled={pagina === totalPaginas}
        style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 13 }}>
        Seguinte
      </button>
    </div>
  )
}

export default function BadgesConsultor() {
  const utilizador = getUtilizador()

  const [meusBadges, setMeusBadges] = useState([])
  const [regulares, setRegulares] = useState([])
  const [especiais, setEspeciais] = useState([])
  const [requisitos, setRequisitos] = useState([])
  const [loading, setLoading] = useState(true)
  const [badgeSelecionado, setBadgeSelecionado] = useState(null)

  // Candidatura / evidências do badge selecionado
  const [candidatura, setCandidatura] = useState(null) // { numCandidatura, evidencias: [{idRequisito, pathFicheiro}] }
  const [aCarregarCandidatura, setACarregarCandidatura] = useState(false)
  const [requisitoAEnviar, setRequisitoAEnviar] = useState(null) // id do requisito a fazer upload neste momento
  const [erroCandidatura, setErroCandidatura] = useState('')
  const [mensagemSubmissao, setMensagemSubmissao] = useState('')
  const [aSubmeter, setASubmeter] = useState(false)

  // Os Meus Badges
  const [filtroMeus, setFiltroMeus] = useState('')
  const [tipoMeus, setTipoMeus] = useState('todos')
  const [paginaMeus, setPaginaMeus] = useState(1)

  // Catálogo de Badges
  const [filtroCatalogo, setFiltroCatalogo] = useState('')
  const [nivelCatalogo, setNivelCatalogo] = useState('todos')
  const [paginaCatalogo, setPaginaCatalogo] = useState(1)

  useEffect(() => {
    Promise.all([
      api.get('/badges/todos'),
      api.get('/catalogo/todos'),
    ])
      .then(([resMeus, resCatalogo]) => {
        setMeusBadges(Array.isArray(resMeus.data) ? resMeus.data : [])
        setRegulares(Array.isArray(resCatalogo.data.regulares) ? resCatalogo.data.regulares : [])
        setEspeciais(Array.isArray(resCatalogo.data.especiais) ? resCatalogo.data.especiais : [])
        setRequisitos(Array.isArray(resCatalogo.data.requisitos) ? resCatalogo.data.requisitos : [])
      })
      .catch((err) => console.error('[BadgesConsultor]', err))
      .finally(() => setLoading(false))
  }, [])

  // Os Meus Badges
  const meusFiltrados = meusBadges.filter((b) => {
    const matchNome = b.nomeBadge?.toLowerCase().includes(filtroMeus.toLowerCase())
    const matchTipo = tipoMeus === 'todos'
      || (tipoMeus === 'validos' && b.valido)
      || (tipoMeus === 'expirados' && !b.valido)
    return matchNome && matchTipo
  })
  const totalPagMeus = Math.ceil(meusFiltrados.length / POR_PAGINA)
  const meusPagina = meusFiltrados.slice((paginaMeus - 1) * POR_PAGINA, paginaMeus * POR_PAGINA)

  // Catálogo de Badges
  const niveisDisponiveis = [...new Set(regulares.map((b) => b.nomeNivel).filter(Boolean))]
  const catalogoFiltrado = regulares.filter((b) => {
    const matchNome = b.nome?.toLowerCase().includes(filtroCatalogo.toLowerCase())
    const matchNivel = nivelCatalogo === 'todos' || b.nomeNivel === nivelCatalogo
    return matchNome && matchNivel
  })
  const totalPagCatalogo = Math.ceil(catalogoFiltrado.length / POR_PAGINA)
  const catalogoPagina = catalogoFiltrado.slice((paginaCatalogo - 1) * POR_PAGINA, paginaCatalogo * POR_PAGINA)

  //Sugestões — badges regulares que ainda não tem, área própria primeiro
  const idsBadgeRegularGanhos = new Set(meusBadges.filter((b) => b.idBadgeRegular).map((b) => b.idBadgeRegular))
  const sugestoes = regulares
    .filter((b) => !idsBadgeRegularGanhos.has(b.id))
    .sort((a, c) => (a.idArea === utilizador?.idArea ? 0 : 1) - (c.idArea === utilizador?.idArea ? 0 : 1))
    .slice(0, 4)

  const requisitosDoSelecionado = badgeSelecionado
    ? requisitos.filter((r) => r.idBadgeRegular === badgeSelecionado.id)
    : []

  // Elegível para candidatura: badge regular do catálogo/sugestões (ainda não obtido),
  // ou um badge que já tens mas em modo "Renovar"
  const podeCandidatar = badgeSelecionado && !badgeSelecionado.especial && (!badgeSelecionado.jaTenho || badgeSelecionado.modoRenovar)

  // Ao abrir o modal de um badge a que se pode candidatar, procura um rascunho já existente
  useEffect(() => {
    setCandidatura(null)
    setErroCandidatura('')
    setMensagemSubmissao('')
    if (!podeCandidatar) return

    setACarregarCandidatura(true)
    api.get('/candidaturas/rascunhos')
      .then(async (res) => {
        const rascunhos = Array.isArray(res.data) ? res.data : []
        const existente = rascunhos.find((r) => r.idBadgeRegular === badgeSelecionado.id)
        if (!existente) { setCandidatura({ numCandidatura: null, evidencias: [] }); return }

        const detalhes = await api.get(`/candidaturas/${existente.numCandidatura}/detalhes`)
        setCandidatura({
          numCandidatura: existente.numCandidatura,
          evidencias: Array.isArray(detalhes.data?.evidencias) ? detalhes.data.evidencias : [],
        })
      })
      .catch(() => setCandidatura({ numCandidatura: null, evidencias: [] }))
      .finally(() => setACarregarCandidatura(false))
  }, [badgeSelecionado?.id])

  const enviarEvidencia = async (idRequisito, ficheiro) => {
    setErroCandidatura('')
    setRequisitoAEnviar(idRequisito)
    try {
      let numCandidatura = candidatura?.numCandidatura

      // Ainda não há candidatura criada - criar
      if (!numCandidatura) {
        const res = await api.post('/candidaturas', { idBadgeRegular: badgeSelecionado.id })
        numCandidatura = res.data.numCandidatura
      }

      const formData = new FormData()
      formData.append('idRequisito', idRequisito)
      formData.append('ficheiro', ficheiro)
      await api.post(`/candidaturas/${numCandidatura}/evidencias`, formData)

      const detalhes = await api.get(`/candidaturas/${numCandidatura}/detalhes`)
      setCandidatura({
        numCandidatura,
        evidencias: Array.isArray(detalhes.data?.evidencias) ? detalhes.data.evidencias : [],
      })
    } catch (err) {
      setErroCandidatura(err?.response?.data?.error || 'Não foi possível enviar o ficheiro.')
    } finally {
      setRequisitoAEnviar(null)
    }
  }

  const submeterCandidatura = async () => {
    if (!candidatura?.numCandidatura) {
      setErroCandidatura('Envia pelo menos uma evidência antes de submeter.')
      return
    }
    setASubmeter(true)
    setErroCandidatura('')
    try {
      await api.post(`/candidaturas/${candidatura.numCandidatura}/submeter`)
      setMensagemSubmissao('Candidatura submetida com sucesso! Vais poder acompanhar o estado em "Pedidos".')
    } catch (err) {
      setErroCandidatura(err?.response?.data?.error || 'Não foi possível submeter a candidatura.')
    } finally {
      setASubmeter(false)
    }
  }

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
              <div style={{ padding: '1.5rem', fontFamily: 'Poppins, sans-serif' }}>

                {loading ? (
                  <p style={{ textAlign: 'center', color: '#aaa' }}>A carregar...</p>
                ) : (
                  <>
                    {/* Os Meus Badges */}
                    <h2 style={{ color: '#39639C', fontWeight: 700, marginBottom: 2 }}>Os Meus Badges</h2>
                    <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>{meusFiltrados.length} badges disponíveis</p>

                    <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                      <BarraPesquisa
                        valor={filtroMeus}
                        onChange={(e) => { setFiltroMeus(e.target.value); setPaginaMeus(1) }}
                        placeholder="Pesquisar badges..."
                      />
                      <select value={tipoMeus} onChange={(e) => { setTipoMeus(e.target.value); setPaginaMeus(1) }}
                        style={{ flex: 1, minWidth: 150, padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, outline: 'none', color: '#555' }}>
                        <option value="todos">Todos os badges</option>
                        <option value="validos">Válidos</option>
                        <option value="expirados">Expirados</option>
                      </select>
                    </div>

                    {meusPagina.length === 0 ? (
                      <p style={{ color: '#aaa', fontSize: 13, marginBottom: 32 }}>Ainda não tens nenhuma badge.</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
                        {meusPagina.map((b) => (
                          <CardBadge
                            key={b.id}
                            b={{ ...b, nome: b.nomeBadge }}
                            especial={!b.idBadgeRegular}
                            onInfo={() => setBadgeSelecionado({ ...b, nome: b.nomeBadge, especial: !b.idBadgeRegular, jaTenho: true })}
                            onRenovar={b.idBadgeRegular ? () => setBadgeSelecionado({ ...b, nome: b.nomeBadge, especial: false, jaTenho: true, modoRenovar: true }) : undefined}
                            corIndicador={corIndicadorValidade(b)}
                            textoExpiracao={formatarTempoRestante(b.dataExpiracao) || (b.valido ? 'Sem data de expiração' : 'Badge inválida')}
                          />
                        ))}
                      </div>
                    )}
                    <Paginacao pagina={paginaMeus} totalPaginas={totalPagMeus} onMudarPagina={setPaginaMeus} />

                    {/* Catálogo de Badges */}
                    <h3 style={{ color: '#39639C', fontWeight: 700, marginBottom: 2, marginTop: 8 }}>Catálogo de Badges</h3>
                    <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>{catalogoFiltrado.length} badges disponíveis</p>

                    <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                      <BarraPesquisa
                        valor={filtroCatalogo}
                        onChange={(e) => { setFiltroCatalogo(e.target.value); setPaginaCatalogo(1) }}
                        placeholder="Pesquisar badges..."
                      />
                      <select value={nivelCatalogo} onChange={(e) => { setNivelCatalogo(e.target.value); setPaginaCatalogo(1) }}
                        style={{ flex: 1, minWidth: 150, padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, outline: 'none', color: '#555' }}>
                        <option value="todos">Nível - Todos</option>
                        {niveisDisponiveis.map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
                      {catalogoPagina.map((b) => {
                        const jaTemEsteBadge = idsBadgeRegularGanhos.has(b.id)
                        return (
                          <CardBadge
                            key={b.id}
                            b={b}
                            onInfo={() => setBadgeSelecionado({ ...b, especial: false, jaTenho: jaTemEsteBadge })}
                            onRenovar={jaTemEsteBadge ? () => setBadgeSelecionado({ ...b, especial: false, jaTenho: true, modoRenovar: true }) : undefined}
                          />
                        )
                      })}
                    </div>
                    <Paginacao pagina={paginaCatalogo} totalPaginas={totalPagCatalogo} onMudarPagina={setPaginaCatalogo} />

                    {/* Sugestões Para Ti */}
                    {sugestoes.length > 0 && (
                      <>
                        <h3 style={{ color: '#39639C', fontWeight: 700, marginBottom: 2, marginTop: 8 }}>Sugestões Para ti</h3>
                        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>{sugestoes.length} badges disponíveis</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                          {sugestoes.map((b) => (
                            <CardBadge key={b.id} b={b} onInfo={() => setBadgeSelecionado({ ...b, especial: false, jaTenho: false })} />
                          ))}
                        </div>
                      </>
                    )}

                    {/* Badges Especiais */}
                    {especiais.length > 0 && (
                      <>
                        <h3 style={{ color: '#39639C', fontWeight: 700, marginBottom: 2 }}>Badges Especiais</h3>
                        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>{especiais.length} badges disponíveis</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                          {especiais.map((b) => (
                            <CardBadge key={b.id} b={b} especial onInfo={() => setBadgeSelecionado({ ...b, especial: true })} />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Modal de informações */}
      {badgeSelecionado && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <button onClick={() => setBadgeSelecionado(null)} style={fecharStyle}>×</button>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ width: 70, height: 70, borderRadius: 12, background: '#e8f0fb', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ color: '#1a1a2e', margin: 0 }}>{badgeSelecionado.nome}</h4>
                  <span style={{ background: '#FFF3E0', color: '#F57C00', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                    {badgeSelecionado.especial ? 'Especial' : (badgeSelecionado.nomeNivel || '—')}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6, lineHeight: 1.5 }}>{badgeSelecionado.descricao}</p>
              </div>
            </div>

            {(badgeSelecionado.nomeArea || badgeSelecionado.nomeServiceLine) && (
              <p style={{ fontSize: 13, color: '#333', marginBottom: 4 }}>
                {[badgeSelecionado.nomeArea, badgeSelecionado.nomeServiceLine].filter(Boolean).join(' · ')}
              </p>
            )}

            {badgeSelecionado.validadeDias && (
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
                Validade: {badgeSelecionado.validadeDias} dias
              </p>
            )}

            {!badgeSelecionado.especial && (
              <>
                <h5 style={{ color: '#39639C', marginBottom: 10 }}>Requisitos</h5>
                {requisitosDoSelecionado.length === 0 ? (
                  <p style={{ color: '#aaa', fontSize: 13 }}>Sem requisitos definidos</p>
                ) : (
                  <ul style={{ paddingLeft: 18, fontSize: 13, color: '#333' }}>
                    {requisitosDoSelecionado.map((r) => (
                      <li key={r.id} style={{ marginBottom: 6 }}>
                        <strong>{r.nome}</strong>
                        {r.descricao && <div style={{ color: '#6b7280', fontSize: 12 }}>{r.descricao}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {podeCandidatar && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                <h5 style={{ color: '#39639C', marginBottom: 4 }}>Obter Badge</h5>
                {badgeSelecionado.modoRenovar && (
                  <p style={{ color: '#6b7280', fontSize: 12, marginBottom: 10 }}>
                    Já tens este badge — envia novas evidências para o renovar.
                  </p>
                )}

                {aCarregarCandidatura ? (
                  <p style={{ color: '#aaa', fontSize: 13 }}>A carregar...</p>
                ) : requisitosDoSelecionado.length === 0 ? (
                  <p style={{ color: '#aaa', fontSize: 13 }}>Este badge não tem requisitos — fala com o Talent Manager.</p>
                ) : (
                  <>
                    {requisitosDoSelecionado.map((r) => {
                      const evidencia = candidatura?.evidencias?.find((e) => e.idRequisito === r.id)
                      const aEnviar = requisitoAEnviar === r.id
                      const inputId = `evidencia-req-${r.id}`
                      return (
                        <div key={r.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          border: '1px solid #eee', borderRadius: 8, padding: '10px 12px', marginBottom: 8,
                        }}>
                          <div style={{ fontSize: 13 }}>
                            {evidencia ? (
                              <a href={`http://localhost:3001/${evidencia.pathFicheiro}`} target="_blank" rel="noreferrer" style={{ color: '#39639C' }}>
                                {evidencia.pathFicheiro.split('/').pop()}
                              </a>
                            ) : (
                              <span>{r.nome}</span>
                            )}
                          </div>
                          <label htmlFor={inputId} style={{ cursor: aEnviar ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {aEnviar ? (
                              <span style={{ fontSize: 12, color: '#9ca3af' }}>A enviar...</span>
                            ) : evidencia ? (
                              <FaCheckCircle style={{ color: '#2ecc71', fontSize: 18 }} title="Substituir ficheiro" />
                            ) : (
                              <FiUploadCloud style={{ color: '#9ca3af', fontSize: 18 }} title="Enviar ficheiro" />
                            )}
                          </label>
                          <input
                            id={inputId}
                            type="file"
                            accept=".pdf,.zip,.jpg,.jpeg,.png"
                            style={{ display: 'none' }}
                            disabled={aEnviar}
                            onChange={(e) => {
                              const ficheiro = e.target.files?.[0]
                              if (ficheiro) enviarEvidencia(r.id, ficheiro)
                              e.target.value = ''
                            }}
                          />
                        </div>
                      )
                    })}

                    {erroCandidatura && <div style={{ color: '#e74c3c', fontSize: 12, marginTop: 6 }}>{erroCandidatura}</div>}
                    {mensagemSubmissao && <div style={{ color: '#2ecc71', fontSize: 12, marginTop: 6 }}>{mensagemSubmissao}</div>}

                    <button
                      onClick={submeterCandidatura}
                      disabled={aSubmeter || !!mensagemSubmissao}
                      style={{
                        marginTop: 12, width: '100%', background: '#39639C', color: '#fff', border: 'none',
                        borderRadius: 8, padding: '9px 0', fontSize: 13, fontWeight: 600,
                        cursor: aSubmeter || mensagemSubmissao ? 'default' : 'pointer',
                        opacity: aSubmeter || mensagemSubmissao ? 0.7 : 1,
                      }}
                    >
                      {aSubmeter ? 'A submeter...' : 'Submeter'}
                    </button>
                  </>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#11a9d6', fontWeight: 700, fontSize: 14 }}>
                <FaBolt /> {badgeSelecionado.pontos ?? 0} pontos
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
}

const modalStyle = {
  background: '#fff', borderRadius: 14, padding: 28, width: '90%', maxWidth: 480,
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)', position: 'relative',
  maxHeight: '85vh', overflowY: 'auto',
}

const fecharStyle = {
  position: 'absolute', top: 12, right: 16, background: 'none',
  border: 'none', fontSize: 22, cursor: 'pointer', color: '#999',
}
