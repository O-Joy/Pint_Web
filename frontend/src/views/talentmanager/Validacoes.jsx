import { useState, useEffect } from 'react'
import LayoutTM from './components/LayoutTM'
import api from '../../services/api'
import { FiDownload, FiSearch, FiRefreshCw } from 'react-icons/fi'
import { FaRegEye, FaRegCheckCircle, FaRegTimesCircle } from 'react-icons/fa'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ESTADOS (tabela estados_candidatura):
// 1 - Em Validação TM | 2 - Em Retificação TM | 3 - Em Validação SLL
// 4 - Em Retificação SLL | 5 - Aprovada | 6 - Rejeitada
const nomeEstado = (idEstadoAtual) => {
  switch (idEstadoAtual) {
    case 1: return 'Em Validação'
    case 2: return 'Em Retificação'
    case 3: return 'Em Validação SLL'
    case 4: return 'Em Retificação SLL'
    case 5: return 'Aprovada'
    case 6: return 'Rejeitada'
    default: return '-'
  }
}

const corEstado = (idEstadoAtual) => {
  if (idEstadoAtual === 5) return { bg: '#e8f5e9', color: '#06A120' }
  if (idEstadoAtual === 6) return { bg: '#fdeceb', color: '#AE0003' }
  if (idEstadoAtual === 2 || idEstadoAtual === 4) return { bg: '#FFF3E0', color: '#F57C00' }
  return { bg: '#e8f0fb', color: '#39639C' }
}

const TABS = ['TODOS', 'APROVADOS', 'REJEITADOS']

export default function Validacoes() {
  const [candidaturas, setCandidaturas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [filtroNivel, setFiltroNivel] = useState('Todos')
  const [tab, setTab] = useState('TODOS')
  const [pagina, setPagina] = useState(1)
  const porPagina = 10

  const [candidaturaSelecionada, setCandidaturaSelecionada] = useState(null)
  const [detalhe, setDetalhe] = useState(null)
  const [loadingDetalhe, setLoadingDetalhe] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [toast, setToast] = useState(null)
  const [aProcessar, setAProcessar] = useState(null)

  useEffect(() => {
    carregarCandidaturas()
  }, [])

  const carregarCandidaturas = () => {
    setLoading(true)
    api.get('/tm/candidaturas')
      .then(res => setCandidaturas(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const abrirDetalhe = (numCandidatura) => {
    setCandidaturaSelecionada(numCandidatura)
    setDetalhe(null)
    setFeedback('')
    setLoadingDetalhe(true)
    api.get(`/tm/candidaturas/${numCandidatura}/detalhe`)
      .then(res => setDetalhe(res.data))
      .catch(() => mostrarToast('Erro ao carregar detalhes da candidatura.', 'erro'))
      .finally(() => setLoadingDetalhe(false))
  }

  const fecharDetalhe = () => {
    setCandidaturaSelecionada(null)
    setDetalhe(null)
    setFeedback('')
  }

  const devolverCandidatura = async (numCandidatura) => {
    setAProcessar(numCandidatura)
    try {
      await api.put(`/tm/candidaturas/${numCandidatura}/devolver`, { comentario: feedback || undefined })
      setCandidaturas(prev => prev.map(c =>
        c.numCandidatura === numCandidatura ? { ...c, idEstadoAtual: 2 } : c
      ))
      fecharDetalhe()
      mostrarToast(`Candidatura #${numCandidatura} devolvida para retificação.`, 'rejeitada')
    } catch (err) {
      mostrarToast(err.response?.data?.error || 'Erro ao devolver candidatura.', 'erro')
    } finally {
      setAProcessar(null)
    }
  }
  
   const mostrarToast = (mensagem, tipo = 'sucesso') => {
    setToast({ mensagem, tipo })
    setTimeout(() => setToast(null), 3500)
  }

  const aprovarCandidatura = async (numCandidatura) => {
    setAProcessar(numCandidatura)
    try {
      await api.put(`/tm/candidaturas/${numCandidatura}/aprovar`, { comentario: feedback || undefined })
      setCandidaturas(prev => prev.map(c =>
        c.numCandidatura === numCandidatura ? { ...c, idEstadoAtual: 3 } : c
      ))
      fecharDetalhe()
      mostrarToast(`Candidatura #${numCandidatura} validada com sucesso.`, 'sucesso')
    } catch (err) {
      mostrarToast(err.response?.data?.error || 'Erro ao aprovar candidatura.', 'erro')
    } finally {
      setAProcessar(null)
    }
  }

  const rejeitarCandidatura = async (numCandidatura) => {
    setAProcessar(numCandidatura)
    try {
      await api.put(`/tm/candidaturas/${numCandidatura}/rejeitar`)
      setCandidaturas(prev => prev.map(c =>
        c.numCandidatura === numCandidatura ? { ...c, idEstadoAtual: 6 } : c
      ))
      fecharDetalhe()
      mostrarToast(`Candidatura #${numCandidatura} rejeitada.`, 'rejeitada')
    } catch (err) {
      mostrarToast(err.response?.data?.error || 'Erro ao rejeitar candidatura.', 'erro')
    } finally {
      setAProcessar(null)
    }
  }

  const niveisDisponiveis = [...new Set(candidaturas.map(c => c.nomeNivel).filter(Boolean))]

  const candidaturasFiltradas = candidaturas.filter(c => {
    const termo = filtro.toLowerCase()
    const matchTexto = (
      c.nomeConsultor?.toLowerCase().includes(termo) ||
      c.nomeBadge?.toLowerCase().includes(termo) ||
      c.nomeArea?.toLowerCase().includes(termo)
    )
    const matchNivel = filtroNivel === 'Todos' || c.nomeNivel === filtroNivel
    const matchTab =
      tab === 'TODOS' ? true :
      tab === 'APROVADOS' ? c.idEstadoAtual === 5 :
      tab === 'REJEITADOS' ? c.idEstadoAtual === 6 : true
    return matchTexto && matchNivel && matchTab
  })

  const totalPaginas = Math.ceil(candidaturasFiltradas.length / porPagina) || 1
  const candidaturasPagina = candidaturasFiltradas.slice((pagina - 1) * porPagina, pagina * porPagina)

  const exportarExcel = () => {
    const dados = candidaturasFiltradas.map(c => ({
      'Nº Candidatura': c.numCandidatura,
      'Consultor': c.nomeConsultor,
      'Área': c.nomeArea,
      'Badge': c.nomeBadge,
      'Nível': c.nomeNivel,
      'Submetido': c.dataCriacao ? new Date(c.dataCriacao).toLocaleDateString('pt-PT') : '-',
      'Estado': nomeEstado(c.idEstadoAtual),
    }))
    const ws = XLSX.utils.json_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Validações')
    XLSX.writeFile(wb, 'validacoes.xlsx')
  }

  const exportarPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Validações', 14, 15)
    autoTable(doc, {
      startY: 25,
      head: [['Nº Candidatura', 'Consultor', 'Área', 'Badge', 'Nível', 'Submetido', 'Estado']],
      body: candidaturasFiltradas.map(c => [
        c.numCandidatura,
        c.nomeConsultor,
        c.nomeArea,
        c.nomeBadge,
        c.nomeNivel,
        c.dataCriacao ? new Date(c.dataCriacao).toLocaleDateString('pt-PT') : '-',
        nomeEstado(c.idEstadoAtual),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [57, 99, 156] },
    })
    doc.save('validacoes.pdf')
  }

 return (
    <LayoutTM>
      <div style={{ fontFamily: 'Poppins, sans-serif' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <h2 style={{ color: '#39639C', fontWeight: 700, marginBottom: 2 }}>Validações</h2>
            <p style={{ color: '#6b7280', fontSize: 13 }}>Pedidos Pendentes</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={carregarCandidaturas} title="Atualizar" style={refreshBtnStyle}>
              <FiRefreshCw />
            </button>
            <button onClick={exportarExcel} style={btnSecundarioStyle}>
              <FiDownload /> Exportar Excel
            </button>
            <button onClick={exportarPDF} style={btnSecundarioStyle}>
              <FiDownload /> Exportar PDF
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 2, minWidth: 200 }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
            <input
              placeholder="Pesquisar Consultor, Badge, Requisito..."
              value={filtro}
              onChange={e => { setFiltro(e.target.value); setPagina(1) }}
              style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <select
            value={filtroNivel}
            onChange={e => { setFiltroNivel(e.target.value); setPagina(1) }}
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, outline: 'none', color: '#555', minWidth: 140 }}
          >
            <option value="Todos">Nível - Todos</option>
            {niveisDisponiveis.map((n, i) => <option key={i} value={n}>{n}</option>)}
          </select>

          <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 10, padding: 4 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => { setTab(t); setPagina(1) }} style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', fontSize: 12,
                cursor: 'pointer', fontWeight: 600,
                background: tab === t ? '#fff' : 'transparent',
                color: tab === t ? '#39639C' : '#6b7280',
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}>{t}</button>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#aaa', padding: 20 }}>A carregar...</p>
          ) : candidaturasPagina.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#aaa', padding: 20 }}>Sem candidaturas para mostrar.</p>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                    {['Nº Candidatura', 'Consultor', 'Área', 'Badge', 'Nível', 'Submetido', 'Estado', 'Ações'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {candidaturasPagina.map((c) => {
                    const cores = corEstado(c.idEstadoAtual)
                    const ativa = c.idEstadoAtual === 1 || c.idEstadoAtual === 2
                    return (
                      <tr key={c.numCandidatura} style={{ borderBottom: '1px solid #f9f9f9' }}>
                        <td style={{ padding: '10px 12px' }}>{c.numCandidatura}</td>
                        <td style={{ padding: '10px 12px' }}>{c.nomeConsultor}</td>
                        <td style={{ padding: '10px 12px', color: '#6b7280' }}>{c.nomeArea}</td>
                        <td style={{ padding: '10px 12px' }}>{c.nomeBadge}</td>
                        <td style={{ padding: '10px 12px', color: '#6b7280' }}>{c.nomeNivel}</td>
                        <td style={{ padding: '10px 12px', color: '#6b7280' }}>
                          {c.dataCriacao ? new Date(c.dataCriacao).toLocaleDateString('pt-PT') : '-'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            background: cores.bg, color: cores.color,
                            borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                          }}>{nomeEstado(c.idEstadoAtual)}</span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <button title="Ver detalhes" onClick={() => abrirDetalhe(c.numCandidatura)} style={iconBtnStyle}>
                              <FaRegEye color="#39639C" size={16} />
                            </button>
                            {ativa && (
                              <>
                                <button
                                  title="Aprovar"
                                  onClick={() => aprovarCandidatura(c.numCandidatura)}
                                  disabled={aProcessar === c.numCandidatura}
                                  style={{ ...iconBtnStyle, opacity: aProcessar === c.numCandidatura ? 0.5 : 1 }}
                                >
                                  <FaRegCheckCircle color="#06A120" size={16} />
                                </button>
                                <button
                                  title="Rejeitar"
                                  onClick={() => rejeitarCandidatura(c.numCandidatura)}
                                  disabled={aProcessar === c.numCandidatura}
                                  style={{ ...iconBtnStyle, opacity: aProcessar === c.numCandidatura ? 0.5 : 1 }}
                                >
                                  <FaRegTimesCircle color="#AE0003" size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {totalPaginas > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                  <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)} style={paginaBtnStyle}>
                    Anterior
                  </button>
                  <span style={{ fontSize: 13, color: '#6b7280', alignSelf: 'center' }}>
                    Página {pagina} de {totalPaginas}
                  </span>
                  <button disabled={pagina === totalPaginas} onClick={() => setPagina(p => p + 1)} style={paginaBtnStyle}>
                    Seguinte
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {candidaturaSelecionada && (
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, maxWidth: 600 }}>
            <button onClick={fecharDetalhe} style={fecharStyle}>×</button>

            {loadingDetalhe || !detalhe ? (
              <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>A carregar...</p>
            ) : (
              <>
                <h4 style={{ color: '#1a1a2e', fontWeight: 700, marginBottom: 18 }}>
                  Nº Candidatura: {detalhe.numCandidatura}
                </h4>

                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <div style={cartaoInfoStyle}>
                    <span style={cartaoLabelStyle}>Consultor:</span>
                    <strong style={{ fontSize: 13 }}>{detalhe.nomeConsultor}</strong>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{detalhe.emailConsultor}</span>
                  </div>
                  <div style={cartaoInfoStyle}>
                    <span style={cartaoLabelStyle}>Badge + Nível:</span>
                    <strong style={{ fontSize: 13 }}>{detalhe.nomeBadge} ({detalhe.nomeNivel})</strong>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{detalhe.pontos} pontos</span>
                  </div>
                </div>

                <h6 style={tituloSeccaoStyle}>Histórico:</h6>
                <div style={{ marginBottom: 18 }}>
                  {detalhe.historico.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#9ca3af' }}>Sem registos.</p>
                  ) : detalhe.historico.map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ color: '#39639C', fontSize: 18, lineHeight: '14px' }}>•</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{h.nomeEstado}</p>
                        <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
                          {new Date(h.dataAlteracao).toLocaleDateString('pt-PT')} às {new Date(h.dataAlteracao).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                          {h.comentario ? ` — ${h.comentario}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {detalhe.sla && (
                  <>
                    <h6 style={tituloSeccaoStyle}>SLA detalhada</h6>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18, fontSize: 13 }}>
                      <div>
                        <span style={cartaoLabelStyle}>Data de início:</span><br />
                        <strong>{new Date(detalhe.sla.dataInicio).toLocaleDateString('pt-PT')}</strong>
                      </div>
                      <div>
                        <span style={cartaoLabelStyle}>Data limite:</span><br />
                        <strong>{new Date(detalhe.sla.dataLimite).toLocaleDateString('pt-PT')}</strong>
                      </div>
                      <div>
                        <span style={cartaoLabelStyle}>Estado da SLA:</span><br />
                        <strong>
                          {Math.abs(detalhe.sla.horasRestantes)}h{' '}
                          <span style={{
                            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                            background: detalhe.sla.prazoUltrapassado ? '#AE0003' : '#06A120',
                          }} />
                        </strong>
                      </div>
                    </div>
                  </>
                )}

                <h6 style={tituloSeccaoStyle}>Requisitos:</h6>
                <div style={{ marginBottom: 18 }}>
                  {detalhe.requisitos.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#9ca3af' }}>Sem requisitos associados.</p>
                  ) : detalhe.requisitos.map((r) => (
                    <RequisitoItem key={r.idRequisito} requisito={r} />
                  ))}
                </div>

                <h6 style={tituloSeccaoStyle}>Feedback:</h6>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Adicione um comentário"
                  style={{
                    width: '100%', minHeight: 70, borderRadius: 8, border: '1px solid #ddd',
                    padding: 10, fontSize: 13, fontFamily: 'inherit', resize: 'vertical',
                    marginBottom: 20, boxSizing: 'border-box',
                  }}
                />

                  {(detalhe.idEstadoAtual === 1 || detalhe.idEstadoAtual === 2) && (
                    <div style={{
                      display: 'flex', justifyContent: 'flex-end', gap: 10,
                      position: 'sticky', bottom: -32, background: '#fff',
                      padding: '12px 0 4px', marginTop: 4,
                    }}>
                      <button
                      onClick={() => devolverCandidatura(detalhe.numCandidatura)}
                      disabled={aProcessar === detalhe.numCandidatura}
                      style={btnDevolverStyle}
                    >
                      <FiRefreshCw size={13} /> Devolver
                    </button>
                    <button
                      onClick={() => rejeitarCandidatura(detalhe.numCandidatura)}
                      disabled={aProcessar === detalhe.numCandidatura}
                      style={btnRejeitarStyle}
                    >
                      Rejeitar
                    </button>
                    <button
                      onClick={() => aprovarCandidatura(detalhe.numCandidatura)}
                      disabled={aProcessar === detalhe.numCandidatura}
                      style={btnEnviarSlStyle}
                    >
                      Enviar Service Line
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: toast.tipo === 'rejeitada' ? '#AE0003' : toast.tipo === 'erro' ? '#AE0003' : '#06A120',
          color: '#fff', padding: '12px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)', zIndex: 2000,
        }}>
          {toast.mensagem}
        </div>
      )}
    </LayoutTM>
  )
}

function RequisitoItem({ requisito }) {
  const [aberto, setAberto] = useState(false)
  const cores = requisito.estado === 'aprovado'
    ? { bg: '#e8f5e9', color: '#06A120' }
    : requisito.estado === 'rejeitado'
    ? { bg: '#fdeceb', color: '#AE0003' }
    : { bg: '#FFF3E0', color: '#F57C00' }

  return (
    <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
      <div
        onClick={() => setAberto(!aberto)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', cursor: 'pointer' }}
      >
        <span style={{ fontSize: 13, fontWeight: 600 }}>{requisito.nomeRequisito}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            background: cores.bg, color: cores.color, borderRadius: 20,
            padding: '3px 10px', fontSize: 11, fontWeight: 600,
          }}>
            • {requisito.estado === 'aprovado' ? 'Aprovado' : requisito.estado === 'rejeitado' ? 'Rejeitado' : 'Em validação'}
          </span>
          <span style={{ color: '#9ca3af', fontSize: 12 }}>{aberto ? '▲' : '▼'}</span>
        </div>
      </div>
      {aberto && (
        <div style={{ padding: '0 14px 12px', fontSize: 12, color: '#6b7280' }}>
          {requisito.descricao && <p style={{ margin: '0 0 8px' }}>{requisito.descricao}</p>}
          {requisito.pathFicheiro ? (
            <a href={requisito.pathFicheiro} target="_blank" rel="noreferrer" style={{ color: '#39639C', fontWeight: 600 }}>
              Ver evidência submetida
            </a>
          ) : (
            <span style={{ color: '#9ca3af' }}>Sem evidência submetida.</span>
          )}
        </div>
      )}
    </div>
  )
}


const btnSecundarioStyle = {
  background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '8px 14px',
  fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
}

const refreshBtnStyle = {
  background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '8px 10px',
  cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#39639C', fontSize: 14,
}

const iconBtnStyle = {
  background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4,
}

const paginaBtnStyle = {
  padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 13,
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  padding: 24, boxSizing: 'border-box',
}

const modalStyle = {
  background: '#fff', borderRadius: 14, padding: '28px 28px 32px', width: '90%',
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)', position: 'relative',
  maxHeight: '88vh', overflowY: 'auto',
}

const fecharStyle = {
  position: 'absolute', top: 12, right: 16, background: 'none',
  border: 'none', fontSize: 22, cursor: 'pointer', color: '#999',
}   

const btnAprovarStyle = {
  background: '#39639C', color: '#fff', border: 'none', borderRadius: 6,
  padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
}

const btnRejeitarStyle = {
  background: '#fff', color: '#AE0003', border: '1px solid #AE0003', borderRadius: 6,
  padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
}

const btnEnviarSlStyle = {
  background: '#06A120', color: '#fff', border: 'none', borderRadius: 6,
  padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
}

const btnDevolverStyle = {
  background: '#fff', color: '#39639C', border: '1px solid #39639C', borderRadius: 6,
  padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6,
}

const cartaoInfoStyle = {
  flex: 1, background: '#f9fafb', borderRadius: 10, padding: '10px 14px',
  display: 'flex', flexDirection: 'column', gap: 2,
}

const cartaoLabelStyle = {
  fontSize: 11, color: '#9ca3af',
}

const tituloSeccaoStyle = {
  fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 10,
}