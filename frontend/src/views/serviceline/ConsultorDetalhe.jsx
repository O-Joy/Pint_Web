// src/views/serviceline/ConsultorDetalhe.jsx
// Perfil detalhado de um consultor, acedido a partir do "olho" na tabela de Consultores.
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import LayoutSL from './components/LayoutSL'
import api from '../../services/api'
import Footer from '../../components/Footer'
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
        <p className="text-center text-secondary" style={{ fontFamily: 'Poppins, sans-serif' }}>A carregar...</p>
      </LayoutSL>
    )
  }

  if (erro || !dados) {
    return (
      <LayoutSL>
        <div style={{ fontFamily: 'Poppins, sans-serif' }}>
          <p className="text-danger">{erro || 'Consultor não encontrado.'}</p>
          <button onClick={() => navigate('/serviceline/consultores')} className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
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

  const stats = [
    { label: 'Badges Obtidos', valor: dados.badgesObtidos.length },
    { label: 'Badges Em Progresso', valor: dados.badgesEmProgresso.length },
    { label: 'Badges Especiais', valor: dados.badgesEspeciais.length },
    { label: 'Pontos Gamification', valor: dados.totalPontos },
  ]

  return (
    <LayoutSL>
      <div style={{ fontFamily: 'Poppins, sans-serif' }}>

        {/* ── Breadcrumb + refresh ── */}
        <div className="d-flex justify-content-between align-items-center mb-2">
          <p className="small text-secondary mb-0">
            <Link to="/serviceline/consultores" className="text-secondary text-decoration-none">Consultores</Link>
            {' > '}Perfil de {dados.nome}
          </p>
          <FiRefreshCw role="button" title="Atualizar" onClick={carregar} className="text-primary" style={{ fontSize: 16 }} />
        </div>
        <h2 className="fw-bold mb-3 text-primary" style={{ fontSize: 22 }}>Perfil Consultor</h2>

        <div className="row g-4 mb-3">

          {/* ── Cartão de identidade ── */}
          <div className="col-12 col-lg-4">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-center rounded-circle overflow-hidden fw-bold mb-3 text-primary"
                  style={{ width: 72, height: 72, background: '#e8f0fb', fontSize: 26 }}>
                  {dados.urlFoto
                    ? <img src={dados.urlFoto} alt={dados.nome} className="w-100 h-100" style={{ objectFit: 'cover' }} />
                    : (dados.nome?.[0]?.toUpperCase() || '?')}
                </div>
                <h3 className="fs-5 fw-bold mb-1" style={{ color: '#1a1a2e' }}>{dados.nome}</h3>
                <p className="small text-secondary mb-1">{dados.nomeArea} · {dados.nomeServiceLine}</p>
                <p className="small mb-3 text-primary">{dados.email}</p>

                <div className="row row-cols-2 g-3">
                  {stats.map((s, i) => (
                    <div className="col" key={i}>
                      <div className="small text-secondary mb-1">{s.label}</div>
                      <span className="badge rounded-pill bg-primary" style={{ fontSize: 13 }}>{s.valor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Abas + tabela ── */}
          <div className="col-12 col-lg-8">
            <div className="card h-100">
              <div className="card-body">
                <ul className="nav nav-pills gap-2 mb-3 flex-wrap">
                  {TABS.map(t => (
                    <li className="nav-item" key={t.key}>
                      <button
                        onClick={() => setTab(t.key)}
                        className={`nav-link small ${tab === t.key ? 'active' : ''}`}
                      >
                        {t.label}
                      </button>
                    </li>
                  ))}
                </ul>

                {tabelaAtiva.linhas.length === 0 ? (
                  <p className="text-center text-secondary py-3 mb-0">{tabelaAtiva.vazio}</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead>
                        <tr>
                          {tabelaAtiva.colunas.map(c => <th key={c} className="text-nowrap">{c}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {tabelaAtiva.linhas.map((linha, i) => (
                          <tr key={i}>
                            {linha.map((valor, j) => (
                              <td key={j} className={j === 0 ? 'fw-medium' : 'text-secondary'}>{valor}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Evolução Profissional ── */}
        <div className="card mb-3">
          <div className="card-body">
            <h4 className="fs-6 fw-bold mb-3 text-primary">Evolução Profissional</h4>
            {dados.evolucao.length === 0 ? (
              <p className="text-center text-secondary mb-0">Ainda sem conquistas registadas.</p>
            ) : (
              <div className="d-flex overflow-auto pb-2">
                {dados.evolucao.map((e, i) => (
                  <div key={i} className="d-flex align-items-center flex-shrink-0">
                    <div className="text-center" style={{ width: 140 }}>
                      <div className="rounded-circle mx-auto mb-2 bg-primary" style={{ width: 16, height: 16 }} />
                      <div className="small fw-medium px-2" style={{ color: '#333' }}>{e.titulo}</div>
                      <div className="text-secondary mt-1" style={{ fontSize: 11 }}>{formatarData(e.data)}</div>
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

        {/* ── Ações ── */}
        <div className="d-flex justify-content-end gap-2 mb-3">
          <button onClick={exportarPerfil} className="btn btn-outline-primary btn-sm">Exportar Perfil</button>
          <button onClick={exportarHistorico} className="btn btn-outline-primary btn-sm">Exportar Histórico</button>
        </div>

        <Footer />
      </div>
    </LayoutSL>
  )
}
