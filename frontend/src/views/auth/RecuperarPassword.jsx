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

    if (!email) {
      setErro('O email é obrigatório.')
      return
    }

    setIsLoading(true)
    try {
      await recuperarPassword(email)

      // Guarda o email no sessionStorage para usar no ecrã seguinte
      // O VerificarCodigo vai buscar este valor para enviar ao backend
      sessionStorage.setItem('resetEmail', email)
      navigate('/verificar-codigo')
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao enviar código. Tenta novamente.'
      setErro(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h2 className="auth-title">Redefine a sua palavra-passe</h2>
      <p className="auth-subtitle">Insira o email da sua conta</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label className="form-label auth-label">Endereço de email*</label>
          <input
            type="email"
            className={`form-control auth-input ${erro ? 'is-invalid' : ''}`}
            placeholder="Digite o seu email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErro('') }}
            required
          />
          {erro && <div className="invalid-feedback">{erro}</div>}
        </div>

        <button
          type="submit"
          className="btn auth-btn-primary w-100 mb-3"
          disabled={isLoading}
        >
          {isLoading && <span className="spinner-border spinner-border-sm me-2" />}
          Seguinte
        </button>

        <div className="auth-divider"><span>Ou</span></div>

        <Link to="/login" className="btn auth-btn-secondary w-100">
          Voltar ao login
        </Link>
      </form>
    </AuthLayout>
  )
}