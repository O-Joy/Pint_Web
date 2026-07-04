import { useState, useEffect, useCallback } from 'react'
import LayoutAdmin from './components/LayoutAdmin'
import api from '../../services/api'
import { Btn, Card, Tabela, Modal, FormField, Input, Select, Alerta, SectionTitle, BadgeTag, useAlerta, exportarJSON, EstadoLista } from './ui'

export default function AdminUtilizadores() {
  const [lista, setLista]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(null)
  const [selecionado, setSel]     = useState(null)
  const [areas, setAreas]         = useState([])
  const [sls, setSls]             = useState([])
  const [alerta, mostrar, limpar] = useAlerta()
  const [form, setForm]           = useState({})
  const [novaPwd, setNovaPwd]     = useState('')

  const carregar = useCallback(() => {
    setLoading(true)
    api.get('/admin/utilizadores').then(r => setLista(r.data)).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    carregar()
    api.get('/admin/areas').then(r => setAreas(r.data)).catch(() => {})
    api.get('/admin/service-lines').then(r => setSls(r.data)).catch(() => {})
  }, [carregar])

  const f = v => setForm(p => ({ ...p, ...v }))

  const abrirCriar = () => {
    setForm({ nome: '', email: '', password: '', perfil: 'consultor', idArea: '', idServiceLine: '' })
    setSel(null); setModal('criar')
  }
  const abrirEditar = u => { setSel(u); setForm({ nome: u.nome, email: u.email }); setModal('editar') }
  const abrirPwd   = u => { setSel(u); setNovaPwd(''); setModal('password') }

  const submeterCriar = async () => {
    try {
      await api.post('/admin/utilizadores', form)
      setModal(null); mostrar('sucesso', 'Utilizador criado.'); carregar()
    } catch (e) { mostrar('erro', e.response?.data?.error || 'Erro ao criar.') }
  }

  const submeterEditar = async () => {
    try {
      await api.put(`/admin/utilizadores/${selecionado.id}`, form)
      setModal(null); mostrar('sucesso', 'Utilizador atualizado.'); carregar()
    } catch (e) { mostrar('erro', e.response?.data?.error || 'Erro ao editar.') }
  }

  const submeterPwd = async () => {
    try {
      await api.put(`/admin/utilizadores/${selecionado.id}/password`, { novaPassword: novaPwd })
      setModal(null); mostrar('sucesso', 'Password redefinida.')
    } catch (e) { mostrar('erro', e.response?.data?.error || 'Erro.') }
  }

  const toggleAtivo = async u => {
    try {
      await api.put(`/admin/utilizadores/${u.id}/ativo`, { ativo: !u.ativo })
      mostrar('sucesso', `Utilizador ${u.ativo ? 'desativado' : 'ativado'}.`); carregar()
    } catch (e) { mostrar('erro', e.response?.data?.error || 'Erro.') }
  }

  const perfilCor   = { administrador: 'azul', talent_manager: 'laranja', sl_leader: 'cinzento', consultor: 'verde' }
  const perfilLabel = { administrador: 'Admin', talent_manager: 'Talent Mgr', sl_leader: 'SL Leader', consultor: 'Consultor' }

  return (
    <LayoutAdmin>
      <SectionTitle title="Utilizadores" action={
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" onClick={() => exportarJSON(lista, 'utilizadores.json')}>↓ Exportar</Btn>
          <Btn onClick={abrirCriar}>+ Novo Utilizador</Btn>
        </div>
      } />
      <Alerta tipo={alerta?.tipo} msg={alerta?.msg} onClose={limpar} />
      <Card>
        <EstadoLista loading={loading} />
        {!loading && (
          <Tabela
            colunas={[
              { key: 'nome',        label: 'Nome' },
              { key: 'email',       label: 'Email' },
              { key: 'perfil',      label: 'Perfil',  render: v => <BadgeTag cor={perfilCor[v] || 'cinzento'}>{perfilLabel[v] || v}</BadgeTag> },
              { key: 'ativo',       label: 'Estado',  render: v => <BadgeTag cor={v ? 'verde' : 'vermelho'}>{v ? 'Ativo' : 'Inativo'}</BadgeTag> },
              { key: 'ultimoLogin', label: 'Último Login', render: v => v ? new Date(v).toLocaleDateString('pt-PT') : 'Nunca' },
            ]}
            dados={lista}
            acoes={u => (<>
              <Btn variant="secondary" onClick={() => abrirEditar(u)}>Editar</Btn>
              <Btn variant="secondary" onClick={() => abrirPwd(u)}>Password</Btn>
              <Btn variant={u.ativo ? 'danger' : 'success'} onClick={() => toggleAtivo(u)}>{u.ativo ? 'Desativar' : 'Ativar'}</Btn>
            </>)}
          />
        )}
      </Card>

      {modal === 'criar' && (
        <Modal titulo="Novo Utilizador" onClose={() => setModal(null)}>
          <FormField label="Nome"><Input value={form.nome} onChange={e => f({ nome: e.target.value })} placeholder="Nome completo" /></FormField>
          <FormField label="Email"><Input type="email" value={form.email} onChange={e => f({ email: e.target.value })} placeholder="email@softinsa.pt" /></FormField>
          <FormField label="Password"><Input type="password" value={form.password} onChange={e => f({ password: e.target.value })} placeholder="Mínimo 6 caracteres" /></FormField>
          <FormField label="Perfil">
            <Select value={form.perfil} onChange={e => f({ perfil: e.target.value })} options={[
              { value: 'consultor', label: 'Consultor' },
              { value: 'talent_manager', label: 'Talent Manager' },
              { value: 'sl_leader', label: 'SL Leader' },
              { value: 'administrador', label: 'Administrador' },
            ]} />
          </FormField>
          {['consultor', 'talent_manager'].includes(form.perfil) && (
            <FormField label="Área">
              <Select value={form.idArea} onChange={e => f({ idArea: e.target.value })} placeholder="Selecionar área" options={areas.map(a => ({ value: a.id, label: a.nome }))} />
            </FormField>
          )}
          {['talent_manager', 'sl_leader'].includes(form.perfil) && (
            <FormField label="Service Line">
              <Select value={form.idServiceLine} onChange={e => f({ idServiceLine: e.target.value })} placeholder="Selecionar SL" options={sls.map(s => ({ value: s.id, label: s.nome }))} />
            </FormField>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1rem' }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={submeterCriar}>Criar</Btn>
          </div>
        </Modal>
      )}

      {modal === 'editar' && (
        <Modal titulo={`Editar — ${selecionado?.nome}`} onClose={() => setModal(null)}>
          <FormField label="Nome"><Input value={form.nome} onChange={e => f({ nome: e.target.value })} /></FormField>
          <FormField label="Email"><Input type="email" value={form.email} onChange={e => f({ email: e.target.value })} /></FormField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1rem' }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={submeterEditar}>Guardar</Btn>
          </div>
        </Modal>
      )}

      {modal === 'password' && (
        <Modal titulo={`Redefinir Password — ${selecionado?.nome}`} onClose={() => setModal(null)}>
          <FormField label="Nova Password"><Input type="password" value={novaPwd} onChange={e => setNovaPwd(e.target.value)} placeholder="Mínimo 6 caracteres" /></FormField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1rem' }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={submeterPwd}>Redefinir</Btn>
          </div>
        </Modal>
      )}
    </LayoutAdmin>
  )
}
