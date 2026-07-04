// views/admin/Utilizadores.jsx
import { useState, useEffect, useCallback } from 'react'
import LayoutAdmin from './components/LayoutAdmin'
import api from '../../services/api'
import { Modal, FormField, Input, Select, Alerta, useAlerta } from './ui'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

// ── Ícones ────────────────────────────────────────────────────────────────────
const IconVer    = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const IconEditar = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IconApagar = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
const IconSearch = () => <svg width="16" height="16" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>

const perfilLabel = { administrador: 'Administrador', talent_manager: 'Talent Manager', sl_leader: 'Service Line', consultor: 'Consultor' }
const perfilCores = {
  administrador: { bg: '#dbeafe', text: '#1e40af' },
  talent_manager: { bg: '#fed7aa', text: '#9a3412' },
  sl_leader: { bg: '#f3f4f6', text: '#374151' },
  consultor: { bg: '#dcfce7', text: '#166534' },
}

export default function AdminUtilizadores() {
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selecionado, setSel] = useState(null)
  const [areas, setAreas] = useState([])
  const [sls, setSls] = useState([])
  const [alerta, mostrar, limpar] = useAlerta()
  const [form, setForm] = useState({})
  const [pesquisa, setPesquisa] = useState('')
  const [filtroPerfil, setFiltro] = useState('todos')
  const [modalVer, setModalVer] = useState(null)
  const [dadosSemestre, setDadosSemestre] = useState([])

  const carregar = useCallback(() => {
    setLoading(true)
    api.get('/admin/utilizadores').then(r => setLista(r.data)).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    carregar()
    api.get('/admin/areas').then(r => setAreas(r.data)).catch(() => {})
    api.get('/admin/service-lines').then(r => setSls(r.data)).catch(() => {})
    api.get('/admin/reporting/consultores-semestre').then(r => setDadosSemestre(r.data)).catch(() => {})
  }, [carregar])

  const listaFiltrada = lista.filter(u => {
    const termo = pesquisa.toLowerCase()
    const matchPesquisa = u.nome?.toLowerCase().includes(termo) || u.email?.toLowerCase().includes(termo)
    const matchPerfil   = filtroPerfil === 'todos' || u.perfil === filtroPerfil
    return matchPesquisa && matchPerfil
  })

  const f = v => setForm(p => ({ ...p, ...v }))

  const abrirCriar = () => {
    setForm({ nome: '', email: '', password: '', perfil: 'consultor', idArea: '', idServiceLine: '', telefone: '' })
    setSel(null); setModal('criar')
  }

  const abrirEditar = u => {
    setSel(u)
    setForm({ nome: u.nome || '', email: u.email || '', telefone: u.telefone || '', ativo: u.ativo, novaPassword: '' })
    setModal('editar')
  }

  const submeterCriar = async () => {
    try {
      await api.post('/admin/utilizadores', form)
      setModal(null); mostrar('sucesso', 'Utilizador criado.'); carregar()
    } catch (e) { mostrar('erro', e.response?.data?.error || 'Erro ao criar.') }
  }

  const submeterEditar = async () => {
    try {
      await api.put(`/admin/utilizadores/${selecionado.id}`, {
        nome: form.nome, email: form.email, telefone: form.telefone, ativo: form.ativo,
      })
      if (form.novaPassword?.trim()) {
        await api.put(`/admin/utilizadores/${selecionado.id}/password`, { novaPassword: form.novaPassword })
      }
      setModal(null); mostrar('sucesso', 'Utilizador atualizado.'); carregar()
    } catch (e) { mostrar('erro', e.response?.data?.error || 'Erro.') }
  }

  const eliminar = async u => {
    if (!window.confirm(`Tens a certeza que queres desativar ${u.nome}?`)) return
    try {
      await api.put(`/admin/utilizadores/${u.id}/ativo`, { ativo: false })
      mostrar('sucesso', 'Utilizador desativado.'); carregar()
    } catch { mostrar('erro', 'Erro.') }
  }

  const exportar = () => {
    const blob = new Blob([JSON.stringify(listaFiltrada, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = 'utilizadores.json'; a.click()
  }

  const dadosGrafico = {
    labels: dadosSemestre.map(d => d.mes),
    datasets: [{
      label: 'Consultores',
      data: dadosSemestre.map(d => d.total),
      borderColor: '#10b4db',
      backgroundColor: 'rgba(16, 180, 219, 0.1)',
      pointBackgroundColor: '#10b4db',
      pointBorderColor: 'white',
      pointBorderWidth: 2,
      pointRadius: 5,
      tension: 0.1,
      fill: false,
    }],
  }

  return (
    <LayoutAdmin>
      <Alerta tipo={alerta?.tipo} msg={alerta?.msg} onClose={limpar} />

      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#39639C', margin: 0 }}>Utilizadores</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportar} style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#374151' }}>
            Exportar Excel
          </button>
          <button onClick={abrirCriar} style={{ background: '#39639C', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            + NOVO UTILIZADOR
          </button>
        </div>
      </div>

      {/* Pesquisa + Filtro */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 16px' }}>
          <IconSearch />
          <input
            value={pesquisa}
            onChange={e => setPesquisa(e.target.value)}
            placeholder="Pesquisar Consultor, Badge, Requisito..."
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: '#374151' }}
          />
          {pesquisa && <button onClick={() => setPesquisa('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>✕</button>}
        </div>
        <select
          value={filtroPerfil}
          onChange={e => setFiltro(e.target.value)}
          style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 16px', fontSize: 14, color: '#374151', cursor: 'pointer', minWidth: 140 }}
        >
          <option value="todos">Todos</option>
          <option value="administrador">Administrador</option>
          <option value="talent_manager">Talent Manager</option>
          <option value="sl_leader">Service Line</option>
          <option value="consultor">Consultor</option>
        </select>
      </div>

      {/* Conteúdo principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

        {/* Tabela */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {loading && <p style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>A carregar...</p>}
          {!loading && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Nome', 'Perfil', 'Área', 'Service Line', 'Ações'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.map((u, i) => {
                  const cor  = perfilCores[u.perfil] || { bg: '#f3f4f6', text: '#374151' }
                  const area = areas.find(a => a.id === u.idArea)
                  const sl   = sls.find(s => s.id === u.idServiceLine)
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{u.nome}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: cor.bg, color: cor.text, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 500 }}>
                          {perfilLabel[u.perfil] || u.perfil}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>{area?.nome || '--'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>{sl?.nome || '--'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => setModalVer(u)} title="Ver" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}><IconVer /></button>
                          <button onClick={() => abrirEditar(u)} title="Editar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#39639C', padding: 4 }}><IconEditar /></button>
                          <button onClick={() => eliminar(u)} title="Desativar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545', padding: 4 }}><IconApagar /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {listaFiltrada.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280', fontSize: 14 }}>Sem utilizadores encontrados.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Painel lateral */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Gráfico */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
            <h4 style={{ color: '#39639C', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Consultores no último semestre</h4>
            {dadosSemestre.length > 0 ? (
              <Line
                data={dadosGrafico}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { color: '#f0f0f0' }, ticks: { font: { size: 10 } } },
                    y: { grid: { color: '#f0f0f0' }, border: { display: false }, ticks: { font: { size: 10 }, stepSize: 1 } },
                  },
                }}
              />
            ) : (
              <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center' }}>Sem dados.</p>
            )}
          </div>

          {/* Resumo */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
            <h4 style={{ color: '#39639C', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Resumo</h4>
            {[
              { label: 'Total',    valor: lista.length },
              { label: 'Ativos',   valor: lista.filter(u => u.ativo).length },
              { label: 'Inativos', valor: lista.filter(u => !u.ativo).length },
            ].map((r, i, arr) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <span style={{ color: '#6b7280' }}>{r.label}</span>
                <span style={{ fontWeight: 700, color: '#1a1a2e' }}>{r.valor}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Ver */}
      {modalVer && (
        <Modal titulo={`Detalhes — ${modalVer.nome}`} onClose={() => setModalVer(null)}>
          {[
            { label: 'Nome',        valor: modalVer.nome },
            { label: 'Email',       valor: modalVer.email },
            { label: 'Telefone',    valor: modalVer.telefone || '—' },
            { label: 'Perfil',      valor: perfilLabel[modalVer.perfil] || modalVer.perfil },
            { label: 'Estado',      valor: modalVer.ativo ? 'Ativo' : 'Inativo' },
            { label: 'Último Login',valor: modalVer.ultimoLogin ? new Date(modalVer.ultimoLogin).toLocaleDateString('pt-PT') : 'Nunca' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
              <span style={{ color: '#6b7280', fontWeight: 500 }}>{r.label}</span>
              <span style={{ color: '#1a1a2e', fontWeight: 600 }}>{r.valor}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={() => { setModalVer(null); abrirEditar(modalVer) }} style={{ background: '#39639C', color: 'white', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Editar
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Criar */}
      {modal === 'criar' && (
        <Modal titulo="Novo Utilizador" onClose={() => setModal(null)}>
          <FormField label="Nome"><Input value={form.nome} onChange={e => f({ nome: e.target.value })} placeholder="Nome completo" /></FormField>
          <FormField label="Email"><Input type="email" value={form.email} onChange={e => f({ email: e.target.value })} placeholder="email@softinsa.pt" /></FormField>
          <FormField label="Telefone"><Input value={form.telefone} onChange={e => f({ telefone: e.target.value })} placeholder="+351 9xx xxx xxx" /></FormField>
          <FormField label="Password"><Input type="password" value={form.password} onChange={e => f({ password: e.target.value })} placeholder="Mínimo 6 caracteres" /></FormField>
          <FormField label="Perfil">
            <Select value={form.perfil} onChange={e => f({ perfil: e.target.value })} options={[
              { value: 'consultor',      label: 'Consultor' },
              { value: 'talent_manager', label: 'Talent Manager' },
              { value: 'sl_leader',      label: 'SL Leader' },
              { value: 'administrador',  label: 'Administrador' },
            ]} />
          </FormField>
          {['consultor', 'talent_manager'].includes(form.perfil) && (
            <FormField label="Área"><Select value={form.idArea} onChange={e => f({ idArea: e.target.value })} placeholder="Selecionar área" options={areas.map(a => ({ value: a.id, label: a.nome }))} /></FormField>
          )}
          {['talent_manager', 'sl_leader'].includes(form.perfil) && (
            <FormField label="Service Line"><Select value={form.idServiceLine} onChange={e => f({ idServiceLine: e.target.value })} placeholder="Selecionar SL" options={sls.map(s => ({ value: s.id, label: s.nome }))} /></FormField>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1rem' }}>
            <button onClick={() => setModal(null)} style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
            <button onClick={submeterCriar} style={{ background: '#39639C', color: 'white', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Criar</button>
          </div>
        </Modal>
      )}

      {/* Modal Editar */}
      {modal === 'editar' && (
        <Modal titulo={`Editar — ${selecionado?.nome}`} onClose={() => setModal(null)}>
          <FormField label="Nome"><Input value={form.nome} onChange={e => f({ nome: e.target.value })} /></FormField>
          <FormField label="Email"><Input type="email" value={form.email} onChange={e => f({ email: e.target.value })} /></FormField>
          <FormField label="Telefone"><Input value={form.telefone} onChange={e => f({ telefone: e.target.value })} placeholder="+351 9xx xxx xxx" /></FormField>
          <FormField label="Estado">
            <Select value={form.ativo ? '1' : '0'} onChange={e => f({ ativo: e.target.value === '1' })} options={[
              { value: '1', label: 'Ativo' },
              { value: '0', label: 'Inativo' },
            ]} />
          </FormField>
          <FormField label="Nova Password (deixa em branco para não alterar)">
            <Input type="password" value={form.novaPassword} onChange={e => f({ novaPassword: e.target.value })} placeholder="Opcional" />
          </FormField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1rem' }}>
            <button onClick={() => setModal(null)} style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
            <button onClick={submeterEditar} style={{ background: '#39639C', color: 'white', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Guardar</button>
          </div>
        </Modal>
      )}
    </LayoutAdmin>
  )
}