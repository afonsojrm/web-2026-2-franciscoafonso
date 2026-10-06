import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, OperatingUnit } from '../types';
import { INITIAL_USERS } from '../data/mockData';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  authToken: string | null;
  login: (email: string, password?: string) => boolean;
  loginWithGoogle: (credential: string) => { success: boolean; message?: string };
  quickLogin: (userId: string) => void;
  logout: () => void;
  switchUser: (userId: string) => void;
  canAccessUnit: (unit: OperatingUnit) => boolean;
  canManageMedicalRecords: () => boolean;
  canManageFinancial: () => boolean;
  canManageInventory: () => boolean;
  canManageBookings: () => boolean;
  canAccessAudit: () => boolean;
}

const decodeGoogleCredential = (token: string): { email?: string; name?: string; sub?: string } | null => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Erro ao decodificar token do Google:', err);
    return null;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUserId = localStorage.getItem('pethub_current_user_id');
    const savedToken = localStorage.getItem('pethub_jwt_token');
    const savedUserData = localStorage.getItem('pethub_current_user_data');
    if (savedUserId && savedToken) {
      if (savedUserData) {
        try {
          return JSON.parse(savedUserData);
        } catch {
          // fallback
        }
      }
      return INITIAL_USERS.find((u) => u.id === savedUserId) || null;
    }
    return null;
  });

  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('pethub_jwt_token') || null;
  });

  useEffect(() => {
    if (currentUser && authToken) {
      localStorage.setItem('pethub_current_user_id', currentUser.id);
      localStorage.setItem('pethub_current_user_data', JSON.stringify(currentUser));
      localStorage.setItem('pethub_jwt_token', authToken);
    } else {
      localStorage.removeItem('pethub_current_user_id');
      localStorage.removeItem('pethub_current_user_data');
      localStorage.removeItem('pethub_jwt_token');
    }
  }, [currentUser, authToken]);

  const generateJwtPayload = (user: User) => {
    // Simulated JWT token following the specification RF01.1
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: user.id,
        name: user.nome,
        role: user.perfil,
        units: user.unidadesAutorizadas,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h
      })
    );
    const signature = 'aws_jwt_sig_pethub2026';
    return `${header}.${payload}.${signature}`;
  };

  const login = (email: string, _password?: string): boolean => {
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (user && user.ativo) {
      const token = generateJwtPayload(user);
      setCurrentUser(user);
      setAuthToken(token);
      return true;
    }
    return false;
  };

  const loginWithGoogle = (credential: string): { success: boolean; message?: string } => {
    // Salva o token JWT original emitido pelo Google no localStorage para inspeção (Print 2 da entrega)
    localStorage.setItem('google_id_token', credential);
    console.log('%c🔑 TOKEN JWT GERADO PELO GOOGLE (Copie para o https://jwt.io):', 'color: #10b981; font-weight: bold; font-size: 14px;');
    console.log(credential);

    const payload = decodeGoogleCredential(credential);
    if (!payload || !payload.email) {
      return { success: false, message: 'Não foi possível validar o token de autenticação do Google.' };
    }

    let user = users.find((u) => u.email.toLowerCase() === payload.email!.toLowerCase());

    if (!user) {
      // Usuário autenticado com o Google não estava no mock pré-definido,
      // cria um perfil ativo no sistema com permissões completas de visualização/administração
      user = {
        id: `google-${payload.sub || Math.random().toString(36).substring(2, 9)}`,
        nome: payload.name || payload.email.split('@')[0],
        email: payload.email,
        perfil: 'ADMIN',
        unidadesAutorizadas: ['CLINICA', 'PETSHOP', 'HOTEL', 'CRECHE'],
        ativo: true,
      };
      setUsers((prev) => [...prev, user!]);
    }

    if (!user.ativo) {
      return { success: false, message: 'Usuário desativado pelo administrador.' };
    }

    const token = generateJwtPayload(user);
    setCurrentUser(user);
    setAuthToken(token);
    return { success: true };
  };

  // Tratar retorno de autenticação do AWS Cognito (Implicit Grant #id_token=... ou Authorization Code ?code=...)
  useEffect(() => {
    // 1. Verificar fragmento de hash (#id_token=...)
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.substring(1)
      : window.location.hash;

    if (hash) {
      const params = new URLSearchParams(hash);
      const idToken = params.get('id_token');
      if (idToken) {
        loginWithGoogle(idToken);
        window.history.replaceState(null, '', window.location.pathname);
        return;
      }
    }

    // 2. Verificar parâmetro de busca de código (?code=...)
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    if (code) {
      const domain = import.meta.env.VITE_COGNITO_DOMAIN;
      const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
      const redirectUri = window.location.origin;

      if (domain && clientId) {
        fetch(`${domain}/oauth2/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            redirect_uri: redirectUri,
            code: code,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.id_token) {
              loginWithGoogle(data.id_token);
              window.history.replaceState(null, '', window.location.pathname);
            }
          })
          .catch((err) => {
            console.warn('Erro ao processar callback do Cognito:', err);
          });
      }
    }
  }, []);

  const quickLogin = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user && user.ativo) {
      const token = generateJwtPayload(user);
      setCurrentUser(user);
      setAuthToken(token);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('pethub_current_user_id');
    localStorage.removeItem('pethub_jwt_token');
  };

  const switchUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      const token = generateJwtPayload(user);
      setCurrentUser(user);
      setAuthToken(token);
    }
  };

  const canAccessUnit = (unit: OperatingUnit): boolean => {
    if (!currentUser) return false;
    if (currentUser.perfil === 'ADMIN') return true;
    return currentUser.unidadesAutorizadas.includes(unit);
  };

  const canManageMedicalRecords = (): boolean => {
    if (!currentUser) return false;
    return currentUser.perfil === 'ADMIN' || currentUser.perfil === 'VET';
  };

  const canManageFinancial = (): boolean => {
    if (!currentUser) return false;
    return (
      currentUser.perfil === 'ADMIN' ||
      currentUser.perfil === 'SOCIO_A' ||
      currentUser.perfil === 'SOCIO_B'
    );
  };

  const canManageInventory = (): boolean => {
    if (!currentUser) return false;
    return (
      currentUser.perfil === 'ADMIN' ||
      currentUser.perfil === 'SOCIO_A' ||
      currentUser.perfil === 'FUNCIONARIO'
    );
  };

  const canManageBookings = (): boolean => {
    if (!currentUser) return false;
    return (
      currentUser.perfil === 'ADMIN' ||
      currentUser.perfil === 'SOCIO_B' ||
      currentUser.perfil === 'FUNCIONARIO'
    );
  };

  const canAccessAudit = (): boolean => {
    if (!currentUser) return false;
    return currentUser.perfil === 'ADMIN';
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isAuthenticated: !!currentUser && !!authToken,
        authToken,
        login,
        loginWithGoogle,
        quickLogin,
        logout,
        switchUser,
        canAccessUnit,
        canManageMedicalRecords,
        canManageFinancial,
        canManageInventory,
        canManageBookings,
        canAccessAudit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
