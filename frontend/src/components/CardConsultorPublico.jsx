// src/components/CardConsultorPublico.jsx
// Cartão de consultor certificado, usado na Home ("Recentes") e no Diretório.

import { Link } from 'react-router-dom'

export default function CardConsultorPublico({ consultor }) {
  return (
    <div className="card h-100 text-center border-0 shadow-sm hover-card">
      <div className="card-body d-flex flex-column align-items-center">
        <div className="rounded-circle overflow-hidden d-flex align-items-center justify-content-center fw-bold mb-2"
          style={{ width: 56, height: 56, background: '#e8f0fb', color: '#39639C', fontSize: 20 }}>
          {consultor.urlFoto
            ? <img src={consultor.urlFoto} alt={consultor.nome} className="w-100 h-100" style={{ objectFit: 'cover' }} />
            : (consultor.nome?.[0]?.toUpperCase() || '?')}
        </div>
        <div className="fw-bold mb-1" style={{ fontSize: 13, color: '#1a1a2e' }}>{consultor.nome}</div>
        <div className="text-secondary mb-3" style={{ fontSize: 12 }}>
          {consultor.nomeBadge} {consultor.nomeNivel !== '-' ? `· ${consultor.nomeNivel}` : ''}
        </div>
        {consultor.tokenValidacao ? (
          <Link to={`/badges/verify/${consultor.tokenValidacao}`} className="btn btn-primary btn-sm mt-auto w-100">
            Informações
          </Link>
        ) : (
          <button className="btn btn-outline-primary btn-sm mt-auto w-100" disabled>Sem certificado público</button>
        )}
      </div>
    </div>
  )
}
