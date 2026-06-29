// src/views/serviceline/Consultores.jsx
import { useState, useEffect } from 'react'
import LayoutSL from './components/LayoutSL'
import api from '../../services/api'
import { FiDownload, FiSearch } from 'react-icons/fi'
import { MdMilitaryTech, MdPerson } from 'react-icons/md'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const corMedalha = (posicao) => {
  if (posicao === 1) return '#f0b429' // ouro
  if (posicao === 2) return '#b0b0b0' // prata
  if (posicao === 3) return '#a0522d' // bronze
  return '#cbd5e1'
}

export default function Consultores() {
  const [consultores, setConsultores] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [filtroArea, setFiltroArea] = useState('todas')

    useEffect(() => {
    api.get('/sl/consultores')
        .then(res => {
        console.log('[Consultores] resposta:', res.status, res.data)
        setConsultores(Array.isArray(res.data) ? res.data : [])
        })
        .catch(err => {
        console.error('[Consultores] ERRO:', err.response?.status, err.response?.data || err.message)
        })
        .finally(() => setLoading(false))
    }, [])

  // a API já devolve ordenado por pontos (desc) — a posição vem do índice original
  const ranking = consultores.map((c, i) => ({ ...c, posicao: i + 1 }))

  const areas = [...new Set(ranking.map(c => c.nomeArea).filter(Boolean))]

  const filtrados = ranking.filter(c => {
    const matchNome = c.nome?.toLowerCase().includes(filtro.toLowerCase())
    const matchArea = filtroArea === 'todas' || c.nomeArea === filtroArea
    return matchNome && matchArea
  })

  const totalBadges = consultores.reduce((acc, c) => acc + (c.totalBadges || 0), 0)
  const totalPontos = consultores.reduce((acc, c) => acc + (c.totalPontos || 0), 0)

  const exportarExcel = () => {
    const dados = filtrados.map(c => ({
      'Posição': c.posicao,
      'Nome': c.nome,
      'Email': c.email,
      'Área': c.nomeArea,
      'Badges': c.totalBadges,
      'Pontos': c.totalPontos,
    }))
    const ws = XLSX.utils.json_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Consultores')
    XLSX.writeFile(wb, 'consultores.xlsx')
  }

  const exportarPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Consultores - Service Line', 14, 15)
    autoTable(doc, {
      startY: 25,
      head: [['#', 'Nome', 'Área', 'Badges', 'Pontos']],
      body: filtrados.map(c => [c.posicao, c.nome, c.nomeArea || '-', c.totalBadges, c.totalPontos]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [57, 99, 156] },
    })
    doc.save('consultores.pdf')
  }

  return (
    <LayoutSL>
      <div style={{ fontFamily: 'Poppins, sans-serif' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <h2 style={{ color: '#39639C', fontWeight: 700, marginBottom: 2 }}>Consultores</h2>
            <p style={{ color: '#6b7280', fontSize: 13 }}>{consultores.length} consultores na sua Service Line</p>
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

        {/* ── Resumo ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, margin: '20px 0 28px' }}>
          {[
            { label: 'Consultores', valor: consultores.length, icon: <MdPerson style={{ color: '#39639C', fontSize: 22 }} /> },
            { label: 'Badges Atribuídos', valor: totalBadges, icon: <MdMilitaryTech style={{ color: '#39639C', fontSize: 22 }} /> },
            { label: 'Pontos Acumulados', valor: totalPontos, icon: <MdMilitaryTech style={{ color: '#39639C', fontSize: 22 }} /> },
          ].map((c, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 16, padding: '20px 24px',
              display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: '#e8f0fb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, color: '#39639C', flexShrink: 0,
              }}>
                {c.icon}
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>{c.valor}</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{c.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Pesquisa e filtro ── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 2, minWidth: 200 }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
            <input
              placeholder="Pesquisar consultor..."
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, outline: 'none' }}
            />
          </div>
          <select value={filtroArea} onChange={e => setFiltroArea(e.target.value)}
            style={{ flex: 1, minWidth: 150, padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, outline: 'none', color: '#555' }}>
            <option value="todas">Todas as áreas</option>
            {areas.map((a, i) => <option key={i} value={a}>{a}</option>)}
          </select>
        </div>

        {/* ── Tabela de ranking ── */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#aaa' }}>A carregar...</p>
          ) : filtrados.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#aaa' }}>Nenhum consultor encontrado.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                    {['#', 'Consultor', 'Área', 'Badges', 'Pontos'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((c) => (
                    <tr key={c.idUtilizador} style={{ borderBottom: '1px solid #f9f9f9' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: corMedalha(c.posicao), color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700,
                        }}>
                          {c.posicao}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%', background: '#e8f0fb',
                            color: '#39639C', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700, flexShrink: 0,
                          }}>
                            {c.nome?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, color: '#333' }}>{c.nome}</div>
                            <div style={{ fontSize: 11, color: '#aaa' }}>{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#6b7280' }}>{c.nomeArea || '-'}</td>
                      <td style={{ padding: '10px 12px' }}>{c.totalBadges}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#39639C' }}>{c.totalPontos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </LayoutSL>
  )
}