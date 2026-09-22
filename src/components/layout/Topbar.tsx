import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PawPrint, ChevronDown, LogOut, Building2, RotateCcw, Menu } from 'lucide-react';

interface TopbarProps {
  isMobile: boolean;
  onToggleMobileMenu: () => void;
}

export const Topbar = ({ isMobile, onToggleMobileMenu }: TopbarProps) => {
  const { currentUser, users, switchUser, logout } = useAuth();
  const { resetDemoData } = useData();

  if (!currentUser) return null;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Menu Hamburger Button */}
          {isMobile && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer shrink-0 border border-slate-200"
              aria-label="Abrir menu de navegação"
              title="Abrir Menu de Navegação"
            >
              <Menu className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-700">Menu</span>
            </button>
          )}

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-600/20 shrink-0">
            <PawPrint className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Pet<span className="text-sky-600">Hub</span>
              </span>
              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                Enterprise
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 hidden md:block">
              Gestão Integrada para Complexos Pet
            </p>
          </div>
        </div>

        {/* Right Section: Workspace Context & User */}
        <div className="flex items-center gap-3">
          {/* Reset Demo Data Button */}
          <button
            onClick={() => {
              if (window.confirm('Deseja recarregar a base com todos os novos fluxos de agendamento e confirmação do cliente?')) {
                resetDemoData();
                window.location.reload();
              }
            }}
            title="Restaurar dados com novos agendamentos e canais"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 border border-slate-200 rounded-xl text-xs font-semibold transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-600" />
            <span>Sincronizar Dados Demo</span>
          </button>

          {/* Workspace Switcher */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-500 font-medium hidden md:inline">Visão:</span>
            <div className="relative">
              <select
                value={currentUser.id}
                onChange={(e) => switchUser(e.target.value)}
                aria-label="Alternar contexto de acesso"
                className="appearance-none bg-transparent text-slate-800 text-xs font-semibold pr-6 cursor-pointer focus:outline-none"
              >
                {users.map((u) => {
                  let perfilLabel = 'Administrador';
                  if (u.perfil === 'SOCIO_A') perfilLabel = 'Clínica & Pet Shop';
                  if (u.perfil === 'SOCIO_B') perfilLabel = 'Hotel & Creche';
                  if (u.perfil === 'VET') perfilLabel = 'Veterinário';
                  if (u.perfil === 'FUNCIONARIO') perfilLabel = 'Atendimento';
                  if (u.perfil === 'TUTOR') perfilLabel = 'Cliente';

                  return (
                    <option key={u.id} value={u.id}>
                      {u.nome} — {perfilLabel}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Current User Badge */}
          <div className="flex items-center gap-2.5 pl-2 sm:pl-3 sm:border-l sm:border-slate-200">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              {currentUser.nome.charAt(0)}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {currentUser.nome}
              </div>
              <div className="text-[11px] font-medium text-slate-500">
                {currentUser.perfil === 'SOCIO_A' && 'Diretoria • Clínica & Pet Shop'}
                {currentUser.perfil === 'SOCIO_B' && 'Diretoria • Hotel & Daycare'}
                {currentUser.perfil === 'ADMIN' && 'Administração Geral'}
                {currentUser.perfil === 'VET' && 'Médico Veterinário'}
                {currentUser.perfil === 'FUNCIONARIO' && 'Equipe de Atendimento'}
                {currentUser.perfil === 'TUTOR' && 'Cliente'}
              </div>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={logout}
            title="Encerrar sessão"
            className="flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-xs font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};
