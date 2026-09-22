import { Link, useLocation } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';

interface RouteMeta {
  section?: string;
  name: string;
}

const ROUTE_MAP: Record<string, RouteMeta> = {
  '/': { name: 'Painel Geral' },
  '/tutores': { section: 'Cadastros Centrais', name: 'Tutores' },
  '/pets': { section: 'Cadastros Centrais', name: 'Animais' },
  '/agendamentos': { section: 'Agendamentos', name: 'Solicitações de Clientes' },
  '/clinica': { section: 'Saúde & Comércio', name: 'Clínica Veterinária' },
  '/shop': { section: 'Saúde & Comércio', name: 'Pet Shop & PDV' },
  '/hotel': { section: 'Hospedagem & Recreação', name: 'Hotel Pet' },
  '/creche': { section: 'Hospedagem & Recreação', name: 'Creche / Daycare' },
  '/financeiro': { section: 'Gestão & Controle', name: 'Fluxo Financeiro' },
  '/auditoria': { section: 'Gestão & Controle', name: 'Trilha de Auditoria' },
};

export const Breadcrumbs = () => {
  const location = useLocation();
  const currentMeta = ROUTE_MAP[location.pathname] || { name: 'Página' };

  if (location.pathname === '/') {
    return null;
  }

  return (
    <nav aria-label="Navegação em migalhas de pão" className="mb-4 flex items-center gap-1.5 text-xs text-slate-400">
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-sky-600 transition-colors py-0.5 text-slate-500 font-medium"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Início</span>
      </Link>

      {currentMeta.section && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="text-slate-500 font-medium hidden sm:inline">{currentMeta.section}</span>
        </>
      )}

      <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
      <span className="text-slate-800 font-semibold truncate">{currentMeta.name}</span>
    </nav>
  );
};
