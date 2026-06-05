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
    <div className="dashboard-layout">
      {/* Topbar fixa no topo — ocupa toda a largura */}
      <div className="dashboard-top">
        <Topbar />
      </div>

      {/* Corpo — sidebar + conteúdo */}
      <div className="dashboard-body">
        <Sidebar navItems={NAV_ITEMS} perfil="Consultor" />
        <div className="dashboard-main">
          <main className="dashboard-content">
            {/* Conteúdo aqui */}
          </main>
        </div>
      </div>
    </div>
  )
}