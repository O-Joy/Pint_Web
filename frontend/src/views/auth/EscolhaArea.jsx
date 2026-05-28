// EscolhaArea.jsx — Ecrã de escolha de área (LoginConsultorArea no protótipo)
// Aparece apenas no PRIMEIRO acesso do consultor — quando primeiroAcesso é true
// O consultor escolhe a sua área de trabalho antes de entrar no dashboard
// O Learning Path ("Jornada Técnica") é fixo neste projeto

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout'
import { getAreas, configuracaoInicial } from '../../services/api'

export default function EscolhaArea() {
  const navigate = useNavigate()
  const [areas, setAreas] = useState([])
  const [idAreaSelecionada, setIdAreaSelecionada] = useState('')
  const [erro, setErro] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Learning Path fixo para este projeto — só existe "Jornada Técnica"
  const learningPath = 'Jornada Técnica'

  // Carrega as áreas disponíveis ao montar o componente
  // useEffect com array vazio [] corre apenas uma vez — equivalente ao initState do Flutter
  useEffect(() => {
    getAreas()
      .then((res) => setAreas(res.data))
      .catch(() => setErro('Erro ao carregar áreas. Tenta novamente.'))
  }, [])

  // Obtém o nome do utilizador guardado no login para personalizar a saudação
  const utilizador = JSON.parse(
    sessionStorage.getItem('utilizador') || localStorage.getItem('utilizador') || '{}'
  )
  const primeiroNome = utilizador?.nome?.split(' ')[0] || 'Utilizador'

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!idAreaSelecionada) {
      setErro('Seleciona uma área para continuar.')
      return
    }

    setIsLoading(true)
    try {
      // Envia a área escolhida ao backend — marca a configuração como completa
      await configuracaoInicial(parseInt(idAreaSelecionada))
      navigate('/consultor/dashboard')
    } catch (err) {
      setErro('Erro ao guardar a área. Tenta novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h2 className="auth-title">Bem-Vinda, {primeiroNome}!</h2>
      <p className="auth-subtitle">Escolha a tua área.</p>

      <form onSubmit={handleSubmit} noValidate>

        {/* Learning Path — fixo, não editável */}
        <div className="mb-3">
          <label className="form-label auth-label">Learning Path:</label>
          <input
            type="text"
            className="form-control auth-input"
            value={learningPath}
            disabled
          />
        </div>

        {/* Service Line — fixo por agora */}
        <div className="mb-3">
          <label className="form-label auth-label">Service Line:</label>
          <input
            type="text"
            className="form-control auth-input"
            value="Mobile Solutions"
            disabled
          />
        </div>

        {/* Área — dropdown com as áreas vindas da API */}
        <div className="mb-4">
          <label className="form-label auth-label">Área:</label>
          <select
            className={`form-select auth-input ${erro ? 'is-invalid' : ''}`}
            value={idAreaSelecionada}
            onChange={(e) => { setIdAreaSelecionada(e.target.value); setErro('') }}
          >
            <option value="">Seleciona a tua área</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.nome}</option>
            ))}
          </select>
          {erro && <div className="invalid-feedback">{erro}</div>}
        </div>

        {/* Botão avançar — guarda a área e navega para o dashboard */}
        <button
          type="submit"
          className="btn auth-btn-primary w-100"
          disabled={isLoading}
        >
          {isLoading && <span className="spinner-border spinner-border-sm me-2" />}
          Avançar
        </button>
      </form>
    </AuthLayout>
  )
}