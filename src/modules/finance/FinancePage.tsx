import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { AccessDenied } from '../../components/common/AccessDenied';
import {
  DollarSign,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  X,
} from 'lucide-react';
import type { OperatingUnit } from '../../types';

export const FinancePage = () => {
  const { finances, addFinanceEntry } = useData();
  const { currentUser, canAccessUnit, canManageFinancial } = useAuth();

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [unidade, setUnidade] = useState<OperatingUnit>(
    currentUser?.unidadesAutorizadas[0] || 'CLINICA'
  );
  const [categoria, setCategoria] = useState('Insumos Operacionais');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('100');
  const [dataCompetencia, setDataCompetencia] = useState(
    new Date().toISOString().split('T')[0]
  );

  if (!currentUser) return null;

  if (!canManageFinancial()) {
    return <AccessDenied moduleName="Gestão Financeira" />;
  }

  // Filter finances strictly according to user's authorized units
  const allowedFinances = finances.filter((f) => canAccessUnit(f.unidadeOrigem));

  const totalReceitas = allowedFinances
    .filter((f) => f.tipoLancamento === 'RECEITA')
    .reduce((acc, curr) => acc + curr.valor, 0);

  const totalDespesas = allowedFinances
    .filter((f) => f.tipoLancamento === 'DESPESA')
    .reduce((acc, curr) => acc + curr.valor, 0);

  const saldoLiquido = totalReceitas - totalDespesas;

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao) return;

    addFinanceEntry({
      unidadeOrigem: unidade,
      tipoLancamento: 'DESPESA',
      categoria,
      descricao,
      valor: parseFloat(valor) || 0,
      dataCompetencia,
      statusLiquidacao: 'PAGO',
    });

    setDescricao('');
    setIsExpenseModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Gestão Financeira
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Fluxo de receitas e despesas com apuração individualizada por unidade operacional.
          </p>
        </div>

        <button
          onClick={() => setIsExpenseModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-rose-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Despesa</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total de Receitas
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1 font-mono">
              R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400">Vendas, diárias e atendimentos</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total de Despesas
            </span>
            <div className="text-2xl font-extrabold text-rose-600 mt-1 font-mono">
              R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400">Insumos, compras e manutenção</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Saldo em Caixa
            </span>
            <div
              className={`text-2xl font-extrabold mt-1 font-mono ${
                saldoLiquido >= 0 ? 'text-sky-600' : 'text-rose-600'
              }`}
            >
              R$ {saldoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400">Resultado do período apurado</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Lançamentos Financeiros ({allowedFinances.length})
          </h2>
          <span className="text-xs text-slate-400">Histórico de movimentações</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <th className="py-3 px-4">Setor</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Categoria / Descrição</th>
                <th className="py-3 px-4">Data Competência</th>
                <th className="py-3 px-4">Liquidação</th>
                <th className="py-3 px-4 text-right">Valor (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {allowedFinances.map((fin) => (
                <tr key={fin.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        fin.unidadeOrigem === 'CLINICA' || fin.unidadeOrigem === 'PETSHOP'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {fin.unidadeOrigem}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 font-bold text-[11px] ${
                        fin.tipoLancamento === 'RECEITA' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {fin.tipoLancamento === 'RECEITA' ? '+' : '-'} {fin.tipoLancamento}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{fin.categoria}</span>
                    <span className="text-[11px] text-slate-500">{fin.descricao}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {new Date(fin.dataCompetencia).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle className="w-3 h-3" />
                      {fin.statusLiquidacao}
                    </span>
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono font-bold text-sm ${
                      fin.tipoLancamento === 'RECEITA' ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    R$ {fin.valor.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Lançar Despesa */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Registrar Despesa</h2>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Setor / Unidade *</label>
                <select
                  value={unidade}
                  onChange={(e) => setUnidade(e.target.value as OperatingUnit)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                >
                  {currentUser.unidadesAutorizadas.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Categoria *</label>
                <input
                  type="text"
                  required
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Ex: Insumos, Manutenção, Limpeza..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição do Gasto *</label>
                <textarea
                  rows={2}
                  required
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Detalhes da despesa..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={dataCompetencia}
                    onChange={(e) => setDataCompetencia(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
                >
                  Confirmar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
