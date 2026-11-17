import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, OperatingUnit } from '../types';
import { INITIAL_USERS } from '../data/mockData';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  authToken: string | null;
  cognitoToken: string | null;
  getValidCognitoToken: () => string | null;
  invalidateCognitoToken: () => void;
  updateCurrentUserProfile: (fields: { nome?: string; email?: string }) => void;
  login: (email: string, password?: string) => boolean;
  loginWithGoogle: (credential: string) => { success: boolean; message?: string };
  loginWithCognito: (provider?: 'Google', redirectAfter?: string) => void;
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

interface DecodedJwtPayload {
  email?: string;
  name?: string;
  sub?: string;
  iss?: string;
  exp?: number;
  'cognito:username'?: string;
}

const decodeGoogleCredential = (token: string): DecodedJwtPayload | null => {
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
    console.error('Erro ao decodificar token JWT:', err);
    return null;
  }
};

const isCognitoJwtValid = (token: string | null): boolean => {
  if (!token) return false;
  const payload = decodeGoogleCredential(token);
  if (!payload || !payload.iss || !payload.iss.includes('cognito-idp.')) return false;
  if (payload.exp && payload.exp * 1000 <= Date.now()) return false;
  return true;
};

const readHashIdToken = (): string | null => {
  if (typeof window === 'undefined' || !window.location.hash) return null;
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.substring(1)
    : window.location.hash;
  return new URLSearchParams(hash).get('id_token');
};

const isSyntheticProviderUsername = (val?: string): boolean =>
  Boolean(val && /^(google|facebook|amazon|apple|saml|oidc)_[\w.-]+$/i.test(val.trim()));

const buildDisplayNameFromPayload = (payload: DecodedJwtPayload): string => {
  const rawName = (payload.name || '').trim();
  if (rawName && !isSyntheticProviderUsername(rawName)) {
    return rawName;
  }
  const username = (payload['cognito:username'] || '').trim();
  if (username && !isSyntheticProviderUsername(username)) {
    return username;
  }
  if (payload.email) {
    return payload.email
      .split('@')[0]
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  return 'Usuário Cognito';
};

const buildUserFromPayload = (payload: DecodedJwtPayload, existingUsers: User[]): User | null => {
  if (!payload.email && !payload.sub) return null;
  const matched = payload.email
    ? existingUsers.find((u) => u.email.toLowerCase() === payload.email!.toLowerCase())
    : undefined;
  if (matched) return matched;
  const isRealCognito = Boolean(payload.iss && payload.iss.includes('cognito-idp.'));
  return {
    id: `${isRealCognito ? 'cognito' : 'google'}-${payload.sub || Math.random().toString(36).substring(2, 9)}`,
    nome: buildDisplayNameFromPayload(payload),
    email: payload.email || '',
    perfil: 'ADMIN',
    unidadesAutorizadas: ['CLINICA', 'PETSHOP', 'HOTEL', 'CRECHE'],
    ativo: true,
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const hashToken = readHashIdToken();
    if (hashToken) {
      const payload = decodeGoogleCredential(hashToken);
      if (payload) {
        const userFromHash = buildUserFromPayload(payload, INITIAL_USERS);
        if (userFromHash) return userFromHash;
      }
    }

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
    const hashToken = readHashIdToken();
    if (hashToken) return hashToken;
    return localStorage.getItem('pethub_jwt_token') || null;
  });

  const [cognitoToken, setCognitoToken] = useState<string | null>(() => {
    const hashToken = readHashIdToken();
    if (isCognitoJwtValid(hashToken)) return hashToken;
    const saved = localStorage.getItem('pethub_cognito_id_token');
    return isCognitoJwtValid(saved) ? saved : null;
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

  useEffect(() => {
    if (cognitoToken && isCognitoJwtValid(cognitoToken)) {
      localStorage.setItem('pethub_cognito_id_token', cognitoToken);
    } else {
      localStorage.removeItem('pethub_cognito_id_token');
    }
  }, [cognitoToken]);

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

  const loginWithCognito = (provider?: 'Google', redirectAfter?: string) => {
    const domain =
      import.meta.env.VITE_COGNITO_DOMAIN ||
      'https://us-east-1wfnrpejee.auth.us-east-1.amazoncognito.com';
    const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID || '5qvdtepvfcgd07q5en3bm8spv7';
    const responseType = import.meta.env.VITE_COGNITO_RESPONSE_TYPE || 'token';
    const redirectUri = window.location.origin;

    if (redirectAfter) {
      sessionStorage.setItem('pethub_post_cognito_redirect', redirectAfter);
    }

    const providerParam = provider ? `identity_provider=${provider}&` : '';
    const cognitoUrl = `${domain}/oauth2/authorize?${providerParam}client_id=${clientId}&response_type=${responseType}&scope=email+openid&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = cognitoUrl;
  };

  const loginWithGoogle = (credential: string): { success: boolean; message?: string } => {
    const payload = decodeGoogleCredential(credential);
    const isRealCognito = Boolean(payload?.iss && payload.iss.includes('cognito-idp.'));

    if (isRealCognito) {
      console.log(
        '%c🔐 TOKEN JWT REAL DO AWS COGNITO (Autorizado para API Gateway /profile):',
        'color: #0284c7; font-weight: bold; font-size: 13px;'
      );
      console.log(credential);
      localStorage.setItem('pethub_cognito_id_token', credential);
      setCognitoToken(credential);
    } else {
      // Salva o token JWT original emitido pelo Google no localStorage para inspeção
      localStorage.setItem('google_id_token', credential);
      console.log(
        '%c🔑 TOKEN JWT GERADO PELO GOOGLE (Copie para o https://jwt.io):',
        'color: #10b981; font-weight: bold; font-size: 14px;'
      );
      console.log(credential);
    }

    if (!payload || (!payload.email && !payload.sub)) {
      return { success: false, message: 'Não foi possível validar o token de autenticação.' };
    }

    let user = payload.email
      ? users.find((u) => u.email.toLowerCase() === payload.email!.toLowerCase())
      : undefined;

    if (!user) {
      // Usuário autenticado externamente não estava no mock pré-definido:
      // cria perfil ativo no sistema com permissões de visualização/administração
      user = {
        id: `${isRealCognito ? 'cognito' : 'google'}-${payload.sub || Math.random().toString(36).substring(2, 9)}`,
        nome: buildDisplayNameFromPayload(payload),
        email: payload.email || '',
        perfil: 'ADMIN',
        unidadesAutorizadas: ['CLINICA', 'PETSHOP', 'HOTEL', 'CRECHE'],
        ativo: true,
      };
      setUsers((prev) => [...prev, user!]);
    }

    if (!user.ativo) {
      return { success: false, message: 'Usuário desativado pelo administrador.' };
    }

    const token = isRealCognito ? credential : generateJwtPayload(user);
    setCurrentUser(user);
    setAuthToken(token);
    return { success: true };
  };

  // Limpa hash #id_token=... após inicialização síncrona ou trata callback ?code=...
  useEffect(() => {
    const hashToken = readHashIdToken();
    if (hashToken) {
      if (isCognitoJwtValid(hashToken)) {
        console.log(
          '%c🔐 TOKEN JWT REAL DO AWS COGNITO (Autorizado para API Gateway /profile):',
          'color: #0284c7; font-weight: bold; font-size: 13px;'
        );
        console.log(hashToken);
      }
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    // Fallback para Authorization Code (?code=...)
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

  const invalidateCognitoToken = () => {
    setCognitoToken(null);
    localStorage.removeItem('pethub_cognito_id_token');
  };

  const getValidCognitoToken = (): string | null => {
    if (!cognitoToken) return null;
    if (!isCognitoJwtValid(cognitoToken)) {
      invalidateCognitoToken();
      return null;
    }
    return cognitoToken;
  };

  useEffect(() => {
    const checkExpiry = () => {
      if (cognitoToken && !isCognitoJwtValid(cognitoToken)) {
        invalidateCognitoToken();
      }
    };
    window.addEventListener('focus', checkExpiry);
    return () => window.removeEventListener('focus', checkExpiry);
  }, [cognitoToken]);

  const logout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    setCognitoToken(null);
    localStorage.removeItem('pethub_current_user_id');
    localStorage.removeItem('pethub_current_user_data');
    localStorage.removeItem('pethub_jwt_token');
    localStorage.removeItem('pethub_cognito_id_token');
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

  const updateCurrentUserProfile = ({ nome, email }: { nome?: string; email?: string }) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const nextNome = nome?.trim() || prev.nome;
      const nextEmail = email?.trim() || prev.email;
      if (nextNome === prev.nome && nextEmail === prev.email) return prev;
      return {
        ...prev,
        nome: nextNome,
        email: nextEmail,
      };
    });
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
        cognitoToken,
        getValidCognitoToken,
        invalidateCognitoToken,
        updateCurrentUserProfile,
        login,
        loginWithGoogle,
        loginWithCognito,
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
