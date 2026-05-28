// api.js — Serviço de comunicação com o backend
// Centraliza todos os pedidos HTTP à API REST
// Usa axios para fazer os pedidos

import axios from 'axios'

// URL base do backend — todos os pedidos começam aqui
const BASE_URL = 'http://localhost:3001/api'

// Instância do axios configurada com a URL base
const api = axios.create({
  baseURL: BASE_URL,
})

// Interceptor — antes de cada pedido, injeta o token JWT no header
// O token pode estar no localStorage (sessão permanente) ou sessionStorage (sessão temporária)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── AUTENTICAÇÃO ──

// Login — envia email e password, recebe token JWT e dados do utilizador
export const login = (email, password) =>
  api.post('/auth/login', { email, password })

// Recuperar password — envia email e o backend envia o código para esse email
// NOTA: como os emails são fictícios, o código é enviado para o email configurado no .env do servidor
export const recuperarPassword = (email) =>
  api.post('/auth/recuperar-password', { email })

// Verificar código — valida o código de 6 dígitos recebido por email
// Devolve um token_reset temporário para usar no ecrã seguinte
export const verificarCodigo = (email, codigo) =>
  api.post('/auth/verificar-codigo', { email, codigo })

// Redefinir password — usa o token_reset para definir a nova password
export const redefinirPassword = (tokenReset, novaPassword) =>
  api.put('/auth/redefinir-password', {
    token_reset: tokenReset,
    nova_password: novaPassword,
  })

// Configuração inicial — guarda a área escolhida no primeiro login
export const configuracaoInicial = (idArea) =>
  api.put('/auth/configuracao-inicial', { idArea })

// Listar áreas — para o dropdown do ecrã de escolha de área
export const getAreas = () => api.get('/areas')

export default api