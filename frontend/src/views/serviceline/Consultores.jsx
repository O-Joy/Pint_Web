// src/views/serviceline/Consultores.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LayoutSL from './components/LayoutSL'
import api from '../../services/api'
import Footer from '../../components/Footer'
import { FiSearch, FiEye, FiCalendar } from 'react-icons/fi'
import { MdMilitaryTech, MdPerson } from 'react-icons/md'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const formatarData = (data) => {
  if (!data) return '-'
  return new Date(data).toLocaleDateString('pt-PT')
}

export default function Consultores() {
  const navigate = useNavigate()
  const [consultores, setConsultores] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [filtroArea, setFiltroArea] = useState('todas')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  useEffect(() => {
    api.get('/sl/consultores')
      .then(res => setConsultores(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error('[Consultores] ERRO:', err.response?.status, err.response?.data || err.message))
      .finally(() => setLoading(false))
  }, [])

  const ranking = consultores.map((c, i) => ({ ...c, posicao: i + 1 }))
  const areas = [...new Set(ranking.map(c => c.nomeArea).filter(Boolean))]

  const filtrados = ranking.filter(c => {
    const termo = filtro.toLowerCase()
    const matchTexto = !termo || c.nome?.toLowerCase().includes(termo) || c.email?.toLowerCase().includes(termo)
    const matchArea = filtroArea === 'todas' || c.nomeArea === filtroArea

    let matchData = true
    if (c.ultimaAtividade && (dataInicio || dataFim)) {
      const dAtiv = new Date(c.ultimaAtividade)
      if (dataInicio) matchData = matchData && dAtiv >= new Date(dataInicio)
      if (dataFim)    matchData = matchData && dAtiv <= new Date(dataFim + 'T23:59:59')
    } else if (!c.ultimaAtividade && (dataInicio || dataFim)) {
      matchData = false
    }

    return matchTexto && matchArea && matchData
  })

  const totalBadges = consultores.reduce((acc, c) => acc + (c.totalBadges || 0), 0)
  const totalPontos = consultores.reduce((acc, c) => acc + (c.totalPontos || 0), 0)

  const exportarExcel = () => {
    const dados = filtrados.map(c => ({
      'Posição': c.posicao, 'Nome': c.nome, 'Email': c.email, 'Área': c.nomeArea,
      'Service Line': c.nomeServiceLine, 'Badges Obtidos': c.totalBadges,
      'Badges Em Processo': c.badgesEmProcesso, 'Pontos Totais': c.totalPontos,
      'Última Atividade': formatarData(c.ultimaAtividade),
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
      head: [['#', 'Nome', 'Área', 'Service Line', 'Badges Obtidos', 'Em Processo', 'Pontos', 'Últ. Atividade']],
      body: filtrados.map(c => [
        c.posicao, c.nome, c.nomeArea || '-', c.nomeServiceLine || '-',
        c.totalBadges, c.badgesEmProcesso, c.totalPontos, formatarData(c.ultimaAtividade),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [57, 99, 156] },
    })
    doc.save('consultores.pdf')
  }

  const CARTOES = [
    { label: 'Consultores', valor: consultores.length, icon: <MdPerson /> },
    { label: 'Badges Atribuídos', valor: totalBadges, icon: <MdMilitaryTech /> },
    { label: 'Pontos Acumulados', valor: totalPontos, icon: <MdMilitaryTech /> },
  ]

  return (
    <LayoutSL>
      <div style={{ fontFamily: 'Poppins, sans-serif' }}>

        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-1">
          <div>
            <h2 className="fw-bold mb-0 text-primary" style={{ fontSize: 22 }}>Consultores</h2>
            <p className="text-secondary small mb-0">{consultores.length} consultores na sua Service Line</p>
          </div>
          <div className="d-flex gap-2">
            <button onClick={exportarExcel} className="btn btn-outline-primary btn-sm">Exportar Excel</button>
            <button onClick={exportarPDF} className="btn btn-outline-primary btn-sm">Exportar PDF</button>
          </div>
        </div>

        {/* ── Resumo ── */}
        <div className="row g-3" style={{ margin: '20px 0 28px' }}>
          {CARTOES.map((c, i) => (
            <div key={i} className="col-12 col-md-4">
              <div className="card h-100">
                <div className="card-body d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0 text-primary"
                    style={{ width: 44, height: 44, background: '#e8f0fb', fontSize: 20 }}>
                    {c.icon}
                  </div>
                  <div>
                    <div className="fw-bold fs-4 lh-1" style={{ color: '#1a1a2e' }}>{c.valor}</div>
                    <div className="text-secondary small mt-1">{c.label}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Pesquisa, filtro de área e período ── */}
        <div className="row g-2 mb-3">
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text"><FiSearch className="text-secondary" /></span>
              <input
                type="text"
                className="form-control"
                placeholder="Pesquisar Consultor..."
                value={filtro}
                onChange={e => setFiltro(e.target.value)}
              />
            </div>
          </div>
          <div className="col-6 col-md-3">
            <select className="form-select" value={filtroArea} onChange={e => setFiltroArea(e.target.value)}>
              <option value="todas">Todas as áreas</option>
              {areas.map((a, i) => <option key={i} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-4">
            <div className="input-group">
              <span className="input-group-text"><FiCalendar className="text-secondary" /></span>
              <input type="date" className="form-control" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
              <span className="input-group-text">–</span>
              <input type="date" className="form-control" value={dataFim} onChange={e => setDataFim(e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Tabela de consultores ── */}
        <div className="card">
          <div className="card-body">
            {loading ? (
              <p className="text-center text-secondary mb-0">A carregar...</p>
            ) : filtrados.length === 0 ? (
              <p className="text-center text-secondary mb-0">Nenhum consultor encontrado.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Consultor</th>
                      <th>Área</th>
                      <th>Service Line</th>
                      <th>Badges Obtidos</th>
                      <th>Badges Em Processo</th>
                      <th>Pontos Totais</th>
                      <th>Última Atividade</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((c) => (
                      <tr key={c.idUtilizador}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 fw-bold text-primary"
                              style={{ width: 30, height: 30, background: '#e8f0fb', fontSize: 12 }}>
                              {c.nome?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="fw-medium">{c.nome}</div>
                              <div className="text-secondary small">{c.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-secondary">{c.nomeArea || '-'}</td>
                        <td className="text-secondary">{c.nomeServiceLine || '-'}</td>
                        <td>{c.totalBadges}</td>
                        <td>{c.badgesEmProcesso}</td>
                        <td className="fw-bold text-primary">{c.totalPontos}</td>
                        <td className="text-secondary text-nowrap">{formatarData(c.ultimaAtividade)}</td>
                        <td>
                          <FiEye
                            role="button"
                            title="Ver perfil"
                            onClick={() => navigate(`/serviceline/consultores/${c.idUtilizador}`)}
                            className="text-primary"
                            style={{ fontSize: 16 }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </LayoutSL>
  )
}
