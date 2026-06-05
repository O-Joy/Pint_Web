// VerificarCodigo.jsx — Ecrã de verificação do código
// O utilizador insere o código de 5 dígitos recebido por email
// Cada dígito tem o seu próprio input — ao preencher um avança automaticamente para o seguinte
// Se o código for válido, o backend devolve um token_reset temporário para o ecrã seguinte


import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout'
import { verificarCodigo } from '../../services/api'

export default function VerificarCodigo() {
  const navigate = useNavigate()
  const [digitos, setDigitos] = useState(['', '', '', '', ''])
  const [erro, setErro] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const refs = useRef([])

  const handleChange = (index, valor) => {
    if (!/^\d?$/.test(valor)) return
    const novos = [...digitos]
    novos[index] = valor
    setDigitos(novos)
    setErro('')
    // Avança automaticamente para o campo seguinte
    if (valor && index < 4) refs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index, e) => {
    // Volta ao campo anterior com backspace
    if (e.key === 'Backspace' && !digitos[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const codigo = digitos.join('')
    if (codigo.length < 5) { setErro('Insere o código completo de 5 dígitos.'); return }

    const email = sessionStorage.getItem('resetEmail')
    if (!email) { navigate('/recuperar-password'); return }

    setIsLoading(true)
    try {
      const res = await verificarCodigo(email, codigo)
      sessionStorage.setItem('tokenReset', res.data.token_reset)
      navigate('/redefinir-password')
    } catch (err) {
      setErro(err.response?.data?.error || 'Código inválido ou expirado.')
      setDigitos(['', '', '', '', ''])
      refs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h4 className="fw-bold mb-1" style={{ color: 'var(--cor-primaria)' }}>
        Redefine a sua palavra-passe
      </h4>
      <p className="mb-4 small" style={{ color: 'var(--cor-primaria)' }}>
        Insira o código enviado para o seu email
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label className="form-label small fw-medium">Código*</label>

          {/* 5 inputs individuais — um por dígito */}
          <div className="d-flex gap-2">
            {digitos.map((d, i) => (
              <input
                key={i}
                ref={(el) => (refs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={`form-control text-center fw-bold fs-5 ${erro ? 'is-invalid' : ''}`}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
              />
            ))}
          </div>
          {erro && <div className="text-danger small mt-2">{erro}</div>}
        </div>

        <button type="submit" className="btn w-100 mb-3 text-white"
          style={{ backgroundColor: 'var(--cor-primaria)' }} disabled={isLoading}>
          {isLoading && <span className="spinner-border spinner-border-sm me-2" />}
          Seguinte
        </button>

        <div className="d-flex align-items-center mb-3">
          <hr className="flex-grow-1" />
          <span className="mx-2 small text-secondary">Ou</span>
          <hr className="flex-grow-1" />
        </div>

        <Link to="/login" className="btn btn-outline-secondary w-100">
          Voltar ao login
        </Link>
      </form>
    </AuthLayout>
  )
}