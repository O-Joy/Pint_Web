import { useState, useEffect } from 'react'
import LayoutTM from './components/LayoutTM'
import api from '../../services/api'
import { FiDownload, FiSearch, FiChevronDown, FiChevronUp, FiFlag, FiCheckCircle } from 'react-icons/fi'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import CardBadge from '../../components/CardBadge'

// >30 dias = válido, <=30 e >7 = a expirar, <=7 = expiração iminente
function estadoValidade(validadeDias) {
  if (validadeDias == null) return 'valido'
  if (validadeDias <= 7) return 'iminente'
  if (validadeDias <= 30) return 'expirar'
  return 'valido'
}

const CORES_ESTADO = {
  valido: { cor: '#06A120', label: 'Válido' },
  expirar: { cor: '#F57C00', label: 'A expirar' },
  iminente: { cor: '#AE0003', label: 'Expiração Iminente' },
}

function FiltroDropdown({ label, opcoes, valor, onChange }) {
  const [aberto, setAberto] = useState(false)
  const opcaoAtual = opcoes.find(o => o.value === valor)

  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 150 }}>
      <button
        onClick={() => setAberto(!aberto)}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd',
          background: '#fff', fontSize: 13, color: '#555', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {opcaoAtual?.cor && <span style={{ width: 8, height: 8, borderRadius: '50%', background: opcaoAtual.cor }} />}
          {opcaoAtual?.label || label}
        </span>
        {aberto ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
      </button>

      {aberto && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, right: 0, background: '#fff',
          border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
          zIndex: 50, maxHeight: 240, overflowY: 'auto',
        }}>
          {opcoes.map(o => (
            <div
              key={o.value}
              onClick={() => { onChange(o.value); setAberto(false) }}
              style={{
                padding: '10px 14px', fontSize: 13, cursor: 'pointer',
                background: valor === o.value ? '#eef3fa' : '#fff',
                display: 'flex', alignItems: 'center', gap: 8,
                color: valor === o.value ? '#39639C' : '#333',
                fontWeight: valor === o.value ? 600 : 400,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f5f7fa'}
              onMouseLeave={e => e.currentTarget.style.background = valor === o.value ? '#eef3fa' : '#fff'}
            >
              {o.cor && <span style={{ width: 8, height: 8, borderRadius: '50%', background: o.cor, flexShrink: 0 }} />}
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RequisitoDropdown({ requisito }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div style={{ background: '#f9fafb', border: '1px solid #eee', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
      <button onClick={() => setAberto(!aberto)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 22, height: 22, borderRadius: 6, background: '#AE0003',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <FiFlag color="#fff" size={12} />
          </span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{requisito.nome}</span>
        </div>
        {aberto ? <FiChevronUp size={14} color="#6b7280" /> : <FiChevronDown size={14} color="#6b7280" />}
      </button>
      {aberto && (
        <div style={{ padding: '0 14px 12px 46px', fontSize: 12, color: '#6b7280' }}>
          {requisito.codigo && (
            <p style={{ marginBottom: 6 }}>
              <strong style={{ color: '#333' }}>Código do Requisito:</strong> {requisito.codigo}
            </p>
          )}
          {requisito.descricao || 'Sem descrição adicional.'}
        </div>
      )}
    </div>
  )
}

export default function Badges() {
  const [badges, setBadges] = useState([])
  const [badgesEspeciais, setBadgesEspeciais] = useState([])
  const [requisitos, setRequisitos] = useState([])
  const [filtro, setFiltro] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroSL, setFiltroSL] = useState('todas')
  const [filtroNivel, setFiltroNivel] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [servicelines, setServicelines] = useState([])
  const [niveis, setNiveis] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)
  const porPagina = 8
  const [historico, setHistorico] = useState([])
  const [tabHistorico, setTabHistorico] = useState('TODOS')
  const [badgeSelecionado, setBadgeSelecionado] = useState(null)
  const [toast, setToast] = useState(null)
  const mostrarToast = (titulo, subtitulo = '') => {
   setToast({ titulo, subtitulo })
   setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    api.get('/catalogo/todos').then(res => {
      const regulares = Array.isArray(res.data.regulares) ? res.data.regulares : []
      const especiais = Array.isArray(res.data.especiais) ? res.data.especiais : []
      const reqs = Array.isArray(res.data.requisitos) ? res.data.requisitos : []

      setBadges(regulares)
      setBadgesEspeciais(especiais)
      setRequisitos(reqs)

      setServicelines([...new Set(regulares.map(b => b.nomeServiceLine).filter(Boolean))])
      setNiveis([...new Set(regulares.map(b => b.nomeNivel).filter(Boolean))])
    }).catch(() => {}).finally(() => setLoading(false))

    api.get('/tm/historico-badges').then(res => {
      setHistorico(Array.isArray(res.data) ? res.data : [])
    }).catch(() => {})
  }, [])

  const exportarExcel = () => {
    const dados = badges.map(b => ({
      'Nome': b.nome,
      'Nível': b.nomeNivel || '-',
      'Área': b.nomeArea || '-',
      'Service Line': b.nomeServiceLine || '-',
      'Pontos': b.pontos,
      'Validade (dias)': b.validadeDias || '-',
    }))
    const ws = XLSX.utils.json_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Badges')
    XLSX.writeFile(wb, 'badges.xlsx')
    mostrarToast('Os dados foram exportados com sucesso!', 'badges.xlsx')
  }

  const exportarPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Catálogo de Badges', 14, 15)
    autoTable(doc, {
      startY: 25,
      head: [['Nome', 'Nível', 'Área', 'Service Line', 'Pontos']],
      body: badges.map(b => [b.nome, b.nomeNivel || '-', b.nomeArea || '-', b.nomeServiceLine || '-', b.pontos]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [57, 99, 156] },
    })
    doc.save('badges.pdf')
    mostrarToast('Os dados foram exportados com sucesso!', 'badges.pdf')
  }

  const badgesFiltrados = (filtroTipo === 'especial' ? [] : badges).filter(b => {
    const matchFiltro = b.nome?.toLowerCase().includes(filtro.toLowerCase())
    const matchSL = filtroSL === 'todas' || b.nomeServiceLine === filtroSL
    const matchNivel = filtroNivel === 'todos' || b.nomeNivel === filtroNivel
    const matchEstado = filtroEstado === 'todos' || estadoValidade(b.validadeDias) === filtroEstado
    return matchFiltro && matchSL && matchNivel && matchEstado
  })

  const especiaisVisiveis = (filtroTipo === 'regular' ? [] : badgesEspeciais).filter(b => {
    const matchFiltro = b.nome?.toLowerCase().includes(filtro.toLowerCase())
    const matchEstado = filtroEstado === 'todos' || estadoValidade(b.validadeDias) === filtroEstado
    return matchFiltro && matchEstado
  })

  const totalPaginas = Math.ceil(badgesFiltrados.length / porPagina)
  const badgesPagina = badgesFiltrados.slice((pagina - 1) * porPagina, pagina * porPagina)

  const requisitosBadge = badgeSelecionado
    ? requisitos.filter(r => r.idBadgeRegular === badgeSelecionado.id)
    : []

  const estadoBadgeSelecionado = badgeSelecionado ? estadoValidade(badgeSelecionado.validadeDias) : 'valido'

  return (
    <LayoutTM>
      <div style={{ fontFamily: 'Poppins, sans-serif' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <h2 style={{ color: '#39639C', fontWeight: 700, marginBottom: 2 }}>Badges</h2>
            <p style={{ color: '#6b7280', fontSize: 13 }}>{badges.length + badgesEspeciais.length} badges disponíveis</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={exportarExcel} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '8px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiDownload /> Exportar Excel
            </button>
            <button onClick={exportarPDF} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '8px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiDownload /> Exportar PDF
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 2, minWidth: 200 }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
            <input
              placeholder="Pesquisar badges..."
              value={filtro}
              onChange={e => { setFiltro(e.target.value); setPagina(1) }}
              style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, outline: 'none' }}
            />
          </div>

          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
            style={{ flex: 1, minWidth: 150, padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, outline: 'none', color: '#555' }}>
            <option value="todos">Todos os badges</option>
            <option value="regular">Regulares</option>
            <option value="especial">Especiais</option>
          </select>

          <select value={filtroSL} onChange={e => setFiltroSL(e.target.value)}
            style={{ flex: 1, minWidth: 150, padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, outline: 'none', color: '#555' }}>
            <option value="todas">Todas Service Lines</option>
            {servicelines.map((sl, i) => <option key={i} value={sl}>{sl}</option>)}
          </select>

          <FiltroDropdown
            label="Nível - Todos"
            valor={filtroNivel}
            onChange={v => { setFiltroNivel(v); setPagina(1) }}
            opcoes={[{ value: 'todos', label: 'Todos' }, ...niveis.map(n => ({ value: n, label: n }))]}
          />

          <FiltroDropdown
            label="Estado - Todos"
            valor={filtroEstado}
            onChange={v => { setFiltroEstado(v); setPagina(1) }}
            opcoes={[
              { value: 'todos', label: 'Todos os badges' },
              { value: 'valido', label: 'Válido', cor: CORES_ESTADO.valido.cor },
              { value: 'expirar', label: 'A expirar', cor: CORES_ESTADO.expirar.cor },
              { value: 'iminente', label: 'Expiração Iminente', cor: CORES_ESTADO.iminente.cor },
            ]}
          />
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#aaa' }}>A carregar...</p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              {badgesPagina.map((b, i) => (
                <CardBadge key={i} b={b} onInfo={() => setBadgeSelecionado({ ...b, especial: false })} />
              ))}
            </div>

            {totalPaginas > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
                <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 13 }}>
                  Anterior
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => (
                  <button key={i} onClick={() => setPagina(i + 1)}
                    style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #ddd', background: pagina === i + 1 ? '#39639C' : '#fff', color: pagina === i + 1 ? '#fff' : '#333', cursor: 'pointer', fontSize: 13 }}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 13 }}>
                  Seguinte
                </button>
              </div>
            )}

            {especiaisVisiveis.length > 0 && (
              <>
                <h3 style={{ color: '#39639C', fontWeight: 700, marginBottom: 4 }}>Badges Especiais</h3>
                <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>{especiaisVisiveis.length} badges especiais</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                  {especiaisVisiveis.map((b, i) => (
                    <CardBadge key={i} b={b} especial onInfo={() => setBadgeSelecionado({ ...b, especial: true })} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ color: '#39639C', fontWeight: 700, margin: 0 }}>Histórico</h3>
            <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 10, padding: 4 }}>
              {['TODOS', 'OBTIDOS', 'EM PROCESSO'].map(tab => (
                <button key={tab} onClick={() => setTabHistorico(tab)} style={{
                  padding: '6px 16px', borderRadius: 8, border: 'none', fontSize: 12,
                  cursor: 'pointer', fontWeight: 600,
                  background: tabHistorico === tab ? '#fff' : 'transparent',
                  color: tabHistorico === tab ? '#39639C' : '#6b7280',
                  boxShadow: tabHistorico === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}>{tab}</button>
              ))}
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                {['Badge', 'Área', 'Nível', 'Consultor', 'Estado'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historico
                .filter(h => tabHistorico === 'TODOS' ||
                  (tabHistorico === 'OBTIDOS' && h.estado === 'Obtido') ||
                  (tabHistorico === 'EM PROCESSO' && h.estado === 'Em Processo'))
                .map((h, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td style={{ padding: '10px 12px' }}>{h.nomeBadge}</td>
                    <td style={{ padding: '10px 12px', color: '#6b7280' }}>{h.nomeArea}</td>
                    <td style={{ padding: '10px 12px', color: '#6b7280' }}>{h.nomeNivel}</td>
                    <td style={{ padding: '10px 12px' }}>{h.nomeConsultor}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        background: h.estado === 'Obtido' ? '#e8f5e9' : '#e8f0fb',
                        color: h.estado === 'Obtido' ? '#06A120' : '#39639C',
                        borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                      }}>{h.estado}</span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {badgeSelecionado && !badgeSelecionado.especial && (
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, maxWidth: 480 }}>
            <button onClick={() => setBadgeSelecionado(null)} style={fecharStyle}>×</button>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ width: 70, height: 70, borderRadius: 12, background: '#e8f0fb', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ color: '#1a1a2e', margin: 0 }}>{badgeSelecionado.nome}</h4>
                  {badgeSelecionado.nomeNivel && (
                    <span style={{ background: '#FFF3E0', color: '#F57C00', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                      {badgeSelecionado.nomeNivel}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6, lineHeight: 1.5 }}>{badgeSelecionado.descricao}</p>
              </div>
            </div>

            {badgeSelecionado.nomeServiceLine && (
              <p style={{ fontSize: 13, color: '#333', marginBottom: 4 }}>
                {badgeSelecionado.nomeArea} · {badgeSelecionado.nomeServiceLine}
              </p>
            )}

            <h5 style={{ color: '#39639C', marginBottom: 10 }}>Requisitos</h5>
            {requisitosBadge.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: 13 }}>Sem requisitos definidos</p>
            ) : requisitosBadge.map((r, i) => (
              <RequisitoDropdown key={i} requisito={r} />
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                {badgeSelecionado.validadeDias
                  ? `Expira em: ${badgeSelecionado.validadeDias} dia${badgeSelecionado.validadeDias === 1 ? '' : 's'}`
                  : 'Sem expiração'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#11a9d6', fontWeight: 700, fontSize: 14 }}>
                  ⚡ {badgeSelecionado.pontos} pontos
                </span>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: CORES_ESTADO[estadoBadgeSelecionado].cor }} title={CORES_ESTADO[estadoBadgeSelecionado].label} />
              </div>
            </div>
          </div>
        </div>
      )}

      {badgeSelecionado && badgeSelecionado.especial && (
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, maxWidth: 480 }}>
            <button onClick={() => setBadgeSelecionado(null)} style={fecharStyle}>×</button>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ width: 70, height: 70, borderRadius: 12, background: '#e8f0fb', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ color: '#1a1a2e', margin: 0 }}>{badgeSelecionado.nome}</h4>
                  <span style={{ background: '#FFF3E0', color: '#F57C00', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                    Especial
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6, lineHeight: 1.5 }}>{badgeSelecionado.descricao}</p>
              </div>
            </div>

            <span style={{ fontSize: 12, color: '#6b7280' }}>
              {badgeSelecionado.validadeDias
                ? `Expira em: ${badgeSelecionado.validadeDias} dia${badgeSelecionado.validadeDias === 1 ? '' : 's'}`
                : 'Sem expiração'}
            </span>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#11a9d6', fontWeight: 700, fontSize: 14 }}>
                ⚡ {badgeSelecionado.pontos} pontos
              </span>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: CORES_ESTADO[estadoBadgeSelecionado].cor }} title={CORES_ESTADO[estadoBadgeSelecionado].label} />
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
    </LayoutTM>
  )
}

const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
const modalStyle = { background: '#fff', borderRadius: 14, padding: 28, width: '90%', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', position: 'relative', maxHeight: '85vh', overflowY: 'auto' }
const fecharStyle = { position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }