import { useState, useCallback } from 'react'

export function Btn({ children, onClick, variant = 'primary', size = 'sm', disabled, type = 'button' }) {
  const estilos = {
    primary:   { background: 'var(--cor-primaria)', color: 'white', border: 'none' },
    secondary: { background: 'white', color: 'var(--cor-texto)', border: '1px solid var(--cor-borda)' },
    danger:    { background: '#fee2e2', color: 'var(--cor-erro)', border: '1px solid #fecaca' },
    success:   { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      ...estilos[variant],
      borderRadius: 6, cursor: disabled ? 'not-allowed' : 'pointer',
      padding: size === 'sm' ? '0.35rem 0.8rem' : '0.55rem 1.1rem',
      fontSize: size === 'sm' ? '.8rem' : '.875rem',
      fontWeight: 500, opacity: disabled ? .6 : 1, whiteSpace: 'nowrap',
    }}>
      {children}
    </button>
  )
}

export function Card({ children, style }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,.06)', ...style }}>
      {children}
    </div>
  )
}

export function KpiCard({ label, value, sub, cor }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem 1.5rem', borderLeft: `4px solid ${cor || 'var(--cor-primaria)'}`, boxShadow: '0 1px 4px rgba(0,0,0,.06)', flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: cor || 'var(--cor-primaria)' }}>{value ?? '—'}</div>
      <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--cor-texto)', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: '.72rem', color: 'var(--cor-texto-secundario)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export function BadgeTag({ children, cor }) {
  const cores = {
    verde:    { bg: '#dcfce7', text: '#166534' },
    vermelho: { bg: '#fee2e2', text: '#991b1b' },
    azul:     { bg: '#dbeafe', text: '#1e40af' },
    cinzento: { bg: '#f3f4f6', text: '#6b7280' },
    laranja:  { bg: '#fed7aa', text: '#9a3412' },
  }
  const c = cores[cor] || cores.cinzento
  return (
    <span style={{ background: c.bg, color: c.text, borderRadius: 999, padding: '2px 10px', fontSize: '.72rem', fontWeight: 600 }}>
      {children}
    </span>
  )
}

export function SectionTitle({ title, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--cor-texto)' }}>{title}</h2>
      {action}
    </div>
  )
}

export function Tabela({ colunas, dados, acoes }) {
  if (!dados?.length) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--cor-texto-secundario)', fontSize: '.875rem' }}>
      Sem dados para mostrar.
    </div>
  )
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.8rem' }}>
        <thead>
          <tr style={{ background: 'var(--cor-fundo)' }}>
            {colunas.map(c => (
              <th key={c.key} style={{ padding: '.6rem .9rem', textAlign: 'left', fontWeight: 600, color: 'var(--cor-texto-secundario)', whiteSpace: 'nowrap' }}>
                {c.label}
              </th>
            ))}
            {acoes && <th style={{ padding: '.6rem .9rem' }} />}
          </tr>
        </thead>
        <tbody>
          {dados.map((row, i) => (
            <tr key={i} style={{ borderTop: '1px solid var(--cor-borda)' }}>
              {colunas.map(c => (
                <td key={c.key} style={{ padding: '.6rem .9rem', color: 'var(--cor-texto)' }}>
                  {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                </td>
              ))}
              {acoes && (
                <td style={{ padding: '.6rem .9rem' }}>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>{acoes(row)}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Modal({ titulo, children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 12, padding: '1.5rem', width: 500, maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{titulo}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--cor-texto-secundario)' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, marginBottom: '.3rem', color: 'var(--cor-texto)' }}>{label}</label>
      {children}
    </div>
  )
}

export function Input({ value, onChange, placeholder, type = 'text', rows, style }) {
  if (rows) {
    return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} className="auth-input" style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', ...style }} />
  }
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="auth-input" style={{ width: '100%', ...style }} />
}

export function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={onChange} className="auth-input" style={{ width: '100%' }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

export function Alerta({ tipo, msg, onClose }) {
  if (!msg) return null
  const cores = { erro: { bg: '#fee2e2', text: 'var(--cor-erro)' }, sucesso: { bg: '#dcfce7', text: '#166534' } }
  const c = cores[tipo] || cores.sucesso
  return (
    <div style={{ background: c.bg, color: c.text, borderRadius: 8, padding: '.6rem 1rem', fontSize: '.8rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>{msg}</span>
      {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', marginLeft: 8 }}>✕</button>}
    </div>
  )
}

export function Tabs({ tabs, ativo, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: '1rem', borderBottom: '1px solid var(--cor-borda)', paddingBottom: '.5rem' }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          background: ativo === t.key ? 'var(--cor-primaria)' : 'none',
          color: ativo === t.key ? 'white' : 'var(--cor-texto-secundario)',
          border: 'none', borderRadius: 6, padding: '.3rem .8rem', fontSize: '.8rem', fontWeight: 500, cursor: 'pointer',
        }}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function EstadoLista({ loading, erro }) {
  if (loading) return <p style={{ padding: '1rem', color: 'var(--cor-texto-secundario)', fontSize: '.875rem' }}>A carregar...</p>
  if (erro)    return <p style={{ padding: '1rem', color: 'var(--cor-erro)', fontSize: '.875rem' }}>{erro}</p>
  return null
}

export function useAlerta() {
  const [alerta, setAlerta] = useState(null)
  const mostrar = useCallback((tipo, msg) => {
    setAlerta({ tipo, msg })
    setTimeout(() => setAlerta(null), 4000)
  }, [])
  const limpar = useCallback(() => setAlerta(null), [])
  return [alerta, mostrar, limpar]
}

export function exportarJSON(dados, nomeF) {
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = nomeF; a.click()
  URL.revokeObjectURL(url)
}
