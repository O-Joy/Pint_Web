import { useState, useEffect } from 'react'
import Topbar from '../../components/Topbar'
import Sidebar, { icons } from '../../components/Sidebar'
import api from '../../services/api'
import { FiSearch, FiUploadCloud } from 'react-icons/fi'
import { FaCheckCircle } from 'react-icons/fa'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/consultor/dashboard', icon: icons.dashboard },
  { label: 'Badges', path: '/consultor/badges', icon: icons.badges },
  { label: 'Pedidos', path: '/consultor/pedidos', icon: icons.pedidos },
  { label: 'Objetivos', path: '/consultor/objetivos', icon: icons.objetivos },
  { label: 'Gamification', path: '/consultor/gamification', icon: icons.gamification },
]

const POR_PAGINA = 6
const ESTADOS_PENDENTES = [1, 2, 3, 4]
const ESTADOS_FINAIS = [5, 6]

function formatarData(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-PT')
}

function formatarDataHora(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
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
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '16px 0' }}>
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

function Abas({ valor, onChange, opcoes }) {
  return (
    <div style={{ display: 'inline-flex', gap: 4, background: '#f3f4f6', borderRadius: 10, padding: 4 }}>
      {opcoes.map((op) => (
        <button key={op.valor} onClick={() => onChange(op.valor)} style={{
          padding: '6px 16px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          background: valor === op.valor ? '#fff' : 'transparent',
          color: valor === op.valor ? '#39639C' : '#6b7280',
          boxShadow: valor === op.valor ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
        }}>
          {op.label}
        </button>
      ))}
    </div>
  )
}

export default function PedidosConsultor() {
  const [candidaturas, setCandidaturas] = useState([])
  const [requisitosCache, setRequisitosCache] = useState([])
  const [loading, setLoading] = useState(true)

  // "Candidaturas / Pedidos Pendentes"
  const [filtroPendentes, setFiltroPendentes] = useState('')
  const [nivelPendentes, setNivelPendentes] = useState('todos')
  const [tabPendentes, setTabPendentes] = useState('todos')
  const [paginaPendentes, setPaginaPendentes] = useState(1)

  // "Histórico / Pedidos Finalizados"
  const [filtroHistorico, setFiltroHistorico] = useState('')
  const [nivelHistorico, setNivelHistorico] = useState('todos')
  const [tabHistorico, setTabHistorico] = useState('todos')
  const [paginaHistorico, setPaginaHistorico] = useState(1)

  // Modal "Detalhes"
  const [candidaturaDetalhe, setCandidaturaDetalhe] = useState(null)
  const [detalhes, setDetalhes] = useState(null)
  const [aCarregarDetalhes, setACarregarDetalhes] = useState(false)

  // Modal "Editar Candidatura" (reenviar evidências)
  const [candidaturaEditar, setCandidaturaEditar] = useState(null)
  const [evidenciasEditar, setEvidenciasEditar] = useState([])
  const [requisitoAEnviar, setRequisitoAEnviar] = useState(null)
  const [erroEditar, setErroEditar] = useState('')
  const [mensagemEditar, setMensagemEditar] = useState('')
  const [aSubmeterEditar, setASubmeterEditar] = useState(false)

  const carregarCandidaturas = () => {
    api.get('/candidaturas')
      .then((res) => setCandidaturas(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error('[PedidosConsultor]', err))
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/candidaturas'),
      api.get('/catalogo/todos'),
    ])
      .then(([resCand, resCat]) => {
        setCandidaturas(Array.isArray(resCand.data) ? resCand.data : [])
        setRequisitosCache(Array.isArray(resCat.data?.requisitos) ? resCat.data.requisitos : [])
      })
      .catch((err) => console.error('[PedidosConsultor]', err))
      .finally(() => setLoading(false))
  }, [])

  const pendentes = candidaturas.filter((c) => ESTADOS_PENDENTES.includes(c.idEstadoAtual))
  const historico = candidaturas.filter((c) => ESTADOS_FINAIS.includes(c.idEstadoAtual))

  const niveisPendentes = [...new Set(pendentes.map((c) => c.nomeNivel).filter(Boolean))]
  const niveisHistorico = [...new Set(historico.map((c) => c.nomeNivel).filter(Boolean))]

  const pendentesFiltrados = pendentes.filter((c) => {
    const alvo = `${c.nomeBadge} ${c.nomeArea}`.toLowerCase()
    const matchNome = alvo.includes(filtroPendentes.toLowerCase())
    const matchNivel = nivelPendentes === 'todos' || c.nomeNivel === nivelPendentes
    const matchTab = tabPendentes === 'todos'
      || (tabPendentes === 'corrigir' && c.acaoNecessaria)
      || (tabPendentes === 'aguardar' && !c.acaoNecessaria)
    return matchNome && matchNivel && matchTab
  })
  const totalPagPendentes = Math.ceil(pendentesFiltrados.length / POR_PAGINA)
  const pendentesPagina = pendentesFiltrados.slice((paginaPendentes - 1) * POR_PAGINA, paginaPendentes * POR_PAGINA)

  const historicoFiltrado = historico.filter((c) => {
    const alvo = `${c.nomeBadge} ${c.nomeArea}`.toLowerCase()
    const matchNome = alvo.includes(filtroHistorico.toLowerCase())
    const matchNivel = nivelHistorico === 'todos' || c.nomeNivel === nivelHistorico
    const matchTab = tabHistorico === 'todos'
      || (tabHistorico === 'aprovados' && c.idEstadoAtual === 5)
      || (tabHistorico === 'rejeitados' && c.idEstadoAtual === 6)
    return matchNome && matchNivel && matchTab
  })
  const totalPagHistorico = Math.ceil(historicoFiltrado.length / POR_PAGINA)
  const historicoPagina = historicoFiltrado.slice((paginaHistorico - 1) * POR_PAGINA, paginaHistorico * POR_PAGINA)

  // Modal Detalhes
  const abrirDetalhes = (c) => {
    setCandidaturaDetalhe(c)
    setDetalhes(null)
    setACarregarDetalhes(true)
    api.get(`/candidaturas/${c.numCandidatura}/detalhes`)
      .then((res) => setDetalhes(res.data))
      .catch((err) => console.error('[PedidosConsultor detalhes]', err))
      .finally(() => setACarregarDetalhes(false))
  }

  // Modal Editar Candidatura (a partir do "Rever Candidatura")
  const abrirEditar = (c) => {
    setCandidaturaDetalhe(null)
    setCandidaturaEditar(c)
    setErroEditar('')
    setMensagemEditar('')
    setEvidenciasEditar([])
    api.get(`/candidaturas/${c.numCandidatura}/detalhes`)
      .then((res) => setEvidenciasEditar(Array.isArray(res.data?.evidencias) ? res.data.evidencias : []))
      .catch((err) => console.error('[PedidosConsultor evidencias]', err))
  }

  const requisitosDoEditar = candidaturaEditar
    ? requisitosCache.filter((r) => r.idBadgeRegular === candidaturaEditar.idBadgeRegular)
    : []

  const enviarEvidenciaEditar = async (idRequisito, ficheiro) => {
    setRequisitoAEnviar(idRequisito)
    setErroEditar('')
    try {
      const formData = new FormData()
      formData.append('idRequisito', idRequisito)
      formData.append('ficheiro', ficheiro)
      await api.post(`/candidaturas/${candidaturaEditar.numCandidatura}/evidencias`, formData)
      const res = await api.get(`/candidaturas/${candidaturaEditar.numCandidatura}/detalhes`)
      setEvidenciasEditar(Array.isArray(res.data?.evidencias) ? res.data.evidencias : [])
    } catch (err) {
      setErroEditar(err?.response?.data?.error || 'Não foi possível enviar o ficheiro.')
    } finally {
      setRequisitoAEnviar(null)
    }
  }

  const submeterEditar = async () => {
    setASubmeterEditar(true)
    setErroEditar('')
    try {
      await api.post(`/candidaturas/${candidaturaEditar.numCandidatura}/submeter`)
      setMensagemEditar('Candidatura reenviada com sucesso!')
      carregarCandidaturas()
    } catch (err) {
      setErroEditar(err?.response?.data?.error || 'Não foi possível reenviar a candidatura.')
    } finally {
      setASubmeterEditar(false)
    }
  }

  return (
    <div className="pg-layout">
      <div className="pg-top"><Topbar /></div>

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
                    {/* Candidaturas / Pedidos Pendentes */}
                    <h2 style={{ color: '#39639C', fontWeight: 700, marginBottom: 2 }}>Candidaturas</h2>
                    <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>Pedidos Pendentes</p>

                    <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                      <BarraPesquisa valor={filtroPendentes} onChange={(e) => { setFiltroPendentes(e.target.value); setPaginaPendentes(1) }} placeholder="Pesquisar, Badge, Área..." />
                      <select value={nivelPendentes} onChange={(e) => { setNivelPendentes(e.target.value); setPaginaPendentes(1) }}
                        style={{ minWidth: 150, padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, outline: 'none', color: '#555' }}>
                        <option value="todos">Nível - Todos</option>
                        {niveisPendentes.map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <Abas
                        valor={tabPendentes}
                        onChange={(v) => { setTabPendentes(v); setPaginaPendentes(1) }}
                        opcoes={[
                          { valor: 'todos', label: 'TODOS' },
                          { valor: 'aguardar', label: 'A AGUARDAR' },
                          { valor: 'corrigir', label: 'A CORRIGIR' },
                        ]}
                      />
                    </div>

                    {pendentesPagina.length === 0 ? (
                      <p style={{ color: '#aaa', fontSize: 13, marginBottom: 32 }}>Sem candidaturas pendentes.</p>
                    ) : (
                      <div className="table-responsive mb-2">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, background: '#fff' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #f0f0f0', textAlign: 'left', color: '#6b7280' }}>
                              <th style={{ padding: '8px 10px' }}>ID Candidatura</th>
                              <th style={{ padding: '8px 10px' }}>Área</th>
                              <th style={{ padding: '8px 10px' }}>Badge</th>
                              <th style={{ padding: '8px 10px' }}>Nível</th>
                              <th style={{ padding: '8px 10px' }}>Requisitos</th>
                              <th style={{ padding: '8px 10px' }}>Data Submissão</th>
                              <th style={{ padding: '8px 10px' }}>Estado Atual</th>
                              <th style={{ padding: '8px 10px' }}>Ação necessária</th>
                              <th style={{ padding: '8px 10px' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {pendentesPagina.map((c) => (
                              <tr key={c.numCandidatura} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                <td style={{ padding: '10px' }}>{c.numCandidatura}</td>
                                <td style={{ padding: '10px' }}>{c.nomeArea || '—'}</td>
                                <td style={{ padding: '10px' }}>{c.nomeBadge}</td>
                                <td style={{ padding: '10px' }}>{c.nomeNivel || '—'}</td>
                                <td style={{ padding: '10px' }}>{c.numRequisitos}</td>
                                <td style={{ padding: '10px' }}>{formatarData(c.dataCriacao)}</td>
                                <td style={{ padding: '10px' }}>{c.nomeEstadoAtual}</td>
                                <td style={{ padding: '10px', color: c.acaoNecessaria ? '#e74c3c' : '#9ca3af', fontWeight: c.acaoNecessaria ? 700 : 400 }}>
                                  {c.acaoNecessaria ? 'SIM ⚠' : '-'}
                                </td>
                                <td style={{ padding: '10px', textAlign: 'right' }}>
                                  <button onClick={() => abrirDetalhes(c)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontWeight: 700, color: '#39639C' }}>+</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <Paginacao pagina={paginaPendentes} totalPaginas={totalPagPendentes} onMudarPagina={setPaginaPendentes} />

                    {/* Histórico / Pedidos Finalizados */}
                    <h2 style={{ color: '#39639C', fontWeight: 700, marginBottom: 2, marginTop: 24 }}>Histórico</h2>
                    <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>Pedidos Finalizados</p>

                    <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                      <BarraPesquisa valor={filtroHistorico} onChange={(e) => { setFiltroHistorico(e.target.value); setPaginaHistorico(1) }} placeholder="Pesquisar, Badge, Área..." />
                      <select value={nivelHistorico} onChange={(e) => { setNivelHistorico(e.target.value); setPaginaHistorico(1) }}
                        style={{ minWidth: 150, padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, outline: 'none', color: '#555' }}>
                        <option value="todos">Nível - Todos</option>
                        {niveisHistorico.map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <Abas
                        valor={tabHistorico}
                        onChange={(v) => { setTabHistorico(v); setPaginaHistorico(1) }}
                        opcoes={[
                          { valor: 'todos', label: 'TODOS' },
                          { valor: 'aprovados', label: 'APROVADOS' },
                          { valor: 'rejeitados', label: 'REJEITADOS' },
                        ]}
                      />
                    </div>

                    {historicoPagina.length === 0 ? (
                      <p style={{ color: '#aaa', fontSize: 13 }}>Ainda sem pedidos finalizados.</p>
                    ) : (
                      <div className="table-responsive mb-2">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, background: '#fff' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #f0f0f0', textAlign: 'left', color: '#6b7280' }}>
                              <th style={{ padding: '8px 10px' }}>ID Candidatura</th>
                              <th style={{ padding: '8px 10px' }}>Área</th>
                              <th style={{ padding: '8px 10px' }}>Badge</th>
                              <th style={{ padding: '8px 10px' }}>Nível</th>
                              <th style={{ padding: '8px 10px' }}>Requisitos</th>
                              <th style={{ padding: '8px 10px' }}>Data Submissão</th>
                              <th style={{ padding: '8px 10px' }}>Data Decisão</th>
                              <th style={{ padding: '8px 10px' }}>Decisão</th>
                              <th style={{ padding: '8px 10px' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {historicoPagina.map((c) => (
                              <tr key={c.numCandidatura} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                <td style={{ padding: '10px' }}>{c.numCandidatura}</td>
                                <td style={{ padding: '10px' }}>{c.nomeArea || '—'}</td>
                                <td style={{ padding: '10px' }}>{c.nomeBadge}</td>
                                <td style={{ padding: '10px' }}>{c.nomeNivel || '—'}</td>
                                <td style={{ padding: '10px' }}>{c.numRequisitos}</td>
                                <td style={{ padding: '10px' }}>{formatarData(c.dataCriacao)}</td>
                                <td style={{ padding: '10px' }}>{formatarData(c.dataDecisao)}</td>
                                <td style={{ padding: '10px', color: c.idEstadoAtual === 5 ? '#2ecc71' : '#e74c3c', fontWeight: 700 }}>
                                  {c.idEstadoAtual === 5 ? 'Aprovado' : 'Rejeitado'}
                                </td>
                                <td style={{ padding: '10px', textAlign: 'right' }}>
                                  <button onClick={() => abrirDetalhes(c)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontWeight: 700, color: '#39639C' }}>+</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <Paginacao pagina={paginaHistorico} totalPaginas={totalPagHistorico} onMudarPagina={setPaginaHistorico} />
                  </>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Modal — Detalhes */}
      {candidaturaDetalhe && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <button onClick={() => setCandidaturaDetalhe(null)} style={fecharStyle}>×</button>
            <h4 style={{ fontWeight: 800, marginBottom: 16 }}>Nº Candidatura: {candidaturaDetalhe.numCandidatura}</h4>

            <div style={{ background: '#f3f4f6', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>Badge + Nível:</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{candidaturaDetalhe.nomeBadge} {candidaturaDetalhe.nomeNivel}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{candidaturaDetalhe.pontos ?? 0} pontos</div>
            </div>

            {aCarregarDetalhes ? (
              <p style={{ color: '#aaa', fontSize: 13 }}>A carregar...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[...(detalhes?.historico ?? [])].reverse().map((h) => (
                  <div key={h.idTransacao} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#39639C', marginTop: 6, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12.5 }}>
                        <span style={{ color: '#6b7280', minWidth: 130 }}>{formatarDataHora(h.dataAlteracao)}</span>
                        <span style={{ fontWeight: 700, color: h.idEstadoAtual === 6 ? '#e74c3c' : (h.idEstadoAtual === 5 ? '#2ecc71' : '#333'), minWidth: 110 }}>
                          {h.nomeEstadoAtual}
                        </span>
                        <span style={{ color: '#6b7280', minWidth: 110 }}>{h.estadoAnterior || '-'}</span>
                        <span style={{ color: '#6b7280' }}>{h.nomeResponsavel || '-'}</span>
                      </div>
                      {h.comentario && (
                        <div style={{ background: '#f9fafb', border: '1px solid #f0f0f0', borderRadius: 8, padding: '8px 10px', marginTop: 6, fontSize: 12, color: '#6b7280' }}>
                          {h.comentario}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {(!detalhes?.historico || detalhes.historico.length === 0) && (
                  <p style={{ color: '#aaa', fontSize: 13 }}>Sem histórico.</p>
                )}
              </div>
            )}

            {candidaturaDetalhe.acaoNecessaria && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button
                  onClick={() => abrirEditar(candidaturaDetalhe)}
                  style={{ background: '#fff', color: '#39639C', border: '1px solid #39639C', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  ↻ Rever Candidatura
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal — Editar Candidatura (reenviar evidências) */}
      {candidaturaEditar && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <button onClick={() => setCandidaturaEditar(null)} style={fecharStyle}>×</button>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ width: 70, height: 70, borderRadius: 12, background: '#e8f0fb', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, overflow: 'hidden' }}>
              {candidaturaEditar.urlImagem
              ? <img src={`http://localhost:3001/${candidaturaEditar.urlImagem}`} alt={candidaturaEditar.nomeBadge} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : '🏅'}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ color: '#1a1a2e', margin: 0 }}>{candidaturaEditar.nomeBadge}</h4>
                <span style={{ background: '#FFF3E0', color: '#F57C00', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                  {candidaturaEditar.nomeNivel || '—'}
                </span>
              </div>
            </div>

            <h5 style={{ color: '#39639C', marginBottom: 10 }}>Editar Candidatura</h5>
            <p style={{ color: '#6b7280', fontSize: 12, marginBottom: 10 }}>
              Envia novas evidências para os requisitos e submete outra vez para validação.
            </p>

            {requisitosDoEditar.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: 13 }}>Sem requisitos definidos.</p>
            ) : (
              <>
                {requisitosDoEditar.map((r) => {
                  const evidencia = evidenciasEditar.find((e) => e.idRequisito === r.id)
                  const aEnviar = requisitoAEnviar === r.id
                  const inputId = `evidencia-editar-${r.id}`
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
                          if (ficheiro) enviarEvidenciaEditar(r.id, ficheiro)
                          e.target.value = ''
                        }}
                      />
                    </div>
                  )
                })}

                {erroEditar && <div style={{ color: '#e74c3c', fontSize: 12, marginTop: 6 }}>{erroEditar}</div>}
                {mensagemEditar && <div style={{ color: '#2ecc71', fontSize: 12, marginTop: 6 }}>{mensagemEditar}</div>}

                <button
                  onClick={submeterEditar}
                  disabled={aSubmeterEditar || !!mensagemEditar}
                  style={{
                    marginTop: 12, width: '100%', background: '#39639C', color: '#fff', border: 'none',
                    borderRadius: 8, padding: '9px 0', fontSize: 13, fontWeight: 600,
                    cursor: aSubmeterEditar || mensagemEditar ? 'default' : 'pointer',
                    opacity: aSubmeterEditar || mensagemEditar ? 0.7 : 1,
                  }}
                >
                  {aSubmeterEditar ? 'A submeter...' : 'Submeter'}
                </button>
              </>
            )}
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
