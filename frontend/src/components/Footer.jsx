import { useState } from 'react'
import ModalPoliticaPrivacidade from './ModalPoliticaPrivacidade'

export default function Footer() {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      <div style={{ textAlign: 'right', marginTop: 16, fontSize: 11, color: '#9ca3af' }}>
        <button
          onClick={() => setAberto(true)}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#9ca3af', textDecoration: 'underline', fontSize: 11 }}
        >
          Política de Privacidade e RGPD
        </button>
      </div>
      {aberto && <ModalPoliticaPrivacidade onClose={() => setAberto(false)} />}
    </>
  )
}
