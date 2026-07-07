// src/views/public/BadgeVerify.jsx
// Página pública de verificação de um badge — o link único que prova que um
// consultor específico obteve um badge específico. Pensada para ser partilhada
// fora da app (LinkedIn, assinatura de email), por isso o visual de "certificado".

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import PublicLayout from '../../components/PublicLayout'
import api from '../../services/api'
import { FiCheckCircle, FiXCircle } from 'react-icons/fi'

const formatarData = (data) => {
  if (!data) return '-'
  return new Date(data).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function BadgeVerify() {
  const { token } = useParams()
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    api.get(`/public/badges/verify/${token}`)
      .then(res => setDados(res.data))
      .catch(err => {
        console.error('[BadgeVerify] ERRO:', err.response?.status, err.response?.data || err.message)
        setErro(err.response?.status === 404 ? 'Este certificado não existe ou o link é inválido.' : 'Não foi possível carregar este certificado de momento.')
      })
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return <PublicLayout><p className="text-center text-secondary py-5">A carregar...</p></PublicLayout>
  }

  if (erro || !dados) {
    return (
      <PublicLayout>
        <div className="text-center py-5">
          <p className="text-danger mb-3">{erro || 'Certificado não encontrado.'}</p>
          <Link to="/" className="btn btn-outline-primary btn-sm">Voltar à página inicial</Link>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className="container py-5" style={{ maxWidth: 720 }}>

        {/* ── Certificado ── */}
        <div className="card">
          <div style={{ height: 8, background: 'linear-gradient(90deg, #39639C 0%, #11a9d6 100%)', borderTopLeftRadius: 14, borderTopRightRadius: 14 }} />
          <div className="card-body text-center px-4 px-md-5 py-5">

            {/* Selo de validade */}
            <div className="d-flex justify-content-center mb-4">
              {dados.valido ? (
                <span className="d-flex align-items-center gap-2 text-success fw-semibold small">
                  <FiCheckCircle /> Certificado Válido
                </span>
              ) : (
                <span className="d-flex align-items-center gap-2 text-danger fw-semibold small">
                  <FiXCircle /> Certificado Expirado
                </span>
              )}
            </div>

            {/* Badge grande */}
            <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3"
              style={{ width: 96, height: 96, background: 'linear-gradient(135deg, #e8f0fb, #dbeeff)', fontSize: 44 }}>
              🏅
            </div>

            <h1 className="fw-bold mb-1" style={{ fontSize: 24, color: '#1a1a2e' }}>{dados.nomeBadge}</h1>
            <span className="badge rounded-pill bg-primary mb-3" style={{ fontSize: 12 }}>{dados.nomeNivel}</span>

            <p className="text-secondary mb-0" style={{ fontSize: 13 }}>Atribuído a</p>
            <h2 className="fw-bold text-primary mb-4" style={{ fontSize: 20 }}>{dados.nomeConsultor}</h2>

            {dados.descricao && (
              <p className="text-secondary mx-auto mb-4" style={{ fontSize: 13, maxWidth: 480, lineHeight: 1.7 }}>
                {dados.descricao}
              </p>
            )}

            {/* Competências */}
            {dados.competencias?.length > 0 && (
              <div className="mb-4">
                <p className="fw-semibold small text-secondary mb-2">Competências certificadas</p>
                <div className="d-flex flex-wrap justify-content-center gap-2">
                  {dados.competencias.map((c, i) => (
                    <span key={i} className="badge rounded-pill" style={{ background: '#eef3fa', color: '#39639C', fontWeight: 500, fontSize: 11.5 }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Info em grelha */}
            <div className="row text-start border-top pt-4 mt-2 g-3">
              <div className="col-6 col-md-3">
                <div className="text-secondary" style={{ fontSize: 11 }}>Área</div>
                <div className="fw-medium" style={{ fontSize: 13 }}>{dados.nomeArea || '-'}</div>
              </div>
              <div className="col-6 col-md-3">
                <div className="text-secondary" style={{ fontSize: 11 }}>Service Line</div>
                <div className="fw-medium" style={{ fontSize: 13 }}>{dados.nomeServiceLine || '-'}</div>
              </div>
              <div className="col-6 col-md-3">
                <div className="text-secondary" style={{ fontSize: 11 }}>Emitido em</div>
                <div className="fw-medium" style={{ fontSize: 13 }}>{formatarData(dados.dataAtribuicao)}</div>
              </div>
              <div className="col-6 col-md-3">
                <div className="text-secondary" style={{ fontSize: 11 }}>Validade</div>
                <div className="fw-medium" style={{ fontSize: 13 }}>{dados.dataExpiracao ? formatarData(dados.dataExpiracao) : 'Sem expiração'}</div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-secondary mt-4" style={{ fontSize: 11 }}>
          Este certificado foi emitido e verificado pela Softinsa através da sua plataforma de badges digitais.{' '}
          <a href="https://www.softinsa.pt" target="_blank" rel="noreferrer" className="text-primary">Saiba mais sobre a Softinsa</a>
        </p>
      </div>
    </PublicLayout>
  )
}
