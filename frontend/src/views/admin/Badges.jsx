import { useState, useEffect, useCallback } from 'react'
import LayoutAdmin from './components/LayoutAdmin'
import api from '../../services/api'
import { Alerta, Modal, FormField, Input, Select, useAlerta } from './ui'

// ── Ícone de badge padrão ─────────────────────────────────────────────────────
const BadgeIcon = () => (
  <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
    <polygon points="30,4 38,16 52,16 42,26 46,40 30,32 14,40 18,26 8,16 22,16" fill="#6366f1" opacity="0.15"/>
    <polygon points="30,4 38,16 52,16 42,26 46,40 30,32 14,40 18,26 8,16 22,16" fill="none" stroke="#6366f1" strokeWidth="2"/>
    <circle cx="30" cy="28" r="8" fill="#6366f1" opacity="0.3"/>
  </svg>
)

const IconEditar = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IconApagar = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
const IconSearch = () => <svg width="16" height="16" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>

// Mapeamento de tipo de nível para label e cor
const nivelInfo = {
  JN: { label: 'Júnior', bg: '#fce7f3', text: '#9d174d' },
  IN: { label: 'Intermédio', bg: '#fee2e2', text: '#991b1b' },
  SN: { label: 'Sénior', bg: '#ddd6fe', text: '#5b21b6' },
  EP: { label: 'Especialista', bg: '#e0e7ff', text: '#3730a3' },
  LD: { label: 'Líder de Conhecimento', bg: '#d1fae5', text: '#065f46' },
  // fallback para os tipos A/B/C/D/E
  A:  { label: 'Júnior', bg: '#fce7f3', text: '#9d174d' },
  B:  { label: 'Intermédio', bg: '#fee2e2', text: '#991b1b' },
  C:  { label: 'Sénior', bg: '#ddd6fe', text: '#5b21b6' },
  D:  { label: 'Especialista', bg: '#e0e7ff', text: '#3730a3' },
  E:  { label: 'Líder de Conhecimento', bg: '#d1fae5', text: '#065f46' },
}

// Calcula quanto tempo falta para expirar
function calcularExpiracao(validadeDias) {
  if (!validadeDias) return null
  const totalHoras = validadeDias * 24
  const horas = Math.floor(totalHoras) % 24
  const diasRestantes = Math.floor(totalHoras / 24)
  if (diasRestantes > 30) return { texto: `${diasRestantes} dias`, cor: '#22c55e' }
  if (diasRestantes > 7)  return { texto: `${diasRestantes} dias`, cor: '#f59e0b' }
  return { texto: `${diasRestantes} dias e ${horas} horas`, cor: '#ef4444' }
}

export default function AdminBadges() {
  const [regulares, setRegulares] = useState([])
  const [especiais, setEspeciais] = useState([])
  const [niveis, setNiveis] = useState([])
  const [areas, setAreas] = useState([])
  const [sls, setSls] = useState([])
  const [lps, setLps] = useState([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null)
  const [modalInfo, setModalInfo] = useState(null)
  const [selecionado, setSel] = useState(null)
  const [form, setForm] = useState({})
  const [alerta, mostrar, limpar] = useAlerta()
  const [tab, setTab] = useState('regulares')
  const [pesquisa, setPesquisa] = useState('')
  const [filtroNivel, setFiltroNivel] = useState('todos')
  const [filtroSL, setFiltroSL] = useState('todos')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [reg, esp, niv, ar, sl, lp] = await Promise.all([
        api.get('/admin/badges/regulares').then(r => r.data),
        api.get('/admin/badges/especiais').then(r => r.data),
        api.get('/admin/niveis').then(r => r.data),
        api.get('/admin/areas').then(r => r.data),
        api.get('/admin/service-lines').then(r => r.data),
        api.get('/admin/learning-paths').then(r => r.data),
      ])
      setRegulares(reg); setEspeciais(esp); setNiveis(niv)
      setAreas(ar); setSls(sl); setLps(lp)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const f = v => setForm(p => ({ ...p, ...v }))

  const listaAtual = tab === 'regulares' ? regulares : especiais

  const listaFiltrada = listaAtual.filter(b => {
    const termo = pesquisa.toLowerCase()
    const matchPesquisa = b.nome?.toLowerCase().includes(termo) || b.descricao?.toLowerCase().includes(termo)
    const nivel = tab === 'regulares' ? niveis.find(n => n.id === b.idNivel) : null
    const matchNivel = filtroNivel === 'todos' || nivel?.tipo === filtroNivel
    const matchSL    = filtroSL === 'todos' || b.idServiceLine === parseInt(filtroSL)
    return matchPesquisa && matchNivel && matchSL
  })

  const abrirModal = (tipo, obj = null) => {
    const base = tipo === 'regular'
      ? { nome: '', descricao: '', pontos: '', validadeDias: '', urlImagem: '', idNivel: '', idArea: '', idServiceLine: '', idLearningPath: '' }
      : { nome: '', descricao: '', pontos: '', validadeDias: '', urlImagem: '', idLearningPath: '' }
    setSel(obj)
    setForm(obj ? { ...base, ...obj } : base)
    setModal(tipo)
  }

  const submeter = async () => {
    try {
      const ep = modal === 'regular' ? '/admin/badges/regulares' : '/admin/badges/especiais'
      if (selecionado) await api.put(`${ep}/${selecionado.id}`, form)
      else             await api.post(ep, form)
      setModal(null); mostrar('sucesso', selecionado ? 'Badge atualizado.' : 'Badge criado.'); carregar()
    } catch (e) { mostrar('erro', e.response?.data?.error || 'Erro.') }
  }

  const eliminar = async (tipo, id) => {
    if (!window.confirm('Tens a certeza que queres eliminar este badge?')) return
    try {
      await api.delete(`/admin/badges/${tipo === 'regular' ? 'regulares' : 'especiais'}/${id}`)
      mostrar('sucesso', 'Badge eliminado.'); carregar()
    } catch (e) { mostrar('erro', e.response?.data?.error || 'Não é possível eliminar.') }
  }

  const exportar = () => {
    const blob = new Blob([JSON.stringify(listaFiltrada, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = 'badges.json'; a.click()
  }

  return (
    <LayoutAdmin>
      <Alerta tipo={alerta?.tipo} msg={alerta?.msg} onClose={limpar} />

      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#39639C', margin: 0 }}>Badges</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{listaFiltrada.length} badges disponíveis</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportar} style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
            Exportar Excel
          </button>
          <button onClick={exportar} style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
            Exportar PDF
          </button>
          <button onClick={() => abrirModal(tab === 'regulares' ? 'regular' : 'especial')} style={{ background: '#39639C', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            + NOVO BADGE
          </button>
        </div>
      </div>

      {/* Pesquisa + Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, marginTop: 16 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 16px' }}>
          <IconSearch />
          <input value={pesquisa} onChange={e => setPesquisa(e.target.value)} placeholder="Pesquisar badges..."
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: '#374151' }} />
          {pesquisa && <button onClick={() => setPesquisa('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>✕</button>}
        </div>
        {tab === 'regulares' && (
          <select value={filtroNivel} onChange={e => setFiltroNivel(e.target.value)}
            style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 16px', fontSize: 14, color: '#374151', cursor: 'pointer', minWidth: 160 }}>
            <option value="todos">Nível - Todos</option>
            <option value="JN">Júnior</option>
            <option value="IN">Intermédio</option>
            <option value="SN">Sénior</option>
            <option value="EP">Especialista</option>
            <option value="LD">Líder</option>
          </select>
        )}
        <select value={filtroSL} onChange={e => setFiltroSL(e.target.value)}
          style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 16px', fontSize: 14, color: '#374151', cursor: 'pointer', minWidth: 180 }}>
          <option value="todos">Todas Service Lines</option>
          {sls.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
        {/* Tabs regulares/especiais */}
        <div style={{ display: 'flex', background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
          {['regulares', 'especiais'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: tab === t ? '#39639C' : 'white',
              color: tab === t ? 'white' : '#374151',
              border: 'none', padding: '10px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
      </div>

      {loading && <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>A carregar...</p>}

      {/* Grelha de cards */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {listaFiltrada.map(b => {
            const nivel   = tab === 'regulares' ? niveis.find(n => n.id === b.idNivel) : null
            const area    = areas.find(a => a.id === b.idArea)
            const sl      = sls.find(s => s.id === b.idServiceLine)
            const nInfo   = nivel ? (nivelInfo[nivel.tipo] || nivelInfo.JN) : null
            const expira  = calcularExpiracao(b.validadeDias)

            return (
              <div key={b.id} style={{ background: 'white', borderRadius: 14, border: '1px solid #e5e7eb', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>

                {/* Botões editar/apagar */}
                <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4 }}>
                  <button onClick={() => abrirModal(tab === 'regulares' ? 'regular' : 'especial', b)}
                    style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: '#39639C' }}>
                    <IconEditar />
                  </button>
                  <button onClick={() => eliminar(tab === 'regulares' ? 'regular' : 'especial', b.id)}
                    style={{ background: 'white', border: '1px solid #fecaca', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: '#dc3545' }}>
                    <IconApagar />
                  </button>
                </div>

                {/* Imagem + tag nível */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 60, height: 60, flexShrink: 0 }}>
                    {b.urlImagem
                      ? <img src={b.urlImagem} alt={b.nome} style={{ width: 60, height: 60, objectFit: 'contain' }} />
                      : <BadgeIcon />}
                  </div>
                  {nInfo && (
                    <span style={{ background: nInfo.bg, color: nInfo.text, borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600, marginTop: 4 }}>
                      {nInfo.label}
                    </span>
                  )}
                </div>

                {/* Nome + descrição */}
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>{b.nome}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {b.descricao || '—'}
                  </div>
                </div>

                {/* Pontos */}
                {b.pontos && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b4db', fontWeight: 700, fontSize: 14 }}>
                    ⚡ {b.pontos} pontos
                  </div>
                )}

                {/* Service Line · Área */}
                {(sl || area) && (
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    {sl?.nome}{sl && area ? ' · ' : ''}{area?.nome}
                  </div>
                )}

                {/* Botão Informações */}
                <button onClick={() => setModalInfo(b)} style={{
                  background: '#39639C', color: 'white', border: 'none', borderRadius: 8,
                  padding: '8px', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%',
                }}>
                  Informações
                </button>

                {/* Expiração */}
                {expira && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280' }}>
                    <span>Expira em:</span>
                    <span style={{ fontWeight: 600 }}>{expira.texto}</span>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: expira.cor, marginLeft: 'auto' }} />
                  </div>
                )}
              </div>
            )
          })}

          {listaFiltrada.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#6b7280', fontSize: 14 }}>
              Sem badges encontrados.
            </div>
          )}
        </div>
      )}

      {/* Modal Informações */}
      {modalInfo && (
        <Modal titulo={modalInfo.nome} onClose={() => setModalInfo(null)}>
          {[
            { label: 'Descrição', valor: modalInfo.descricao || '—' },
            { label: 'Pontos', valor: modalInfo.pontos ? `${modalInfo.pontos} pontos` : '—' },
            { label: 'Validade', valor: modalInfo.validadeDias ? `${modalInfo.validadeDias} dias` : 'Sem validade' },
            { label: 'Nível', valor: niveis.find(n => n.id === modalInfo.idNivel)?.nome || '—' },
            { label: 'Área', valor: areas.find(a => a.id === modalInfo.idArea)?.nome || '—' },
            { label: 'Service Line', valor: sls.find(s => s.id === modalInfo.idServiceLine)?.nome || '—' },
            { label: 'Estado', valor: modalInfo.ativo ? 'Ativo' : 'Inativo' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
              <span style={{ color: '#6b7280', fontWeight: 500 }}>{r.label}</span>
              <span style={{ color: '#1a1a2e', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{r.valor}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1rem' }}>
            <button onClick={() => { setModalInfo(null); abrirModal(tab === 'regulares' ? 'regular' : 'especial', modalInfo) }}
              style={{ background: '#39639C', color: 'white', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Editar
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Criar/Editar Regular */}
      {modal === 'regular' && (
        <Modal titulo={`${selecionado ? 'Editar' : 'Novo'} Badge Regular`} onClose={() => setModal(null)}>
          <FormField label="Nome"><Input value={form.nome} onChange={e => f({ nome: e.target.value })} /></FormField>
          <FormField label="Descrição"><Input value={form.descricao} onChange={e => f({ descricao: e.target.value })} rows={3} /></FormField>
          <div style={{ display: 'flex', gap: 8 }}>
            <FormField label="Pontos"><Input type="number" value={form.pontos} onChange={e => f({ pontos: e.target.value })} /></FormField>
            <FormField label="Validade (dias)"><Input type="number" value={form.validadeDias} onChange={e => f({ validadeDias: e.target.value })} /></FormField>
          </div>
          <FormField label="Nível">
            <Select value={form.idNivel || ''} onChange={e => f({ idNivel: e.target.value })} placeholder="Selecionar"
              options={niveis.map(n => ({ value: n.id, label: `${n.nome} (${n.tipo || '-'})` }))} />
          </FormField>
          <FormField label="Área (opcional)">
            <Select value={form.idArea || ''} onChange={e => f({ idArea: e.target.value })} placeholder="Nenhuma"
              options={areas.map(a => ({ value: a.id, label: a.nome }))} />
          </FormField>
          <FormField label="Service Line (opcional)">
            <Select value={form.idServiceLine || ''} onChange={e => f({ idServiceLine: e.target.value })} placeholder="Nenhuma"
              options={sls.map(s => ({ value: s.id, label: s.nome }))} />
          </FormField>
          <FormField label="Learning Path (opcional)">
            <Select value={form.idLearningPath || ''} onChange={e => f({ idLearningPath: e.target.value })} placeholder="Nenhum"
              options={lps.map(l => ({ value: l.id, label: l.nome }))} />
          </FormField>
          <FormField label="URL Imagem (opcional)"><Input value={form.urlImagem} onChange={e => f({ urlImagem: e.target.value })} placeholder="https://..." /></FormField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1rem' }}>
            <button onClick={() => setModal(null)} style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
            <button onClick={submeter} style={{ background: '#39639C', color: 'white', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{selecionado ? 'Guardar' : 'Criar'}</button>
          </div>
        </Modal>
      )}

      {/* Modal Criar/Editar Especial */}
      {modal === 'especial' && (
        <Modal titulo={`${selecionado ? 'Editar' : 'Novo'} Badge Especial`} onClose={() => setModal(null)}>
          <FormField label="Nome"><Input value={form.nome} onChange={e => f({ nome: e.target.value })} /></FormField>
          <FormField label="Descrição"><Input value={form.descricao} onChange={e => f({ descricao: e.target.value })} rows={3} /></FormField>
          <div style={{ display: 'flex', gap: 8 }}>
            <FormField label="Pontos"><Input type="number" value={form.pontos} onChange={e => f({ pontos: e.target.value })} /></FormField>
            <FormField label="Validade (dias)"><Input type="number" value={form.validadeDias} onChange={e => f({ validadeDias: e.target.value })} /></FormField>
          </div>
          <FormField label="Learning Path (opcional)">
            <Select value={form.idLearningPath || ''} onChange={e => f({ idLearningPath: e.target.value })} placeholder="Nenhum"
              options={lps.map(l => ({ value: l.id, label: l.nome }))} />
          </FormField>
          <FormField label="URL Imagem (opcional)"><Input value={form.urlImagem} onChange={e => f({ urlImagem: e.target.value })} placeholder="https://..." /></FormField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1rem' }}>
            <button onClick={() => setModal(null)} style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
            <button onClick={submeter} style={{ background: '#39639C', color: 'white', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{selecionado ? 'Guardar' : 'Criar'}</button>
          </div>
        </Modal>
      )}
    </LayoutAdmin>
  )
}