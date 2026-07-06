// src/views/consultor/Notificacoes.jsx
import LayoutConsultor from './components/LayoutConsultor'
import NotificacoesConteudo from '../../components/NotificacoesConteudo'

export default function Notificacoes() {
  return (
    <LayoutConsultor>
      <div className="p-4">
        <NotificacoesConteudo />
      </div>
    </LayoutConsultor>
  )
}