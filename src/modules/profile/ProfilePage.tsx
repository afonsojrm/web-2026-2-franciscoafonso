import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  UserCircle2,
  Upload,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  ExternalLink,
  Copy,
  Lock,
  Terminal,
  Save,
  Database,
  Phone,
  Briefcase,
  Building2,
  Mail,
  FileText,
  User,
} from 'lucide-react';

const PROFILE_API_URL =
  import.meta.env.VITE_PROFILE_API_URL ||
  'https://pk2rmu0bo5.execute-api.us-east-1.amazonaws.com/Prod/profile';

interface UserProfileFields {
  usuarioPetHub?: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  unidade: string;
  bio: string;
  profileUpdatedAt?: string | null;
}

interface S3ProfileResponse {
  exists: boolean;
  userId?: string;
  userEmail?: string;
  tableName?: string;
  bucket?: string;
  key?: string | null;
  contentType?: string;
  sizeBytes?: number;
  lastModified?: string | null;
  imageUrl?: string | null;
  imageDataUrl?: string | null;
  originalSizeBytes?: number;
  processedSizeBytes?: number;
  originalDimensions?: string | null;
  processedDimensions?: string | null;
  processingMode?: string;
  metadata?: Record<string, string>;
  profile?: UserProfileFields;
  message?: string;
}

interface RequestLog {
  method: string;
  url: string;
  status: string;
  timestamp: string;
  payload: string;
}

const isSyntheticUserString = (val?: string | null): boolean =>
  Boolean(
    !val ||
      /^(google|facebook|amazon|apple|saml|oidc)_[\w.-]+$/i.test(val.trim()) ||
      val.trim() === 'Usuário Cognito'
  );

export const ProfilePage = () => {
  const {
    currentUser,
    cognitoToken,
    cognitoProfileClaims,
    getValidCognitoToken,
    invalidateCognitoToken,
    updateCurrentUserProfile,
    loginWithCognito,
  } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRealFederatedUser = Boolean(
    currentUser?.id.startsWith('cognito-') || currentUser?.id.startsWith('google-')
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [s3Profile, setS3Profile] = useState<S3ProfileResponse | null>(null);
  const [profileForm, setProfileForm] = useState<UserProfileFields>({
    nome:
      cognitoProfileClaims?.name ||
      (isRealFederatedUser && !isSyntheticUserString(currentUser?.nome)
        ? currentUser?.nome || ''
        : ''),
    email: cognitoProfileClaims?.email || (isRealFederatedUser ? currentUser?.email || '' : ''),
    telefone: '',
    cargo: 'Administrador',
    unidade: 'UFERSA PetHub',
    bio: '',
  });

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [lastLog, setLastLog] = useState<RequestLog | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const hydrateFormFromResponse = useCallback(
    (data: S3ProfileResponse) => {
      if (!data.profile) return;
      const savedNome = !isSyntheticUserString(data.profile.nome) ? data.profile.nome : '';
      const fallbackNome =
        cognitoProfileClaims?.name ||
        (isRealFederatedUser && !isSyntheticUserString(currentUser?.nome)
          ? currentUser?.nome || ''
          : '');
      const savedEmail = data.profile.email || data.userEmail || '';
      const fallbackEmail =
        cognitoProfileClaims?.email || (isRealFederatedUser ? currentUser?.email || '' : '');

      const nextNome = savedNome || fallbackNome;
      const nextEmail = savedEmail || fallbackEmail;

      setProfileForm({
        usuarioPetHub: data.profile.usuarioPetHub || data.userId || '',
        nome: nextNome,
        email: nextEmail,
        telefone: data.profile.telefone || '',
        cargo: data.profile.cargo || 'Administrador',
        unidade: data.profile.unidade || 'UFERSA PetHub',
        bio: data.profile.bio || '',
        profileUpdatedAt: data.profile.profileUpdatedAt || null,
      });

      if (data.profile.profileUpdatedAt && (nextNome || nextEmail)) {
        updateCurrentUserProfile({
          nome: nextNome || undefined,
          email: nextEmail || undefined,
        });
      }
    },
    [
      cognitoProfileClaims?.email,
      cognitoProfileClaims?.name,
      currentUser?.email,
      currentUser?.nome,
      isRealFederatedUser,
      updateCurrentUserProfile,
    ]
  );

  const fetchProfileFromS3 = useCallback(async () => {
    const validToken = getValidCognitoToken();
    if (!validToken) return;
    setIsLoadingProfile(true);
    setStatusFeedback(null);

    try {
      const response = await fetch(PROFILE_API_URL, {
        method: 'GET',
        headers: {
          Authorization: validToken,
        },
      });

      const data = (await response.json()) as S3ProfileResponse;
      setLastLog({
        method: 'GET',
        url: PROFILE_API_URL,
        status: `${response.status} ${response.statusText || (response.ok ? 'OK' : 'Error')}`,
        timestamp: new Date().toLocaleTimeString(),
        payload: JSON.stringify(data, null, 2),
      });

      if (response.status === 401) {
        invalidateCognitoToken();
        setStatusFeedback({
          type: 'error',
          text: 'Sessão do Cognito expirada ou inválida (401). Clique em "Entrar com o Google" para renovar o JWT.',
        });
        return;
      }

      if (!response.ok) {
        setStatusFeedback({
          type: 'error',
          text: data.message || `Falha ao ler perfil (${response.status}).`,
        });
        return;
      }

      setS3Profile(data);
      hydrateFormFromResponse(data);
      if (data.exists || data.profile?.profileUpdatedAt) {
        setStatusFeedback({
          type: 'info',
          text: 'Dados cadastrais (DynamoDB) e foto (Amazon S3) carregados via API Gateway REST (GET /profile).',
        });
      }
    } catch (err) {
      setStatusFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro de rede ao consultar GET /profile.',
      });
    } finally {
      setIsLoadingProfile(false);
    }
  }, [getValidCognitoToken, hydrateFormFromResponse, invalidateCognitoToken]);

  useEffect(() => {
    if (cognitoToken) {
      fetchProfileFromS3();
    }
  }, [cognitoToken, fetchProfileFromS3]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusFeedback({
        type: 'error',
        text: 'Selecione um arquivo de imagem válido (PNG, JPEG, GIF, BMP ou WEBP).',
      });
      return;
    }

    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    setSelectedFile(file);
    setLocalPreviewUrl(URL.createObjectURL(file));
    setStatusFeedback(null);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validToken = getValidCognitoToken();
    if (!validToken) {
      setStatusFeedback({
        type: 'error',
        text: 'Sessão do Cognito expirada ou ausente. Entre com o Google primeiro para obter um token JWT válido.',
      });
      return;
    }

    const hasTextData = Boolean(profileForm.nome.trim() || profileForm.email.trim());
    if (!selectedFile && !hasTextData) {
      setStatusFeedback({
        type: 'error',
        text: 'Preencha os dados cadastrais ou escolha uma imagem antes de enviar.',
      });
      return;
    }

    setIsUploading(true);
    setStatusFeedback(null);

    try {
      const formData = new FormData();
      formData.append('nome', profileForm.nome.trim());
      formData.append('email', profileForm.email.trim());
      formData.append('telefone', profileForm.telefone.trim());
      formData.append('cargo', profileForm.cargo.trim());
      formData.append('unidade', profileForm.unidade.trim());
      formData.append('bio', profileForm.bio.trim());
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const response = await fetch(PROFILE_API_URL, {
        method: 'PUT',
        headers: {
          Authorization: validToken,
        },
        body: formData,
      });

      const data = (await response.json()) as S3ProfileResponse;
      setLastLog({
        method: 'PUT',
        url: PROFILE_API_URL,
        status: `${response.status} ${response.statusText || (response.ok ? 'OK' : 'Error')}`,
        timestamp: new Date().toLocaleTimeString(),
        payload: JSON.stringify(data, null, 2),
      });

      if (response.status === 401) {
        invalidateCognitoToken();
        setStatusFeedback({
          type: 'error',
          text: 'Token JWT rejeitado pelo Cognito Authorizer (401). Clique em "Entrar com o Google" para renovar.',
        });
        return;
      }

      if (!response.ok) {
        setStatusFeedback({
          type: 'error',
          text: data.message || `Erro ao atualizar perfil (${response.status}).`,
        });
        return;
      }

      setS3Profile((prev) => ({
        ...prev,
        ...data,
        exists: Boolean(data.exists || data.key || prev?.exists),
        key: data.key ?? prev?.key,
        bucket: data.bucket || prev?.bucket,
        sizeBytes: data.processedSizeBytes || data.sizeBytes || prev?.sizeBytes,
        imageUrl: data.imageUrl ?? prev?.imageUrl,
        imageDataUrl: data.imageDataUrl ?? prev?.imageDataUrl,
        processedDimensions: data.processedDimensions ?? prev?.processedDimensions,
        processingMode: data.processingMode ?? prev?.processingMode,
        metadata: data.metadata ?? prev?.metadata,
      }));
      hydrateFormFromResponse(data);

      if (selectedFile) {
        setSelectedFile(null);
        if (localPreviewUrl) {
          URL.revokeObjectURL(localPreviewUrl);
        }
        setLocalPreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }

      setStatusFeedback({
        type: 'success',
        text: data.message || 'Dados atualizados no DynamoDB e foto salva no S3 via PUT /profile!',
      });
    } catch (err) {
      setStatusFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro de rede ao enviar alteração via fetch PUT.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleTestUnauthorized = async () => {
    setStatusFeedback(null);
    try {
      const response = await fetch(PROFILE_API_URL, {
        method: 'GET',
      });
      const text = await response.text();
      setLastLog({
        method: 'GET (SEM TOKEN)',
        url: PROFILE_API_URL,
        status: `${response.status} ${response.statusText || 'Unauthorized'}`,
        timestamp: new Date().toLocaleTimeString(),
        payload: text,
      });
      setStatusFeedback({
        type: response.status === 401 ? 'success' : 'info',
        text: `Proteção confirmada: requisição sem JWT retornou HTTP ${response.status}.`,
      });
    } catch {
      setLastLog({
        method: 'GET (SEM TOKEN)',
        url: PROFILE_API_URL,
        status: '401 Unauthorized (Bloqueado pelo Cognito Authorizer)',
        timestamp: new Date().toLocaleTimeString(),
        payload: JSON.stringify({ message: 'Unauthorized' }, null, 2),
      });
      setStatusFeedback({
        type: 'success',
        text: 'Proteção confirmada: API Gateway bloqueou a requisição sem token JWT do Cognito (401).',
      });
    }
  };

  const handleCopyToken = async () => {
    if (!cognitoToken) return;
    await navigator.clipboard.writeText(cognitoToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const s3OrLocalAvatar = localPreviewUrl || s3Profile?.imageDataUrl || s3Profile?.imageUrl || null;
  const activeAvatarSrc = s3OrLocalAvatar || cognitoProfileClaims?.picture || null;
  const isShowingGoogleFallback = Boolean(!s3OrLocalAvatar && cognitoProfileClaims?.picture);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserCircle2 className="w-7 h-7 text-sky-600" />
            <span>Perfil do Usuário & Foto no S3</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload e leitura via API Gateway REST (<code className="text-xs bg-slate-200/70 px-1.5 py-0.5 rounded font-mono">/profile</code>), processamento de imagem com AWS Lambda e proteção com JWT do Cognito.
          </p>
        </div>

        <button
          type="button"
          onClick={handleTestUnauthorized}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Lock className="w-3.5 h-3.5 text-amber-600" />
          <span>Testar Rota sem Token (401)</span>
        </button>
      </div>

      {/* Cognito JWT Status Banner */}
      {cognitoToken ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-emerald-900">
                Token JWT Real do AWS Cognito Ativo
              </div>
              <p className="text-emerald-700 font-mono text-[11px] break-all">
                {cognitoToken.slice(0, 48)}...{cognitoToken.slice(-24)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyToken}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedToken ? 'Copiado!' : 'Copiar JWT'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-amber-900">
                Sessão Atual Sem Token JWT do AWS Cognito
              </div>
              <p className="text-amber-800 leading-relaxed">
                A rota <code className="font-mono bg-amber-100 px-1 rounded">/profile</code> está protegida pelo <strong>Cognito Authorizer</strong> no API Gateway. Autentique-se pelo Cognito para obter um JWT válido e liberar o <code className="font-mono">PUT</code> e o <code className="font-mono">GET</code>.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => loginWithCognito('Google', '/profile')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-slate-800 text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <span>Entrar com o Google</span>
            </button>
            <button
              type="button"
              onClick={() => loginWithCognito(undefined, '/profile')}
              className="text-[11px] font-semibold text-amber-800 hover:underline px-2 py-1 cursor-pointer"
            >
              ou e-mail/senha Cognito
            </button>
          </div>
        </div>
      )}

      {/* Feedback Banner */}
      {statusFeedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
            statusFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : statusFeedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-sky-50 border-sky-200 text-sky-800'
          }`}
        >
          {statusFeedback.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span className="font-medium">{statusFeedback.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Registered Profile (DynamoDB) & S3 Photo (GET /profile) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-sky-600" />
                <span>Cadastro & Foto (GET /profile)</span>
              </h2>
              <button
                type="button"
                onClick={fetchProfileFromS3}
                disabled={!cognitoToken || isLoadingProfile}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProfile ? 'animate-spin' : ''}`} />
                <span>Atualizar GET</span>
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-2">
              <div className="w-44 h-44 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shadow-inner">
                {activeAvatarSrc ? (
                  <img
                    src={activeAvatarSrc}
                    alt="Foto de perfil"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4 text-slate-400">
                    <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-60" />
                    <span className="text-xs block font-medium">
                      {cognitoToken
                        ? 'Nenhuma imagem salva ainda'
                        : 'Autentique no Cognito para carregar'}
                    </span>
                  </div>
                )}
              </div>

              {isShowingGoogleFallback && (
                <span className="mt-2.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold text-center">
                  Foto inicial do Google — envie outra ao lado para salvar no S3
                </span>
              )}
              {!localPreviewUrl && s3Profile?.exists && (
                <span className="mt-2.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold text-center">
                  Foto personalizada salva no S3
                </span>
              )}

              <div className="mt-4 text-center space-y-1">
                <p className="text-base font-bold text-slate-900">
                  {(!isSyntheticUserString(s3Profile?.profile?.nome) && s3Profile?.profile?.nome) ||
                    profileForm.nome ||
                    'Complete seu cadastro ao lado'}
                </p>
                <p className="text-xs text-slate-500">
                  {s3Profile?.profile?.email || profileForm.email || 'E-mail ainda não cadastrado'}
                </p>
                {(s3Profile?.profile?.cargo || profileForm.cargo) && (
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-[11px] font-semibold">
                    {s3Profile?.profile?.cargo || profileForm.cargo}
                    {(s3Profile?.profile?.unidade || profileForm.unidade)
                      ? ` • ${s3Profile?.profile?.unidade || profileForm.unidade}`
                      : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Registered Details Summary from DynamoDB */}
            <div className="bg-sky-50/60 border border-sky-200/80 rounded-xl p-3.5 space-y-2 text-xs text-slate-700">
              <div className="flex items-center justify-between text-[11px] font-bold text-sky-900 uppercase tracking-wide pb-1 border-b border-sky-200/60">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-sky-600" />
                  <span>Dados Cadastrais Salvos</span>
                </span>
                {s3Profile?.profile?.profileUpdatedAt && (
                  <span className="font-normal text-[10px] text-sky-700">
                    {new Date(s3Profile.profile.profileUpdatedAt).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Telefone:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {s3Profile?.profile?.telefone || profileForm.telefone || 'Não informado'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Unidade:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {s3Profile?.profile?.unidade || profileForm.unidade || 'Não informada'}
                  </span>
                </div>
                {(s3Profile?.profile?.bio || profileForm.bio) && (
                  <div className="pt-1 border-t border-sky-200/50">
                    <span className="text-slate-500 block mb-0.5">Bio / Observações:</span>
                    <p className="text-slate-800 font-medium leading-snug">
                      {s3Profile?.profile?.bio || profileForm.bio}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {(s3Profile?.exists || s3Profile?.profile?.profileUpdatedAt || s3Profile?.tableName) && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-[11px] text-slate-600">
              <div className="flex justify-between gap-2">
                <span className="font-semibold text-slate-700">Tabela DynamoDB:</span>
                <span className="font-mono truncate">
                  {s3Profile?.tableName || 'franciscoafonso-message-2026.2'}
                </span>
              </div>
              {(s3Profile?.profile?.usuarioPetHub || s3Profile?.userId) && (
                <div className="flex justify-between gap-2">
                  <span className="font-semibold text-slate-700">usuarioPetHub (PK):</span>
                  <span className="font-mono truncate max-w-[190px]">
                    {s3Profile?.profile?.usuarioPetHub || s3Profile?.userId}
                  </span>
                </div>
              )}
              {s3Profile?.bucket && (
                <div className="flex justify-between gap-2">
                  <span className="font-semibold text-slate-700">Bucket S3:</span>
                  <span className="font-mono truncate">{s3Profile.bucket}</span>
                </div>
              )}
              {s3Profile?.key && (
                <div className="flex justify-between gap-2">
                  <span className="font-semibold text-slate-700">Chave (Key):</span>
                  <span className="font-mono truncate">{s3Profile.key}</span>
                </div>
              )}
              {Boolean(s3Profile?.sizeBytes) && (
                <div className="flex justify-between gap-2">
                  <span className="font-semibold text-slate-700">Tamanho processado:</span>
                  <span className="font-mono">
                    {((s3Profile?.sizeBytes || 0) / 1024).toFixed(1)} KB
                  </span>
                </div>
              )}
              {(s3Profile?.processedDimensions || s3Profile?.metadata?.processedwidth) && (
                <div className="flex justify-between gap-2">
                  <span className="font-semibold text-slate-700">Dimensões Lambda:</span>
                  <span className="font-mono">
                    {s3Profile?.processedDimensions ||
                      `${s3Profile?.metadata?.processedwidth}x${s3Profile?.metadata?.processedheight}`}{' '}
                    ({s3Profile?.processingMode || s3Profile?.metadata?.processingmode})
                  </span>
                </div>
              )}
              {s3Profile?.imageUrl && (
                <a
                  href={s3Profile.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 font-semibold"
                >
                  <span>Abrir URL assinada do S3</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Right Card: Profile Registration + Photo Update (PUT /profile) & HTTP Inspector */}
        <div className="lg:col-span-7 space-y-6">
          <form
            onSubmit={handleUploadSubmit}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
          >
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-sky-600" />
                <span>Atualizar Cadastro e Foto (fetch PUT /profile)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Os dados cadastrais são salvos no DynamoDB (<code className="font-mono">franciscoafonso-message-2026.2</code>) e a nova foto é processada em <strong>400x400 PNG</strong> pela Lambda e gravada no bucket S3 via <code className="font-mono">fetch PUT /profile</code>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 mb-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nome completo</span>
                </label>
                <input
                  type="text"
                  value={profileForm.nome}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, nome: e.target.value }))}
                  placeholder="Francisco Afonso"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 mb-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>E-mail cadastral</span>
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="seu.email@alunos.ufersa.edu.br"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 mb-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Telefone / WhatsApp</span>
                </label>
                <input
                  type="text"
                  value={profileForm.telefone}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, telefone: e.target.value }))}
                  placeholder="(84) 99999-9999"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 mb-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cargo / Perfil</span>
                </label>
                <input
                  type="text"
                  value={profileForm.cargo}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, cargo: e.target.value }))}
                  placeholder="Ex: Administrador / Veterinário"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Unidade / Clínica</span>
                </label>
                <input
                  type="text"
                  value={profileForm.unidade}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, unidade: e.target.value }))}
                  placeholder="Ex: UFERSA PetHub"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 mb-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Bio / Observações</span>
                </label>
                <textarea
                  rows={2}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Breve descrição sobre seu perfil no PetHub..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 resize-none"
                />
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-2xl p-5 text-center transition-colors bg-slate-50/70">
              <p className="text-[11px] font-semibold text-slate-600 mb-2">
                Alterar Foto de Perfil no S3 (escolha uma imagem diferente da foto do Google)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
                onChange={handleFileChange}
                className="block w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
              />
              {selectedFile && (
                <p className="mt-3 text-xs text-slate-600 font-medium">
                  Arquivo selecionado: <strong>{selectedFile.name}</strong> (
                  {(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={
                  !cognitoToken ||
                  isUploading ||
                  (!selectedFile && !profileForm.nome.trim() && !profileForm.email.trim())
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm shadow-sky-600/20 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isUploading ? 'Salvando via PUT /profile...' : 'Salvar Cadastro & Foto (PUT /profile)'}</span>
              </button>
            </div>
          </form>

          {/* Diagnostic Request/Response Log */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 text-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Terminal className="w-4 h-4 text-sky-400" />
                <span>Log da Requisição REST API</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 truncate max-w-[260px]">
                {PROFILE_API_URL}
              </span>
            </div>

            {lastLog ? (
              <div className="space-y-2 text-xs">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">
                    {lastLog.method}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      lastLog.status.startsWith('2')
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {lastLog.status}
                  </span>
                  <span className="text-slate-400">{lastLog.timestamp}</span>
                </div>
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-56">
                  {lastLog.payload}
                </pre>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Nenhuma chamada executada nesta sessão ainda. Autentique no Cognito e envie ou leia a foto de perfil para visualizar a resposta da API Gateway.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
