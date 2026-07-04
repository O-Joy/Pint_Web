import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LayoutTM from './components/LayoutTM'
import api from '../../services/api'
import { FiSearch, FiEye, FiCalendar, FiDownload, FiCheckCircle } from 'react-icons/fi'
import { MdMilitaryTech, MdPerson } from 'react-icons/md'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const formatarData = (data) => data ? new Date(data).toLocaleDateString('pt-PT') : '-'

export default function Consultores() {
  const navigate = useNavigate()
  const [consultores, setConsultores] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [filtroArea, setFiltroArea] = useState('todas')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [toast, setToast] = useState(null)
  const mostrarToast = (titulo, subtitulo = '') => {
   setToast({ titulo, subtitulo })
   setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    api.get('/tm/consultores')
      .then(res => setConsultores(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error('[Consultores TM]', err.response?.data || err.message))
      .finally(() => setLoading(false))
  }, [])

  const areas = [...new Set(consultores.map(c => c.nomeArea).filter(Boolean))]

  const filtrados = consultores.filter(c => {
    const termo = filtro.toLowerCase()
    const matchTexto = !termo || c.nome?.toLowerCase().includes(termo) || c.email?.toLowerCase().includes(termo)
    const matchArea = filtroArea === 'todas' || c.nomeArea === filtroArea
    let matchData = true
    if (c.ultimaAtividade && (dataInicio || dataFim)) {
      const d = new Date(c.ultimaAtividade)
      if (dataInicio) matchData = matchData && d >= new Date(dataInicio)
      if (dataFim) matchData = matchData && d <= new Date(dataFim + 'T23:59:59')
    } else if (!c.ultimaAtividade && (dataInicio || dataFim)) {
      matchData = false
    }
    return matchTexto && matchArea && matchData
  })

  const totalBadges = consultores.reduce((acc, c) => acc + (c.totalBadges || 0), 0)
  const totalPontos = consultores.reduce((acc, c) => acc + (c.totalPontos || 0), 0)

  const exportarExcel = () => {
    const dados = filtrados.map(c => ({
      'Nome': c.nome, 'Email': c.email, 'Área': c.nomeArea, 'Service Line': c.nomeServiceLine,
      'Badges Obtidos': c.totalBadges, 'Badges Em Processo': c.badgesEmProcesso,
      'Pontos Totais': c.totalPontos, 'Última Atividade': formatarData(c.ultimaAtividade),
    }))
    const ws = XLSX.utils.json_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Consultores')
    XLSX.writeFile(wb, 'consultores.xlsx')
    mostrarToast('Os dados foram exportados com sucesso!', 'consultores.xlsx')
  }

  const exportarPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Consultores', 14, 15)
    autoTable(doc, {
      startY: 25,
      head: [['Nome', 'Área', 'Service Line', 'Badges Obtidos', 'Em Processo', 'Pontos', 'Últ. Atividade']],
      body: filtrados.map(c => [c.nome, c.nomeArea || '-', c.nomeServiceLine || '-', c.totalBadges, c.badgesEmProcesso, c.totalPontos, formatarData(c.ultimaAtividade)]),
      styles: { fontSize: 9 }, headStyles: { fillColor: [57, 99, 156] },
    })
    doc.save('consultores.pdf')
    mostrarToast('Os dados foram exportados com sucesso!', 'consultores.pdf')
  }

  const CARTOES = [
    { label: 'Consultores', valor: consultores.length, icon: <MdPerson /> },
    { label: 'Badges Atribuídos', valor: totalBadges, icon: <MdMilitaryTech /> },
    { label: 'Pontos Acumulados', valor: totalPontos, icon: <MdMilitaryTech /> },
  ]

  return (
    <LayoutTM>
      <div style={{ fontFamily: 'Poppins, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <h2 style={{ color: '#39639C', fontWeight: 700, marginBottom: 2 }}>Consultores</h2>
            <p style={{ color: '#6b7280', fontSize: 13 }}>{consultores.length} pedidos</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={exportarExcel} style={btnStyle}><FiDownload /> Exportar Excel</button>
            <button onClick={exportarPDF} style={btnStyle}><FiDownload /> Exportar PDF</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, margin: '20px 0 24px' }}>
          {CARTOES.map((c, i) => (
            <div key={i} style={cardKpiStyle}>
              <div style={iconeKpiStyle}>{c.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>{c.valor}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{c.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 2, minWidth: 220 }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
            <input placeholder="Pesquisar Consultor, Badge, Requisito..." value={filtro} onChange={e => setFiltro(e.target.value)}
              style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <select value={filtroArea} onChange={e => setFiltroArea(e.target.value)} style={inputStyle}>
            <option value="todas">Todas as áreas</option>
            {areas.map((a, i) => <option key={i} value={a}>{a}</option>)}
          </select>
          <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={inputStyle} />
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#aaa', padding: 20 }}>A carregar...</p>
          ) : filtrados.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#aaa', padding: 20 }}>Nenhum consultor encontrado.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  {['Consultor', 'Área', 'Service Line', 'Badges Obtidos', 'Badges Em Processo', 'Pontos Totais', 'Última Atividade', 'Ações'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(c => (
                  <tr key={c.idUtilizador} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 500 }}>{c.nome}</div>
                      <div style={{ color: '#6b7280', fontSize: 11 }}>{c.email}</div>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#6b7280' }}>{c.nomeArea || '-'}</td>
                    <td style={{ padding: '10px 12px', color: '#6b7280' }}>{c.nomeServiceLine || '-'}</td>
                    <td style={{ padding: '10px 12px' }}>{c.totalBadges}</td>
                    <td style={{ padding: '10px 12px' }}>{c.badgesEmProcesso}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#39639C' }}>{c.totalPontos}</td>
                    <td style={{ padding: '10px 12px', color: '#6b7280', whiteSpace: 'nowrap' }}>{formatarData(c.ultimaAtividade)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <FiEye role="button" title="Ver perfil" onClick={() => navigate(`/talent/consultores/${c.idUtilizador}`)} color="#39639C" style={{ cursor: 'pointer' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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

const btnStyle = { background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '8px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }
const inputStyle = { padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, outline: 'none', color: '#555' }
const cardKpiStyle = { background: '#fff', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }
const iconeKpiStyle = { width: 44, height: 44, borderRadius: 12, background: '#e8f0fb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#39639C', fontSize: 20, flexShrink: 0 }