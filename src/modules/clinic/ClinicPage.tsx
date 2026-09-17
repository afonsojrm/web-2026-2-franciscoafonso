import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { AccessDenied } from '../../components/common/AccessDenied';
import type { TipoAtendimento, TipoProcedimento, StatusConsulta, StatusPagamento, CanalAgendamento } from '../../types';
import {
  Stethoscope,
  Plus,
  Calendar,
  FileText,
  Syringe,
  CheckCircle2,
  CheckCircle,
  Lock,
  X,
  User,
  Phone,
  AlertCircle,
  MessageSquare,
  PhoneCall,
  Building2,
} from 'lucide-react';

export const ClinicPage = () => {
  const {
    consultas,
    vacinas,
    pets,
    tutors,
    addConsulta,
    updateConsulta,
    addVacina,
    checkPetScheduleConflicts,
  } = useData();
  const { currentUser, canAccessUnit, canManageMedicalRecords } = useAuth();

  const [activeTab, setActiveTab] = useState<'consultas' | 'vacinas'>('consultas');

  // Modal State: Agendar Consulta (com consulta e identificação prévia do cliente/tutor)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedTutorId, setSelectedTutorId] = useState(tutors[0]?.id || '');
  const [selectedPetId, setSelectedPetId] = useState(() => {
    const firstTutorPets = pets.filter((p) => p.tutorId === (tutors[0]?.id || ''));
    return firstTutorPets[0]?.id || pets[0]?.id || '';
  });
  const [tipoAtendimento, setTipoAtendimento] = useState<TipoAtendimento>('CONSULTA');
  const [dataHoraAgendada, setDataHoraAgendada] = useState(new Date().toISOString().slice(0, 16));
  const [valorConsulta, setValorConsulta] = useState('150');
  const [scheduleStatus, setScheduleStatus] = useState<StatusConsulta>('CONFIRMADA');
  const [schedulePayment, setSchedulePayment] = useState<StatusPagamento>('PENDENTE');
  const [canalAgendamento, setCanalAgendamento] = useState<CanalAgendamento>('BALCAO_PRESENCIAL');
  const [observacoesAgendamento, setObservacoesAgendamento] = useState('');

  // Selected tutor object and their pets
  const selectedTutor = tutors.find((t) => t.id === selectedTutorId);
  const tutorPets = pets.filter((p) => p.tutorId === selectedTutorId);

  // Detecção de múltiplos serviços / conflitos de agenda para o pet na data e horário
  const selectedDate = dataHoraAgendada.split('T')[0] || '';
  const selectedTime = dataHoraAgendada.split('T')[1]?.slice(0, 5) || '';
  const scheduleConflicts = checkPetScheduleConflicts(selectedPetId, selectedDate, { time: selectedTime });

  // Modal State: Atendimento / Prontuário Clínico (Veterinário)
  const [isMedicalRecordOpen, setIsMedicalRecordOpen] = useState(false);
  const [selectedConsultaId, setSelectedConsultaId] = useState<string | null>(null);
  const [diagnostico, setDiagnostico] = useState('');
  const [prescricao, setPrescricao] = useState('');

  // Modal State: Nova Vacina
  const [isVaccineOpen, setIsVaccineOpen] = useState(false);
  const [vacinaPetId, setVacinaPetId] = useState(pets[0]?.id || '');
  const [vacinaTipo, setVacinaTipo] = useState<TipoProcedimento>('VACINA');
  const [vacinaDescricao, setVacinaDescricao] = useState('Vacina V10 Polivalente');
  const [vacinaData, setVacinaData] = useState(new Date().toISOString().split('T')[0]);
  const [vacinaProximaDose, setVacinaProximaDose] = useState('2027-03-14');
  const [vacinaLote, setVacinaLote] = useState('LT-2026-V88');

  if (!currentUser) return null;

  if (!canAccessUnit('CLINICA')) {
    return <AccessDenied moduleName="Clínica Veterinária" />;
  }

  const handleCanalChange = (canal: CanalAgendamento) => {
    setCanalAgendamento(canal);
    if (canal === 'BALCAO_PRESENCIAL') {
      setScheduleStatus('CONFIRMADA');
    } else {
      setScheduleStatus('AGENDADA');
    }
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetId) return;

    const isConfirmadoNoAto = canalAgendamento === 'BALCAO_PRESENCIAL';

    addConsulta({
      petId: selectedPetId,
      veterinarioId: currentUser.id,
      veterinarioNome: currentUser.perfil === 'VET' ? currentUser.nome : 'Dra. Camila Nogueira (CRMV 14205)',
      dataHoraAgendada: new Date(dataHoraAgendada).toISOString(),
      tipoAtendimento,
      status: isConfirmadoNoAto ? scheduleStatus : 'AGENDADA',
      valor: parseFloat(valorConsulta) || 150,
      statusPagamento: schedulePayment,
      canalAgendamento,
      confirmadoPeloCliente: isConfirmadoNoAto,
      dataConfirmacaoCliente: isConfirmadoNoAto ? new Date().toISOString() : undefined,
      diagnostico: observacoesAgendamento ? `Observação do tutor: ${observacoesAgendamento}` : undefined,
    });

    setIsScheduleOpen(false);
    setObservacoesAgendamento('');
  };

  const handleMedicalRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsultaId) return;

    updateConsulta(selectedConsultaId, {
      diagnostico,
      prescricao,
      status: 'FINALIZADA',
      dataHoraRealizada: new Date().toISOString(),
    });

    setIsMedicalRecordOpen(false);
    setSelectedConsultaId(null);
    setDiagnostico('');
    setPrescricao('');
  };

  const handleVaccineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacinaPetId) return;

    addVacina({
      petId: vacinaPetId,
      veterinarioId: currentUser.id,
      tipo: vacinaTipo,
      descricao: vacinaDescricao,
      dataAplicacao: vacinaData,
      dataProximaDose: vacinaProximaDose,
      lote: vacinaLote,
    });

    setIsVaccineOpen(false);
  };

  const openMedicalRecordModal = (consultaId: string) => {
    const c = consultas.find((item) => item.id === consultaId);
    if (!c) return;
    setSelectedConsultaId(consultaId);
    setDiagnostico(c.diagnostico || '');
    setPrescricao(c.prescricao || '');
    setIsMedicalRecordOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Clínica Veterinária
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Prontuário eletrônico unificado, histórico clínico, consultas e controle preventivo de vacinação.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVaccineOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 shadow-xs transition-all"
          >
            <Syringe className="w-4 h-4 text-sky-600" />
            <span>Registrar Imunização</span>
          </button>
          <button
            onClick={() => setIsScheduleOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-sky-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Atendimento</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('consultas')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'consultas'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Consultas & Procedimentos ({consultas.length})
        </button>
        <button
          onClick={() => setActiveTab('vacinas')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'vacinas'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Carteira de Vacinação & Vermífugos ({vacinas.length})
        </button>
      </div>

      {/* Tab 1: Consultas */}
      {activeTab === 'consultas' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {consultas.map((c) => {
              const pet = pets.find((p) => p.id === c.petId);
              const tutor = pet ? tutors.find((t) => t.id === pet.tutorId) : null;

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-sky-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">
                          {c.tipoAtendimento}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base">{pet?.nome}</h3>
                        <p className="text-xs text-slate-500">
                          {pet?.especie} • {pet?.raca}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.status === 'FINALIZADA'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : c.status === 'CONFIRMADA'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {c.status}
                        </span>

                        <div className="flex items-center gap-1">
                          {c.canalAgendamento && (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                              {c.canalAgendamento === 'BALCAO_PRESENCIAL'
                                ? 'Balcão'
                                : c.canalAgendamento === 'WHATSAPP'
                                ? 'WhatsApp'
                                : c.canalAgendamento === 'TELEFONE'
                                ? 'Telefone'
                                : 'Portal'}
                            </span>
                          )}
                          {c.confirmadoPeloCliente === false && c.status === 'AGENDADA' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-200">
                              Aguardando Tutor
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>Cliente: <strong className="text-slate-800">{tutor?.nome}</strong> ({tutor?.telefone})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Data: {new Date(c.dataHoraAgendada).toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                        <span>Profissional: {c.veterinarioNome}</span>
                      </div>
                    </div>

                    {c.diagnostico && (
                      <div className="text-xs bg-sky-50/60 p-3 rounded-xl border border-sky-100 space-y-1">
                        <strong className="text-sky-900 block font-semibold">Diagnóstico Clínico:</strong>
                        <p className="text-slate-700 leading-relaxed">{c.diagnostico}</p>
                        {c.prescricao && (
                          <div className="pt-2 mt-2 border-t border-sky-100">
                            <strong className="text-sky-900 block font-semibold">Prescrição Médica:</strong>
                            <p className="text-slate-700 font-mono text-[11px]">{c.prescricao}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      R$ {c.valor.toFixed(2)} ({c.statusPagamento})
                    </span>

                    <div className="flex items-center gap-1.5">
                      {c.status === 'AGENDADA' && (
                        <button
                          onClick={() => updateConsulta(c.id, { status: 'CONFIRMADA' })}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                          title="Confirmar agendamento previamente consultado com o cliente"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Confirmar c/ Cliente</span>
                        </button>
                      )}

                      {canManageMedicalRecords() ? (
                        <button
                          onClick={() => openMedicalRecordModal(c.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3 py-1 rounded-lg transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{c.status === 'FINALIZADA' ? 'Ver Prontuário' : 'Efetuar Atendimento'}</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <Lock className="w-3 h-3" />
                          <span>Apenas Veterinário</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Vacinas */}
      {activeTab === 'vacinas' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <th className="py-3 px-4">Animal (Pet)</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Descrição do Procedimento</th>
                  <th className="py-3 px-4">Data de Aplicação</th>
                  <th className="py-3 px-4">Próxima Dose / Validade</th>
                  <th className="py-3 px-4">Lote</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {vacinas.map((v) => {
                  const pet = pets.find((p) => p.id === v.petId);

                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {pet?.nome} ({pet?.especie})
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {v.tipo}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">{v.descricao}</td>
                      <td className="py-3 px-4">{new Date(v.dataAplicacao).toLocaleDateString('pt-BR')}</td>
                      <td className="py-3 px-4">
                        {v.dataProximaDose ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {new Date(v.dataProximaDose).toLocaleDateString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-slate-400">Dose única</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{v.lote || 'N/A'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Agendar Atendimento */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Agendar Atendimento Veterinário</h2>
              <button onClick={() => setIsScheduleOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3.5 mt-4 text-xs">
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
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 font-medium"
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
                      <User className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span><strong>{selectedTutor.nome}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{selectedTutor.telefone}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Selecionar Paciente do Cliente Consultado */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  2. Selecionar Paciente do Cliente *
                </label>
                {tutorPets.length === 0 ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                    Este cliente não possui animais cadastrados no momento.
                  </div>
                ) : (
                  <select
                    value={selectedPetId}
                    onChange={(e) => setSelectedPetId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 font-medium"
                  >
                    {tutorPets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} ({p.especie} - {p.raca} • Porte {p.porte})
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
                        ? 'border-sky-600 bg-sky-50 text-sky-900 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-sky-600" />
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
                    ⚠️ Solicitação recebida à distância: nascerá com status <strong>AGENDADA (Aguardando Confirmação do Tutor)</strong>. O tutor poderá confirmar pelo portal do cliente ou a recepção poderá confirmar após retorno.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Atendimento *</label>
                <select
                  value={tipoAtendimento}
                  onChange={(e) => setTipoAtendimento(e.target.value as TipoAtendimento)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="CONSULTA">Consulta Clínica</option>
                  <option value="RETORNO">Retorno</option>
                  <option value="EXAME">Exame Laboratorial</option>
                  <option value="CIRURGIA">Cirurgia</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data e Hora *</label>
                  <input
                    type="datetime-local"
                    value={dataHoraAgendada}
                    onChange={(e) => setDataHoraAgendada(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    value={valorConsulta}
                    onChange={(e) => setValorConsulta(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Alerta de Conflitos / Serviços Múltiplos Concorrentes */}
              {scheduleConflicts.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {scheduleConflicts.map((conf) => (
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
                          <span>{conf.isSobreposicaoHorario ? 'Atenção: Choque Direto de Horário' : 'Serviço Já Cadastrado na Mesma Data (Combo)'}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/70 font-mono">{conf.servico}</span>
                        </div>
                        <p className="text-[11px] leading-tight">
                          {conf.titulo} ({conf.detalhes})
                        </p>
                        <p className="text-[10px] opacity-80">
                          {conf.isSobreposicaoHorario
                            ? 'O animal já possui outro atendimento clínico agendado próximo a este horário. Verifique o horário antes de confirmar.'
                            : 'O animal fará mais de um serviço nesta data (serviço casado). Os agendamentos constarão no histórico do pet.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status do Agendamento *</label>
                  <select
                    value={scheduleStatus}
                    onChange={(e) => setScheduleStatus(e.target.value as StatusConsulta)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="AGENDADA">Agendada (Pendente confirmação)</option>
                    <option value="CONFIRMADA">Confirmada com o Cliente</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status de Pagamento *</label>
                  <select
                    value={schedulePayment}
                    onChange={(e) => setSchedulePayment(e.target.value as StatusPagamento)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="PENDENTE">Pendente (Pagar no balcão)</option>
                    <option value="PAGO">Pago Antecipadamente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Observações / Confirmação com o Cliente
                </label>
                <input
                  type="text"
                  value={observacoesAgendamento}
                  onChange={(e) => setObservacoesAgendamento(e.target.value)}
                  placeholder="Ex: Cliente solicitou atendimento no início da tarde por WhatsApp..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Prontuário Médico (Restrito a Veterinário) */}
      {isMedicalRecordOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-sky-600" />
                <h2 className="text-base font-bold text-slate-900">Prontuário Veterinário Eletrônico</h2>
              </div>
              <button onClick={() => setIsMedicalRecordOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMedicalRecordSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Diagnóstico e Anamnese *</label>
                <textarea
                  rows={3}
                  required
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  placeholder="Relatório de exame físico, histórico, achados clínicos..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Prescrição Medicamentosa e Orientações *</label>
                <textarea
                  rows={3}
                  required
                  value={prescricao}
                  onChange={(e) => setPrescricao(e.target.value)}
                  placeholder="Medicamento, dosagem, posologia e recomendações ao tutor..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800">
                Profissional Responsável: <strong>{currentUser.nome}</strong> ({currentUser.crmv || 'CRMV Ativo'})
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMedicalRecordOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs"
                >
                  Assinar e Finalizar Atendimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Imunização */}
      {isVaccineOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Registrar Vacina ou Vermífugo</h2>
              <button onClick={() => setIsVaccineOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVaccineSubmit} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Paciente Animal *</label>
                <select
                  value={vacinaPetId}
                  onChange={(e) => setVacinaPetId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                >
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} ({p.especie})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo *</label>
                  <select
                    value={vacinaTipo}
                    onChange={(e) => setVacinaTipo(e.target.value as TipoProcedimento)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="VACINA">Vacina</option>
                    <option value="VERMIFUGO">Vermífugo</option>
                    <option value="ANTIPULGAS">Antipulgas</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lote</label>
                  <input
                    type="text"
                    value={vacinaLote}
                    onChange={(e) => setVacinaLote(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição do Imunizante *</label>
                <input
                  type="text"
                  required
                  value={vacinaDescricao}
                  onChange={(e) => setVacinaDescricao(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data da Aplicação *</label>
                  <input
                    type="date"
                    value={vacinaData}
                    onChange={(e) => setVacinaData(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Próxima Dose Prevista</label>
                  <input
                    type="date"
                    value={vacinaProximaDose}
                    onChange={(e) => setVacinaProximaDose(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVaccineOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs"
                >
                  Salvar Aplicação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
