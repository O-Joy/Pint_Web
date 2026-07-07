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
import { desenharLogoSoftinsa } from '../../utils/pdfLogo'

const formatarData = (data) => {
  if (!data) return '-'
  return new Date(data).toLocaleDateString('pt-PT')
}

// Carrega uma imagem (foto de perfil) e devolve em base64, para poder ser
// inserida no PDF — o jsPDF não consegue usar diretamente um URL externo.
async function carregarImagemBase64(url) {
  if (!url) return null
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

const AZUL = [57, 99, 156]
const AZUL_CLARO = [232, 240, 251]
const CINZA = [107, 114, 128]

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
  const [aExportar, setAExportar] = useState(false)

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

  const exportarPerfil = async () => {
    if (!dados || aExportar) return
    setAExportar(true)
    try {
      const doc = new jsPDF()
      const largura = doc.internal.pageSize.getWidth()
      const fotoBase64 = await carregarImagemBase64(dados.urlFoto)

      // ── Cabeçalho de marca ──
      doc.setFillColor(...AZUL)
      doc.rect(0, 0, largura, 32, 'F')
      // "Chapa" branca para o logótipo ficar sempre legível em cima do azul
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(12, 7, 42, 14, 2, 2, 'F')
      await desenharLogoSoftinsa(doc, { x: 15, y: 10, altura: 8, comLinha: false })
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      doc.text('Perfil de Consultor · Plataforma de Badges', 14, 26)
      doc.setFontSize(8)
      doc.text(`Gerado em ${new Date().toLocaleDateString('pt-PT')}`, largura - 14, 14, { align: 'right' })

      // ── Foto + identidade ──
      const fotoX = 14, fotoY = 42, fotoTam = 26
      if (fotoBase64) {
        const formato = fotoBase64.includes('image/png') ? 'PNG' : fotoBase64.includes('image/webp') ? 'WEBP' : 'JPEG'
        try { doc.addImage(fotoBase64, formato, fotoX, fotoY, fotoTam, fotoTam, undefined, 'FAST') } catch { /* imagem inválida, ignora */ }
      } else {
        doc.setFillColor(...AZUL_CLARO)
        doc.circle(fotoX + fotoTam / 2, fotoY + fotoTam / 2, fotoTam / 2, 'F')
        doc.setTextColor(...AZUL)
        doc.setFontSize(18)
        doc.setFont(undefined, 'bold')
        doc.text((dados.nome?.[0] || '?').toUpperCase(), fotoX + fotoTam / 2, fotoY + fotoTam / 2 + 3, { align: 'center' })
      }

      const textoX = fotoX + fotoTam + 10
      doc.setTextColor(26, 26, 46)
      doc.setFontSize(15)
      doc.setFont(undefined, 'bold')
      doc.text(dados.nome || '-', textoX, fotoY + 8)
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      doc.setTextColor(...CINZA)
      doc.text([dados.nomeArea, dados.nomeServiceLine].filter(Boolean).join(' · ') || '-', textoX, fotoY + 15)
      doc.setTextColor(...AZUL)
      doc.text(dados.email || '-', textoX, fotoY + 21)

      // ── Estatísticas (badges obtidos / em progresso / especiais / pontos) ──
      const statsY = fotoY + fotoTam + 12
      const stats = [
        { label: 'Badges Obtidos', valor: dados.badgesObtidos.length },
        { label: 'Em Progresso', valor: dados.badgesEmProgresso.length },
        { label: 'Especiais', valor: dados.badgesEspeciais.length },
        { label: 'Pontos Gamification', valor: dados.totalPontos },
      ]
      const larguraCaixa = (largura - 28) / 4
      stats.forEach((s, i) => {
        const x = 14 + i * larguraCaixa
        doc.setFillColor(248, 249, 251)
        doc.roundedRect(x, statsY, larguraCaixa - 4, 20, 2, 2, 'F')
        doc.setTextColor(...AZUL)
        doc.setFontSize(14)
        doc.setFont(undefined, 'bold')
        doc.text(String(s.valor), x + (larguraCaixa - 4) / 2, statsY + 9, { align: 'center' })
        doc.setTextColor(...CINZA)
        doc.setFontSize(7.5)
        doc.setFont(undefined, 'normal')
        doc.text(s.label, x + (larguraCaixa - 4) / 2, statsY + 15, { align: 'center' })
      })

      // ── Rodapé em cada página ──
      const rodape = () => {
        const paginas = doc.internal.getNumberOfPages()
        for (let p = 1; p <= paginas; p++) {
          doc.setPage(p)
          doc.setFontSize(8)
          doc.setTextColor(...CINZA)
          doc.text('Softinsa — Plataforma de Badges', 14, doc.internal.pageSize.getHeight() - 10)
          doc.text(`Página ${p} de ${paginas}`, largura - 14, doc.internal.pageSize.getHeight() - 10, { align: 'right' })
        }
      }

      let y = statsY + 28

      // ── Badges Obtidos ──
      doc.setTextColor(...AZUL)
      doc.setFontSize(11)
      doc.setFont(undefined, 'bold')
      doc.text('Badges Obtidos', 14, y)
      if (dados.badgesObtidos.length === 0) {
        doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(...CINZA)
        doc.text('Ainda sem badges obtidos.', 14, y + 6)
        y += 14
      } else {
        autoTable(doc, {
          startY: y + 4,
          head: [['Badge', 'Área', 'Nível', 'Pontos', 'Aprovação', 'Expiração']],
          body: dados.badgesObtidos.map(b => [b.nomeBadge, b.nomeArea, b.nomeNivel, b.pontos, formatarData(b.dataAtribuicao), formatarData(b.dataExpiracao)]),
          styles: { fontSize: 8.5 },
          headStyles: { fillColor: AZUL },
          margin: { left: 14, right: 14 },
        })
        y = doc.lastAutoTable.finalY + 12
      }

      // ── Badges Em Progresso ──
      doc.setTextColor(...AZUL)
      doc.setFontSize(11)
      doc.setFont(undefined, 'bold')
      doc.text('Badges Em Progresso', 14, y)
      if (dados.badgesEmProgresso.length === 0) {
        doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(...CINZA)
        doc.text('Sem candidaturas em progresso.', 14, y + 6)
        y += 14
      } else {
        autoTable(doc, {
          startY: y + 4,
          head: [['Badge', 'Nível', 'Estado', 'Submissão']],
          body: dados.badgesEmProgresso.map(b => [b.nomeBadge, b.nomeNivel, b.nomeEstado, formatarData(b.dataCriacao)]),
          styles: { fontSize: 8.5 },
          headStyles: { fillColor: AZUL },
          margin: { left: 14, right: 14 },
        })
        y = doc.lastAutoTable.finalY + 12
      }

      // ── Badges Especiais ──
      if (dados.badgesEspeciais.length > 0) {
        doc.setTextColor(...AZUL)
        doc.setFontSize(11)
        doc.setFont(undefined, 'bold')
        doc.text('Badges Especiais', 14, y)
        autoTable(doc, {
          startY: y + 4,
          head: [['Badge Especial', 'Pontos', 'Atribuição', 'Expiração']],
          body: dados.badgesEspeciais.map(b => [b.nomeBadgeEspecial, b.pontos, formatarData(b.dataAtribuicao), formatarData(b.dataExpiracao)]),
          styles: { fontSize: 8.5 },
          headStyles: { fillColor: AZUL },
          margin: { left: 14, right: 14 },
        })
      }

      rodape()
      doc.save(`perfil_${dados.nome?.replace(/\s+/g, '_') || id}.pdf`)
    } finally {
      setAExportar(false)
    }
  }

  const exportarHistorico = async () => {
    if (!dados) return
    const doc = new jsPDF()
    const y = await desenharLogoSoftinsa(doc)
    doc.setFontSize(14)
    doc.text(`Histórico de ${dados.nome}`, 14, y)
    autoTable(doc, {
      startY: y + 8,
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
          <button onClick={exportarPerfil} disabled={aExportar} className="btn btn-outline-primary btn-sm">
            {aExportar ? 'A gerar...' : 'Exportar Perfil'}
          </button>
          <button onClick={exportarHistorico} className="btn btn-outline-primary btn-sm">Exportar Histórico</button>
        </div>

        <Footer />
      </div>
    </LayoutSL>
  )
}
