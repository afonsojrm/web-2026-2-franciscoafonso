import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, OperatingUnit } from '../types';
import { INITIAL_USERS } from '../data/mockData';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  authToken: string | null;
  login: (email: string, password?: string) => boolean;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [users] = useState<User[]>(INITIAL_USERS);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUserId = localStorage.getItem('pethub_current_user_id');
    const savedToken = localStorage.getItem('pethub_jwt_token');
    if (savedUserId && savedToken) {
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
      localStorage.setItem('pethub_jwt_token', authToken);
    } else {
      localStorage.removeItem('pethub_current_user_id');
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
