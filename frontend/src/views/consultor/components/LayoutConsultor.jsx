// src/views/consultor/components/LayoutConsultor.jsx
// Layout partilhado por todos os ecrãs do perfil Consultor —
// segue exatamente o mesmo padrão do LayoutSL.jsx (Service Line Leader)

import Topbar from '../../../components/Topbar'
import Sidebar, { icons } from '../../../components/Sidebar'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/consultor/dashboard', icon: icons.dashboard },
  { label: 'Badges', path: '/consultor/badges', icon: icons.badges },
  { label: 'Pedidos', path: '/consultor/pedidos', icon: icons.pedidos },
  { label: 'Objetivos', path: '/consultor/objetivos', icon: icons.objetivos },
  { label: 'Gamification', path: '/consultor/gamification', icon: icons.gamification },
]

export default function LayoutConsultor({ children }) {
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
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
