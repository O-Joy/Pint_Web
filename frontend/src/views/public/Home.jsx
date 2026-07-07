// src/views/public/Home.jsx
import { useState, useEffect } from 'react'
import PublicLayout from '../../components/PublicLayout'
import CardBadgePublico from '../../components/CardBadgePublico'
import CardConsultorPublico from '../../components/CardConsultorPublico'
import api from '../../services/api'
import { FiSearch } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export default function PublicHome() {
  const [destaques, setDestaques] = useState([])
  const [recentes, setRecentes] = useState([])
  const [loading, setLoading] = useState(true)
  const [pesquisa, setPesquisa] = useState('')
  const [selecionado, setSelecionado] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/public/destaques'),
      api.get('/public/recentes'),
    ]).then(([d, r]) => {
      setDestaques(Array.isArray(d.data) ? d.data : [])
      setRecentes(Array.isArray(r.data) ? r.data : [])
    }).catch(err => console.error('[PublicHome] ERRO:', err.response?.data || err.message))
      .finally(() => setLoading(false))
  }, [])

  function pesquisarEIr(e) {
    e.preventDefault()
    window.location.href = `/explorar?q=${encodeURIComponent(pesquisa)}`
  }

  return (
    <PublicLayout>
      {/* ── Hero ── */}
      <div className="text-center py-5 px-3">
        <h1 className="fw-bold text-primary mb-2" style={{ fontSize: 32 }}>Galeria Pública de Badges</h1>
        <p className="mb-4" style={{ fontSize: 15 }}>
          <span className="text-primary fw-semibold">Descubra e Verifique</span>
          <span className="text-secondary"> os nossos Badges</span>
        </p>
        <form onSubmit={pesquisarEIr} className="mx-auto" style={{ maxWidth: 480 }}>
          <div className="input-group">
            <span className="input-group-text"><FiSearch className="text-secondary" /></span>
            <input
              className="form-control"
              placeholder="Pesquisar badges, consultores..."
              value={pesquisa}
              onChange={e => setPesquisa(e.target.value)}
            />
          </div>
        </form>
      </div>

      <div className="container pb-5" style={{ maxWidth: 1100 }}>

        {/* ── Destaques ── */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold text-primary mb-0" style={{ fontSize: 16 }}>Destaques</h4>
          <Link to="/explorar" className="small text-primary text-decoration-none">Ver Todos</Link>
        </div>
        {loading ? (
          <p className="text-secondary text-center py-4">A carregar...</p>
        ) : destaques.length === 0 ? (
          <p className="text-secondary text-center py-4">Ainda não há badges atribuídos.</p>
        ) : (
          <div className="row g-3 mb-5">
            {destaques.map((b) => (
              <div key={b.idBadgeRegular} className="col-6 col-lg-3">
                <CardBadgePublico badge={b} onInfo={() => setSelecionado(b)} />
              </div>
            ))}
          </div>
        )}

        {/* ── Recentes ── */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold text-primary mb-0" style={{ fontSize: 16 }}>Recentes</h4>
          <Link to="/consultores-certificados" className="small text-primary text-decoration-none">Ver Todos</Link>
        </div>
        {loading ? (
          <p className="text-secondary text-center py-4">A carregar...</p>
        ) : recentes.length === 0 ? (
          <p className="text-secondary text-center py-4">Ainda não há certificações recentes.</p>
        ) : (
          <div className="row g-3">
            {recentes.map((c, i) => (
              <div key={i} className="col-6 col-lg-3">
                <CardConsultorPublico consultor={c} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal de informação rápida de um destaque ── */}
      {selecionado && (
        <div
          onClick={() => setSelecionado(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div onClick={e => e.stopPropagation()} className="card" style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
            <div className="card-body">
              <button onClick={() => setSelecionado(null)} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 20, color: '#9ca3af', cursor: 'pointer' }}>×</button>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 48, height: 48, background: '#eef3fa', fontSize: 22 }}>🏅</div>
                <div>
                  <div className="fw-bold" style={{ fontSize: 15 }}>{selecionado.nomeBadge}</div>
                  <span className="badge rounded-pill bg-primary" style={{ fontSize: 11 }}>{selecionado.nomeNivel}</span>
                </div>
              </div>
              <p className="text-secondary small mb-3">{selecionado.descricao || 'Sem descrição.'}</p>
              <p className="small text-secondary mb-0">
                {[selecionado.nomeServiceLine, selecionado.nomeArea].filter(Boolean).join(' · ')}
              </p>
              <p className="small text-primary fw-medium mt-1">{selecionado.totalConsultores} consultores certificados</p>
              <Link to="/explorar" className="btn btn-primary btn-sm w-100 mt-2">Ver no catálogo</Link>
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  )
}
