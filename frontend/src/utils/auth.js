// src/utils/auth.js
// Utilitário central para gerir a sessão do utilizador
// Lê do localStorage (sessão permanente) ou sessionStorage (sessão temporária)
// É usado pelo ProtectedRoute e por qualquer componente que precise saber quem está logado

// Devolve o token JWT guardado, ou null se não existir
export const getToken = () =>
  localStorage.getItem('token') || sessionStorage.getItem('token')

// Devolve os dados do utilizador (id, nome, perfil, etc.), ou null se não existir
export const getUtilizador = () => {
  const dados =
    localStorage.getItem('utilizador') || sessionStorage.getItem('utilizador')
  return dados ? JSON.parse(dados) : null
}

// Devolve o perfil do utilizador: 'consultor', 'talent_manager', 'service_line', 'administrador'
export const getPerfil = () => {
  const utilizador = getUtilizador()
  return utilizador?.perfil || null
}

// Verifica se o utilizador está autenticado (tem token)
export const estaAutenticado = () => !!getToken()

// Apaga todos os dados da sessão — usado no logout
export const limparSessao = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('utilizador')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('utilizador')
}

// Grava uma sessão nova — usado no login
// Limpa SEMPRE os dois storages primeiro, para nunca ficar lixo de uma sessão
// anterior (ex: outro utilizador que fechou o browser sem fazer logout)
export const guardarSessao = (token, utilizador, manterSessao) => {
  limparSessao()
  const storage = manterSessao ? localStorage : sessionStorage
  storage.setItem('token', token)
  storage.setItem('utilizador', JSON.stringify(utilizador))
}