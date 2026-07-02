import Topbar from "../../../components/Topbar";
import Sidebar, {icons} from "../../../components/Sidebar";

const NAV_ITEMS = [
  { label: 'Dashboard',    path: '/serviceline/dashboard',    icon: icons.dashboard },
  { label: 'Validações',   path: '/serviceline/validacoesSL',   icon: icons.validacoes },
  { label: 'Badges',       path: '/serviceline/badges',       icon: icons.badges },
  { label: 'Consultores',  path: '/serviceline/consultores',  icon: icons.utilizadores },
  { label: 'Relatórios',   path: '/serviceline/relatorios',   icon: icons.relatorios },
  { label: 'Gamification', path: '/serviceline/gamification', icon: icons.pedidos },
]

export default function LayoutSL({ children }) {
    return (
        <div className="pg-layout">
            <div className="pg-top">
                <Topbar />
            </div>
            <div className="container-fluid pg-body">
                <div className="row h-100">
                    <div className="col-auto d-none d-md-flex p-0">
                        <Sidebar navItems={NAV_ITEMS} perfil="Service Line Leader" />
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