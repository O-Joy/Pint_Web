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

  // Array com os 5 dígitos — cada posição corresponde a um input
  const [digitos, setDigitos] = useState(['', '', '', '', ''])
  const [erro, setErro] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Refs para poder focar cada input programaticamente
  // Por exemplo, quando o utilizador preenche o 1º dígito, o 2º fica em foco automaticamente
  const refs = useRef([])

  const handleChange = (index, valor) => {
    // Só aceita dígitos numéricos
    if (!/^\d?$/.test(valor)) return

    const novos = [...digitos]
    novos[index] = valor
    setDigitos(novos)
    setErro('')

    // Avança automaticamente para o campo seguinte ao preencher
    if (valor && index < 4) {
      refs.current[index + 1]?.focus()
    }
  }

  // Volta ao campo anterior ao apagar com backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digitos[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const codigo = digitos.join('')

    if (codigo.length < 5) {
      setErro('Insere o código completo de 5 dígitos.')
      return
    }

    // Recupera o email guardado no ecrã anterior
    const email = sessionStorage.getItem('resetEmail')
    if (!email) {
      navigate('/recuperar-password')
      return
    }

    setIsLoading(true)
    try {
      const res = await verificarCodigo(email, codigo)

      // Guarda o token temporário para usar no ecrã de redefinir password
      sessionStorage.setItem('tokenReset', res.data.token_reset)
      navigate('/redefinir-password')
    } catch (err) {
      const msg = err.response?.data?.error || 'Código inválido ou expirado.'
      setErro(msg)

      // Limpa todos os campos para o utilizador tentar novamente
      setDigitos(['', '', '', '', ''])
      refs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h2 className="auth-title">Redefine a sua palavra-passe</h2>
      <p className="auth-subtitle">Insira o código enviado para o seu email</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label className="form-label auth-label">Código*</label>

          {/*inputs individuais — um por cada dígito do código */}
          <div className="codigo-inputs">
            {digitos.map((d, i) => (
              <input
                key={i}
                ref={(el) => (refs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={`form-control auth-input codigo-input ${erro ? 'is-invalid' : ''}`}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
              />
            ))}
          </div>
          {erro && <div className="text-danger small mt-2">{erro}</div>}
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