// src/views/consultor/Notificacoes.jsx
import Topbar from '../../components/Topbar'
import Sidebar, { icons } from '../../components/Sidebar'
import NotificacoesConteudo from '../../components/NotificacoesConteudo'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/consultor/dashboard', icon: icons.dashboard },
  { label: 'Badges', path: '/consultor/badges', icon: icons.badges },
  { label: 'Pedidos', path: '/consultor/pedidos', icon: icons.pedidos },
  { label: 'Objetivos', path: '/consultor/objetivos', icon: icons.objetivos },
  { label: 'Gamification', path: '/consultor/gamification', icon: icons.gamification },
]

export default function Notificacoes() {
  return (
    <div className="pg-layout">
      <div className="pg-top">
        <Topbar />
      </div>

      <div className="container-fluid pg-body">
        <div className="row h-100">
          <div className="col-auto d-none d-md-flex p-0">
            <Sidebar navItems={NAV_ITEMS} perfil="Consultor" />
          </div>

          <div className="col">
            <main className="pg-content">
              <div className="p-4">
                <NotificacoesConteudo />
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
