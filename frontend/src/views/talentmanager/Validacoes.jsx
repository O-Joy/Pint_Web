import { useState, useEffect } from 'react'
import LayoutTM from './components/LayoutTM'
import api from '../../services/api'
import { FiDownload, FiSearch, FiRefreshCw, FiCornerUpLeft, FiSend, FiCheckCircle, FiChevronDown } from 'react-icons/fi'
import { FaRegEye } from 'react-icons/fa'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

const corSla = (slaEstado) => {
  if (slaEstado === 'estourado') return '#AE0003'
  if (slaEstado === 'alerta') return '#F57C00'
  return '#06A120'
}

const TABS = ['TODOS', 'APROVADOS', 'REJEITADOS']

const OPCOES_EXPORTAR = [
  { id: 'candidaturas', label: 'Candidaturas' },
  { id: 'evidencias', label: 'Evidências' },
  { id: 'historico', label: 'Histórico de Validações' },
  { id: 'sla', label: 'SLA' },
  { id: 'certificados', label: 'Certificados' },
]

const OPCOES_CERTIFICADO = [
  { id: 'assinatura', label: 'Assinatura Service Line' },
  { id: 'data', label: 'Data' },
  { id: 'logotipo', label: 'Logótipo' },
]

const TEXTOS_CONFIRMACAO = {
  aprovar: {
    texto: (num) => `Esta ação não pode ser revertida. A candidatura ${num} será aceite e será encaminhada para o Service Line.`,
    botao: 'VALIDAR',
    cor: '#06A120',
  },
  rejeitar: {
    texto: (num) => `Esta ação não pode ser revertida. A candidatura ${num} será rejeitada de imediato.`,
    botao: 'REJEITAR',
    cor: '#AE0003',
  },
  devolver: {
    texto: (num) => `Esta ação não pode ser revertida. A candidatura ${num} será devolvida para o consultor.`,
    botao: 'DEVOLVER',
    cor: '#F57C00',
  },
}

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
  const [requisitoAberto, setRequisitoAberto] = useState(null)

  const [toast, setToast] = useState(null)
  const [aProcessar, setAProcessar] = useState(null)
  const [confirmacao, setConfirmacao] = useState(null) // { tipo: 'aprovar'|'rejeitar'|'devolver' }

  const [ordenarPor, setOrdenarPor] = useState('numCandidatura')
  const [ordemDesc, setOrdemDesc] = useState(false)

  const [modalExportar, setModalExportar] = useState(null) // 'excel' | 'pdf' | null
  const [tiposSelecionados, setTiposSelecionados] = useState(['candidaturas'])

  const [modalCertificado, setModalCertificado] = useState(false)
  const [itensCertificado, setItensCertificado] = useState([])
  const [comentariosEvidencia, setComentariosEvidencia] = useState({})

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

  const mostrarToast = (titulo, subtitulo = '', tipo = 'sucesso') => {
    setToast({ titulo, subtitulo, tipo })
    setTimeout(() => setToast(null), 4000)
  }

  const abrirDetalhe = (c) => {
    setCandidaturaSelecionada(c)
    setFeedback('')
    setRequisitoAberto(null)
    setDetalhe(null)
    setLoadingDetalhe(true)
    api.get(`/tm/candidaturas/${c.numCandidatura}/detalhe`)
      .then(res => setDetalhe(res.data))
      .catch(() => setDetalhe(null))
      .finally(() => setLoadingDetalhe(false))
  }

  const fecharDetalhe = () => {
    setCandidaturaSelecionada(null)
    setDetalhe(null)
  }

  const atualizarRequisitoLocal = (idRequisito, dadosNovos) => {
  setDetalhe(prev => prev ? {
    ...prev,
    requisitos: prev.requisitos.map(r => r.idRequisito === idRequisito ? { ...r, ...dadosNovos } : r),
  } : prev)
}

const validarEvidencia = async (idRequisito, idEvidencia) => {
  try {
    await api.put(`/tm/evidencias/${idEvidencia}/validar`)
    atualizarRequisitoLocal(idRequisito, { estado: 'Validado' })
    mostrarToast('Requisito validado com sucesso!', '', 'sucesso')
  } catch (err) {
    mostrarToast(err.response?.data?.error || 'Erro ao validar requisito.', '', 'erro')
  }
}

const rejeitarEvidencia = async (idRequisito, idEvidencia) => {
  try {
    await api.put(`/tm/evidencias/${idEvidencia}/rejeitar`)
    atualizarRequisitoLocal(idRequisito, { estado: 'Rejeitado' })
    mostrarToast('Requisito rejeitado.', '', 'erro')
  } catch (err) {
    mostrarToast(err.response?.data?.error || 'Erro ao rejeitar requisito.', '', 'erro')
  }
}

const descarregarFicheiro = async (idEvidencia, nomeFicheiro) => {
  try {
    const res = await api.get(`/tm/evidencias/${idEvidencia}/download`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = nomeFicheiro || 'evidencia'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    mostrarToast('Erro ao obter o ficheiro.', '', 'erro')
  }
}

  const aprovarCandidatura = async (numCandidatura) => {
    setAProcessar(numCandidatura)
    try {
      await api.put(`/tm/candidaturas/${numCandidatura}/aprovar`)
      setCandidaturas(prev => prev.map(c => c.numCandidatura === numCandidatura ? { ...c, idEstadoAtual: 3 } : c))
      fecharDetalhe()
      mostrarToast(`Candidatura ${numCandidatura} validada com sucesso!`, 'Enviada ao Service Line para prosseguir a validação.', 'sucesso')
    } catch (err) {
      mostrarToast(err.response?.data?.error || 'Erro ao processar candidatura.', '', 'erro')
    } finally {
      setAProcessar(null)
      setConfirmacao(null)
    }
  }

  const rejeitarCandidatura = async (numCandidatura) => {
    setAProcessar(numCandidatura)
    try {
      await api.put(`/tm/candidaturas/${numCandidatura}/rejeitar`, { comentario: feedback })
      setCandidaturas(prev => prev.map(c => c.numCandidatura === numCandidatura ? { ...c, idEstadoAtual: 6 } : c))
      fecharDetalhe()
      mostrarToast(`Candidatura ${numCandidatura} rejeitada com sucesso!`, '', 'sucesso')
    } catch (err) {
      mostrarToast(err.response?.data?.error || 'Erro ao processar candidatura.', '', 'erro')
    } finally {
      setAProcessar(null)
      setConfirmacao(null)
    }
  }

  const devolverCandidatura = async (numCandidatura) => {
    setAProcessar(numCandidatura)
    try {
      await api.put(`/tm/candidaturas/${numCandidatura}/devolver`, { comentario: feedback })
      setCandidaturas(prev => prev.map(c => c.numCandidatura === numCandidatura ? { ...c, idEstadoAtual: 2 } : c))
      fecharDetalhe()
      mostrarToast(`Candidatura ${numCandidatura} devolvida com sucesso!`, '', 'sucesso')
    } catch (err) {
      mostrarToast(err.response?.data?.error || 'Erro ao processar candidatura.', '', 'erro')
    } finally {
      setAProcessar(null)
      setConfirmacao(null)
    }
  }

  const executarConfirmacao = () => {
    if (!confirmacao) return
    const { tipo, numCandidatura } = confirmacao
    if (tipo === 'aprovar') aprovarCandidatura(numCandidatura)
    else if (tipo === 'rejeitar') rejeitarCandidatura(numCandidatura)
    else if (tipo === 'devolver') devolverCandidatura(numCandidatura)
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

  const candidaturasOrdenadas = [...candidaturasFiltradas].sort((a, b) => {
    let valA = a[ordenarPor]
    let valB = b[ordenarPor]
    if (ordenarPor === 'dataCriacao') {
      valA = valA ? new Date(valA).getTime() : 0
      valB = valB ? new Date(valB).getTime() : 0
    } else if (typeof valA === 'string') {
      valA = valA?.toLowerCase() || ''
      valB = valB?.toLowerCase() || ''
    } else {
      valA = valA ?? 0
      valB = valB ?? 0
    }
    if (valA < valB) return ordemDesc ? 1 : -1
    if (valA > valB) return ordemDesc ? -1 : 1
    return 0
  })

  const totalPaginas = Math.ceil(candidaturasOrdenadas.length / porPagina) || 1
  const candidaturasPagina = candidaturasOrdenadas.slice((pagina - 1) * porPagina, pagina * porPagina)

  const toggleTipoExportar = (id) => {
    setTiposSelecionados(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  const montarColunas = () => {
    const colunas = []
    if (tiposSelecionados.includes('candidaturas')) {
      colunas.push(
        ['Nº Candidatura', c => c.numCandidatura],
        ['Consultor', c => c.nomeConsultor],
        ['Área', c => c.nomeArea],
        ['Badge', c => c.nomeBadge],
        ['Nível', c => c.nomeNivel],
        ['Submetido', c => c.dataCriacao ? new Date(c.dataCriacao).toLocaleDateString('pt-PT') : '-'],
        ['Estado', c => nomeEstado(c.idEstadoAtual)],
      )
    }
    if (tiposSelecionados.includes('evidencias')) {
      colunas.push(['Requisitos', c => c.nomesRequisitos || '-'])
    }
    if (tiposSelecionados.includes('sla')) {
      colunas.push(['SLA (horas)', c => c.slaHoras ?? '-'], ['SLA Estado', c => c.slaEstado ?? '-'])
    }
    return colunas
  }

  const confirmarExportacao = () => {
    const colunas = montarColunas()
    if (modalExportar === 'excel') {
      const dados = candidaturasOrdenadas.map(c => {
        const linha = {}
        colunas.forEach(([label, get]) => { linha[label] = get(c) })
        return linha
      })
      const ws = XLSX.utils.json_to_sheet(dados)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Validações')
      XLSX.writeFile(wb, 'validacoes.xlsx')
    } else if (modalExportar === 'pdf') {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('Validações', 14, 15)
      autoTable(doc, {
        startY: 25,
        head: [colunas.map(([label]) => label)],
        body: candidaturasOrdenadas.map(c => colunas.map(([, get]) => get(c))),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [57, 99, 156] },
      })
      doc.save('validacoes.pdf')
    }
    setModalExportar(null)
    mostrarToast('Os dados foram exportados com sucesso!', '', 'sucesso')
  }

  const toggleItemCertificado = (id) => {
    setItensCertificado(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const confirmarCertificado = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Certificado de Badge', 14, 20)
    if (itensCertificado.includes('logotipo')) { doc.setFontSize(12); doc.text('SOFTINSA', 14, 30) }
    doc.setFontSize(12)
    doc.text(`Candidatura Nº ${candidaturaSelecionada?.numCandidatura ?? ''}`, 14, 45)
    doc.text(`Consultor: ${candidaturaSelecionada?.nomeConsultor ?? ''}`, 14, 53)
    doc.text(`Badge: ${candidaturaSelecionada?.nomeBadge ?? ''}`, 14, 61)
    if (itensCertificado.includes('data')) doc.text(`Data: ${new Date().toLocaleDateString('pt-PT')}`, 14, 69)
    if (itensCertificado.includes('assinatura')) doc.text('Assinatura Service Line: ____________________', 14, 90)
    doc.save(`certificado_${candidaturaSelecionada?.numCandidatura}.pdf`)
    setModalCertificado(false)
    mostrarToast('Certificado exportado com sucesso!', '', 'sucesso')
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
            <button onClick={carregarCandidaturas} title="Atualizar" style={refreshBtnStyle}><FiRefreshCw /></button>
            <button onClick={() => { setTiposSelecionados(['candidaturas']); setModalExportar('excel') }} style={btnSecundarioStyle}><FiDownload /> Exportar Excel</button>
            <button onClick={() => { setTiposSelecionados(['candidaturas']); setModalExportar('pdf') }} style={btnSecundarioStyle}><FiDownload /> Exportar PDF</button>
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
          <select value={filtroNivel} onChange={e => { setFiltroNivel(e.target.value); setPagina(1) }} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, outline: 'none', color: '#555', minWidth: 140 }}>
            <option value="Todos">Nível - Todos</option>
            {niveisDisponiveis.map((n, i) => <option key={i} value={n}>{n}</option>)}
          </select>
          <select value={ordenarPor} onChange={e => { setOrdenarPor(e.target.value); setPagina(1) }} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, outline: 'none', color: '#555', minWidth: 160 }}>
            <option value="numCandidatura">Ordenar por Nº Candidatura</option>
            <option value="nomeConsultor">Ordenar por Consultor</option>
            <option value="nomeBadge">Ordenar por Badge</option>
            <option value="nomeArea">Ordenar por Área</option>
            <option value="nomeNivel">Ordenar por Nível</option>
            <option value="dataCriacao">Ordenar por Data</option>
          </select>
          <button onClick={() => setOrdemDesc(!ordemDesc)} title={ordemDesc ? 'Descendente' : 'Ascendente'} style={{ ...refreshBtnStyle, fontWeight: 700 }}>{ordemDesc ? '↓' : '↑'}</button>
          <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 10, padding: 4 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => { setTab(t); setPagina(1) }} style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', fontSize: 12, cursor: 'pointer', fontWeight: 600,
                background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#39639C' : '#6b7280',
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
                    {['Nº Candidatura', 'Consultor', 'Área', 'Badge', 'Nível', 'Requisitos', 'Submetido', 'SLA', 'Estado', 'Ações'].map(h => (
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
                        <td style={{ padding: '10px 12px', color: '#6b7280' }}>{c.nomesRequisitos || '-'}</td>
                        <td style={{ padding: '10px 12px', color: '#6b7280' }}>{c.dataCriacao ? new Date(c.dataCriacao).toLocaleDateString('pt-PT') : '-'}</td>
                        <td style={{ padding: '10px 12px' }}>
                          {c.slaHoras ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#333' }}>
                              {c.slaHoras}H
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: corSla(c.slaEstado) }} />
                            </span>
                          ) : '-'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ background: cores.bg, color: cores.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{nomeEstado(c.idEstadoAtual)}</span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <button title="Ver detalhes" onClick={() => abrirDetalhe(c)} style={iconBtnStyle}>
                              <FaRegEye color="#39639C" size={16} />
                            </button>
                            {ativa && (
                              <>
                                <button title="Devolver" onClick={() => setConfirmacao({ tipo: 'devolver', numCandidatura: c.numCandidatura })} disabled={aProcessar === c.numCandidatura} style={{ ...iconBtnStyle, opacity: aProcessar === c.numCandidatura ? 0.5 : 1 }}>
                                  <FiCornerUpLeft color="#F57C00" size={16} />
                                </button>
                                <button title="Enviar Service Line" onClick={() => setConfirmacao({ tipo: 'aprovar', numCandidatura: c.numCandidatura })} disabled={aProcessar === c.numCandidatura} style={{ ...iconBtnStyle, opacity: aProcessar === c.numCandidatura ? 0.5 : 1 }}>
                                  <FiSend color="#39639C" size={16} />
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
                  <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)} style={paginaBtnStyle}>Anterior</button>
                  <span style={{ fontSize: 13, color: '#6b7280', alignSelf: 'center' }}>Página {pagina} de {totalPaginas}</span>
                  <button disabled={pagina === totalPaginas} onClick={() => setPagina(p => p + 1)} style={paginaBtnStyle}>Seguinte</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODAL DE DETALHE */}
      {candidaturaSelecionada && (
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, maxWidth: 560 }}>
            <button onClick={fecharDetalhe} style={fecharStyle}>×</button>
            <h4 style={{ color: '#1a1a2e', marginBottom: 16 }}>Nº Candidatura: {candidaturaSelecionada.numCandidatura}</h4>

            {loadingDetalhe ? (
              <p style={{ textAlign: 'center', color: '#aaa', padding: 20 }}>A carregar detalhe...</p>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                  <div style={cardInfoStyle}>
                    <p style={cardInfoLabelStyle}>Consultor</p>
                    <p style={cardInfoValorStyle}>{detalhe?.consultor?.nome || candidaturaSelecionada.nomeConsultor}</p>
                    <p style={{ fontSize: 11, color: '#6b7280' }}>{detalhe?.consultor?.email || candidaturaSelecionada.emailConsultor}</p>
                  </div>
                  <div style={cardInfoStyle}>
                    <p style={cardInfoLabelStyle}>Badge + Nível</p>
                    <p style={cardInfoValorStyle}>{candidaturaSelecionada.nomeBadge} {candidaturaSelecionada.nomeNivel}</p>
                    <p style={{ fontSize: 11, color: '#6b7280' }}>{detalhe?.badge?.pontos ?? 0} pontos</p>
                  </div>
                </div>

                <p style={secaoTituloStyle}>Histórico:</p>
                <ul style={{ margin: '0 0 18px', paddingLeft: 18, fontSize: 12, color: '#333' }}>
                  {(detalhe?.historico?.length ? detalhe.historico : [{ titulo: 'Pedido Submetido', data: candidaturaSelecionada.dataCriacao }]).map((h, i) => (
                    <li key={i} style={{ marginBottom: 4 }}>
                      <strong>{h.titulo}</strong> — {h.data ? new Date(h.data).toLocaleString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </li>
                  ))}
                </ul>

                <p style={secaoTituloStyle}>SLA cumprido/SLA</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 18 }}>
                  <div>
                    <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Data de Início</p>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{detalhe?.sla?.dataInicio ? new Date(detalhe.sla.dataInicio).toLocaleDateString('pt-PT') : '-'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Data Limite</p>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{detalhe?.sla?.dataLimite ? new Date(detalhe.sla.dataLimite).toLocaleDateString('pt-PT') : '-'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Estado do SLA</p>
                    <p style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {candidaturaSelecionada.slaHoras ?? detalhe?.sla?.horas ?? '-'}h
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: corSla(candidaturaSelecionada.slaEstado) }} />
                    </p>
                  </div>
                </div>

                <p style={secaoTituloStyle}>Requisitos</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                  {(detalhe?.requisitos || []).map((r, i) => (
                    <div key={r.idRequisito} style={requisitoItemStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setRequisitoAberto(requisitoAberto === i ? null : i)}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{r.nome} {r.nivel ? `(Nível ${r.nivel})` : ''}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: r.estado === 'Validado' ? '#06A120' : r.estado === 'Rejeitado' ? '#AE0003' : '#F57C00' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.estado === 'Validado' ? '#06A120' : r.estado === 'Rejeitado' ? '#AE0003' : '#F57C00' }} /> {r.estado}
                          </span>
                          <FiChevronDown style={{ transform: requisitoAberto === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </div>
                      </div>

                      {requisitoAberto === i && (
                        <div style={{ marginTop: 10 }}>
                          <p style={{ fontSize: 10, color: '#6b7280', marginBottom: 8 }}>Código do Requisito: {r.idRequisito}</p>

                          {r.evidencia ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: '1px solid #eee', borderRadius: 6, padding: '8px 10px', marginBottom: 10 }}>
                              <span style={{ fontSize: 11, color: '#333' }}>{r.evidencia.nomeFicheiro}</span>
                              <button
                                onClick={() => descarregarFicheiro(r.evidencia.id, r.evidencia.nomeFicheiro)}
                                style={{ background: '#39639C', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
                              >
                                Ver Ficheiro / Download
                              </button>
                            </div>
                          ) : (
                            <p style={{ fontSize: 11, color: '#aaa', marginBottom: 10 }}>Sem ficheiro submetido.</p>
                          )}

                          <textarea
                            value={comentariosEvidencia[r.idRequisito] || ''}
                            onChange={e => setComentariosEvidencia(prev => ({ ...prev, [r.idRequisito]: e.target.value }))}
                            placeholder="Escreve as observações"
                            style={{ width: '100%', minHeight: 50, borderRadius: 6, border: '1px solid #ddd', padding: 8, fontSize: 11, fontFamily: 'inherit', resize: 'vertical', marginBottom: 8, boxSizing: 'border-box' }}
                          />

                          {r.evidencia && r.estado === 'Em validação' && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                              <button onClick={() => rejeitarEvidencia(r.idRequisito, r.evidencia.id)} style={{ ...btnRejeitarStyle, padding: '4px 12px', fontSize: 11 }}>Rejeitar</button>
                              <button onClick={() => validarEvidencia(r.idRequisito, r.evidencia.id)} style={{ ...btnAprovarStyle, padding: '4px 12px', fontSize: 11 }}>Validar</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <p style={secaoTituloStyle}>Feedback</p>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Adicione um comentário"
                  style={{ width: '100%', minHeight: 70, borderRadius: 8, border: '1px solid #ddd', padding: 10, fontSize: 12, fontFamily: 'inherit', resize: 'vertical', marginBottom: 18, boxSizing: 'border-box' }}
                />

                {candidaturaSelecionada.idEstadoAtual === 5 ? (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => setModalCertificado(true)} style={btnAprovarStyle}>Exportar Certificado</button>
                  </div>
                ) : (candidaturaSelecionada.idEstadoAtual === 1 || candidaturaSelecionada.idEstadoAtual === 2) && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button onClick={() => setConfirmacao({ tipo: 'devolver', numCandidatura: candidaturaSelecionada.numCandidatura })} style={btnDevolverStyle}>Devolver</button>
                    <button onClick={() => setConfirmacao({ tipo: 'rejeitar', numCandidatura: candidaturaSelecionada.numCandidatura })} style={btnRejeitarStyle}>Rejeitar</button>
                    <button onClick={() => setConfirmacao({ tipo: 'aprovar', numCandidatura: candidaturaSelecionada.numCandidatura })} style={btnAprovarStyle}>Enviar Service Line</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO (aprovar / rejeitar / devolver) */}
      {confirmacao && (
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, maxWidth: 380 }}>
            <button onClick={() => setConfirmacao(null)} style={fecharStyle}>×</button>
            <h4 style={{ color: '#1a1a2e', marginBottom: 12, fontSize: 15 }}>Tem a certeza?</h4>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 22 }}>
              {TEXTOS_CONFIRMACAO[confirmacao.tipo].texto(confirmacao.numCandidatura)}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setConfirmacao(null)} style={btnCancelarStyle}>CANCELAR</button>
              <button
                onClick={executarConfirmacao}
                disabled={aProcessar === confirmacao.numCandidatura}
                style={{ ...btnConfirmarStyle, background: TEXTOS_CONFIRMACAO[confirmacao.tipo].cor }}
              >
                {TEXTOS_CONFIRMACAO[confirmacao.tipo].botao}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EXPORTAR (lista) */}
      {modalExportar && (
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, maxWidth: 380 }}>
            <button onClick={() => setModalExportar(null)} style={fecharStyle}>×</button>
            <h4 style={{ color: '#1a1a2e', marginBottom: 16, fontSize: 14 }}>Selecione os ficheiros que deseja exportar:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {OPCOES_EXPORTAR.map(opt => (
                <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#333', cursor: 'pointer' }}>
                  <input type="checkbox" checked={tiposSelecionados.includes(opt.id)} onChange={() => toggleTipoExportar(opt.id)} />
                  {opt.label}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setModalExportar(null)} style={btnCancelarStyle}>Cancelar</button>
              <button onClick={confirmarExportacao} disabled={tiposSelecionados.length === 0} style={btnAprovarStyle}>Exportar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CERTIFICADO */}
      {modalCertificado && (
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, maxWidth: 380 }}>
            <button onClick={() => setModalCertificado(false)} style={fecharStyle}>×</button>
            <h4 style={{ color: '#1a1a2e', marginBottom: 16, fontSize: 14 }}>Selecione os dados que deseja no certificado:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {OPCOES_CERTIFICADO.map(opt => (
                <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#333', cursor: 'pointer' }}>
                  <input type="checkbox" checked={itensCertificado.includes(opt.id)} onChange={() => toggleItemCertificado(opt.id)} />
                  {opt.label}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setModalCertificado(false)} style={btnCancelarStyle}>Cancelar</button>
              <button onClick={confirmarCertificado} style={btnAprovarStyle}>Exportar</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
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

const btnSecundarioStyle = { background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '8px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }
const refreshBtnStyle = { background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#39639C', fontSize: 14 }
const iconBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }
const paginaBtnStyle = { padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 13 }
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
const modalStyle = { background: '#fff', borderRadius: 14, padding: 28, width: '90%', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', position: 'relative', maxHeight: '85vh', overflowY: 'auto' }
const fecharStyle = { position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }
const btnAprovarStyle = { background: '#06A120', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const btnRejeitarStyle = { background: '#AE0003', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const btnDevolverStyle = { background: '#fff', color: '#F57C00', border: '1px solid #F57C00', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const btnCancelarStyle = { background: '#fff', color: '#333', border: '1px solid #ddd', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const btnConfirmarStyle = { color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }
const cardInfoStyle = { background: '#f9fafb', border: '1px solid #eee', borderRadius: 10, padding: '10px 14px' }
const cardInfoLabelStyle = { fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }
const cardInfoValorStyle = { fontSize: 13, fontWeight: 700, color: '#1a1a2e' }
const secaoTituloStyle = { fontSize: 12, fontWeight: 700, color: '#39639C', marginBottom: 8 }
const requisitoItemStyle = { background: '#f9fafb', border: '1px solid #eee', borderRadius: 8, padding: '10px 12px' }