import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { validateEmail } from '../../utils/validators';
import {
  PawPrint,
  Lock,
  Mail,
  ShieldCheck,
  Stethoscope,
  ShoppingBag,
  BedDouble,
  Sun,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
} from 'lucide-react';

export const LoginPage = () => {
  const { login, loginWithGoogle, quickLogin, users } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('socio.a@pethub.com.br');
  const [password, setPassword] = useState('pethub123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleSuccess = (credentialResponse: { credential?: string }) => {
    setErrorMsg('');
    if (!credentialResponse.credential) {
      setErrorMsg('Nenhuma credencial retornada pelo Google.');
      return;
    }

    const result = loginWithGoogle(credentialResponse.credential);
    if (result.success) {
      navigate('/');
    } else {
      setErrorMsg(result.message || 'Falha ao autenticar com a conta Google.');
    }
  };

  const handleGoogleError = () => {
    setErrorMsg('Falha ao autenticar com o Google. Tente novamente.');
  };

  const handleCognitoGoogleLogin = () => {
    const domain = import.meta.env.VITE_COGNITO_DOMAIN || 'https://us-east-1wfnrpejee.auth.us-east-1.amazoncognito.com';
    const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID || '5qvdtepvfcgd07q5en3bm8spv7';
    const responseType = import.meta.env.VITE_COGNITO_RESPONSE_TYPE || 'token';
    const redirectUri = window.location.origin;

    const cognitoUrl = `${domain}/oauth2/authorize?identity_provider=Google&client_id=${clientId}&response_type=${responseType}&scope=email+openid+profile&redirect_uri=${encodeURIComponent(redirectUri)}`;

    window.location.href = cognitoUrl;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !validateEmail(email)) {
      setErrorMsg('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (!password) {
      setErrorMsg('Por favor, informe a senha de acesso.');
      return;
    }

    const success = login(email, password);
    if (success) {
      navigate('/');
    } else {
      setErrorMsg('E-mail ou senha incorretos. Verifique suas credenciais.');
    }
  };

  const handleQuickLogin = (userId: string) => {
    quickLogin(userId);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Header */}
      <div className="border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/30">
              <PawPrint className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Pet<span className="text-sky-400">Hub</span>
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Plataforma Corporativa para Complexos Pet
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Branding & Features */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Gestão Multi-Unidade com Centros de Custo Isolados</span>
            </div>

            <div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Eficiência Operacional para o seu{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
                  Complexo Pet
                </span>
              </h1>
              <p className="text-base text-slate-400 mt-4 leading-relaxed">
                Integre clínica veterinária, pet shop, hotel e daycare sob um mesmo cadastro centralizado, mantendo total privacidade contábil entre gestores e sócios.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 text-xs text-slate-300">
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center mb-2.5">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <strong className="text-white block mb-1">Clínica & Pet Shop</strong>
                <span className="text-slate-400">Prontuário eletrônico veterinário, controle de vacinas e PDV ágil.</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2.5">
                  <BedDouble className="w-4 h-4" />
                </div>
                <strong className="text-white block mb-1">Hotel & Daycare</strong>
                <span className="text-slate-400">Prevenção contra sobrelotação, diárias automáticas e relatórios.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Form & Demo Accounts */}
          <div className="lg:col-span-6 space-y-5">
            <div className="bg-white rounded-3xl p-8 text-slate-900 shadow-2xl border border-slate-200">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Entrar na Plataforma
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Acesse o painel administrativo do seu estabelecimento
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">E-mail Corporativo</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@pethub.com.br"
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Senha</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-sky-600" />
                    <span>Lembrar meu acesso</span>
                  </label>
                  <span className="text-sky-600 hover:underline cursor-pointer font-medium">Esqueceu a senha?</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-600/30 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-white px-2.5 text-slate-400 font-semibold tracking-wider">
                    ou continue com
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center w-full">
                {googleClientId ? (
                  <div className="w-full flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      shape="rectangular"
                      theme="outline"
                      size="large"
                      width="100%"
                      text="continue_with"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleCognitoGoogleLogin}
                    className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer hover:border-slate-400 active:scale-[0.99]"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Entrar com o Google</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Demo Credentials */}
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Acesso Rápido para Demonstração
                </span>
                <span className="text-[10px] text-slate-500">Selecione uma conta:</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {users.map((u) => {
                  let roleBadge = 'Gestor A';
                  let icon = ShoppingBag;

                  if (u.perfil === 'SOCIO_A') {
                    roleBadge = 'Clínica & Shop';
                    icon = ShoppingBag;
                  } else if (u.perfil === 'SOCIO_B') {
                    roleBadge = 'Hotel & Creche';
                    icon = BedDouble;
                  } else if (u.perfil === 'ADMIN') {
                    roleBadge = 'Diretoria';
                    icon = Building2;
                  } else if (u.perfil === 'VET') {
                    roleBadge = 'Veterinário';
                    icon = Stethoscope;
                  } else if (u.perfil === 'FUNCIONARIO') {
                    roleBadge = 'Recepção';
                    icon = Sun;
                  } else {
                    roleBadge = 'Cliente';
                    icon = KeyRound;
                  }

                  const IconComponent = icon;

                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickLogin(u.id)}
                      className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-sky-500 hover:bg-slate-800 transition-all text-left flex flex-col justify-between group"
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <IconComponent className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-400" />
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 font-mono">
                          {roleBadge}
                        </span>
                      </div>
                      <span className="font-bold text-white text-[11px] truncate block w-full">
                        {u.nome.split(' ')[0]} {u.nome.split(' ')[1] || ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-slate-800/80 py-4 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p>© 2026 PetHub Enterprise. Todos os direitos reservados.</p>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Privacidade</span>
            <span>•</span>
            <span>Termos de Uso</span>
            <span>•</span>
            <span>Segurança da Informação</span>
          </div>
        </div>
      </div>
    </div>
  );
};
