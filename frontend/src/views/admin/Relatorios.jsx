// views/admin/Relatorios.jsx
import LayoutAdmin from './components/LayoutAdmin'

export default function AdminRelatorios() {
  return (
    <LayoutAdmin>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '60vh', textAlign: 'center',
        fontFamily: 'Poppins, sans-serif',
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🚧</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#39639C', marginBottom: 8 }}>
          Página em Construção
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 400 }}>
          Em desenvolvimento.
        </p>
      </div>
    </LayoutAdmin>
  )
}