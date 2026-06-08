import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import LayoutSL from './components/LayoutSL'
import api from '../../services/api'
import { MdPendingActions, MdPeopleAlt, MdVerified } from 'react-icons/md'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function DashboardServiceLine() {
  const [stats, setStats] = useState({ pendentes: 0, consultores: 0, aprovados: 0, variacao: 0 })
  const [topConsultores, setTopConsultores] = useState([])
  const [consultores, setConsultores] = useState([])
  const [dadosGrafico, setDadosGrafico] = useState([])

  useEffect(() => {
    api.get('/sl/dashboard').then(res => setStats(res.data)).catch(() => {})

    api.get('/sl/top-consultores').then(res => {
      const dados = Array.isArray(res.data) ? res.data : []
      setTopConsultores(dados.slice(0, 4))
      setConsultores(dados.slice(0, 4).map(c => ({
        nome: c.nome,
        progresso: c.totalBadges > 0 ? Math.min(c.totalBadges * 10, 100) : 10,
      })))
    }).catch(() => {})

    api.get('/sl/estatisticas-mensais').then(res => {
      setDadosGrafico(Array.isArray(res.data) ? res.data : [])
    }).catch(() => {})
  }, [])

  return (
    <LayoutSL>
      {/* conteúdo aqu */}
    </LayoutSL>
  )
}