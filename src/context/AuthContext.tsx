import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserProfile, OperatingUnit } from '../types';

const COGNITO_DIRECT_CLIENT_ID =
  import.meta.env.VITE_COGNITO_DIRECT_CLIENT_ID || '3q4bh38dq7k9peha8ihjahqaom';

const ROLE_UNITS_MAP: Record<UserProfile, OperatingUnit[]> = {
  ADMIN: ['CLINICA', 'PETSHOP', 'HOTEL', 'CRECHE'],
  SOCIO_A: ['CLINICA', 'PETSHOP'],
  SOCIO_B: ['HOTEL', 'CRECHE'],
  VET: ['CLINICA'],
  FUNCIONARIO: ['PETSHOP', 'HOTEL', 'CRECHE'],
  TUTOR: [],
};

interface CognitoProfileClaims {
  name: string;
  email: string;
  picture: string;
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  authToken: string | null;
  cognitoToken: string | null;
  cognitoProfileClaims: CognitoProfileClaims | null;
  getValidCognitoToken: () => string | null;
  invalidateCognitoToken: () => void;
  updateCurrentUserProfile: (fields: { nome?: string; email?: string }) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: (credential: string) => { success: boolean; message?: string };
  loginWithCognito: (provider?: 'Google', redirectAfter?: string) => void;
  logout: () => void;
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
  picture?: string;
  sub?: string;
  iss?: string;
  exp?: number;
  'cognito:username'?: string;
  'cognito:groups'?: string[];
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

const resolveProfileFromGroups = (groups?: string[]): UserProfile => {
  if (!Array.isArray(groups) || groups.length === 0) return 'ADMIN';
  const orderedRoles: UserProfile[] = ['ADMIN', 'SOCIO_A', 'SOCIO_B', 'VET', 'FUNCIONARIO', 'TUTOR'];
  for (const role of orderedRoles) {
    if (groups.includes(role)) {
      return role;
    }
  }
  return 'ADMIN';
};

const buildUserFromPayload = (payload: DecodedJwtPayload): User | null => {
  if (!payload.email && !payload.sub) return null;
  const perfil = resolveProfileFromGroups(payload['cognito:groups']);
  return {
    id: `cognito-${payload.sub || Math.random().toString(36).substring(2, 9)}`,
    nome: buildDisplayNameFromPayload(payload),
    email: payload.email || '',
    perfil,
    unidadesAutorizadas: ROLE_UNITS_MAP[perfil],
    ativo: true,
    crmv: perfil === 'VET' ? 'CRMV-RN 14205' : undefined,
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const hashToken = readHashIdToken();
    if (hashToken && isCognitoJwtValid(hashToken)) {
      const payload = decodeGoogleCredential(hashToken);
      if (payload) {
        const userFromHash = buildUserFromPayload(payload);
        if (userFromHash) return userFromHash;
      }
    }

    const savedCognito = localStorage.getItem('pethub_cognito_id_token');
    if (isCognitoJwtValid(savedCognito)) {
      const savedUserData = localStorage.getItem('pethub_current_user_data');
      if (savedUserData) {
        try {
          const parsed = JSON.parse(savedUserData) as User;
          if (parsed?.id?.startsWith('cognito-')) {
            return parsed;
          }
        } catch {
          // fallback para decodificação do token Cognito
        }
      }
      const payload = decodeGoogleCredential(savedCognito!);
      if (payload) return buildUserFromPayload(payload);
    }

    return null;
  });

  const [authToken, setAuthToken] = useState<string | null>(() => {
    const hashToken = readHashIdToken();
    if (isCognitoJwtValid(hashToken)) return hashToken;
    const savedCognito = localStorage.getItem('pethub_cognito_id_token');
    return isCognitoJwtValid(savedCognito) ? savedCognito : null;
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
    const cognitoUrl = `${domain}/oauth2/authorize?${providerParam}client_id=${clientId}&response_type=${responseType}&scope=email+openid+profile&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = cognitoUrl;
  };

  const loginWithGoogle = (credential: string): { success: boolean; message?: string } => {
    const payload = decodeGoogleCredential(credential);
    if (!payload || !isCognitoJwtValid(credential)) {
      return { success: false, message: 'Token JWT do AWS Cognito inválido ou expirado.' };
    }

    const user = buildUserFromPayload(payload);
    if (!user) {
      return { success: false, message: 'Não foi possível identificar o usuário no token.' };
    }

    console.log(
      '%c🔐 TOKEN JWT REAL DO AWS COGNITO:',
      'color: #0284c7; font-weight: bold; font-size: 13px;'
    );
    console.log(credential);
    localStorage.setItem('pethub_cognito_id_token', credential);
    setCognitoToken(credential);
    setCurrentUser(user);
    setAuthToken(credential);
    return { success: true };
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('https://cognito-idp.us-east-1.amazonaws.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
        },
        body: JSON.stringify({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: COGNITO_DIRECT_CLIENT_ID,
          AuthParameters: {
            USERNAME: email.trim().toLowerCase(),
            PASSWORD: password,
          },
        }),
      });

      const data = (await response.json()) as {
        AuthenticationResult?: { IdToken?: string };
        message?: string;
        __type?: string;
      };

      if (!response.ok || !data.AuthenticationResult?.IdToken) {
        if (data.__type?.includes('NotAuthorizedException') || data.__type?.includes('UserNotFoundException')) {
          return { success: false, message: 'E-mail ou senha inválidos no AWS Cognito.' };
        }
        return {
          success: false,
          message: data.message || 'Falha na autenticação com o AWS Cognito.',
        };
      }

      return loginWithGoogle(data.AuthenticationResult.IdToken);
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Erro de rede ao autenticar no Cognito.',
      };
    }
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
    const allowedLogoutOrigins = [
      'http://localhost:5173',
      'https://franciscoafonso.zangado.web.ufersa.dev.br',
    ];
    const shouldClearHostedUiSession =
      Boolean(cognitoToken || localStorage.getItem('pethub_cognito_id_token')) &&
      allowedLogoutOrigins.includes(window.location.origin);

    setCurrentUser(null);
    setAuthToken(null);
    setCognitoToken(null);
    localStorage.removeItem('pethub_current_user_id');
    localStorage.removeItem('pethub_current_user_data');
    localStorage.removeItem('pethub_jwt_token');
    localStorage.removeItem('pethub_cognito_id_token');

    if (shouldClearHostedUiSession) {
      const domain =
        import.meta.env.VITE_COGNITO_DOMAIN ||
        'https://us-east-1wfnrpejee.auth.us-east-1.amazoncognito.com';
      const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID || '5qvdtepvfcgd07q5en3bm8spv7';
      const logoutUri = `${window.location.origin}/login`;
      window.location.href = `${domain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
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

  const cognitoPayload = cognitoToken ? decodeGoogleCredential(cognitoToken) : null;
  const cognitoDisplayName = cognitoPayload ? buildDisplayNameFromPayload(cognitoPayload) : '';
  const cognitoProfileClaims: CognitoProfileClaims | null = cognitoPayload
    ? {
        name: cognitoDisplayName === 'Usuário Cognito' ? '' : cognitoDisplayName,
        email: cognitoPayload.email || '',
        picture: cognitoPayload.picture || '',
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser && authToken && cognitoToken),
        authToken,
        cognitoToken,
        cognitoProfileClaims,
        getValidCognitoToken,
        invalidateCognitoToken,
        updateCurrentUserProfile,
        login,
        loginWithGoogle,
        loginWithCognito,
        logout,
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
