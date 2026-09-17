import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { AccessDenied } from '../../components/common/AccessDenied';
import type { TurnoCreche, StatusPresencaCreche, StatusPagamento, CanalAgendamento } from '../../types';
import {
  Plus,
  Clock,
  CheckCircle,
  DoorOpen,
  X,
  User,
  Phone,
  AlertCircle,
  MessageSquare,
  PhoneCall,
  Building2,
} from 'lucide-react';

export const DaycarePage = () => {
  const {
    creche,
    pets,
    tutors,
    addPresencaCreche,
    updatePresencaCreche,
    checkPetScheduleConflicts,
  } = useData();
  const { currentUser, canAccessUnit, canManageBookings } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTutorId, setSelectedTutorId] = useState(tutors[0]?.id || '');
  const [selectedPetId, setSelectedPetId] = useState(() => {
    const firstTutorPets = pets.filter((p) => p.tutorId === (tutors[0]?.id || ''));
    return firstTutorPets[0]?.id || pets[0]?.id || '';
  });
  const [turno, setTurno] = useState<TurnoCreche>('INTEGRAL');
  const [dataFrequencia, setDataFrequencia] = useState(new Date().toISOString().split('T')[0]);
  const [valor, setValor] = useState('60');
  const [crecheStatus, setCrecheStatus] = useState<StatusPresencaCreche>('AGENDADO');
  const [crechePayment, setCrechePayment] = useState<StatusPagamento>('PENDENTE');
  const [canalAgendamento, setCanalAgendamento] = useState<CanalAgendamento>('BALCAO_PRESENCIAL');
  const [relatorioDiario, setRelatorioDiario] = useState('Excelente integração com os outros cães.');
  const [capacityError, setCapacityError] = useState('');

  const selectedTutor = tutors.find((t) => t.id === selectedTutorId);
  const tutorPets = pets.filter((p) => p.tutorId === selectedTutorId);

  // Detecção de múltiplos serviços / conflitos de agenda para o pet na creche
  const daycareConflicts = checkPetScheduleConflicts(selectedPetId, dataFrequencia, { turno });

  if (!currentUser) return null;

  if (!canAccessUnit('CRECHE')) {
    return <AccessDenied moduleName="Creche / Daycare" />;
  }

  // Limite de capacidade por turno
  const MAX_CAPACITY_PER_SHIFT = 6;

  const countForShift = (t: TurnoCreche) => {
    return creche.filter(
      (c) =>
        c.dataFrequencia === dataFrequencia &&
        (c.turno === t || c.turno === 'INTEGRAL') &&
        c.status !== 'CANCELADO'
    ).length;
  };

  const currentShiftOccupancy = countForShift(turno);

  const handleCanalChange = (canal: CanalAgendamento) => {
    setCanalAgendamento(canal);
    if (canal === 'BALCAO_PRESENCIAL') {
      setCrecheStatus('PRESENTE');
    } else {
      setCrecheStatus('AGENDADO');
    }
  };

  const handleCreatePresenca = (e: React.FormEvent) => {
    e.preventDefault();
    setCapacityError('');

    // Check Capacity Limit
    if (currentShiftOccupancy >= MAX_CAPACITY_PER_SHIFT) {
      setCapacityError(
        `Capacidade máxima atingida (${MAX_CAPACITY_PER_SHIFT} animais) para o turno ${turno} na data ${dataFrequencia}.`
      );
      return;
    }

    const isConfirmadoNoAto = canalAgendamento === 'BALCAO_PRESENCIAL';

    addPresencaCreche({
      petId: selectedPetId,
      responsavelId: currentUser.id,
      responsavelNome: currentUser.nome,
      dataFrequencia,
      turno,
      horaEntrada: isConfirmadoNoAto && crecheStatus === 'PRESENTE' ? '08:00' : undefined,
      status: isConfirmadoNoAto ? crecheStatus : 'AGENDADO',
      valor: parseFloat(valor) || 50,
      statusPagamento: crechePayment,
      relatorioDiario,
      canalAgendamento,
      confirmadoPeloCliente: isConfirmadoNoAto,
      dataConfirmacaoCliente: isConfirmadoNoAto ? new Date().toISOString() : undefined,
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Creche Pet (Daycare)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Socialização por turnos, monitoramento de presença e atividades diárias.
          </p>
        </div>

        {canManageBookings() && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Admitir Animal na Creche</span>
          </button>
        )}
      </div>

      {/* Turn Occupancy Bars */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Capacidade por Turno (Limite: {MAX_CAPACITY_PER_SHIFT} vagas)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {(['MANHA', 'TARDE', 'INTEGRAL'] as TurnoCreche[]).map((t) => {
            const count = countForShift(t);
            const percent = Math.min(100, Math.round((count / MAX_CAPACITY_PER_SHIFT) * 100));

            return (
              <div key={t} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-800">Turno {t}</span>
                  <span className={count >= MAX_CAPACITY_PER_SHIFT ? 'text-rose-600' : 'text-blue-700'}>
                    {count}/{MAX_CAPACITY_PER_SHIFT} vagas
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      percent >= 100
                        ? 'bg-rose-500'
                        : percent >= 70
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daycare Attendance List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Diário de Presença & Frequência</h2>
          <span className="text-xs text-slate-400">{creche.length} registro(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <th className="py-3 px-4">Cliente (Tutor)</th>
                <th className="py-3 px-4">Animal</th>
                <th className="py-3 px-4">Data & Turno</th>
                <th className="py-3 px-4">Entrada / Saída</th>
                <th className="py-3 px-4">Diário Comportamental</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {creche.map((item) => {
                const pet = pets.find((p) => p.id === item.petId);
                const tutor = pet ? tutors.find((t) => t.id === pet.tutorId) : null;

                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">{tutor?.nome}</span>
                      <span className="text-[11px] text-slate-400">{tutor?.telefone}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {pet?.nome}
                      <span className="block text-[11px] font-normal text-slate-400">
                        {pet?.raca} ({pet?.porte})
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">
                        {new Date(item.dataFrequencia).toLocaleDateString('pt-BR')}
                      </div>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold">
                        Turno {item.turno}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {item.horaEntrada || '--:--'} às {item.horaSaida || 'Em permanência'}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="line-clamp-2 text-slate-600 italic">
                        "{item.relatorioDiario || 'Sem ocorrências registradas'}"
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'PRESENTE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.status === 'FINALIZADO'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {item.status}
                        </span>

                        <div className="flex items-center gap-1">
                          {item.canalAgendamento && (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                              {item.canalAgendamento === 'BALCAO_PRESENCIAL'
                                ? 'Balcão'
                                : item.canalAgendamento === 'WHATSAPP'
                                ? 'WhatsApp'
                                : item.canalAgendamento === 'TELEFONE'
                                ? 'Telefone'
                                : 'Portal'}
                            </span>
                          )}
                          {item.confirmadoPeloCliente === false && item.status === 'AGENDADO' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-200">
                              Aguardando Tutor
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.status === 'AGENDADO' && canManageBookings() && (
                        <button
                          onClick={() =>
                            updatePresencaCreche(item.id, {
                              status: 'PRESENTE',
                              horaEntrada: '08:00',
                            })
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg mr-1.5"
                          title="Dar entrada / Check-in do animal"
                        >
                          <DoorOpen className="w-3.5 h-3.5" />
                          <span>Check-in</span>
                        </button>
                      )}
                      {item.status === 'PRESENTE' && canManageBookings() && (
                        <button
                          onClick={() =>
                            updatePresencaCreche(item.id, {
                              status: 'FINALIZADO',
                              horaSaida: new Date().toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              }),
                            })
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Finalizar Dia</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Admitir na Creche */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Admitir Animal na Creche</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {capacityError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs">
                {capacityError}
              </div>
            )}

            <form onSubmit={handleCreatePresenca} className="space-y-3.5 mt-4 text-xs">
              {/* 1. Consultar Cliente (Tutor) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  1. Consultar Cliente (Tutor Responsável) *
                </label>
                <select
                  value={selectedTutorId}
                  onChange={(e) => {
                    const newTutorId = e.target.value;
                    setSelectedTutorId(newTutorId);
                    const clientPets = pets.filter((p) => p.tutorId === newTutorId);
                    setSelectedPetId(clientPets[0]?.id || '');
                  }}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {tutors.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome} (CPF: {t.cpf} • Tel: {t.telefone})
                    </option>
                  ))}
                </select>

                {/* Ficha de Contato do Cliente */}
                {selectedTutor && (
                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[11px] text-slate-600">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span><strong>{selectedTutor.nome}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{selectedTutor.telefone}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Selecionar Animal do Cliente Consultado */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  2. Selecionar Animal do Cliente *
                </label>
                {tutorPets.length === 0 ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                    Este cliente não possui animais cadastrados no momento.
                  </div>
                ) : (
                  <select
                    value={selectedPetId}
                    onChange={(e) => setSelectedPetId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {tutorPets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} ({p.especie} - {p.raca})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 3. Canal de Solicitação e Consentimento do Cliente */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  3. Canal de Solicitação / Origem *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCanalChange('BALCAO_PRESENCIAL')}
                    className={`p-2 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      canalAgendamento === 'BALCAO_PRESENCIAL'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-[11px]">Balcão</span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-normal">Presencial (Autorizado)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCanalChange('WHATSAPP')}
                    className={`p-2 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      canalAgendamento === 'WHATSAPP'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[11px]">WhatsApp</span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-normal">Aguardando Tutor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCanalChange('TELEFONE')}
                    className={`p-2 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      canalAgendamento === 'TELEFONE'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-[11px]">Telefone</span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-normal">Aguardando Tutor</span>
                  </button>
                </div>

                {canalAgendamento !== 'BALCAO_PRESENCIAL' && (
                  <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-2">
                    ⚠️ Solicitação à distância: nascerá como <strong>AGENDADO (Aguardando Confirmação do Tutor)</strong>. O tutor poderá confirmar pelo portal do cliente ou a recepção poderá dar check-in no ato da recepção do cão.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Turno *</label>
                  <select
                    value={turno}
                    onChange={(e) => setTurno(e.target.value as TurnoCreche)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="MANHA">Manhã</option>
                    <option value="TARDE">Tarde</option>
                    <option value="INTEGRAL">Integral</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data *</label>
                  <input
                    type="date"
                    value={dataFrequencia}
                    onChange={(e) => setDataFrequencia(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Alerta de Conflitos / Serviços Múltiplos Concorrentes */}
              {daycareConflicts.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {daycareConflicts.map((conf) => (
                    <div
                      key={conf.id}
                      className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                        conf.isSobreposicaoHorario
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}
                    >
                      <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${conf.isSobreposicaoHorario ? 'text-rose-600' : 'text-amber-600'}`} />
                      <div className="space-y-0.5">
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{conf.isSobreposicaoHorario ? 'Atenção: Turno Conflitante na Creche' : 'Outro Serviço Cadastrado nesta Data (Combo)'}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/70 font-mono">{conf.servico}</span>
                        </div>
                        <p className="text-[11px] leading-tight">
                          {conf.titulo} ({conf.detalhes})
                        </p>
                        <p className="text-[10px] opacity-80">
                          {conf.isSobreposicaoHorario
                            ? 'O cão já possui presença ou diária agendada para este mesmo turno.'
                            : 'O cão tem outro serviço cadastrado (ex: consulta ou hotel). Farão parte do histórico unificado do animal.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status de Entrada *</label>
                  <select
                    value={crecheStatus}
                    onChange={(e) => setCrecheStatus(e.target.value as StatusPresencaCreche)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="AGENDADO">Agendado (Aguardando chegada)</option>
                    <option value="PRESENTE">Presente Imediatamente (Check-in)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status de Pagamento *</label>
                  <select
                    value={crechePayment}
                    onChange={(e) => setCrechePayment(e.target.value as StatusPagamento)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="PENDENTE">Pendente (Cobrar no balcão/saída)</option>
                    <option value="PAGO">Pago Antecipadamente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Valor da Diária (R$)</label>
                <input
                  type="number"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Diário de Atividades / Observação Inicial</label>
                <textarea
                  rows={2}
                  value={relatorioDiario}
                  onChange={(e) => setRelatorioDiario(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={tutorPets.length === 0}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs"
                >
                  Confirmar Admissão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
