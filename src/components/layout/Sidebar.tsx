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
} from 'lucide-react';
import type { OperatingUnit } from '../../types';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  unit?: OperatingUnit;
}

export const Sidebar = () => {
  const { currentUser, canAccessUnit, canManageFinancial, canAccessAudit } = useAuth();

  if (!currentUser) return null;

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
        className={({ isActive }) =>
          `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            isActive
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`
        }
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4" />
          <span>{item.name}</span>
        </div>
      </NavLink>
    );
  };

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
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
    </aside>
  );
};
