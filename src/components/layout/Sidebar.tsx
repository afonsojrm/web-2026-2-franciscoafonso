import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Dog,
  Stethoscope,
  ShoppingBag,
  BedDouble,
  Sun,
  DollarSign,
  History,
  CalendarCheck,
  X,
  PawPrint,
  LogOut,
} from 'lucide-react';
import type { OperatingUnit } from '../../types';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  unit?: OperatingUnit;
}

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isMobile, isOpen, onClose }: SidebarProps) => {
  const { currentUser, canAccessUnit, canManageFinancial, canAccessAudit, logout } = useAuth();

  if (!currentUser) return null;

  // No mobile, se não estiver aberto, não renderiza absolutamente NADA no DOM
  if (isMobile && !isOpen) {
    return null;
  }

  const coreItems: NavItem[] = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    ...(currentUser.perfil !== 'TUTOR'
      ? [
          { name: 'Tutores', path: '/tutores', icon: Users },
          { name: 'Animais', path: '/pets', icon: Dog },
          { name: 'Agendamentos Online', path: '/agendamentos', icon: CalendarCheck },
        ]
      : [
          { name: 'Meus Animais', path: '/pets', icon: Dog },
          { name: 'Agendamentos Online', path: '/agendamentos', icon: CalendarCheck },
        ]),
  ];

  const healthItems: NavItem[] = (
    [
      { name: 'Clínica Veterinária', path: '/clinica', icon: Stethoscope, unit: 'CLINICA' },
      { name: 'Pet Shop & PDV', path: '/shop', icon: ShoppingBag, unit: 'PETSHOP' },
    ] as NavItem[]
  ).filter((item) => (item.unit ? canAccessUnit(item.unit) : true));

  const hospitalityItems: NavItem[] = (
    [
      { name: 'Hotel Pet', path: '/hotel', icon: BedDouble, unit: 'HOTEL' },
      { name: 'Creche / Daycare', path: '/creche', icon: Sun, unit: 'CRECHE' },
    ] as NavItem[]
  ).filter((item) => (item.unit ? canAccessUnit(item.unit) : true));

  const managementItems: NavItem[] = [
    ...(canManageFinancial()
      ? [{ name: 'Financeiro', path: '/financeiro', icon: DollarSign }]
      : []),
    ...(canAccessAudit()
      ? [{ name: 'Auditoria de Eventos', path: '/auditoria', icon: History }]
      : []),
  ];

  const renderLink = (item: NavItem) => {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={() => {
          if (isMobile) onClose();
        }}
        className={({ isActive }) =>
          `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            isActive
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`
        }
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 shrink-0" />
          <span className="truncate">{item.name}</span>
        </div>
      </NavLink>
    );
  };

  const navContent = (
    <div className="space-y-6">
      {/* Core Sections */}
      {coreItems.length > 0 && (
        <div>
          <span className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-400">
            Cadastros Centrais
          </span>
          <nav className="mt-2 space-y-1">{coreItems.map(renderLink)}</nav>
        </div>
      )}

      {/* Health & Retail */}
      {healthItems.length > 0 && (
        <div>
          <span className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-400">
            Saúde & Comércio
          </span>
          <nav className="mt-2 space-y-1">{healthItems.map(renderLink)}</nav>
        </div>
      )}

      {/* Hospitality & Care */}
      {hospitalityItems.length > 0 && (
        <div>
          <span className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-400">
            Hospedagem & Recreação
          </span>
          <nav className="mt-2 space-y-1">{hospitalityItems.map(renderLink)}</nav>
        </div>
      )}

      {/* Management & Audit */}
      {managementItems.length > 0 && (
        <div>
          <span className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-400">
            Gestão & Controle
          </span>
          <nav className="mt-2 space-y-1">{managementItems.map(renderLink)}</nav>
        </div>
      )}
    </div>
  );

  // MODO MOBILE: Renderiza como Gaveta Modal com fundo escurecido
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex animate-in fade-in duration-150">
        {/* Backdrop de sobreposição */}
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity cursor-pointer"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Painel lateral da gaveta */}
        <aside
          aria-label="Menu de Navegação Mobile"
          className="relative z-10 w-72 max-w-[85vw] bg-white h-full border-r border-slate-200 p-5 flex flex-col justify-between shadow-2xl overflow-y-auto"
        >
          <div>
            {/* Header com Logo e Botão Fechar */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm">
                  <PawPrint className="w-4 h-4" />
                </div>
                <span className="text-base font-bold text-slate-900">
                  Pet<span className="text-sky-600">Hub</span>
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar menu"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Perfil do Usuário no Mobile */}
            <div className="mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                  {currentUser.nome.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {currentUser.nome}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {currentUser.perfil === 'SOCIO_A' && 'Clínica & Pet Shop'}
                    {currentUser.perfil === 'SOCIO_B' && 'Hotel & Daycare'}
                    {currentUser.perfil === 'ADMIN' && 'Administrador Geral'}
                    {currentUser.perfil === 'VET' && 'Médico Veterinário'}
                    {currentUser.perfil === 'FUNCIONARIO' && 'Atendimento'}
                    {currentUser.perfil === 'TUTOR' && 'Cliente Tutor'}
                  </div>
                </div>
              </div>
            </div>

            {navContent}
          </div>

          {/* Rodapé Mobile Drawer com Logout */}
          <div className="pt-4 mt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onClose();
                logout();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-xs font-semibold border border-rose-100 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta</span>
            </button>
          </div>
        </aside>
      </div>
    );
  }

  // MODO WEB / DESKTOP (padrão fixo na lateral esquerda)
  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between overflow-y-auto">
      {navContent}
    </aside>
  );
};
