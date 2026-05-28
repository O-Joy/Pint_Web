// RedefinirPassword.jsx — Ecrã de redefinição de password
// O utilizador define a nova password usando o token_reset guardado no ecrã anterior
// Após sucesso, redireciona para o login com mensagem de confirmação

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout'
import { redefinirPassword } from '../../services/api'

export default function RedefinirPassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ novaPassword: '', confirmar: '' })
  const [erro, setErro] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErro('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validações locais antes de chamar a API
    if (form.novaPassword.length < 8) {
      setErro('A password deve ter pelo menos 8 caracteres.')
      return
    }
    if (form.novaPassword !== form.confirmar) {
      setErro('As passwords não coincidem.')
      return
    }

    // Recupera o token temporário guardado no ecrã de verificação de código
    const tokenReset = sessionStorage.getItem('tokenReset')
    if (!tokenReset) {
      navigate('/recuperar-password')
      return
    }

    setIsLoading(true)
    try {
      await redefinirPassword(tokenReset, form.novaPassword)

      // Limpa os dados temporários do fluxo de recuperação
      sessionStorage.removeItem('resetEmail')
      sessionStorage.removeItem('tokenReset')

      // Redireciona para o login com mensagem de sucesso
      // O Login.jsx lê esta mensagem através do location.state
      navigate('/login', {
        state: { mensagem: 'A sua password foi redefinida com sucesso.' },
      })
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao redefinir password.'
      setErro(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h2 className="auth-title">Redifina a sua palavra-passe</h2>
      <p className="auth-subtitle">Insira a sua nova palavra-passe</p>

      <form onSubmit={handleSubmit} noValidate>

        <div className="mb-3">
          <label className="form-label auth-label">Nova palavra-passe*</label>
          <input
            type="password"
            name="novaPassword"
            className={`form-control auth-input ${erro ? 'is-invalid' : ''}`}
            placeholder="Digite a sua nova palavra-passe"
            value={form.novaPassword}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-4">
          <label className="form-label auth-label">Repita a palavra-passe*</label>
          <input
            type="password"
            name="confirmar"
            className={`form-control auth-input ${erro ? 'is-invalid' : ''}`}
            placeholder="Repita a sua nova palavra-passe"
            value={form.confirmar}
            onChange={handleChange}
            required
          />
          {erro && <div className="text-danger small mt-2">{erro}</div>}
        </div>

        <button
          type="submit"
          className="btn auth-btn-primary w-100"
          disabled={isLoading}
        >
          {isLoading && <span className="spinner-border spinner-border-sm me-2" />}
          Redefinir
        </button>
      </form>
    </AuthLayout>
  )
}