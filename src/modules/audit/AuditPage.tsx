import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { AccessDenied } from '../../components/common/AccessDenied';
import { Search, CheckCircle } from 'lucide-react';

export const AuditPage = () => {
  const { audits } = useData();
  const { currentUser, canAccessAudit } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  if (!currentUser) return null;

  if (!canAccessAudit()) {
    return <AccessDenied moduleName="Auditoria de Eventos" />;
  }

  const filteredAudits = audits.filter(
    (a) =>
      a.usuarioNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.entidadeAlvo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.detalhes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Auditoria de Eventos
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registro cronológico e imutável de todas as ações de inserção, alteração e exclusão de dados críticos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            Integridade Transacional Ativa
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Filtrar auditoria por usuário, entidade (Tutor, Pet, Venda...) ou detalhes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
        />
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <th className="py-3 px-4">Ação</th>
                <th className="py-3 px-4">Entidade Alvo</th>
                <th className="py-3 px-4">Usuário Responsável</th>
                <th className="py-3 px-4">Detalhes da Operação</th>
                <th className="py-3 px-4 text-right">Data & Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAudits.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                        a.acaoExecutada === 'INSERT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : a.acaoExecutada === 'UPDATE'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {a.acaoExecutada}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                    {a.entidadeAlvo}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">{a.usuarioNome}</td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-md">
                    {a.detalhes}
                    <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                      ID Alvo: {a.registroId}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-500 whitespace-nowrap">
                    {new Date(a.timestampEvento).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
