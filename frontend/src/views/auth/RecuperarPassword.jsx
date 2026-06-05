// RecuperarPassword.jsx — Ecrã de recuperação de password
// O utilizador insere o email da conta para receber o código de verificação
// O backend envia o código para o EMAIL_USER configurado no .env
// porque os emails na BD são fictícios

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout'
import { recuperarPassword } from '../../services/api'

export default function RecuperarPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { setErro('O email é obrigatório.'); return }

    setIsLoading(true)
    try {
      await recuperarPassword(email)
      // Guarda o email para usar no ecrã de verificação de código
      sessionStorage.setItem('resetEmail', email)
      navigate('/verificar-codigo')
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao enviar código. Tenta novamente.')
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
        Insira o email da sua conta
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label className="form-label small fw-medium">Endereço de email*</label>
          <input
            type="email"
            className={`form-control ${erro ? 'is-invalid' : ''}`}
            placeholder="Digite o seu email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErro('') }}
          />
          {erro && <div className="invalid-feedback">{erro}</div>}
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