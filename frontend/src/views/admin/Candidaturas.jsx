import { useState, useEffect, useCallback } from 'react'
import LayoutAdmin from './components/LayoutAdmin'
import api from '../../services/api'
import { Btn, Card, Tabela, Modal, Alerta, SectionTitle, BadgeTag, Select, useAlerta, EstadoLista, exportarJSON } from './ui'

export default function AdminCandidaturas() {
  const [lista, setLista]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [detalhe, setDetalhe]     = useState(null)
  const [filtroEstado, setFiltro] = useState('')
  const [alerta, mostrar, limpar] = useAlerta()

  const carregar = useCallback(() => {
    setLoading(true)
    const params = filtroEstado ? `?idEstado=${filtroEstado}` : ''
    api.get(`/admin/candidaturas${params}`).then(r => setLista(r.data)).finally(() => setLoading(false))
  }, [filtroEstado])

  useEffect(() => { carregar() }, [carregar])

  const verDetalhe = async num => {
    try {
      const r = await api.get(`/admin/candidaturas/${num}`)
      setDetalhe(r.data)
    } catch { mostrar('erro', 'Erro ao carregar detalhe.') }
  }

  const exportar = async () => {
    const params = filtroEstado ? `?idEstado=${filtroEstado}` : ''
    const r = await api.get(`/admin/exportar/candidaturas${params}`)
    exportarJSON(r.data, 'candidaturas.json')
  }

  const estadoCores = { 1: 'azul', 2: 'laranja', 3: 'azul', 4: 'laranja', 5: 'verde', 6: 'vermelho' }

  return (
    <LayoutAdmin>
      <SectionTitle title="Candidaturas" action={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Select value={filtroEstado} onChange={e => setFiltro(e.target.value)}
            placeholder="Todos os estados"
            options={[
              { value: '1', label: 'Em Validação TM' },
              { value: '2', label: 'Em Retificação (TM)' },
              { value: '3', label: 'Em Validação SLL' },
              { value: '4', label: 'Em Retificação (SLL)' },
              { value: '5', label: 'Aprovada' },
              { value: '6', label: 'Rejeitada' },
            ]}
          />
          <Btn variant="secondary" onClick={exportar}>↓ Exportar</Btn>
        </div>
      } />
      <Alerta tipo={alerta?.tipo} msg={alerta?.msg} onClose={limpar} />
      <Card>
        <EstadoLista loading={loading} />
        {!loading && (
          <Tabela
            colunas={[
              { key: 'numCandidatura', label: '#' },
              { key: 'nomeBadge',      label: 'Badge' },
              { key: 'nomeCandidato',  label: 'Consultor' },
              { key: 'nomeEstado',     label: 'Estado', render: (v, row) => <BadgeTag cor={estadoCores[row.idEstadoAtual] || 'cinzento'}>{v}</BadgeTag> },
              { key: 'dataCriacao',    label: 'Data', render: v => new Date(v).toLocaleDateString('pt-PT') },
            ]}
            dados={lista}
            acoes={row => <Btn variant="secondary" onClick={() => verDetalhe(row.numCandidatura)}>Ver</Btn>}
          />
        )}
      </Card>

      {detalhe && (
        <Modal titulo={`Candidatura #${detalhe.numCandidatura}`} onClose={() => setDetalhe(null)}>
          <h4 style={{ fontSize: '.85rem', fontWeight: 700, marginBottom: '.75rem', color: 'var(--cor-texto-secundario)' }}>Histórico</h4>
          {detalhe.historico?.length ? detalhe.historico.map((h, i) => (
            <div key={i} style={{ padding: '.5rem .75rem', borderLeft: '3px solid var(--cor-primaria)', marginBottom: '.5rem', background: 'var(--cor-fundo)', borderRadius: '0 6px 6px 0' }}>
              <div style={{ fontSize: '.78rem', fontWeight: 600 }}>{h.nomeEstado} · {new Date(h.dataAlteracao).toLocaleDateString('pt-PT')}</div>
              {h.comentario && <div style={{ fontSize: '.75rem', color: 'var(--cor-texto-secundario)', marginTop: 2 }}>{h.comentario}</div>}
            </div>
          )) : <p style={{ fontSize: '.8rem', color: 'var(--cor-texto-secundario)' }}>Sem histórico.</p>}

          <h4 style={{ fontSize: '.85rem', fontWeight: 700, margin: '1rem 0 .75rem', color: 'var(--cor-texto-secundario)' }}>Evidências</h4>
          {detalhe.evidencias?.length ? detalhe.evidencias.map((e, i) => (
            <div key={i} style={{ fontSize: '.78rem', padding: '.4rem .75rem', background: 'var(--cor-fundo)', borderRadius: 6, marginBottom: 4 }}>
              Requisito #{e.idRequisito} · {e.estado}
            </div>
          )) : <p style={{ fontSize: '.8rem', color: 'var(--cor-texto-secundario)' }}>Sem evidências.</p>}
        </Modal>
      )}
    </LayoutAdmin>
  )
}