// src/components/PublicLayout.jsx
// Layout partilhado por todas as páginas públicas (Home, Explorar, Consultores, Verificação).
// Sem Sidebar/autenticação — é o "site" que qualquer pessoa vê antes de entrar na app.

import { Link } from 'react-router-dom'

export default function PublicLayout({ children }) {
  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f6fa' }}>

      {/* ── Cabeçalho ── */}
      <header className="d-flex justify-content-between align-items-center px-4 px-md-5 py-3 bg-white border-bottom">
        <Link to="/" className="fw-bold fs-4 text-decoration-none" style={{ color: '#39639C', letterSpacing: 0.5 }}>
          <img 
            src="/logo-softinsa.svg" 
            alt="Softinsa" 
            height="50" 
            style={{ objectFit: 'contain' }}
          />
        </Link>
        <nav className="d-flex align-items-center gap-4">
          <Link to="/explorar" className="text-secondary text-decoration-none small fw-medium d-none d-sm-inline">Explorar</Link>
          <Link to="/consultores-certificados" className="text-secondary text-decoration-none small fw-medium d-none d-sm-inline">Consultores</Link>
          <Link to="/login" className="btn btn-primary btn-sm">Entrar</Link>
        </nav>
      </header>

      <main className="flex-grow-1">{children}</main>

      {/* ── Rodapé ── */}
      <footer className="text-center text-secondary bg-white border-top py-4" style={{ fontSize: 12 }}>
        <div className="mb-1">
          Zona Industrial de Coimbrões 15, 3500-161 Viseu · +351 232 132 160 · geral@softinsa.pt
        </div>
        <div>© {new Date().getFullYear()} Softinsa</div>
      </footer>
    </div>
  )
}
