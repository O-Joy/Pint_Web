import { useState, useEffect, useRef } from 'react'
import { Modal } from 'bootstrap'
import LayoutConsultor from './components/LayoutConsultor'
import api from '../../services/api'
import { FaLayerGroup, FaSitemap, FaRoute, FaCrown, FaTrophy } from 'react-icons/fa'

// Ícone + cor por tipo de objetivo — IDs fixos da tabela tipo_objetivo
const VISUAL_POR_TIPO = {
  1: { Icone: FaLayerGroup, cor: '#39639C' },// Completar Área
  2: { Icone: FaSitemap, cor: '#6f42c1' },// Completar Service Line
  3: { Icone: FaRoute, cor: '#0d9488' },// Completar Learning Path
  4: { Icone: FaCrown, cor: '#d4a017' },// Atingir Nível Líder
  5: { Icone: FaTrophy, cor: '#e67e22' },// Atingir Topo Gamification
}

function formatarData(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-PT')
}

function diasRestantesTexto(dataFim) {
  const dias = Math.ceil((new Date(dataFim) - new Date()) / 86_400_000)
  if (dias < 0) return 'Expirado'
  if (dias === 0) return 'Hoje'
  return `${dias} Dia${dias === 1 ? '' : 's'}`
}

const CORES_RESULTADO = {
  Concluido: { bg: '#e8f5e9', cor: '#2E7D32', texto: 'Alcançado' },
  'Não Alcançado': { bg: '#fdecea', cor: '#c0392b', texto: 'Não Alcançado' },
  Eliminado: { bg: '#f3f4f6', cor: '#6b7280', texto: 'Eliminado' },
}

export default function ObjetivosConsultor() {
  const [tipos, setTipos] = useState([])
  const [emCurso, setEmCurso] = useState([])
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState(true)

  const [tipoSelecionado, setTipoSelecionado] = useState(null)
  const [dataLimite, setDataLimite] = useState('')
  const [erroForm, setErroForm] = useState('')
  const [aGuardar, setAGuardar] = useState(false)

  const [objetivoParaEditar, setObjetivoParaEditar] = useState(null)
  const [novaDataEdicao, setNovaDataEdicao] = useState('')
  const [erroEdicao, setErroEdicao] = useState('')

  const [objetivoParaRemover, setObjetivoParaRemover] = useState(null)
  const [mensagemSucesso, setMensagemSucesso] = useState('')

  const modalCriarRef = useRef(null)
  const modalEditarRef = useRef(null)
  const modalRemoverRef = useRef(null)
  const modalSucessoRef = useRef(null)

  const carregarTudo = () => {
    setLoading(true)
    Promise.all([
      api.get('/objetivos/tipos'),
      api.get('/objetivos/em-curso'),
      api.get('/objetivos/historico'),
    ])
      .then(([resTipos, resEmCurso, resHistorico]) => {
        setTipos(Array.isArray(resTipos.data) ? resTipos.data : [])
        setEmCurso(Array.isArray(resEmCurso.data) ? resEmCurso.data : [])
        setHistorico(Array.isArray(resHistorico.data) ? resHistorico.data : [])
      })
      .catch((err) => console.error('[ObjetivosConsultor]', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregarTudo() }, [])

  // Fecha um modal e só abre o seguinte depois da animação de fecho acabar
  // (evita dois backdrops do Bootstrap a sobrepor-se)
  const trocarModal = (elFechar, refAbrir) => {
    const instancia = Modal.getInstance(elFechar)
    const aoFechar = () => {
      Modal.getOrCreateInstance(refAbrir.current).show()
      elFechar.removeEventListener('hidden.bs.modal', aoFechar)
    }
    elFechar.addEventListener('hidden.bs.modal', aoFechar)
    instancia?.hide()
  }


  // Criar
  const abrirModalCriar = (tipo) => {
    setTipoSelecionado(tipo)
    setDataLimite('')
    setErroForm('')
    Modal.getOrCreateInstance(modalCriarRef.current).show()
  }

  const confirmarCriar = async () => {
    if (!dataLimite) { setErroForm('Escolhe uma data limite.'); return }
    setAGuardar(true)
    setErroForm('')
    try {
      await api.post('/objetivos', { idTipoObjetivo: tipoSelecionado.id, dataFim: dataLimite })
      carregarTudo()
      trocarModal(modalCriarRef.current, modalSucessoRef)
      setMensagemSucesso(`Objetivo "${tipoSelecionado.nome}" criado com sucesso!`)
    } catch (err) {
      setErroForm(err?.response?.data?.error || 'Não foi possível criar o objetivo.')
    } finally {
      setAGuardar(false)
    }
  }

  // Editar
  const abrirModalEditar = (obj) => {
    setObjetivoParaEditar(obj)
    setNovaDataEdicao(obj.dataFim?.slice(0, 10) || '')
    setErroEdicao('')
    Modal.getOrCreateInstance(modalEditarRef.current).show()
  }

  const confirmarEditar = async () => {
    setErroEdicao('')
    try {
      await api.put(`/objetivos/${objetivoParaEditar.id}`, { dataFim: novaDataEdicao })
      carregarTudo()
      trocarModal(modalEditarRef.current, modalSucessoRef)
      setMensagemSucesso('Data limite atualizada com sucesso!')
    } catch (err) {
      setErroEdicao(err?.response?.data?.error || 'Não foi possível editar o objetivo.')
    }
  }

  // Remover
  const abrirModalRemover = (obj) => {
    setObjetivoParaRemover(obj)
    Modal.getOrCreateInstance(modalRemoverRef.current).show()
  }

  const confirmarRemover = async () => {
    try {
      await api.delete(`/objetivos/${objetivoParaRemover.id}`)
      carregarTudo()
      trocarModal(modalRemoverRef.current, modalSucessoRef)
      setMensagemSucesso('Objetivo removido.')
    } catch (err) {
      trocarModal(modalRemoverRef.current, modalSucessoRef)
      setMensagemSucesso(err?.response?.data?.error || 'Não foi possível remover o objetivo.')
    }
  }

  return (
    <LayoutConsultor>
      <div className="p-4">

                <h2 className="text-center fw-bold mb-4" style={{ color: '#39639C' }}>Crie um novo objetivo</h2>

                <div className="row g-3 mb-5">
                  {tipos.map((tipo) => {
                    const visual = VISUAL_POR_TIPO[tipo.id] || { Icone: FaLayerGroup, cor: '#39639C' }
                    const jaEmCurso = emCurso.some((o) => o.idTipoObjetivo === tipo.id)
                    return (
                      <div key={tipo.id} className="col-12 col-md-6 col-lg-4">
                        <button
                          type="button"
                          disabled={jaEmCurso}
                          onClick={() => abrirModalCriar(tipo)}
                          className="w-100 h-100 border-0 text-center p-4"
                          style={{
                            background: jaEmCurso ? '#f3f4f6' : '#fff',
                            borderRadius: 14,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            cursor: jaEmCurso ? 'not-allowed' : 'pointer',
                            opacity: jaEmCurso ? 0.6 : 1,
                          }}
                        >
                          <div style={{ fontSize: 34, color: visual.cor, marginBottom: 10 }}>
                            <visual.Icone />
                          </div>
                          <div className="fw-bold" style={{ color: '#1a1a2e', fontSize: 15 }}>{tipo.nome}</div>
                          <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>
                            {jaEmCurso ? 'Já tens este objetivo em curso' : tipo.descricao}
                          </div>
                        </button>
                      </div>
                    )
                  })}
                </div>

                <h3 className="fw-bold mb-3" style={{ color: '#39639C' }}>Objetivos em progresso</h3>

                {loading ? (
                  <p className="text-center text-muted">A carregar...</p>
                ) : emCurso.length === 0 ? (
                  <p className="text-muted mb-5">Ainda não tens nenhum objetivo em curso — escolhe um acima para começares.</p>
                ) : (
                  <div className="table-responsive mb-5">
                    <table className="table align-middle bg-white" style={{ borderRadius: 12, overflow: 'hidden' }}>
                      <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                          <th style={{ minWidth: 220 }}>Objetivo</th>
                          <th style={{ minWidth: 200 }}>Progresso</th>
                          <th>Data Inicial</th>
                          <th>Data Final</th>
                          <th>Dias Restantes</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {emCurso.map((obj) => (
                          <tr key={obj.id}>
                            <td className="fw-semibold">{obj.nomeTipo}</td>
                            <td>
                              {obj.formato === 'posicao' ? (
                                <div className="d-flex align-items-center gap-2">
                                  <div className="text-center border rounded px-2 py-1">
                                    <div className="fw-bold" style={{ color: '#39639C' }}>{obj.atual ?? '—'}</div>
                                    <div style={{ fontSize: 10, color: '#9ca3af' }}>Atual</div>
                                  </div>
                                  <span className="text-muted">→</span>
                                  <div className="text-center border rounded px-2 py-1">
                                    <div className="fw-bold" style={{ color: '#39639C' }}>{obj.meta}</div>
                                    <div style={{ fontSize: 10, color: '#9ca3af' }}>Objetivo</div>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="progress" style={{ height: 8 }}>
                                    <div
                                      className="progress-bar"
                                      style={{ width: `${obj.percentagem}%`, background: '#39639C' }}
                                    />
                                  </div>
                                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{obj.atual}/{obj.meta}</div>
                                </div>
                              )}
                            </td>
                            <td style={{ fontSize: 13 }}>{formatarData(obj.dataInicio)}</td>
                            <td style={{ fontSize: 13 }}>{formatarData(obj.dataFim)}</td>
                            <td className="fw-semibold" style={{ fontSize: 13, color: '#39639C' }}>{diasRestantesTexto(obj.dataFim)}</td>
                            <td className="text-end" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                              <button className="btn btn-link btn-sm p-0 me-2" onClick={() => abrirModalEditar(obj)}>Editar</button>
                              <button className="btn btn-link btn-sm p-0 text-danger" onClick={() => abrirModalRemover(obj)}>Remover</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <h3 className="fw-bold mb-3" style={{ color: '#39639C' }}>Histórico</h3>
                {historico.length === 0 ? (
                  <p className="text-muted">Ainda sem objetivos terminados.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle bg-white" style={{ borderRadius: 12, overflow: 'hidden' }}>
                      <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                          <th>Tipo de objetivo</th>
                          <th>Data Inicial</th>
                          <th>Data Final</th>
                          <th>Data de Conclusão</th>
                          <th>Resultado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historico.map((h) => {
                          const cores = CORES_RESULTADO[h.resultado] || { bg: '#f3f4f6', cor: '#6b7280', texto: h.resultado }
                          return (
                            <tr key={h.id}>
                              <td className="fw-semibold">{h.nomeTipo}</td>
                              <td style={{ fontSize: 13 }}>{formatarData(h.dataInicio)}</td>
                              <td style={{ fontSize: 13 }}>{formatarData(h.dataFim)}</td>
                              <td style={{ fontSize: 13 }}>{formatarData(h.dataConclusao)}</td>
                              <td>
                                <span
                                  className="badge rounded-pill"
                                  style={{ background: cores.bg, color: cores.cor, fontWeight: 600, fontSize: 11 }}
                                >
                                  {cores.texto}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>

      {/* Modal — Criar objetivo */}
      <div className="modal fade" ref={modalCriarRef} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header border-0 pb-0">
              <div>
                <h5 className="modal-title fw-bold">{tipoSelecionado?.nome}</h5>
                <p className="text-muted mb-0" style={{ fontSize: 13 }}>Preenche os detalhes para criar um novo objetivo</p>
              </div>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Data limite</label>
              <input
                type="date"
                className="form-control"
                value={dataLimite}
                min={new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)}
                onChange={(e) => setDataLimite(e.target.value)}
              />
              {erroForm && <div className="text-danger mt-2" style={{ fontSize: 13 }}>{erroForm}</div>}
            </div>
            <div className="modal-footer border-0">
              <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" className="btn text-white" style={{ background: '#39639C' }} disabled={aGuardar} onClick={confirmarCriar}>
                {aGuardar ? 'A criar...' : 'Criar Objetivo'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal — Editar objetivo */}
      <div className="modal fade" ref={modalEditarRef} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-bold">Editar "{objetivoParaEditar?.nomeTipo}"</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Nova data limite</label>
              <input
                type="date"
                className="form-control"
                value={novaDataEdicao}
                min={new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)}
                onChange={(e) => setNovaDataEdicao(e.target.value)}
              />
              {erroEdicao && <div className="text-danger mt-2" style={{ fontSize: 13 }}>{erroEdicao}</div>}
            </div>
            <div className="modal-footer border-0">
              <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" className="btn text-white" style={{ background: '#39639C' }} onClick={confirmarEditar}>Guardar</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal — Confirmar remoção */}
      <div className="modal fade" ref={modalRemoverRef} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-bold">Remover objetivo?</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14 }}>
                Tens a certeza que queres remover o objetivo <strong>"{objetivoParaRemover?.nomeTipo}"</strong>?
                Vai ficar registado no histórico como "Eliminado".
              </p>
            </div>
            <div className="modal-footer border-0">
              <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" className="btn btn-danger" onClick={confirmarRemover}>Remover</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal — Sucesso / aviso genérico */}
      <div className="modal fade" ref={modalSucessoRef} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content text-center">
            <div className="modal-body py-4">
              <p className="mb-0 fw-semibold">{mensagemSucesso}</p>
            </div>
            <div className="modal-footer border-0 justify-content-center pt-0">
              <button type="button" className="btn text-white px-4" style={{ background: '#39639C' }} data-bs-dismiss="modal">OK</button>
            </div>
          </div>
        </div>
      </div>
    </LayoutConsultor>
  )
}