import { useState, useEffect } from 'react'
import LayoutTM from './components/LayoutTM'
import api from '../../services/api'
import { FiDownload, FiSearch } from 'react-icons/fi'
import { FaBolt } from 'react-icons/fa'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import CardBadge from '../../components/CardBadge'

const coresNivel = {
  'Júnior': { bg: '#FFF3E0', color: '#F57C00' },
  'Intermédio': { bg: '#FCE4EC', color: '#E91E63' },
  'Sénior': { bg: '#E3F2FD', color: '#1E88E5' },
  'Especialista': { bg: '#F3E5F5', color: '#8E24AA' },
  'Lider': { bg: '#E8F5E9', color: '#43A047' },
}

export default function Badges() {
  const [badges, setBadges] = useState([])
  const [badgesEspeciais, setBadgesEspeciais] = useState([])
  const [filtro, setFiltro] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroSL, setFiltroSL] = useState('todas')
  const [servicelines, setServicelines] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)
  const porPagina = 8
  const [historico, setHistorico] = useState([])
  const [tabHistorico, setTabHistorico] = useState('TODOS')


  useEffect(() => {
    api.get('/catalogo/todos').then(res => {
      const regulares = Array.isArray(res.data.regulares) ? res.data.regulares : []
      const especiais = Array.isArray(res.data.especiais) ? res.data.especiais : []
      
      setBadges(regulares)
      setBadgesEspeciais(especiais)
      
      const sls = [...new Set(regulares.map(b => b.nomeServiceLine).filter(Boolean))]
      setServicelines(sls)
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
      }

      const exportarPDF = () => {
        const doc = new jsPDF()
        doc.setFontSize(16)
        doc.text('Catálogo de Badges', 14, 15)
        autoTable(doc, {
          startY: 25,
          head: [['Nome', 'Nível', 'Área', 'Service Line', 'Pontos']],
          body: badges.map(b => [
            b.nome,
            b.nomeNivel || '-',
            b.nomeArea || '-',
            b.nomeServiceLine || '-',
            b.pontos,
          ]),
          styles: { fontSize: 10 },
          headStyles: { fillColor: [57, 99, 156] },
        })
        doc.save('badges.pdf')
      }

  const badgesFiltrados = (filtroTipo === 'especial' ? [] : badges).filter(b => {
  const matchFiltro = b.nome?.toLowerCase().includes(filtro.toLowerCase())
  const matchSL = filtroSL === 'todas' || b.nomeServiceLine === filtroSL
  return matchFiltro && matchSL
})

const especiaisVisiveis = (filtroTipo === 'regular' ? [] : badgesEspeciais).filter(b =>
  b.nome?.toLowerCase().includes(filtro.toLowerCase())
)

  const totalPaginas = Math.ceil(badgesFiltrados.length / porPagina)
  const badgesPagina = badgesFiltrados.slice((pagina - 1) * porPagina, pagina * porPagina)

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
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#aaa' }}>A carregar...</p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              {badgesPagina.map((b, i) => <CardBadge key={i} b={b} />)}
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
              {especiaisVisiveis.map((b, i) => <CardBadge key={i} b={b} especial />)}
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
    </LayoutTM>
  )
}