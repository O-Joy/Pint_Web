import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import LayoutTM from './components/LayoutTM'
import api from '../../services/api'
import { FiRefreshCw, FiChevronLeft, FiDownload, FiCheckCircle } from 'react-icons/fi'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const formatarData = (data) => data ? new Date(data).toLocaleDateString('pt-PT') : '-'

const TABS = [
  { key: 'obtidos', label: 'Badges Obtidos' },
  { key: 'progresso', label: 'Badges Em Progresso' },
  { key: 'especiais', label: 'Badges Especiais' },
  { key: 'historico', label: 'Histórico do Consultor' },
]

export default function ConsultorDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)
  const [tab, setTab] = useState('obtidos')
  const [toast, setToast] = useState(null)
  const mostrarToast = (titulo, subtitulo = '') => {
   setToast({ titulo, subtitulo })
   setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => { carregar() }, [id]) // eslint-disable-line

  function carregar() {
    setLoading(true)
    setErro(null)
    api.get(`/tm/consultores/${id}`)
      .then(res => setDados(res.data))
      .catch(err => setErro(err.response?.data?.error || 'Não foi possível carregar o perfil do consultor.'))
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
      body: dados.badgesObtidos.map(b => [b.nomeBadge, b.nomeArea, b.nomeNivel, b.pontos, formatarData(b.dataAtribuicao), formatarData(b.dataExpiracao)]),
      styles: { fontSize: 9 }, headStyles: { fillColor: [57, 99, 156] },
    })
    doc.save(`perfil_${dados.nome?.replace(/\s+/g, '_') || id}.pdf`)
    mostrarToast('Perfil exportado com sucesso!', `perfil_${dados.nome}.pdf`)
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
      styles: { fontSize: 9 }, headStyles: { fillColor: [57, 99, 156] },
    })
    doc.save(`historico_${dados.nome?.replace(/\s+/g, '_') || id}.pdf`)
    mostrarToast('Histórico exportado com sucesso!', `historico_${dados.nome}.pdf`)
  }

  if (loading) return <LayoutTM><p style={{ textAlign: 'center', color: '#aaa', fontFamily: 'Poppins, sans-serif' }}>A carregar...</p></LayoutTM>

  if (erro || !dados) {
    return (
      <LayoutTM>
        <div style={{ fontFamily: 'Poppins, sans-serif' }}>
          <p style={{ color: '#AE0003' }}>{erro || 'Consultor não encontrado.'}</p>
          <button onClick={() => navigate('/talent/consultores')} style={{ ...btnStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiChevronLeft /> Voltar a Consultores
          </button>
        </div>
      </LayoutTM>
    )
  }

  const tabelas = {
    obtidos: { colunas: ['Badge', 'Área', 'Nível', 'Pontos', 'Data de Aprovação', 'Data de Expiração'], linhas: dados.badgesObtidos.map(b => [b.nomeBadge, b.nomeArea, b.nomeNivel, b.pontos, formatarData(b.dataAtribuicao), formatarData(b.dataExpiracao)]), vazio: 'Ainda sem badges obtidos.' },
    progresso: { colunas: ['Badge', 'Nível', 'Estado', 'Data de Submissão'], linhas: dados.badgesEmProgresso.map(b => [b.nomeBadge, b.nomeNivel, b.nomeEstado, formatarData(b.dataCriacao)]), vazio: 'Sem candidaturas em progresso.' },
    especiais: { colunas: ['Badge Especial', 'Pontos', 'Data de Atribuição', 'Data de Expiração'], linhas: dados.badgesEspeciais.map(b => [b.nomeBadgeEspecial, b.pontos, formatarData(b.dataAtribuicao), formatarData(b.dataExpiracao)]), vazio: 'Sem badges especiais.' },
    historico: { colunas: ['Data', 'Badge', 'Estado', 'Comentário'], linhas: dados.historico.map(h => [formatarData(h.data), h.nomeBadge, h.nomeEstado, h.comentario || '-']), vazio: 'Sem histórico disponível.' },
  }
  const tabelaAtiva = tabelas[tab]

  const stats = [
    { label: 'Badges Obtidos', valor: dados.badgesObtidos.length },
    { label: 'Badges Em Progresso', valor: dados.badgesEmProgresso.length },
    { label: 'Badges Especiais', valor: dados.badgesEspeciais.length },
    { label: 'Pontos Gamification', valor: dados.totalPontos },
  ]

  return (
    <LayoutTM>
      <div style={{ fontFamily: 'Poppins, sans-serif' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
            <Link to="/talent/consultores" style={{ color: '#6b7280', textDecoration: 'none' }}>Consultores</Link>
            {' > '}Perfil de {dados.nome}
          </p>
          <FiRefreshCw role="button" title="Atualizar" onClick={carregar} color="#39639C" style={{ cursor: 'pointer' }} />
        </div>
        <h2 style={{ color: '#39639C', fontWeight: 700, marginBottom: 16 }}>Perfil Consultor</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 20 }}>

          <div style={cardStyle}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#e8f0fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 26, color: '#39639C', marginBottom: 12, overflow: 'hidden' }}>
              {dados.urlFoto ? <img src={dados.urlFoto} alt={dados.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (dados.nome?.[0]?.toUpperCase() || '?')}
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>{dados.nome}</h3>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{dados.nomeArea} · {dados.nomeServiceLine}</p>
            <p style={{ fontSize: 12, color: '#39639C', marginBottom: 16 }}>{dados.email}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {stats.map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{s.label}</div>
                  <span style={{ background: '#39639C', color: '#fff', borderRadius: 20, padding: '3px 12px', fontSize: 13, fontWeight: 700 }}>{s.valor}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  padding: '8px 14px', borderRadius: 8, border: 'none', fontSize: 12, cursor: 'pointer', fontWeight: 600,
                  background: tab === t.key ? '#39639C' : '#f3f4f6', color: tab === t.key ? '#fff' : '#6b7280',
                }}>{t.label}</button>
              ))}
            </div>

            {tabelaAtiva.linhas.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#aaa', padding: 20 }}>{tabelaAtiva.vazio}</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                    {tabelaAtiva.colunas.map(c => <th key={c} style={{ padding: '8px 10px', textAlign: 'left', color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {tabelaAtiva.linhas.map((linha, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f9f9f9' }}>
                      {linha.map((valor, j) => <td key={j} style={{ padding: '8px 10px', color: j === 0 ? '#1a1a2e' : '#6b7280', fontWeight: j === 0 ? 500 : 400 }}>{valor}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <h4 style={{ color: '#39639C', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Evolução Profissional</h4>
          {dados.evolucao.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#aaa' }}>Ainda sem conquistas registadas.</p>
          ) : (
            <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: 8 }}>
              {dados.evolucao.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ textAlign: 'center', width: 140 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#39639C', margin: '0 auto 8px' }} />
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#333', padding: '0 8px' }}>{e.titulo}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{formatarData(e.data)}</div>
                  </div>
                  {i < dados.evolucao.length - 1 && <div style={{ width: 60, height: 2, background: '#e5e7eb', marginTop: -30, flexShrink: 0 }} />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={exportarPerfil} style={btnStyle}><FiDownload /> Exportar Perfil</button>
          <button onClick={exportarHistorico} style={btnStyle}><FiDownload /> Exportar Histórico</button>
        </div>
      </div>
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

const cardStyle = { background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }
const btnStyle = { background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '8px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }