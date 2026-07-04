import { useState, useEffect, useCallback } from 'react'
import LayoutAdmin from './components/LayoutAdmin'
import api from '../../services/api'
import { Alerta, Modal, FormField, Input, Select, useAlerta } from './ui'

function Btn({ children, onClick, variant = 'primary' }) {
  const estilos = {
    primary:   { background: '#39639C', color: 'white', border: 'none' },
    secondary: { background: 'white', color: '#39639C', border: '1px solid #39639C' },
    danger:    { background: 'white', color: '#dc3545', border: '1px solid #dc3545' },
  }
  return (
    <button onClick={onClick} style={{
      ...estilos[variant], borderRadius: 6, cursor: 'pointer',
      padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: 4,
    }}>
      {children}
    </button>
  )
}

const IconEditar = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IconApagar = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
)
const Seta = ({ aberto }) => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
    style={{ transform: aberto ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .2s', flexShrink: 0 }}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

const BotaoAcoes = ({ onEditar, onApagar }) => (
  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
    <button onClick={onEditar} style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#39639C' }}>
      <IconEditar />
    </button>
    <button onClick={onApagar} style={{ background: 'white', border: '1px solid #fca5a5', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#dc3545' }}>
      <IconApagar />
    </button>
  </div>
)

export default function AdminLearningPaths() {
  const [dados, setDados]         = useState({ lp: [], sl: [], areas: [], niveis: [], requisitos: [], badges: [] })
  const [loading, setLoading]     = useState(true)
  const [alerta, mostrar, limpar] = useAlerta()
  const [modal, setModal]         = useState(null)
  const [form, setForm]           = useState({})
  const [abertos, setAbertos]     = useState({})

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [lp, sl, areas, niveis, requisitos, badges] = await Promise.all([
        api.get('/admin/learning-paths').then(r => r.data),
        api.get('/admin/service-lines').then(r => r.data),
        api.get('/admin/areas').then(r => r.data),
        api.get('/admin/niveis').then(r => r.data),
        api.get('/admin/requisitos').then(r => r.data),
        api.get('/admin/badges/regulares').then(r => r.data),
      ])
      setDados({ lp, sl, areas, niveis, requisitos, badges })
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const toggle = key => setAbertos(p => ({ ...p, [key]: !p[key] }))
  const f = v => setForm(p => ({ ...p, ...v }))

  const abrirModal = (tipo, obj = null, defaults = {}) => {
    const iniciais = {
      lp:        { nome: '', descricao: '' },
      sl:        { nome: '', descricao: '', idLearningPath: '' },
      area:      { nome: '', descricao: '', idServiceLine: '' },
      nivel:     { nome: '', tipo: '', descricao: '', idArea: '' },
      requisito: { nome: '', descricao: '', idBadgeRegular: '' },
    }
    setForm(obj ? { ...iniciais[tipo], ...obj } : { ...iniciais[tipo], ...defaults })
    setModal({ tipo, obj })
  }

  const submeter = async () => {
    const eps = { lp: '/admin/learning-paths', sl: '/admin/service-lines', area: '/admin/areas', nivel: '/admin/niveis', requisito: '/admin/requisitos' }
    try {
      if (modal.obj) await api.put(`${eps[modal.tipo]}/${modal.obj.id}`, form)
      else           await api.post(eps[modal.tipo], form)
      setModal(null); mostrar('sucesso', modal.obj ? 'Atualizado.' : 'Criado.'); carregar()
    } catch (e) { mostrar('erro', e.response?.data?.error || 'Erro.') }
  }

  const eliminar = async (tipo, id) => {
    if (!window.confirm('Tens a certeza?')) return
    const eps = { lp: '/admin/learning-paths', sl: '/admin/service-lines', area: '/admin/areas', nivel: '/admin/niveis', requisito: '/admin/requisitos' }
    try {
      await api.delete(`${eps[tipo]}/${id}`); mostrar('sucesso', 'Eliminado.'); carregar()
    } catch (e) { mostrar('erro', e.response?.data?.error || 'Não é possível eliminar.') }
  }

  const tiposNivel = [
    { value: 'JN', label: 'JN — Júnior' },
    { value: 'IN', label: 'IN — Intermédio' },
    { value: 'SN', label: 'SN — Sénior' },
    { value: 'EP', label: 'EP — Especialista' },
    { value: 'LD', label: 'LD — Líder' },
  ]

  return (
    <LayoutAdmin>
      {/* Cabeçalho */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#39639C', margin: 0 }}>Gerir Learning Paths</h2>
        <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 12, color: '#6b7280' }}>
          <span>{dados.lp.length} LEARNING PATH{dados.lp.length !== 1 ? 'S' : ''}</span>
          <span>|</span>
          <span>{dados.sl.length} SERVICE LINE{dados.sl.length !== 1 ? 'S' : ''}</span>
          <span>|</span>
          <span>{dados.areas.length} ÁREA{dados.areas.length !== 1 ? 'S' : ''}</span>
        </div>
      </div>

      <Alerta tipo={alerta?.tipo} msg={alerta?.msg} onClose={limpar} />

      {loading && <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>A carregar...</p>}

      {!loading && dados.lp.map(lp => (
        <div key={lp.id} style={{ marginBottom: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: 'white', overflow: 'hidden' }}>

          {/* ── Learning Path ── */}
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, cursor: 'pointer' }}
              onClick={() => toggle(`lp-${lp.id}`)}>
              <Seta aberto={abertos[`lp-${lp.id}`]} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>{lp.nome.toUpperCase()}</div>
                {lp.descricao && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{lp.descricao}</div>}
              </div>
            </div>
            <BotaoAcoes onEditar={() => abrirModal('lp', lp)} onApagar={() => eliminar('lp', lp.id)} />
          </div>

          {abertos[`lp-${lp.id}`] && (
            <div style={{ background: '#f3f6fb', padding: '0 16px 16px' }}>

              {dados.sl.filter(sl => sl.idLearningPath === lp.id).map(sl => (
                <div key={sl.id} style={{ marginBottom: 12 }}>

                  {/* ── Service Line ── */}
                  <div style={{ background: '#e8f0fb', borderRadius: 10, borderLeft: '4px solid #39639C', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, cursor: 'pointer' }}
                    onClick={() => toggle(`sl-${sl.id}`)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                      <Seta aberto={abertos[`sl-${sl.id}`]} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{sl.nome}</div>
                        {sl.descricao && <div style={{ fontSize: 12, color: '#6b7280' }}>{sl.descricao}</div>}
                      </div>
                    </div>
                    <BotaoAcoes onEditar={() => abrirModal('sl', sl)} onApagar={() => eliminar('sl', sl.id)} />
                  </div>

                  {abertos[`sl-${sl.id}`] && (
                    <div style={{ paddingLeft: 16 }}>
                      {dados.areas.filter(a => a.idServiceLine === sl.id).map(area => (
                        <div key={area.id} style={{ marginBottom: 8 }}>

                          {/* ── Área ── */}
                          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e5e7eb', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, cursor: 'pointer' }}
                            onClick={() => toggle(`area-${area.id}`)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                              <Seta aberto={abertos[`area-${area.id}`]} />
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{area.nome}</span>
                            </div>
                            <BotaoAcoes onEditar={() => abrirModal('area', area)} onApagar={() => eliminar('area', area.id)} />
                          </div>

                          {abertos[`area-${area.id}`] && (
                            <div style={{ paddingLeft: 16 }}>
                              {dados.niveis.filter(n => n.idArea === area.id).map(nivel => {
                                const badgeDoNivel = dados.badges.find(b => b.idNivel === nivel.id)
                                const reqs = badgeDoNivel ? dados.requisitos.filter(r => r.idBadgeRegular === badgeDoNivel.id) : []
                                return (
                                  <div key={nivel.id} style={{ marginBottom: 6 }}>

                                    {/* ── Nível ── */}
                                    <div style={{ background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, cursor: 'pointer' }}
                                      onClick={() => toggle(`nivel-${nivel.id}`)}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                                        <Seta aberto={abertos[`nivel-${nivel.id}`]} />
                                        {nivel.tipo && (
                                          <span style={{ background: '#39639C', color: 'white', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                                            {nivel.tipo}
                                          </span>
                                        )}
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e' }}>{nivel.nome}</span>
                                        <span style={{ fontSize: 11, color: '#6b7280' }}>· {reqs.length} requisitos</span>
                                      </div>
                                      <BotaoAcoes onEditar={() => abrirModal('nivel', nivel)} onApagar={() => eliminar('nivel', nivel.id)} />
                                    </div>

                                    {abertos[`nivel-${nivel.id}`] && (
                                      <div style={{ paddingLeft: 16, paddingBottom: 6 }}>
                                        {reqs.map(req => (
                                          <div key={req.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div>
                                              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e' }}>{req.nome}</div>
                                              {req.descricao && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{req.descricao}</div>}
                                            </div>
                                            <BotaoAcoes onEditar={() => abrirModal('requisito', req)} onApagar={() => eliminar('requisito', req.id)} />
                                          </div>
                                        ))}
                                        <Btn variant="secondary" onClick={() => abrirModal('requisito', null, { idBadgeRegular: badgeDoNivel?.id || '' })}>
                                          + Adicionar Requisito
                                        </Btn>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                              <div style={{ marginTop: 6 }}>
                                <Btn variant="secondary" onClick={() => abrirModal('nivel', null, { idArea: area.id })}>
                                  + Adicionar Nível
                                </Btn>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      <div style={{ marginTop: 6 }}>
                        <Btn variant="secondary" onClick={() => abrirModal('area', null, { idServiceLine: sl.id })}>
                          + Adicionar Área
                        </Btn>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div style={{ marginTop: 6 }}>
                <Btn variant="secondary" onClick={() => abrirModal('sl', null, { idLearningPath: lp.id })}>
                  + Adicionar Service Line
                </Btn>
              </div>
            </div>
          )}
        </div>
      ))}

      <div style={{ marginTop: 16 }}>
        <button onClick={() => abrirModal('lp')} style={{
          background: '#39639C', color: 'white', border: 'none', borderRadius: 8,
          padding: '10px 32px', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%',
        }}>
          + Adicionar Learning Path
        </button>
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          titulo={`${modal.obj ? 'Editar' : 'Novo'} ${{ lp: 'Learning Path', sl: 'Service Line', area: 'Área', nivel: 'Nível', requisito: 'Requisito' }[modal.tipo]}`}
          onClose={() => setModal(null)}
        >
          <FormField label="Nome">
            <Input value={form.nome || ''} onChange={e => f({ nome: e.target.value })} placeholder="Nome..." />
          </FormField>
          {modal.tipo !== 'requisito' && (
            <FormField label="Descrição">
              <Input value={form.descricao || ''} onChange={e => f({ descricao: e.target.value })} placeholder="Descrição..." />
            </FormField>
          )}
          {modal.tipo === 'sl' && (
            <FormField label="Learning Path">
              <Select value={form.idLearningPath || ''} onChange={e => f({ idLearningPath: e.target.value })}
                placeholder="Selecionar" options={dados.lp.map(l => ({ value: l.id, label: l.nome }))} />
            </FormField>
          )}
          {modal.tipo === 'area' && (
            <FormField label="Service Line">
              <Select value={form.idServiceLine || ''} onChange={e => f({ idServiceLine: e.target.value })}
                placeholder="Selecionar" options={dados.sl.map(s => ({ value: s.id, label: s.nome }))} />
            </FormField>
          )}
          {modal.tipo === 'nivel' && (<>
            <FormField label="Tipo">
              <Select value={form.tipo || ''} onChange={e => f({ tipo: e.target.value })}
                placeholder="Selecionar" options={tiposNivel} />
            </FormField>
            <FormField label="Área">
              <Select value={form.idArea || ''} onChange={e => f({ idArea: e.target.value })}
                placeholder="Selecionar" options={dados.areas.map(a => ({ value: a.id, label: a.nome }))} />
            </FormField>
          </>)}
          {modal.tipo === 'requisito' && (<>
            <FormField label="Badge Regular">
              <Select value={form.idBadgeRegular || ''} onChange={e => f({ idBadgeRegular: e.target.value })}
                placeholder="Selecionar badge" options={dados.badges.map(b => ({ value: b.id, label: b.nome }))} />
            </FormField>
            <FormField label="Descrição / Evidências">
              <Input value={form.descricao || ''} onChange={e => f({ descricao: e.target.value })}
                rows={3} placeholder="Que evidências o consultor deve submeter..." />
            </FormField>
          </>)}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1.25rem' }}>
            <button onClick={() => setModal(null)} style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 13 }}>
              Cancelar
            </button>
            <button onClick={submeter} style={{ background: '#39639C', color: 'white', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              {modal.obj ? 'Guardar' : 'Criar'}
            </button>
          </div>
        </Modal>
      )}
    </LayoutAdmin>
  )
}