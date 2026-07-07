// src/components/CardBadgePublico.jsx
// Cartão de badge para as páginas públicas (Home, Explorar).
// Diferente do CardBadge.jsx interno — este não tem ações de gestão, só "Informações".

const CORES_NIVEL = {
  'júnior': { bg: '#FFF3E0', color: '#F57C00' },
  'intermédio': { bg: '#FCE4EC', color: '#E91E63' },
  'sénior': { bg: '#E3F2FD', color: '#1E88E5' },
  'especialista': { bg: '#F3E5F5', color: '#8E24AA' },
  'líder de conhecimento': { bg: '#E8F5E9', color: '#2E7D32' },
}

function coresNivel(nivel) {
  const chave = (nivel || '').toLowerCase()
  return CORES_NIVEL[chave] || { bg: '#f0f0f0', color: '#555' }
}

export default function CardBadgePublico({ badge, onInfo }) {
  const cores = coresNivel(badge.nomeNivel)
  return (
    <div className="card h-100 border-0 shadow-sm hover-card">
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex align-items-center justify-content-center rounded-3"
            style={{ width: 48, height: 48, background: '#eef3fa', fontSize: 22, flexShrink: 0 }}>
            🏅
          </div>
          <span className="badge rounded-pill" style={{ background: cores.bg, color: cores.color, fontSize: 11 }}>
            {badge.nomeNivel}
          </span>
        </div>

        <div className="fw-bold mb-1" style={{ fontSize: 14, color: '#1a1a2e' }}>{badge.nomeBadge}</div>
        <div className="text-secondary mb-2" style={{
          fontSize: 12, lineHeight: 1.5, flexGrow: 1,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {badge.descricao || 'Sem descrição.'}
        </div>

        <div className="small fw-medium mb-2" style={{ color: '#11a9d6' }}>
          {badge.totalConsultores} Consultor{badge.totalConsultores === 1 ? '' : 'es'}
        </div>
        {(badge.nomeServiceLine || badge.nomeArea) && (
          <div className="text-secondary mb-3" style={{ fontSize: 11 }}>
            {[badge.nomeServiceLine, badge.nomeArea].filter(Boolean).join(' · ')}
          </div>
        )}

        <button onClick={onInfo} className="btn btn-primary btn-sm mt-auto">Informações</button>
      </div>
    </div>
  )
}
