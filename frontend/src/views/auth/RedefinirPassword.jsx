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
    if (form.novaPassword.length < 8) {
      setErro('A password deve ter pelo menos 8 caracteres.')
      return
    }
    if (form.novaPassword !== form.confirmar) {
      setErro('As passwords não coincidem.')
      return
    }
    const tokenReset = sessionStorage.getItem('tokenReset')
    if (!tokenReset) { navigate('/recuperar-password'); return }

    setIsLoading(true)
    try {
      await redefinirPassword(tokenReset, form.novaPassword)
      sessionStorage.removeItem('resetEmail')
      sessionStorage.removeItem('tokenReset')
      navigate('/login', { state: { mensagem: 'A sua password foi redefinida com sucesso.' } })
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao redefinir password.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h4 className="fw-bold mb-1" style={{ color: 'var(--cor-primaria)' }}>
        Redifina a sua palavra-passe
      </h4>
      <p className="mb-4 small" style={{ color: 'var(--cor-primaria)' }}>
        Insira a sua nova palavra-passe
      </p>

      <form onSubmit={handleSubmit} noValidate>

        {/* Nova password */}
        <div className="mb-3">
          <label className="form-label small fw-medium">Nova palavra-passe*</label>
          <input
            type="password"
            name="novaPassword"
            className={`form-control ${erro ? 'is-invalid' : ''}`}
            placeholder="Digite a sua nova palavra-passe"
            value={form.novaPassword}
            onChange={handleChange}
          />
        </div>

        {/* Confirmação */}
        <div className="mb-4">
          <label className="form-label small fw-medium">Repita a palavra-passe*</label>
          <input
            type="password"
            name="confirmar"
            className={`form-control ${erro ? 'is-invalid' : ''}`}
            placeholder="Repita a sua nova palavra-passe"
            value={form.confirmar}
            onChange={handleChange}
          />
          {erro && <div className="text-danger small mt-2">{erro}</div>}
        </div>

        <button type="submit" className="btn w-100 text-white"
          style={{ backgroundColor: 'var(--cor-primaria)' }} disabled={isLoading}>
          {isLoading && <span className="spinner-border spinner-border-sm me-2" />}
          Redefinir
        </button>

      </form>
    </AuthLayout>
  )
}