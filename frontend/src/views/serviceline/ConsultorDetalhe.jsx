// src/views/serviceline/ConsultorDetalhe.jsx
// Perfil detalhado de um consultor, acedido a partir do "olho" na tabela de Consultores.
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import LayoutSL from './components/LayoutSL'
import api from '../../services/api'
import { FiRefreshCw, FiChevronLeft } from 'react-icons/fi'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const formatarData = (data) => {
  if (!data) return '-'
  return new Date(data).toLocaleDateString('pt-PT')
}

const TABS = [
  { key: 'obtidos',    label: 'Badges Obtidos' },
  { key: 'progresso',  label: 'Badges Em Progresso' },
  { key: 'especiais',  label: 'Badges Especiais' },
  { key: 'historico',  label: 'Histórico do Consultor' },
]

export default function ConsultorDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)
  const [tab, setTab] = useState('obtidos')

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function carregar() {
    setLoading(true)
    setErro(null)
    api.get(`/sl/consultores/${id}`)
      .then(res => setDados(res.data))
      .catch(err => {
        console.error('[ConsultorDetalhe] ERRO:', err.response?.status, err.response?.data || err.message)
        setErro(err.response?.data?.error || 'Não foi possível carregar o perfil do consultor.')
      })
      .finally(() => setLoading(false))
  }

  const exportarPerfil = () => {
    if (!dados) return
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(`Perfil de ${dados.nome}`, 14, 15)
    doc.setFontSize(10)
    doc.text(`${dados.nomeArea || '-'} · ${dados.nomeServiceLine || '-'}`, 14, 22)
    doc.text(`${dados.email || '-'}`, 14, 28)

    autoTable(doc, {
      startY: 36,
      head: [['Badge', 'Área', 'Nível', 'Pontos', 'Data Aprovação', 'Data Expiração']],
      body: dados.badgesObtidos.map(b => [
        b.nomeBadge, b.nomeArea, b.nomeNivel, b.pontos, formatarData(b.dataAtribuicao), formatarData(b.dataExpiracao),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [57, 99, 156] },
    })
    doc.save(`perfil_${dados.nome?.replace(/\s+/g, '_') || id}.pdf`)
  }

  const exportarHistorico = () => {
    if (!dados) return
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(`Histórico de ${dados.nome}`, 14, 15)
    autoTable(doc, {
      startY: 25,
      head: [['Data', 'Badge', 'Estado', 'Comentário']],
      body: dados.historico.map(h => [formatarData(h.data), h.nomeBadge, h.nomeEstado, h.comentario || '-']),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [57, 99, 156] },
    })
    doc.save(`historico_${dados.nome?.replace(/\s+/g, '_') || id}.pdf`)
  }

  if (loading) {
    return (
      <LayoutSL>
        <p style={{ textAlign: 'center', color: '#aaa', fontFamily: 'Poppins, sans-serif' }}>A carregar...</p>
      </LayoutSL>
    )
  }

  if (erro || !dados) {
    return (
      <LayoutSL>
        <div style={{ fontFamily: 'Poppins, sans-serif' }}>
          <p style={{ color: '#e05252' }}>{erro || 'Consultor não encontrado.'}</p>
          <button onClick={() => navigate('/serviceline/consultores')} style={{
            background: '#fff', color: '#39639C', border: '1px solid #39639C', borderRadius: 8,
            padding: '8px 16px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <FiChevronLeft /> Voltar a Consultores
          </button>
        </div>
      </LayoutSL>
    )
  }

  const tabelas = {
    obtidos: {
      colunas: ['Badge', 'Área', 'Nível', 'Pontos', 'Data de Aprovação', 'Data de Expiração'],
      linhas: dados.badgesObtidos.map(b => [b.nomeBadge, b.nomeArea, b.nomeNivel, b.pontos, formatarData(b.dataAtribuicao), formatarData(b.dataExpiracao)]),
      vazio: 'Ainda sem badges obtidos.',
    },
    progresso: {
      colunas: ['Badge', 'Nível', 'Estado', 'Data de Submissão'],
      linhas: dados.badgesEmProgresso.map(b => [b.nomeBadge, b.nomeNivel, b.nomeEstado, formatarData(b.dataCriacao)]),
      vazio: 'Sem candidaturas em progresso.',
    },
    especiais: {
      colunas: ['Badge Especial', 'Pontos', 'Data de Atribuição', 'Data de Expiração'],
      linhas: dados.badgesEspeciais.map(b => [b.nomeBadgeEspecial, b.pontos, formatarData(b.dataAtribuicao), formatarData(b.dataExpiracao)]),
      vazio: 'Sem badges especiais.',
    },
    historico: {
      colunas: ['Data', 'Badge', 'Estado', 'Comentário'],
      linhas: dados.historico.map(h => [formatarData(h.data), h.nomeBadge, h.nomeEstado, h.comentario || '-']),
      vazio: 'Sem histórico disponível.',
    },
  }
  const tabelaAtiva = tabelas[tab]

  return (
    <LayoutSL>
      <div style={{ fontFamily: 'Poppins, sans-serif' }}>

        {/* ── Breadcrumb + refresh ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
            <Link to="/serviceline/consultores" style={{ color: '#9ca3af', textDecoration: 'none' }}>Consultores</Link>
            {' > '}Perfil de {dados.nome}
          </p>
          <FiRefreshCw title="Atualizar" onClick={carregar} style={{ cursor: 'pointer', color: '#39639C', fontSize: 16 }} />
        </div>
        <h2 style={{ color: '#39639C', fontWeight: 700, marginBottom: 20 }}>Perfil Consultor</h2>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>

          {/* ── Cartão de identidade ── */}
          <div style={{
            background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            flex: '1 1 260px', minWidth: 260, maxWidth: 300,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', background: '#e8f0fb',
              color: '#39639C', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 700, marginBottom: 14, overflow: 'hidden',
            }}>
              {dados.urlFoto
                ? <img src={dados.urlFoto} alt={dados.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (dados.nome?.[0]?.toUpperCase() || '?')}
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e', marginBottom: 2 }}>{dados.nome}</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 2 }}>{dados.nomeArea} · {dados.nomeServiceLine}</p>
            <p style={{ fontSize: 13, color: '#39639C', marginBottom: 18 }}>{dados.email}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Badges Obtidos', valor: dados.badgesObtidos.length },
                { label: 'Badges Em Progresso', valor: dados.badgesEmProgresso.length },
                { label: 'Badges Especiais', valor: dados.badgesEspeciais.length },
                { label: 'Pontos Gamification', valor: dados.totalPontos },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{s.label}</div>
                  <div style={{
                    display: 'inline-block', background: '#39639C', color: '#fff', fontWeight: 700,
                    fontSize: 13, borderRadius: 6, padding: '2px 10px',
                  }}>
                    {s.valor}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Abas + tabela ── */}
          <div style={{
            background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            flex: '2 1 500px', minWidth: 320,
          }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  border: '1px solid ' + (tab === t.key ? '#39639C' : '#e5e7eb'),
                  background: tab === t.key ? '#39639C' : '#fff',
                  color: tab === t.key ? '#fff' : '#555',
                  borderRadius: 8, padding: '8px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 500,
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            {tabelaAtiva.linhas.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#aaa', padding: '20px 0' }}>{tabelaAtiva.vazio}</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      {tabelaAtiva.colunas.map(c => (
                        <th key={c} style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tabelaAtiva.linhas.map((linha, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f9f9f9' }}>
                        {linha.map((valor, j) => (
                          <td key={j} style={{ padding: '10px 12px', color: j === 0 ? '#333' : '#6b7280', fontWeight: j === 0 ? 500 : 400 }}>
                            {valor}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Evolução Profissional ── */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 20 }}>
          <h4 style={{ color: '#39639C', fontWeight: 700, marginBottom: 20, fontSize: 15 }}>Evolução Profissional</h4>
          {dados.evolucao.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#aaa' }}>Ainda sem conquistas registadas.</p>
          ) : (
            <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: 8 }}>
              {dados.evolucao.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ textAlign: 'center', width: 140 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', background: '#39639C',
                      margin: '0 auto 10px',
                    }} />
                    <div style={{ fontSize: 12, color: '#333', fontWeight: 500, padding: '0 8px' }}>{e.titulo}</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{formatarData(e.data)}</div>
                  </div>
                  {i < dados.evolucao.length - 1 && (
                    <div style={{ width: 60, height: 2, background: '#e5e7eb', marginTop: -30, flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </LayoutSL>
  )
}
