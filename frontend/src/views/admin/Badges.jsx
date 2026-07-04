import { useState, useEffect, useCallback } from 'react'
import LayoutAdmin from './components/LayoutAdmin'
import api from '../../services/api'
import { Btn, Card, Tabela, Modal, FormField, Input, Select, Alerta, SectionTitle, BadgeTag, Tabs, useAlerta, EstadoLista, exportarJSON } from './ui'

export default function AdminBadges() {
  const [tab, setTab]             = useState('regulares')
  const [regulares, setRegulares] = useState([])
  const [especiais, setEspeciais] = useState([])
  const [niveis, setNiveis]       = useState([])
  const [areas, setAreas]         = useState([])
  const [sls, setSls]             = useState([])
  const [lps, setLps]             = useState([])
  const [loading, setLoading]     = useState(false)
  const [modal, setModal]         = useState(null)
  const [selecionado, setSel]     = useState(null)
  const [form, setForm]           = useState({})
  const [alerta, mostrar, limpar] = useAlerta()

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
      setRegulares(reg); setEspeciais(esp); setNiveis(niv); setAreas(ar); setSls(sl); setLps(lp)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const formBase = tipo => tipo === 'regular'
    ? { nome: '', descricao: '', pontos: '', validadeDias: '', urlImagem: '', idNivel: '', idArea: '', idServiceLine: '', idLearningPath: '' }
    : { nome: '', descricao: '', pontos: '', validadeDias: '', urlImagem: '', idLearningPath: '' }

  const abrirModal = (tipo, obj = null) => {
    setSel(obj); setForm(obj ? { ...formBase(tipo), ...obj } : formBase(tipo)); setModal(tipo)
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
    if (!window.confirm('Tens a certeza?')) return
    try {
      await api.delete(`/admin/badges/${tipo === 'regular' ? 'regulares' : 'especiais'}/${id}`)
      mostrar('sucesso', 'Badge eliminado.'); carregar()
    } catch (e) { mostrar('erro', e.response?.data?.error || 'Não é possível eliminar.') }
  }

  const exportar = async () => {
    const r = await api.get('/admin/exportar/badges')
    exportarJSON(r.data, 'badges.json')
  }

  const f = v => setForm(p => ({ ...p, ...v }))

  return (
    <LayoutAdmin>
      <SectionTitle title="Gestão de Badges" action={
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" onClick={exportar}>↓ Exportar</Btn>
          <Btn onClick={() => abrirModal(tab === 'regulares' ? 'regular' : 'especial')}>+ Novo Badge</Btn>
        </div>
      } />
      <Alerta tipo={alerta?.tipo} msg={alerta?.msg} onClose={limpar} />
      <Tabs tabs={[{ key: 'regulares', label: 'Regulares' }, { key: 'especiais', label: 'Especiais' }]} ativo={tab} onChange={setTab} />
      <Card>
        <EstadoLista loading={loading} />
        {!loading && tab === 'regulares' && (
          <Tabela
            colunas={[
              { key: 'nome', label: 'Nome' },
              { key: 'pontos', label: 'Pontos' },
              { key: 'validadeDias', label: 'Validade (dias)' },
              { key: 'idNivel', label: 'Nível', render: v => niveis.find(n => n.id === v)?.nome || '—' },
              { key: 'ativo', label: 'Estado', render: v => <BadgeTag cor={v ? 'verde' : 'vermelho'}>{v ? 'Ativo' : 'Inativo'}</BadgeTag> },
            ]}
            dados={regulares}
            acoes={row => (<>
              <Btn variant="secondary" onClick={() => abrirModal('regular', row)}>Editar</Btn>
              <Btn variant="danger" onClick={() => eliminar('regular', row.id)}>Eliminar</Btn>
            </>)}
          />
        )}
        {!loading && tab === 'especiais' && (
          <Tabela
            colunas={[
              { key: 'nome', label: 'Nome' },
              { key: 'pontos', label: 'Pontos' },
              { key: 'validadeDias', label: 'Validade (dias)' },
              { key: 'idLearningPath', label: 'Learning Path', render: v => lps.find(l => l.id === v)?.nome || '—' },
              { key: 'ativo', label: 'Estado', render: v => <BadgeTag cor={v ? 'verde' : 'vermelho'}>{v ? 'Ativo' : 'Inativo'}</BadgeTag> },
            ]}
            dados={especiais}
            acoes={row => (<>
              <Btn variant="secondary" onClick={() => abrirModal('especial', row)}>Editar</Btn>
              <Btn variant="danger" onClick={() => eliminar('especial', row.id)}>Eliminar</Btn>
            </>)}
          />
        )}
      </Card>

      {modal === 'regular' && (
        <Modal titulo={`${selecionado ? 'Editar' : 'Novo'} Badge Regular`} onClose={() => setModal(null)}>
          <FormField label="Nome"><Input value={form.nome} onChange={e => f({ nome: e.target.value })} /></FormField>
          <FormField label="Descrição"><Input value={form.descricao} onChange={e => f({ descricao: e.target.value })} /></FormField>
          <div style={{ display: 'flex', gap: 8 }}>
            <FormField label="Pontos"><Input type="number" value={form.pontos} onChange={e => f({ pontos: e.target.value })} /></FormField>
            <FormField label="Validade (dias)"><Input type="number" value={form.validadeDias} onChange={e => f({ validadeDias: e.target.value })} /></FormField>
          </div>
          <FormField label="Nível"><Select value={form.idNivel || ''} onChange={e => f({ idNivel: e.target.value })} placeholder="Selecionar" options={niveis.map(n => ({ value: n.id, label: `${n.nome} (${n.tipo || '-'})` }))} /></FormField>
          <FormField label="Área (opcional)"><Select value={form.idArea || ''} onChange={e => f({ idArea: e.target.value })} placeholder="Nenhuma" options={areas.map(a => ({ value: a.id, label: a.nome }))} /></FormField>
          <FormField label="Service Line (opcional)"><Select value={form.idServiceLine || ''} onChange={e => f({ idServiceLine: e.target.value })} placeholder="Nenhuma" options={sls.map(s => ({ value: s.id, label: s.nome }))} /></FormField>
          <FormField label="Learning Path (opcional)"><Select value={form.idLearningPath || ''} onChange={e => f({ idLearningPath: e.target.value })} placeholder="Nenhum" options={lps.map(l => ({ value: l.id, label: l.nome }))} /></FormField>
          <FormField label="URL Imagem"><Input value={form.urlImagem} onChange={e => f({ urlImagem: e.target.value })} placeholder="https://..." /></FormField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1rem' }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={submeter}>{selecionado ? 'Guardar' : 'Criar'}</Btn>
          </div>
        </Modal>
      )}

      {modal === 'especial' && (
        <Modal titulo={`${selecionado ? 'Editar' : 'Novo'} Badge Especial`} onClose={() => setModal(null)}>
          <FormField label="Nome"><Input value={form.nome} onChange={e => f({ nome: e.target.value })} /></FormField>
          <FormField label="Descrição"><Input value={form.descricao} onChange={e => f({ descricao: e.target.value })} /></FormField>
          <div style={{ display: 'flex', gap: 8 }}>
            <FormField label="Pontos"><Input type="number" value={form.pontos} onChange={e => f({ pontos: e.target.value })} /></FormField>
            <FormField label="Validade (dias)"><Input type="number" value={form.validadeDias} onChange={e => f({ validadeDias: e.target.value })} /></FormField>
          </div>
          <FormField label="Learning Path (opcional)"><Select value={form.idLearningPath || ''} onChange={e => f({ idLearningPath: e.target.value })} placeholder="Nenhum" options={lps.map(l => ({ value: l.id, label: l.nome }))} /></FormField>
          <FormField label="URL Imagem"><Input value={form.urlImagem} onChange={e => f({ urlImagem: e.target.value })} placeholder="https://..." /></FormField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1rem' }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={submeter}>{selecionado ? 'Guardar' : 'Criar'}</Btn>
          </div>
        </Modal>
      )}
    </LayoutAdmin>
  )
}
