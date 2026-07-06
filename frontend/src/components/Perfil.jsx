// Página de perfil partilhada por todos os perfis
// Recebe Cards e Info como props —> variam por perfil
// Vai buscar os dados do utilizador diretamente do sessionStorage/localStorage
// Deteta automaticamente o perfil e mostra os campos correspondentes

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUtilizador } from '../utils/auth'
import api from '../services/api'
import Sidebar, { icons } from './Sidebar'
import Topbar from './Topbar'
import { FaMedal } from 'react-icons/fa6'
import { LuTarget } from 'react-icons/lu'
import { FaTrophy } from 'react-icons/fa'
import { IoIosTrendingUp } from "react-icons/io";
import { FaLinkedin } from "react-icons/fa";
import { FaGlobe } from "react-icons/fa";
import { FaPhone } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import { FaPen } from "react-icons/fa";
import { FiDownload, FiCheckCircle } from 'react-icons/fi'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const NAV_ITEMS = {
  consultor: [
    { label: 'Dashboard', path: '/consultor/dashboard', icon: icons.dashboard },
    { label: 'Badges', path: '/consultor/badges', icon: icons.badges },
    { label: 'Pedidos', path: '/consultor/pedidos', icon: icons.pedidos },
    { label: 'Objetivos', path: '/consultor/objetivos', icon: icons.objetivos },
    { label: 'Gamification', path: '/consultor/gamification', icon: icons.gamification },
  ],
  talent_manager: [
    { label: 'Dashboard', path: '/talent/dashboard', icon: icons.dashboard },
    { label: 'Badges', path: '/talent/badges', icon: icons.badges },
    { label: 'Validações', path: '/talent/validacoes', icon: icons.validacoes },
    { label: 'Consultores', path: '/talent/consultores', icon: icons.utilizadores },
    { label: 'Relatórios', path: '/talent/relatorios', icon: icons.relatorios },
    { label: 'Gamification', path: '/talent/gamification', icon: icons.gamification },
  ],
  sl_leader: [
    { label: 'Dashboard', path: '/serviceline/dashboard', icon: icons.dashboard },
  ],
  administrador: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: icons.dashboard },
    { label: 'Utilizadores', path: '/admin/utilizadores', icon: icons.utilizadores },
  ],
}

const PERFIL_LABELS = {
  consultor: 'Consultor',
  talent_manager: 'Talent Manager',
  sl_leader: 'Service Line Leader',
  administrador: 'Administrador',
}

// A foto pode vir como URL completo ou como caminho do upload (uploads/fotos/xxx.jpg)
function urlFotoCompleto(urlFoto) {
  if (!urlFoto) return null
  return urlFoto.startsWith('http') ? urlFoto : `http://localhost:3001/${urlFoto}`
}

export default function Perfil() {
  const navigate = useNavigate()
  const utilizadorLocal = getUtilizador()
  const perfil = utilizadorLocal?.perfil || 'consultor'
  const navItems = NAV_ITEMS[perfil] || []
  const perfilLabel = PERFIL_LABELS[perfil] || ''

  const [dados, setDados] = useState(null)
  const [aCarregar, setACarregar] = useState(true)

  const [badgesSelecionados, setBadgesSelecionados] = useState([])
  const [modalCertificadoDados, setModalCertificadoDados] = useState(false)
  const [itensCertificado, setItensCertificado] = useState([])
  const [confirmacaoExport, setConfirmacaoExport] = useState(null)
  const [toast, setToast] = useState(null)

  const mostrarToast = (titulo, subtitulo = '') => {
    setToast({ titulo, subtitulo })
    setTimeout(() => setToast(null), 4000)
  }

  const toggleBadgeSelecionado = (id) => {
    setBadgesSelecionados(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id])
  }
  const toggleItemCertificado = (id) => {
    setItensCertificado(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  useEffect(() => {
    api.get('/perfil/me')
      .then((res) => setDados(res.data))
      .catch((err) => console.error('[Perfil]', err))
      .finally(() => setACarregar(false))
  }, [])

  // Enquanto a API não responde, usa o que ficou guardado no login para não mostrar tudo vazio
  const utilizador = dados || utilizadorLocal || {}
  const inicial = utilizador?.nome?.[0]?.toUpperCase() || 'U'

  const executarExportacaoCertificado = () => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const largura = doc.internal.pageSize.getWidth()
  const altura = doc.internal.pageSize.getHeight()

  const azulMarinho = [22, 38, 66]
  const azulMedio = [58, 90, 138]
  const azulClaro = [140, 170, 210]
  const dourado = [200, 170, 110]
  const cinzaTexto = [90, 90, 90]

  // ── Fundo geral ──
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, largura, altura, 'F')

  // ── Borda fina ──
  doc.setDrawColor(...azulMarinho)
  doc.setLineWidth(0.6)
  doc.rect(6, 6, largura - 12, altura - 12)

  // ── Mosaico geométrico do lado direito ──
  const coresMosaico = [azulMarinho, azulMedio, azulClaro, [230, 236, 245]]
  const tamanhoQuadrado = 12
  const inicioMosaicoX = largura - 70
  for (let col = 0; col < 6; col++) {
    for (let lin = 0; lin < Math.ceil(altura / tamanhoQuadrado); lin++) {
      const cor = coresMosaico[(col + lin) % coresMosaico.length]
      doc.setFillColor(...cor)
      doc.rect(inicioMosaicoX + col * tamanhoQuadrado, lin * tamanhoQuadrado, tamanhoQuadrado, tamanhoQuadrado, 'F')
    }
  }
  // Máscara branca por cima para o mosaico não cobrir a borda
  doc.setFillColor(255, 255, 255)
  doc.rect(largura - 6, 0, 20, altura, 'F')
  doc.setDrawColor(...azulMarinho)
  doc.rect(6, 6, largura - 12, altura - 12)

  // ── Selo circular sobre o mosaico ──
  const selCentroX = largura - 40
  const selCentroY = 30
  doc.setFillColor(255, 255, 255)
  doc.circle(selCentroX, selCentroY, 14, 'F')
  doc.setDrawColor(...dourado)
  doc.setLineWidth(1)
  doc.circle(selCentroX, selCentroY, 14)
  doc.circle(selCentroX, selCentroY, 11)
  doc.setFillColor(...dourado)
  doc.circle(selCentroX, selCentroY, 4, 'F')

  // ── Título ──
  doc.setTextColor(...azulMarinho)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.text('CERTIFICADO', 25, 48)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'normal')
  doc.text('DE DESEMPENHO', 25, 58)

  doc.setDrawColor(...dourado)
  doc.setLineWidth(1)
  doc.line(25, 64, 100, 64)

  // ── "Este certificado é atribuído a" ──
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...cinzaTexto)
  doc.text('Este certificado é atribuído a', 25, 80)

  // ── Nome ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.setTextColor(...azulMedio)
  doc.text(utilizador?.nome || '-', 25, 95)

  // ── Descrição de mérito ──
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...cinzaTexto)
  doc.text(`pelo desempenho como Talent Manager na Service Line ${utilizador?.nomeServiceLine || '-'},`, 25, 106)
  doc.text(`com ${utilizador?.candidaturasValidadas ?? 0} candidaturas validadas e SLA médio de ${utilizador?.slaMedio ?? 0}h.`, 25, 113)

  // ── Data (se selecionada) ──
  if (itensCertificado.includes('data')) {
    doc.setFontSize(10)
    doc.text(`Emitido em ${new Date().toLocaleDateString('pt-PT')}`, 25, 122)
  }

  // ── Rodapé: duas "assinaturas" lado a lado ──
  const rodapeY = altura - 30

  // Assinatura 1 — sempre presente (Talent Manager)
  doc.setDrawColor(150, 150, 150)
  doc.line(25, rodapeY, 90, rodapeY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...azulMarinho)
  doc.text(utilizador?.nome || '-', 25, rodapeY + 6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...cinzaTexto)
  doc.text('Talent Manager', 25, rodapeY + 11)

  // Assinatura 2 — Service Line (só se selecionada)
  if (itensCertificado.includes('assinatura')) {
    doc.setDrawColor(150, 150, 150)
    doc.line(110, rodapeY, 175, rodapeY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...azulMarinho)
    doc.text(utilizador?.nomeServiceLine || '-', 110, rodapeY + 6)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...cinzaTexto)
    doc.text('Service Line Leader', 110, rodapeY + 11)
  }

  // ── Logótipo (se selecionado) — grande, no topo ──
  if (itensCertificado.includes('logotipo')) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(...azulMarinho)
    doc.text('SOFT', 25, 20)
    doc.setTextColor(...azulMedio)
    doc.text('INSA', 25 + doc.getTextWidth('SOFT'), 20)

    doc.setDrawColor(...dourado)
    doc.setLineWidth(0.6)
    doc.line(25, 23, 25 + doc.getTextWidth('SOFTINSA'), 23)
  }

  doc.save(`certificado_${(utilizador?.nome || 'talent-manager').replace(/\s+/g, '_')}.pdf`)
  setModalCertificadoDados(false)
  setConfirmacaoExport(null)
  mostrarToast('A exportação foi concluída com sucesso', '')
}


  const executarExportacaoAssinatura = () => {
    const badgesEscolhidos = (utilizador?.badgesAssinatura || []).filter(b => badgesSelecionados.includes(b.id))
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Assinatura de Email', 14, 15)
    autoTable(doc, {
      startY: 25,
      head: [['Badge', 'Estado', 'SLA']],
      body: badgesEscolhidos.map(b => [b.nome, b.estado, b.slaMeses ? `${b.slaMeses} meses` : '-']),
      styles: { fontSize: 9 }, headStyles: { fillColor: [57, 99, 156] },
    })
    doc.save('assinatura.pdf')
    setConfirmacaoExport(null)
    mostrarToast('A exportação foi concluída com sucesso', '')
  }

  const dataMembro = utilizador?.dataMembro
    ? new Date(utilizador.dataMembro).toLocaleDateString('pt-PT')
    : '—'

  const statsCards = perfil === 'consultor' ? [
    { icone: <FaMedal size={16} />, label: 'Badges:', valor: utilizador?.totalBadges ?? 0 },
    { icone: <LuTarget size={16} />, label: 'Objetivos:', valor: utilizador?.totalObjetivos ?? 0 },
    { icone: <FaTrophy size={16} />, label: 'Ranking:', valor: utilizador?.posicaoRanking ? `${utilizador.posicaoRanking}º` : '—' },
    { icone: <IoIosTrendingUp size={16}/>, label: 'Pontos:', valor: utilizador?.totalPontos ?? 0 },
  ] : perfil === 'talent_manager' ? [
    { label: 'Candidaturas validadas:', valor: utilizador?.candidaturasValidadas ?? 0 },
    { label: 'Relatórios Exportados:', valor: utilizador?.relatoriosExportados ?? 0 },
    { label: 'SLA:', valor: `${utilizador?.slaMedio ?? 0}h` },
    { label: 'Badges disponíveis:', valor: utilizador?.badgesDisponiveis ?? 0 },
  ] : []

  const camposInfo = [
    ...(utilizador?.nomeLearningPath ? [{ label: 'Learning Path:', valor: utilizador.nomeLearningPath }] : []),
    { label: 'Membro desde:', valor: dataMembro },
    ...(utilizador?.nomeServiceLine ? [{ label: 'Service Line:', valor: utilizador.nomeServiceLine }] : []),
        ...(utilizador?.urlLinkedin ? [{
      icone: <FaLinkedin />,
      valor: utilizador.urlLinkedin
    }] : []),
    ...(utilizador?.nomeArea ? [{ label: 'Área:', valor: utilizador.nomeArea }] : []),
   
    ...(perfil === 'consultor' ? [{
      icone: <FaGlobe />,
      valor: `www.softinsa.pt/galeria-publica/${utilizador?.nome?.split(' ')[0]}`
    }] : []),
  ]

  return (
    <div className="pg-layout">
      <div className="pg-top">
        <Topbar />
      </div>

      <div className="container-fluid pg-body">
        <div className="row h-100">

          {/* Sidebar — esconde em ecrãs pequenos */}
          <div className="col-auto d-flex p-0">
            <Sidebar navItems={navItems} perfil={perfilLabel} />
          </div>

          {/* Conteúdo principal */}
          <div className="col">
            <main className="pg-content">
              <div className="perfil-wrapper">

                <h2 style={{ color: '#39639C', fontWeight: 700, fontSize: '1.3rem', marginBottom: '-1.5rem' }}>O Meu Perfil</h2>

                {/* Cabeçalho */}
                <div className="perfil-header">
                    <div className="row align-items-center g-3 w-100">
                        
                        {/* Avatar */}
                        <div className="col-auto">
                        <div className="perfil-avatar">
                            {utilizador?.urlFoto
                            ? <img src={urlFotoCompleto(utilizador.urlFoto)} alt="avatar" />
                            : <span>{inicial}</span>
                            }
                        </div>
                        </div>

                        {/* Nome e contactos */}
                        <div className="col" style={{ minWidth: 220}}>
                        <h2 className="perfil-nome">{utilizador?.nome || '—'} {aCarregar && <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>(a atualizar...)</span>}</h2>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <p className="perfil-cargo mb-0">{perfilLabel}</p>
                          <button
                            onClick={() => navigate('/definicoes')}
                            className="btn btn-sm d-inline-flex align-items-center gap-1"
                            style={{ border: '1px solid #39639C', color: '#39639C', background: '#fff', fontSize: 12, padding: '2px 10px', borderRadius: 20 }}
                          >
                            <FaPen size={11} /> Alterar Perfil
                          </button>
                        </div>
                        <div className="perfil-contactos">
                            {utilizador?.email && (
                            <div className="perfil-contacto-item">
                                <MdEmail />
                                <span>{utilizador.email}</span>
                            </div>
                            )}
                            {utilizador?.telefone && (
                            <div className="perfil-contacto-item">
                                <FaPhone />
                                <span>{utilizador.telefone}</span>
                            </div>
                            )}
                        </div>
                    </div>

                    {/* Cards de estatísticas — col fixo em ecrãs grandes, full width em pequenos */}
                    {statsCards.length > 0 && (
                    <div className="col-auto">
                        <div className="row g-2" style={{ maxWidth: perfil === 'talent_manager' ? 520 : 320 }}>
                        {statsCards.map((card, i) => (
                            <div key={i} className="col-6">
                            <div className={perfil === 'talent_manager' ? 'perfil-stat-card-tm' : 'perfil-stat-card'}>
                                {card.icone && <span className="perfil-stat-icon">{card.icone}</span>}
                                <span className="perfil-stat-label">{card.label}</span>
                                <span className="perfil-stat-valor">{card.valor}</span>
                            </div>
                            </div>
                        ))}
                        </div>
                    </div>
                    )}

                </div>
                </div>

                {/* Grelha de campos — Bootstrap grid para responsividade */}
                {camposInfo.length > 0 && (
                    <div className="perfil-campos">
                    {camposInfo.map((campo, i) => (
                        <div key={i} className="perfil-campo-item">
                        {campo.icone && <span className="perfil-campo-icone">{campo.icone}</span>}
                        {campo.label && <span className="perfil-campo-label">{campo.label}</span>}
                        <span className="perfil-campo-valor">{campo.valor || '—'}</span>
                        </div>
                    ))}
                    </div>
                )}

                 {perfil === 'talent_manager' && (
                  <div style={{ background: '#fff', border: '1px solid var(--cor-borda)', borderRadius: 12, padding: '1.5rem' }}>
                    <h4 style={{ color: '#39639C', fontWeight: 700, fontSize: 15, marginBottom: 2 }}>Assinatura de Email</h4>
                    <p style={{ color: '#6b7280', fontSize: 12, marginBottom: 16 }}>Seleciona um badge obtido para adicionar à tua assinatura do email.</p>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                          {['Nome', 'Estado', 'SLA', 'Selecionar'].map(h => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Selecionar' ? 'right' : 'left', color: '#6b7280', fontWeight: 600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(utilizador?.badgesAssinatura || []).map(b => (
                          <tr key={b.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                            <td style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ width: 22, height: 22, borderRadius: 6, background: '#e8e4fb', flexShrink: 0 }} />
                              {b.nome}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#06A120', fontWeight: 600, fontSize: 11 }}>{b.estado.toUpperCase()}</td>
                            <td style={{ padding: '10px 12px', color: '#6b7280' }}>{b.slaMeses ? `${b.slaMeses} meses` : '-'}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                              <input type="checkbox" checked={badgesSelecionados.includes(b.id)} onChange={() => toggleBadgeSelecionado(b.id)} />
                            </td>
                          </tr>
                        ))}
                        {(!utilizador?.badgesAssinatura || utilizador.badgesAssinatura.length === 0) && (
                          <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: '#aaa' }}>Sem badges disponíveis.</td></tr>
                        )}
                      </tbody>
                    </table>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                      <button onClick={() => setModalCertificadoDados(true)} style={btnPerfilStyle}><FiDownload /> Exportar Certificado</button>
                      <button
                        onClick={() => setConfirmacaoExport('assinatura')}
                        disabled={badgesSelecionados.length === 0}
                        style={{
                          ...btnPerfilStyle,
                          opacity: badgesSelecionados.length === 0 ? 0.4 : 1,
                          cursor: badgesSelecionados.length === 0 ? 'not-allowed' : 'pointer',
                        }}
                        title={badgesSelecionados.length === 0 ? 'Seleciona pelo menos um badge' : ''}
                      >
                        <FiDownload /> Exportar Assinatura
                      </button>
                   </div>
                  </div>
                )}

                {modalCertificadoDados && (
                  <div style={overlayPerfilStyle}>
                    <div style={modalPerfilStyle}>
                      <button onClick={() => setModalCertificadoDados(false)} style={fecharPerfilStyle}>×</button>
                      <h4 style={{ marginBottom: 16, fontSize: 14 }}>Selecione os dados que deseja no certificado:</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                        {[{ id: 'assinatura', label: 'Assinatura Service Line' }, { id: 'data', label: 'Data' }, { id: 'logotipo', label: 'Logótipo' }].map(opt => (
                          <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                            <input type="checkbox" checked={itensCertificado.includes(opt.id)} onChange={() => toggleItemCertificado(opt.id)} />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button onClick={() => setModalCertificadoDados(false)} style={btnCancelarPerfilStyle}>Cancelar</button>
                        <button onClick={() => { setModalCertificadoDados(false); setConfirmacaoExport('certificado') }} style={btnPerfilStyle}>Exportar</button>
                      </div>
                    </div>
                  </div>
                )}

                {confirmacaoExport && (
                  <div style={overlayPerfilStyle}>
                    <div style={{ ...modalPerfilStyle, maxWidth: 340 }}>
                      <button onClick={() => setConfirmacaoExport(null)} style={fecharPerfilStyle}>×</button>
                      <h4 style={{ marginBottom: 20, fontSize: 14 }}>
                        Tem a certeza que deseja exportar {confirmacaoExport === 'certificado' ? 'o certificado' : 'a assinatura'}?
                      </h4>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button onClick={() => setConfirmacaoExport(null)} style={btnCancelarPerfilStyle}>Cancelar</button>
                        <button
                          onClick={confirmacaoExport === 'certificado' ? executarExportacaoCertificado : executarExportacaoAssinatura}
                          style={btnPerfilStyle}
                        >
                          Exportar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

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

              </div>
            </main>
          </div>

        </div>
      </div>
    </div>

  )
}

const btnPerfilStyle = { background: '#39639C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }
const btnCancelarPerfilStyle = { background: '#fff', color: '#333', border: '1px solid #ddd', borderRadius: 6, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }
const overlayPerfilStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
const modalPerfilStyle = { background: '#fff', borderRadius: 14, padding: 28, width: '90%', maxWidth: 420, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', position: 'relative' }
const fecharPerfilStyle = { position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }