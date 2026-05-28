// Login.jsx — Ecrã de login
// É o primeiro ecrã que o utilizador vê quando abre a aplicação
// Após login bem sucedido, redireciona para o dashboard do perfil correto
// Se for o primeiro login de um consultor, vai para /escolha-area

import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout'
import { login } from '../../services/api'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  // Estado do formulário — guarda o que o utilizador está a escrever
  const [form, setForm] = useState({ email: '', password: '' })
  const [manterSessao, setManterSessao] = useState(false)
  const [aceitouRgpd, setAceitouRgpd] = useState(false)
  const [erro, setErro] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Mensagem de sucesso que vem do ecrã de redefinir password
  const mensagemSucesso = location.state?.mensagem

  // Atualiza o campo que o utilizador está a editar e limpa o erro
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErro('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Valida a aceitação do RGPD antes de fazer qualquer pedido
    if (!aceitouRgpd) {
      setErro('Deve aceitar a Política de Privacidade para continuar.')
      return
    }

    setIsLoading(true)
    try {
      const res = await login(form.email, form.password)
      const { token } = res.data
      const dados = res.data.consultor || res.data.utilizador

        // Junta o perfil ao objeto — o ProtectedRoute precisa dele para verificar o acesso
        const dadosComPerfil = { ...dados, perfil: res.data.perfil }

        if (manterSessao) {
        localStorage.setItem('token', token)
        localStorage.setItem('utilizador', JSON.stringify(dadosComPerfil))
        } else {
        sessionStorage.setItem('token', token)
        sessionStorage.setItem('utilizador', JSON.stringify(dadosComPerfil))
        }

      // Se é o primeiro acesso do consultor, vai para escolha de área
      const primeiroAcesso = res.data.consultor?.primeiroAcesso ?? false
      if (primeiroAcesso) {
        navigate('/escolha-area')
        return
      }

      // Redireciona para o dashboard do perfil correto
      const perfil = res.data.perfil
      if (perfil === 'administrador') navigate('/admin/dashboard')
      else if (perfil === 'talent_manager') navigate('/talent/dashboard')
      else if (perfil === 'sl_leader') navigate('/serviceline/dashboard')
      else navigate('/consultor/dashboard')

    } catch (err) {
      const msg = err.response?.data?.error || 'Credenciais inválidas. Tenta novamente.'
      setErro(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h2 className="auth-title">Entre na sua conta</h2>
      <p className="auth-subtitle">Insira o email da sua conta</p>

      {/* Mensagem de sucesso após redefinir password */}
      {mensagemSucesso && (
        <div className="alert alert-success py-2 small mb-3">{mensagemSucesso}</div>
      )}

      <form onSubmit={handleSubmit} noValidate>

        <div className="mb-3">
          <label className="form-label auth-label">Endereço de email*</label>
          <input
            type="email"
            name="email"
            className={`form-control auth-input ${erro ? 'is-invalid' : ''}`}
            placeholder="Digite o seu email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label auth-label">Palavra-passe*</label>
          <input
            type="password"
            name="password"
            className={`form-control auth-input ${erro ? 'is-invalid' : ''}`}
            placeholder="Digite a sua palavra-passe"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        {/* Checkbox para manter a sessão entre sessões do browser */}
        <div className="form-check mb-2">
          <input
            type="checkbox"
            className="form-check-input"
            id="manterSessao"
            checked={manterSessao}
            onChange={(e) => setManterSessao(e.target.checked)}
          />
          <label className="form-check-label auth-check-label" htmlFor="manterSessao">
            Manter sessão iniciada
          </label>
        </div>

        {/* Checkbox RGPD — obrigatório para poder fazer login */}
        <div className="form-check mb-3">
          <input
            type="checkbox"
            className="form-check-input"
            id="rgpd"
            checked={aceitouRgpd}
            onChange={(e) => { setAceitouRgpd(e.target.checked); setErro('') }}
          />
          <label className="form-check-label auth-check-label" htmlFor="rgpd">
            Li e aceito a{' '}
            <a href="#" className="auth-link">Política de Privacidade</a>
            {' '}e autorizo o tratamento dos meus dados pessoais para efeitos de certificação profissional.
          </label>
        </div>

        {erro && <div className="alert alert-danger py-2 small">{erro}</div>}

        <button
          type="submit"
          className="btn auth-btn-primary w-100 mb-3"
          disabled={isLoading}
        >
          {isLoading && <span className="spinner-border spinner-border-sm me-2" />}
          Login
        </button>

        <div className="auth-divider"><span>Ou</span></div>

        <Link to="/recuperar-password" className="btn auth-btn-secondary w-100">
          Redefinir palavra-passe
        </Link>
      </form>
    </AuthLayout>
  )
}