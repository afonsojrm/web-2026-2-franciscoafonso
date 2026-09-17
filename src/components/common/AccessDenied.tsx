import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AccessDeniedProps {
  moduleName: string;
}

export const AccessDenied = ({ moduleName }: AccessDeniedProps) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-md w-full text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Acesso Restrito
        </h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Sua conta não possui permissão para acessar o setor <strong className="text-slate-700">{moduleName}</strong>. 
          As visualizações e operações são restritas às suas unidades de atuação autorizadas.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retornar ao Painel Principal</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
