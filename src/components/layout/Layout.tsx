import { useState, useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from './Breadcrumbs';
import { ChatBotWidget } from '../common/ChatBotWidget';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useAuth } from '../../context/AuthContext';

export const Layout = ({ children }: { children: ReactNode }) => {
  // Detecta se a visualização atual é mobile / tablet (< 1024px)
  const isMobile = useIsMobile(1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { cognitoToken } = useAuth();

  useEffect(() => {
    if (cognitoToken) {
      const nextRoute = sessionStorage.getItem('pethub_post_cognito_redirect');
      if (nextRoute && nextRoute !== location.pathname) {
        sessionStorage.removeItem('pethub_post_cognito_redirect');
        navigate(nextRoute, { replace: true });
      }
    }
  }, [cognitoToken, location.pathname, navigate]);

  // Fecha o menu mobile automaticamente se a rota mudar
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setIsMobileMenuOpen(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      <Topbar
        isMobile={isMobile}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
      />
      <div className="flex-1 flex min-w-0 overflow-x-hidden relative">
        <Sidebar
          isMobile={isMobile}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 min-w-0 p-3.5 sm:p-6 overflow-y-auto max-w-7xl w-full">
          <Breadcrumbs />
          {children}
        </main>
      </div>
      <ChatBotWidget />
    </div>
  );
};
