// src/components/CardBadge.jsx
// Card de badge reutilizável — design clean baseado no Figma
// Usado pelo Talent Manager e pelo Service Line Leader

import { FaBolt } from 'react-icons/fa'

// Match parcial — verifica se o nomeNivel contém a palavra-chave
function getCoresNivel(nivel) {
  if (!nivel) return { bg: '#f0f0f0', color: '#555' }
  const n = nivel.toLowerCase()
  if (n.includes('júnior') || n.includes('junior')) return { bg: '#FFF3E0', color: '#F57C00' }
  if (n.includes('intermédio') || n.includes('intermedio')) return { bg: '#FCE4EC', color: '#E91E63' }
  if (n.includes('sénior') || n.includes('senior')) return { bg: '#E3F2FD', color: '#1E88E5' }
  if (n.includes('especialista')) return { bg: '#F3E5F5', color: '#8E24AA' }
  if (n.includes('lider') || n.includes('líder')) return { bg: '#E8F5E9', color: '#2E7D32' }
  return { bg: '#f0f0f0', color: '#555' }
}

export default function CardBadge({ b, especial, onInformacoes }) {
  const nivel = b.nomeNivel || ''
  const cores = getCoresNivel(nivel)

  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      padding: 20,
      boxShadow: '0 5px 40px rgba(237,237,237,1)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {/* Imagem + tag nível/especial */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 10, background: '#eef3fa',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {b.urlImagem
            ? <img src={`http://localhost:3001/${b.urlImagem}`} alt={b.nome} style={{ width: 48, height: 48, objectFit: 'contain' }} />
            : <span style={{ fontSize: 26 }}>{especial ? '⭐' : '🏅'}</span>
          }
        </div>
        {especial
          ? <span style={{ background: '#f3f4f6', color: '#6b7280', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 600 }}>Especial</span>
          : nivel && <span style={{ background: cores.bg, color: cores.color, borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 600 }}>{nivel}</span>
        }
      </div>

      {/* Nome + descrição */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e', marginBottom: 4 }}>{b.nome}</div>
        <div style={{
          fontSize: 12, color: '#6b7280', lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {b.descricao || 'Sem descrição.'}
        </div>
      </div>

      {/* Pontos */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#11a9d6', fontWeight: 700, fontSize: 14 }}>
          <FaBolt /> {b.pontos ?? 0} pontos
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Definidos Pelo Administrador</div>
      </div>

      {/* Service Line · Área */}
      {(b.nomeServiceLine || b.nomeArea) && (
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          {[b.nomeServiceLine, b.nomeArea].filter(Boolean).join(' · ')}
        </div>
      )}

      {/* Botão */}
      <button
        onClick={onInformacoes}
        style={{
          background: '#39639C', color: '#fff', border: 'none',
          borderRadius: 8, padding: '9px 0', fontSize: 13,
          fontWeight: 600, cursor: 'pointer', marginTop: 'auto',
        }}
      >
        Informações
      </button>
    </div>
  )
}