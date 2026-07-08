import Topbar from '../../../components/Topbar'
import Sidebar, { icons } from '../../../components/Sidebar'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: icons.dashboard },
  { label: 'Utilizadores', path: '/admin/utilizadores', icon: icons.utilizadores },
  { label: 'Learning Paths', path: '/admin/learning-paths', icon: icons.relatorios },
  { label: 'Badges', path: '/admin/badges', icon: icons.badges },
  { label: 'Candidaturas', path: '/admin/candidaturas', icon: icons.pedidos },
  { label: 'Relatórios', path: '/admin/relatorios', icon: icons.relatorios },
]

export default function LayoutAdmin({ children }) {
  return (
    <div className="pg-layout">
      <div className="pg-top">
        <Topbar />
      </div>
      <div className="container-fluid pg-body">
        <div className="row h-100">
          <div className="col-auto d-none d-md-flex p-0">
            <Sidebar navItems={NAV_ITEMS} perfil="Administrador" />
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