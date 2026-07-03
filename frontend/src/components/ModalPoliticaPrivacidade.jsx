import { useState, useEffect } from 'react'
import api from '../services/api'

export default function ModalPoliticaPrivacidade({ onClose }) {
  const [conteudo, setConteudo] = useState('')
  const [dataAlteracao, setDataAlteracao] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    api.get('/configuracao/politica_privacidade')
      .then(res => {
        setConteudo(res.data?.conteudo || '')
        setDataAlteracao(res.data?.dataAlteracao || null)
      })
      .catch(err => {
        console.error('[ModalPoliticaPrivacidade] ERRO:', err.response?.status, err.response?.data || err.message)
        setErro('Não foi possível carregar a política de privacidade de momento.')
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, padding: '32px 36px', width: '100%', maxWidth: 640,
          maxHeight: '80vh', overflowY: 'auto', position: 'relative', fontFamily: 'Poppins, sans-serif',
        }}
      >
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 18, background: 'none', border: 'none',
          fontSize: 22, cursor: 'pointer', color: '#9ca3af', lineHeight: 1,
        }}>
          ×
        </button>

        <h2 style={{ color: '#39639C', fontWeight: 700, fontSize: 20, margin: '0 0 4px' }}>Política de Privacidade &amp; RGPD</h2>
        {dataAlteracao && (
          <p style={{ color: '#9ca3af', fontSize: 11, margin: '0 0 22px' }}>
            Última atualização: {new Date(dataAlteracao).toLocaleDateString('pt-PT')}
          </p>
        )}

        {loading ? (
          <p style={{ color: '#9ca3af', fontSize: 13 }}>A carregar...</p>
        ) : erro ? (
          <p style={{ color: '#dc2626', fontSize: 13 }}>{erro}</p>
        ) : (
          <p style={{ color: '#4b5563', fontSize: 13.5, lineHeight: 1.8, whiteSpace: 'pre-line', margin: 0 }}>
            {conteudo}
          </p>
        )}
      </div>
    </div>
  )
}
