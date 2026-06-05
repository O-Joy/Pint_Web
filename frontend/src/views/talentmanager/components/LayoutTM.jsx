import Topbar from '../../../components/Topbar'
import Sidebar, { icons } from '../../../components/Sidebar'

const NAV_ITEMS = [
  { label: 'Dashboard',    path: '/talent/dashboard',    icon: icons.dashboard },
  { label: 'Badges',       path: '/talent/badges',       icon: icons.badges },
  { label: 'Validações',   path: '/talent/validacoes',   icon: icons.validacoes },
  { label: 'Consultores',  path: '/talent/consultores',  icon: icons.utilizadores },
  { label: 'Relatórios',   path: '/talent/relatorios',   icon: icons.relatorios },
  { label: 'Gamification', path: '/talent/gamification', icon: icons.gamification },
]

export default function LayoutTM({ children }) {
  return (
    <div className="pg-layout">
      <div className="pg-top">
        <Topbar />
      </div>
      <div className="container-fluid pg-body">
        <div className="row h-100">
          <div className="col-auto d-none d-md-flex p-0">
            <Sidebar navItems={NAV_ITEMS} perfil="Talent Manager" />
          </div>
          <div className="col">
            <main className="pg-content">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}