import { FaBolt } from 'react-icons/fa'

const coresNivel = {
  'Júnior': { bg: '#FFF3E0', color: '#F57C00' },
  'Intermédio': { bg: '#FCE4EC', color: '#E91E63' },
  'Sénior': { bg: '#E3F2FD', color: '#1E88E5' },
  'Especialista': { bg: '#F3E5F5', color: '#8E24AA' },
  'Lider': { bg: '#E8F5E9', color: '#43A047' },
}

export default function CardBadge({ b, especial }) {
  const nivel = b.nomeNivel || ''
  const cores = coresNivel[nivel] || { bg: '#f0f0f0', color: '#555' }
  const expiracaoHoras = b.validadeDias ? b.validadeDias * 24 : null

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 10, border: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: 56, height: 56, borderRadius: 10, background: '#e8f0fb' }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {especial && <span style={{ background: '#e8f0fb', color: '#39639C', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>Especial</span>}
          {nivel && <span style={{ background: cores.bg, color: cores.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{nivel}</span>}
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e', marginBottom: 4 }}>{b.nome}</div>
        <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {b.descricao}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#11a9d6', fontWeight: 700, fontSize: 14 }}>
        <FaBolt /> {b.pontos} pontos
      </div>

      {b.nomeServiceLine && (
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          {b.nomeArea} · {b.nomeServiceLine}
        </div>
      )}

      <button style={{ background: '#39639C', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 'auto' }}>
        Informações
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {expiracaoHoras && (
          <span style={{ fontSize: 11, color: '#6b7280' }}>
            Expira em: {expiracaoHoras} horas
          </span>
        )}
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: b.ativo ? '#2ecc71' : '#e74c3c', marginLeft: 'auto' }} />
      </div>
    </div>
  )
}