import Topbar from '../../components/Topbar'
import Sidebar, { icons } from '../../components/Sidebar'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/consultor/dashboard', icon: icons.dashboard },
  { label: 'Badges', path: '/consultor/badges', icon: icons.badges },
  { label: 'Pedidos', path: '/consultor/pedidos', icon: icons.pedidos },
  { label: 'Objetivos', path: '/consultor/objetivos', icon: icons.objetivos },
  { label: 'Gamification', path: '/consultor/gamification', icon: icons.gamification },
]

export default function DashboardConsultor() {
  return (
    <div className="pg-layout">
      {/* Topbar — linha completa no topo */}
      <div className="pg-top">
        <Topbar />
      </div>

      {/* Corpo — row do Bootstrap */}
      <div className="container-fluid pg-body">
        <div className="row h-100">

          {/* Sidebar — col automática, esconde em xs/sm */}
          <div className="col-auto d-none d-md-flex p-0">
            <Sidebar navItems={NAV_ITEMS} perfil="Consultor" />
          </div>

          {/* Conteúdo — ocupa o resto */}
          <div className="col">
            <main className="pg-content">
              {/* Conteúdo aqui */}
            </main>
          </div>

        </div>
      </div>
    </div>
  )
}