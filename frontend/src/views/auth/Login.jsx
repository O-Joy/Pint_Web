// Login.jsx — Ecrã de login
// Bootstrap puro — sem classes CSS customizadas nos elementos de formulário

import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout'
import { login } from '../../services/api'
import { guardarSessao } from '../../utils/auth'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [manterSessao, setManterSessao] = useState(false)
  const [aceitouRgpd, setAceitouRgpd] = useState(false)
  const [erro, setErro] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const mensagemSucesso = location.state?.mensagem

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErro('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!aceitouRgpd) {
      setErro('Deve aceitar a Política de Privacidade para continuar.')
      return
    }
    setIsLoading(true)
    try {
      const res = await login(form.email, form.password)
      const { token } = res.data
      const dados = res.data.consultor || res.data.utilizador
      const dadosComPerfil = { ...dados, perfil: res.data.perfil }
      
      guardarSessao(token, dadosComPerfil, manterSessao)
      
      const primeiroAcesso = res.data.consultor?.primeiroAcesso ?? false
      if (primeiroAcesso) { navigate('/escolha-area'); return }
      const perfil = res.data.perfil
      if (perfil === 'administrador') navigate('/admin/dashboard')
      else if (perfil === 'talent_manager') navigate('/talent/dashboard')
      else if (perfil === 'sl_leader') navigate('/serviceline/dashboard')
      else navigate('/consultor/dashboard')
    } catch (err) {
      setErro(err.response?.data?.error || 'Credenciais inválidas. Tenta novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h4 className="fw-bold mb-1" style={{ color: 'var(--cor-primaria)' }}>
        Entre na sua conta
      </h4>
      <p className="mb-4 small" style={{ color: 'var(--cor-primaria)' }}>
        Insira o email da sua conta
      </p>

      {mensagemSucesso && (
        <div className="alert alert-success py-2 small">{mensagemSucesso}</div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label className="form-label small fw-medium">Endereço de email*</label>
          <input
            type="email"
            name="email"
            className={`form-control ${erro ? 'is-invalid' : ''}`}
            placeholder="Digite o seu email"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label className="form-label small fw-medium">Palavra-passe*</label>
          <input
            type="password"
            name="password"
            className={`form-control ${erro ? 'is-invalid' : ''}`}
            placeholder="Digite a sua palavra-passe"
            value={form.password}
            onChange={handleChange}
          />
        </div>

        <div className="form-check mb-2">
          <input type="checkbox" className="form-check-input" id="manterSessao"
            checked={manterSessao} onChange={(e) => setManterSessao(e.target.checked)} />
          <label className="form-check-label small text-secondary" htmlFor="manterSessao">
            Manter sessão iniciada
          </label>
        </div>

        <div className="form-check mb-3">
          <input type="checkbox"
            className={`form-check-input ${!aceitouRgpd && erro ? 'is-invalid' : ''}`}
            id="rgpd" checked={aceitouRgpd}
            onChange={(e) => { setAceitouRgpd(e.target.checked); setErro('') }} />
          <label className="form-check-label small text-secondary" htmlFor="rgpd">
            Li e aceito a{' '}
            <a href="#" className="text-primary">Política de Privacidade</a>
            {' '}e autorizo o tratamento dos meus dados pessoais para efeitos de certificação profissional.
          </label>
        </div>

        {erro && <div className="alert alert-danger py-2 small">{erro}</div>}

        <button type="submit" className="btn w-100 mb-3 text-white"
          style={{ backgroundColor: 'var(--cor-primaria)' }} disabled={isLoading}>
          {isLoading && <span className="spinner-border spinner-border-sm me-2" />}
          Login
        </button>

        <div className="d-flex align-items-center mb-3">
          <hr className="flex-grow-1" />
          <span className="mx-2 small text-secondary">Ou</span>
          <hr className="flex-grow-1" />
        </div>

        <Link to="/recuperar-password" className="btn btn-outline-secondary w-100">
          Redefinir palavra-passe
        </Link>
      </form>
    </AuthLayout>
  )
}