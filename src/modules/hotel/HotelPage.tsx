import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { AccessDenied } from '../../components/common/AccessDenied';
import type { PetPorte, StatusReserva, StatusPagamento, CanalAgendamento } from '../../types';
import {
  Plus,
  Calendar,
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

export const HotelPage = () => {
  const {
    acomodacoes,
    reservas,
    pets,
    tutors,
    addReserva,
    updateReservaStatus,
    checkPetScheduleConflicts,
  } = useData();
  const { currentUser, canAccessUnit, canManageBookings } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTutorId, setSelectedTutorId] = useState(tutors[0]?.id || '');
  const [selectedPetId, setSelectedPetId] = useState(() => {
    const firstTutorPets = pets.filter((p) => p.tutorId === (tutors[0]?.id || ''));
    return firstTutorPets[0]?.id || pets[0]?.id || '';
  });
  const [selectedAcomodacaoId, setSelectedAcomodacaoId] = useState(
    acomodacoes.find((a) => a.status === 'DISPONIVEL')?.id || acomodacoes[0]?.id || ''
  );
  const [dataCheckinPrevista, setDataCheckinPrevista] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [dataCheckoutPrevista, setDataCheckoutPrevista] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 16);
  });
  const [instrucoesAlimentacao, setInstrucoesAlimentacao] = useState('2x ao dia pela manhã e tarde');
  const [reservaStatus, setReservaStatus] = useState<StatusReserva>('RESERVADA');
  const [reservaPayment, setReservaPayment] = useState<StatusPagamento>('PENDENTE');
  const [canalAgendamento, setCanalAgendamento] = useState<CanalAgendamento>('BALCAO_PRESENCIAL');
  const [bookingError, setBookingError] = useState('');

  const selectedTutor = tutors.find((t) => t.id === selectedTutorId);
  const tutorPets = pets.filter((p) => p.tutorId === selectedTutorId);

  // Detecção de conflitos e serviços múltiplos
  const selectedDate = dataCheckinPrevista.split('T')[0] || '';
  const hotelConflicts = checkPetScheduleConflicts(selectedPetId, selectedDate);

  if (!currentUser) return null;

  if (!canAccessUnit('HOTEL')) {
    return <AccessDenied moduleName="Hotel Pet" />;
  }

  const handleCanalChange = (canal: CanalAgendamento) => {
    setCanalAgendamento(canal);
    if (canal === 'BALCAO_PRESENCIAL') {
      setReservaStatus('HOSPEDADO');
    } else {
      setReservaStatus('RESERVADA');
    }
  };

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');

    const pet = pets.find((p) => p.id === selectedPetId);
    const acomodacao = acomodacoes.find((a) => a.id === selectedAcomodacaoId);

    if (!pet || !acomodacao) return;

    // Check size compatibility
    const sizeOrder: Record<PetPorte, number> = {
      Mini: 1,
      Pequeno: 2,
      Médio: 3,
      Grande: 4,
      Gigante: 5,
    };

    if (sizeOrder[pet.porte] > sizeOrder[acomodacao.portePermitido]) {
      setBookingError(
        `Incompatibilidade de porte: O animal é de porte ${pet.porte}, mas a acomodação suporta até ${acomodacao.portePermitido}.`
      );
      return;
    }

    // Validação de período e disponibilidade
    const checkinDate = new Date(dataCheckinPrevista).getTime();
    const checkoutDate = new Date(dataCheckoutPrevista).getTime();

    if (checkoutDate <= checkinDate) {
      setBookingError('A data de check-out deve ser posterior à data de check-in.');
      return;
    }

    const hasConflict = reservas.some(
      (r) =>
        r.acomodacaoId === acomodacao.id &&
        (r.status === 'RESERVADA' || r.status === 'HOSPEDADO') &&
        !(
          checkoutDate <= new Date(r.dataCheckinPrevista).getTime() ||
          checkinDate >= new Date(r.dataCheckoutPrevista).getTime()
        )
    );

    if (hasConflict) {
      setBookingError(
        'A acomodação selecionada já possui reserva confirmada para este período.'
      );
      return;
    }

    const diffDays = Math.max(
      1,
      Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24))
    );
    const valorTotal = diffDays * acomodacao.valorDiaria;

    const isConfirmadoNoAto = canalAgendamento === 'BALCAO_PRESENCIAL';

    addReserva({
      petId: pet.id,
      acomodacaoId: acomodacao.id,
      dataCheckinPrevista: new Date(dataCheckinPrevista).toISOString(),
      dataCheckoutPrevista: new Date(dataCheckoutPrevista).toISOString(),
      status: isConfirmadoNoAto ? reservaStatus : 'RESERVADA',
      totalDiarias: diffDays,
      valorTotal,
      statusPagamento: reservaPayment,
      instrucoesAlimentacao,
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Hotel Pet</h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de acomodações, controle de diárias, check-in e check-out de hóspedes.
          </p>
        </div>

        {canManageBookings() && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Reserva de Hospedagem</span>
          </button>
        )}
      </div>

      {/* Accommodation Cards */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-slate-900">Mapa de Acomodações & Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {acomodacoes.map((acom) => {
            const currentBooking = reservas.find(
              (r) => r.acomodacaoId === acom.id && r.status === 'HOSPEDADO'
            );
            const petHospedado = currentBooking ? pets.find((p) => p.id === currentBooking.petId) : null;

            return (
              <div
                key={acom.id}
                className={`p-4 rounded-2xl border transition-all ${
                  acom.status === 'OCUPADA'
                    ? 'border-blue-300 bg-blue-50/50'
                    : acom.status === 'DISPONIVEL'
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-slate-200 bg-slate-100 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900">{acom.identificacao}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      acom.status === 'OCUPADA'
                        ? 'bg-blue-200 text-blue-900'
                        : acom.status === 'DISPONIVEL'
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {acom.status}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 space-y-1">
                  <div>Porte: <strong className="text-slate-800">{acom.portePermitido}</strong></div>
                  <div>Diária: <strong className="font-mono text-slate-900">R$ {acom.valorDiaria.toFixed(2)}</strong></div>
                </div>

                {petHospedado && (
                  <div className="mt-2 pt-2 border-t border-blue-200 text-[10px] text-blue-900 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-blue-600" />
                    <span>Hóspede: {petHospedado.nome}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Reservas & Estadias Registradas</h2>
          <span className="text-xs text-slate-400">{reservas.length} reserva(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <th className="py-3 px-4">Cliente (Tutor)</th>
                <th className="py-3 px-4">Hóspede (Pet)</th>
                <th className="py-3 px-4">Acomodação</th>
                <th className="py-3 px-4">Período Previsto</th>
                <th className="py-3 px-4">Diárias / Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {reservas.map((res) => {
                const pet = pets.find((p) => p.id === res.petId);
                const tutor = pet ? tutors.find((t) => t.id === pet.tutorId) : null;
                const acom = acomodacoes.find((a) => a.id === res.acomodacaoId);

                return (
                  <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">{tutor?.nome}</span>
                      <span className="text-[11px] text-slate-400">{tutor?.telefone}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {pet?.nome}
                      <span className="block text-[11px] font-normal text-slate-400">
                        {pet?.especie} • {pet?.porte}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium">{acom?.identificacao}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(res.dataCheckinPrevista).toLocaleDateString('pt-BR')} até{' '}
                          {new Date(res.dataCheckoutPrevista).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-800">
                        {res.totalDiarias} diárias • R$ {res.valorTotal.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            res.status === 'HOSPEDADO'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : res.status === 'FINALIZADA'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {res.status}
                        </span>

                        <div className="flex items-center gap-1">
                          {res.canalAgendamento && (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                              {res.canalAgendamento === 'BALCAO_PRESENCIAL'
                                ? 'Balcão'
                                : res.canalAgendamento === 'WHATSAPP'
                                ? 'WhatsApp'
                                : res.canalAgendamento === 'TELEFONE'
                                ? 'Telefone'
                                : 'Portal'}
                            </span>
                          )}
                          {res.confirmadoPeloCliente === false && res.status === 'RESERVADA' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-200">
                              Aguardando Tutor
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {res.status === 'RESERVADA' && canManageBookings() && (
                        <button
                          onClick={() => updateReservaStatus(res.id, 'HOSPEDADO')}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg"
                        >
                          <DoorOpen className="w-3.5 h-3.5" />
                          <span>Check-in</span>
                        </button>
                      )}
                      {res.status === 'HOSPEDADO' && canManageBookings() && (
                        <button
                          onClick={() => updateReservaStatus(res.id, 'FINALIZADA')}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Check-out</span>
                        </button>
                      )}
                      {res.status === 'FINALIZADA' && (
                        <span className="text-[11px] text-slate-400">Encerrada</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nova Reserva */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Nova Reserva de Hospedagem</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs">
                {bookingError}
              </div>
            )}

            <form onSubmit={handleCreateBooking} className="space-y-3.5 mt-4 text-xs">
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
                      <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span><strong>{selectedTutor.nome}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{selectedTutor.telefone}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Selecionar Hóspede do Cliente Consultado */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  2. Selecionar Hóspede Animal do Cliente *
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
                        {p.nome} ({p.especie} - Porte {p.porte})
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
                        ? 'border-amber-600 bg-amber-50 text-amber-900 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-600" />
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
                    ⚠️ Solicitação à distância: nascerá como <strong>RESERVADA (Aguardando Confirmação do Tutor)</strong>. O tutor poderá confirmar pelo portal do cliente ou a recepção poderá dar check-in após chegada.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Acomodação Desejada *</label>
                <select
                  value={selectedAcomodacaoId}
                  onChange={(e) => setSelectedAcomodacaoId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                >
                  {acomodacoes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.identificacao} (Porte {a.portePermitido} - R$ {a.valorDiaria}/dia) - {a.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data Check-in *</label>
                  <input
                    type="datetime-local"
                    value={dataCheckinPrevista}
                    onChange={(e) => setDataCheckinPrevista(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data Check-out *</label>
                  <input
                    type="datetime-local"
                    value={dataCheckoutPrevista}
                    onChange={(e) => setDataCheckoutPrevista(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Alerta de Conflitos / Serviços Múltiplos */}
              {hotelConflicts.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {hotelConflicts.map((conf) => (
                    <div
                      key={conf.id}
                      className="p-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs flex items-start gap-2.5"
                    >
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <div className="font-bold flex items-center gap-1.5">
                          <span>Serviço Já Cadastrado no Período (Combo Hotel + Serviço)</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/70 font-mono">{conf.servico}</span>
                        </div>
                        <p className="text-[11px] leading-tight">
                          {conf.titulo} ({conf.detalhes})
                        </p>
                        <p className="text-[10px] text-amber-700 opacity-90">
                          O pet poderá usufruir de consultas ou creche casadas durante a estadia no hotel.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status da Reserva *</label>
                  <select
                    value={reservaStatus}
                    onChange={(e) => setReservaStatus(e.target.value as StatusReserva)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="RESERVADA">Reservada (Aguardando check-in)</option>
                    <option value="HOSPEDADO">Hospedado Imediatamente (Check-in)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status de Pagamento *</label>
                  <select
                    value={reservaPayment}
                    onChange={(e) => setReservaPayment(e.target.value as StatusPagamento)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="PENDENTE">Pendente (Pagar no check-out/balcão)</option>
                    <option value="PAGO">Pago Antecipadamente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Instruções de Alimentação</label>
                <input
                  type="text"
                  value={instrucoesAlimentacao}
                  onChange={(e) => setInstrucoesAlimentacao(e.target.value)}
                  placeholder="Gramagem, horários e rotina..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                >
                  Confirmar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
