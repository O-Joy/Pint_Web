// src/components/ProtectedRoute.jsx
// Componente "porteiro" que protege as rotas da aplicação
// Recebe os perfis permitidos e verifica se o utilizador logado tem um deles
// Se não estiver autenticado → redireciona para /login
// Se estiver autenticado mas com perfil errado → redireciona para /login
// Se tudo estiver bem → mostra a página pedida (children)

import { Navigate } from 'react-router-dom'
import { estaAutenticado, getPerfil } from '../utils/auth'

// perfisPermitidos — array com os perfis que podem aceder a esta rota
// Ex: ['consultor'] ou ['talent_manager', 'administrador']
export default function ProtectedRoute({ children, perfisPermitidos }) {

  // Primeiro verifica se há sessão ativa
  if (!estaAutenticado()) {
    return <Navigate to="/login" replace />
  }

  // Depois verifica se o perfil do utilizador está na lista de permitidos
  const perfil = getPerfil()
  if (perfisPermitidos && !perfisPermitidos.includes(perfil)) {
    return <Navigate to="/login" replace />
  }

  // Tudo certo — mostra a página
  return children
}