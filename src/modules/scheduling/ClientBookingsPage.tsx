import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  CalendarCheck,
  Calendar,
  Clock,
  Dog,
  Stethoscope,
  BedDouble,
  Sun,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Check,
  Sparkles,
  Layers,
  Building2,
  Phone,
  PhoneCall,
  MessageSquare,
  User,
} from 'lucide-react';
import type {
  Pet,
  TipoAtendimento,
  TurnoCreche,
  CanalAgendamento,
  ConflitoAgendamento,
} from '../../types';

type ServiceType = 'CLINICA' | 'HOTEL' | 'CRECHE';
type FilterTab = 'TODOS' | 'CLINICA' | 'HOTEL' | 'CRECHE' | 'MULTIPLOS';

export const ClientBookingsPage = () => {
  const { currentUser } = useAuth();
  const {
    tutors,
    pets,
    consultas,
    reservas,
    creche,
    acomodacoes,
    addConsulta,
    updateConsulta,
    addReserva,
    updateReservaStatus,
    addPresencaCreche,
    updatePresencaCreche,
    checkPetScheduleConflicts,
    confirmarAgendamentoCliente,
    recusarAgendamentoCliente,
  } = useData();

  if (!currentUser) return null;

  const isStaff = currentUser.perfil !== 'TUTOR';

  // State for filters
  const [activeTab, setActiveTab] = useState<FilterTab>('TODOS');
  const [selectedTutorFilter, setSelectedTutorFilter] = useState<string>('TODOS');
  const [selectedPetFilter, setSelectedPetFilter] = useState<string>('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State: Multi-service selection enabled!
  const [selectedTutorId, setSelectedTutorId] = useState<string>(tutors[0]?.id || '');
  const [canalAgendamento, setCanalAgendamento] = useState<CanalAgendamento>('BALCAO_PRESENCIAL');
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<{
    clinica: boolean;
    hotel: boolean;
    creche: boolean;
  }>({
    clinica: true,
    hotel: false,
    creche: false,
  });

  // Clinic fields
  const [tipoAtendimento, setTipoAtendimento] = useState<TipoAtendimento>('CONSULTA');
  const [dataHoraConsulta, setDataHoraConsulta] = useState<string>('');
  const [clinicaObservacoes, setClinicaObservacoes] = useState<string>('');

  // Hotel fields
  const [acomodacaoId, setAcomodacaoId] = useState<string>('');
  const [dataCheckin, setDataCheckin] = useState<string>('');
  const [dataCheckout, setDataCheckout] = useState<string>('');
  const [hotelInstrucoes, setHotelInstrucoes] = useState<string>('');

  // Daycare fields
  const [dataCreche, setDataCreche] = useState<string>('');
  const [turnoCreche, setTurnoCreche] = useState<TurnoCreche>('INTEGRAL');
  const [crecheObservacoes, setCrecheObservacoes] = useState<string>('');

  // Form error
  const [formError, setFormError] = useState<string | null>(null);

  // Resolve logged tutor (if tutor portal)
  const loggedTutor = !isStaff
    ? tutors.find((t) => t.email.toLowerCase() === currentUser.email.toLowerCase())
    : undefined;

  const myPets = !isStaff && loggedTutor
    ? pets.filter((p) => p.tutorId === loggedTutor.id)
    : pets;

  const myPetIds = myPets.map((p) => p.id);

  // Filter items based on staff vs tutor view and filters
  const baseConsultas = isStaff
    ? (selectedTutorFilter === 'TODOS'
        ? consultas
        : consultas.filter((c) => {
            const pet = pets.find((p) => p.id === c.petId);
            return pet && pet.tutorId === selectedTutorFilter;
          }))
    : consultas.filter((c) => myPetIds.includes(c.petId));

  const baseReservas = isStaff
    ? (selectedTutorFilter === 'TODOS'
        ? reservas
        : reservas.filter((r) => {
            const pet = pets.find((p) => p.id === r.petId);
            return pet && pet.tutorId === selectedTutorFilter;
          }))
    : reservas.filter((r) => myPetIds.includes(r.petId));

  const baseCreche = isStaff
    ? (selectedTutorFilter === 'TODOS'
        ? creche
        : creche.filter((cr) => {
            const pet = pets.find((p) => p.id === cr.petId);
            return pet && pet.tutorId === selectedTutorFilter;
          }))
    : creche.filter((cr) => myPetIds.includes(cr.petId));

  // Modal context: resolve selected tutor and their pets
  const modalSelectedTutor = isStaff
    ? tutors.find((t) => t.id === selectedTutorId) || tutors[0]
    : loggedTutor;

  const modalPets = isStaff
    ? pets.filter((p) => p.tutorId === (modalSelectedTutor?.id || selectedTutorId))
    : myPets;

  // Selected pet object for modal validations
  const selectedPet: Pet | undefined = pets.find((p) => p.id === selectedPetId);

  // Available accommodations matching pet size
  const compatibleRooms = acomodacoes.filter(
    (a) => a.status !== 'MANUTENCAO' && (!selectedPet || a.portePermitido === selectedPet.porte)
  );

  // Handle tutor change in modal (Staff view)
  const handleTutorSelectChange = (newTutorId: string) => {
    setSelectedTutorId(newTutorId);
    const clientPets = pets.filter((p) => p.tutorId === newTutorId);
    setSelectedPetId(clientPets[0]?.id || '');
  };

  // Helper to toggle a service in the multi-select modal
  const toggleService = (type: 'clinica' | 'hotel' | 'creche') => {
    setSelectedServices((prev) => {
      const updated = { ...prev, [type]: !prev[type] };
      // Ensure at least one service remains selected
      if (!updated.clinica && !updated.hotel && !updated.creche) {
        return prev;
      }
      return updated;
    });
  };

  // Real-time conflict detection inside the modal
  const modalConflicts: ConflitoAgendamento[] = [];
  if (selectedPetId) {
    if (selectedServices.clinica && dataHoraConsulta) {
      const date = dataHoraConsulta.split('T')[0];
      const time = dataHoraConsulta.split('T')[1]?.slice(0, 5);
      modalConflicts.push(...checkPetScheduleConflicts(selectedPetId, date, { time }));
    }
    if (selectedServices.creche && dataCreche) {
      modalConflicts.push(
        ...checkPetScheduleConflicts(selectedPetId, dataCreche, { turno: turnoCreche })
      );
    }
    if (selectedServices.hotel && dataCheckin) {
      const date = dataCheckin.split('T')[0];
      modalConflicts.push(...checkPetScheduleConflicts(selectedPetId, date));
    }
  }

  // Deduplicate conflicts by id
  const uniqueModalConflicts = modalConflicts.filter(
    (c, index, self) => index === self.findIndex((item) => item.id === c.id)
  );

  // Calculate estimated total for multi-service booking
  const calculateEstimatedTotal = (): number => {
    let total = 0;
    if (selectedServices.clinica) {
      total += tipoAtendimento === 'RETORNO' ? 80 : tipoAtendimento === 'EXAME' ? 180 : 150;
    }
    if (selectedServices.hotel && acomodacaoId && dataCheckin && dataCheckout) {
      const checkinDate = new Date(dataCheckin);
      const checkoutDate = new Date(dataCheckout);
      if (checkoutDate > checkinDate) {
        const room = acomodacoes.find((a) => a.id === acomodacaoId);
        if (room) {
          const diffDays = Math.max(1, Math.ceil((checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24)));
          total += diffDays * room.valorDiaria;
        }
      }
    }
    if (selectedServices.creche) {
      total += turnoCreche === 'INTEGRAL' ? 75 : 45;
    }
    return total;
  };

  // Handle multi-service appointment submission
  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedPetId) {
      setFormError('Selecione o animal para o agendamento.');
      return;
    }

    if (!selectedServices.clinica && !selectedServices.hotel && !selectedServices.creche) {
      setFormError('Selecione pelo menos um serviço para agendar.');
      return;
    }

    // Validate Clinica
    if (selectedServices.clinica && !dataHoraConsulta) {
      setFormError('Informe a data e o horário da consulta clínica.');
      return;
    }

    // Validate Hotel
    let hotelDiarias = 0;
    let hotelValor = 0;
    if (selectedServices.hotel) {
      if (!acomodacaoId) {
        setFormError('Selecione uma acomodação compatível para a hospedagem.');
        return;
      }
      if (!dataCheckin || !dataCheckout) {
        setFormError('Informe as datas previstas de check-in e check-out do hotel.');
        return;
      }

      const checkinDate = new Date(dataCheckin);
      const checkoutDate = new Date(dataCheckout);

      if (checkoutDate <= checkinDate) {
        setFormError('A data de check-out do hotel deve ser posterior à data de check-in.');
        return;
      }

      const room = acomodacoes.find((a) => a.id === acomodacaoId);
      if (!room) {
        setFormError('Acomodação de hotel inválida.');
        return;
      }

      const diffTime = Math.abs(checkoutDate.getTime() - checkinDate.getTime());
      hotelDiarias = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      hotelValor = hotelDiarias * room.valorDiaria;
    }

    // Validate Creche
    if (selectedServices.creche) {
      if (!dataCreche) {
        setFormError('Informe a data desejada para a permanência na creche.');
        return;
      }

      const currentCount = creche.filter(
        (cr) => cr.dataFrequencia === dataCreche && cr.turno === turnoCreche && cr.status !== 'CANCELADO'
      ).length;

      if (currentCount >= 10) {
        setFormError(`Capacidade esgotada para o turno ${turnoCreche} da creche nesta data.`);
        return;
      }
    }

    try {
      const scheduledNames: string[] = [];
      const effectiveCanal: CanalAgendamento = isStaff ? canalAgendamento : 'PORTAL_TUTOR';
      const isConfirmed = effectiveCanal === 'PORTAL_TUTOR' || effectiveCanal === 'BALCAO_PRESENCIAL';
      const nowIso = new Date().toISOString();

      // 1. Add Hotel if selected
      if (selectedServices.hotel) {
        addReserva({
          petId: selectedPetId,
          acomodacaoId,
          dataCheckinPrevista: new Date(dataCheckin).toISOString(),
          dataCheckoutPrevista: new Date(dataCheckout).toISOString(),
          status: 'RESERVADA',
          totalDiarias: hotelDiarias,
          valorTotal: hotelValor,
          statusPagamento: 'PENDENTE',
          instrucoesAlimentacao: hotelInstrucoes,
          canalAgendamento: effectiveCanal,
          confirmadoPeloCliente: isConfirmed,
          dataConfirmacaoCliente: isConfirmed ? nowIso : undefined,
        });
        scheduledNames.push('Hospedagem no Hotel');
      }

      // 2. Add Clinic if selected
      if (selectedServices.clinica) {
        const valor = tipoAtendimento === 'RETORNO' ? 80 : tipoAtendimento === 'EXAME' ? 180 : 150;
        addConsulta({
          petId: selectedPetId,
          veterinarioId: 'user-vet-1',
          veterinarioNome: 'Dra. Camila Nogueira (CRMV-RN 14205)',
          dataHoraAgendada: new Date(dataHoraConsulta).toISOString(),
          tipoAtendimento,
          status: isConfirmed ? 'CONFIRMADA' : 'AGENDADA',
          valor,
          statusPagamento: 'PENDENTE',
          canalAgendamento: effectiveCanal,
          confirmadoPeloCliente: isConfirmed,
          dataConfirmacaoCliente: isConfirmed ? nowIso : undefined,
          diagnostico: clinicaObservacoes
            ? `Observações: ${clinicaObservacoes}${
                selectedServices.hotel ? ' (Agendado em conjunto com Hospedagem no Hotel)' : ''
              }`
            : undefined,
        });
        scheduledNames.push('Consulta Clínica');
      }

      // 3. Add Daycare if selected
      if (selectedServices.creche) {
        const valor = turnoCreche === 'INTEGRAL' ? 75 : 45;
        addPresencaCreche({
          petId: selectedPetId,
          responsavelId: 'user-func-1',
          responsavelNome: 'Lucas Martins (Monitor Chefe)',
          dataFrequencia: dataCreche,
          turno: turnoCreche,
          status: 'AGENDADO',
          valor,
          statusPagamento: 'PENDENTE',
          canalAgendamento: effectiveCanal,
          confirmadoPeloCliente: isConfirmed,
          dataConfirmacaoCliente: isConfirmed ? nowIso : undefined,
          relatorioDiario: crecheObservacoes ? `Nota: ${crecheObservacoes}` : undefined,
        });
        scheduledNames.push('Creche / Daycare');
      }

      const petName = selectedPet?.nome || 'o animal';
      const tutorName = modalSelectedTutor?.nome || 'o cliente';
      const confirmationNotice = !isConfirmed
        ? ' (Solicitação recebida à distância: aguardando confirmação do tutor).'
        : '';

      setSuccessMessage(
        scheduledNames.length > 1
          ? `Combo de serviços agendado com sucesso para ${petName} (${scheduledNames.join(' + ')}) - Tutor: ${tutorName}!${confirmationNotice}`
          : `${scheduledNames[0]} agendado(a) com sucesso para ${petName} - Tutor: ${tutorName}!${confirmationNotice}`
      );

      // Reset modal state
      setIsModalOpen(false);
      setClinicaObservacoes('');
      setHotelInstrucoes('');
      setCrecheObservacoes('');
      setDataHoraConsulta('');
      setDataCheckin('');
      setDataCheckout('');
      setDataCreche('');
      setSelectedServices({ clinica: true, hotel: false, creche: false });

      setTimeout(() => setSuccessMessage(null), 6000);
    } catch {
      setFormError('Ocorreu um erro ao registrar o agendamento.');
    }
  };

  // Compile unified list of bookings for view
  interface UnifiedBooking {
    id: string;
    originalId: string;
    type: ServiceType;
    petId: string;
    petName: string;
    petBreed: string;
    tutorId: string;
    tutorName: string;
    tutorPhone: string;
    title: string;
    detail: string;
    dateFormatted: string;
    rawDate: string;
    status: string;
    statusColor: string;
    valor: number;
    pagamento: 'PENDENTE' | 'PAGO';
    canCancel: boolean;
    concurrentServicesCount: number;
    concurrentServicesSummary: string[];
    canalAgendamento?: CanalAgendamento;
    confirmadoPeloCliente?: boolean;
    needsClientConfirmation: boolean;
  }

  // Count active / pending services per pet
  const getPetConcurrentServices = (petId: string, currentBookingId: string) => {
    const concurrent: string[] = [];

    consultas
      .filter((c) => c.petId === petId && `consulta-${c.id}` !== currentBookingId && c.status !== 'CANCELADA')
      .forEach((c) => concurrent.push(`🩺 Clínica (${c.tipoAtendimento})`));

    reservas
      .filter((r) => r.petId === petId && `hotel-${r.id}` !== currentBookingId && r.status !== 'CANCELADA')
      .forEach((r) => {
        const room = acomodacoes.find((a) => a.id === r.acomodacaoId);
        concurrent.push(`🏨 Hotel (${room ? room.identificacao : 'Hospedagem'})`);
      });

    creche
      .filter((cr) => cr.petId === petId && `creche-${cr.id}` !== currentBookingId && cr.status !== 'CANCELADO')
      .forEach((cr) => concurrent.push(`☀️ Creche (${cr.turno})`));

    return concurrent;
  };

  const unifiedBookings: UnifiedBooking[] = [
    ...baseConsultas.map((c) => {
      const pet = pets.find((p) => p.id === c.petId);
      const tutor = pet ? tutors.find((t) => t.id === pet.tutorId) : undefined;
      const isPending = c.status === 'AGENDADA' || c.status === 'CONFIRMADA';
      const concurrent = getPetConcurrentServices(c.petId, `consulta-${c.id}`);

      return {
        id: `consulta-${c.id}`,
        originalId: c.id,
        type: 'CLINICA' as ServiceType,
        petId: c.petId,
        petName: pet ? pet.nome : 'Pet',
        petBreed: pet ? `${pet.especie} • ${pet.raca}` : '',
        tutorId: tutor?.id || '',
        tutorName: tutor?.nome || 'Cliente',
        tutorPhone: tutor?.telefone || '',
        title: `Consulta Veterinária (${c.tipoAtendimento})`,
        detail: c.veterinarioNome,
        dateFormatted: new Date(c.dataHoraAgendada).toLocaleString('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short',
        }),
        rawDate: c.dataHoraAgendada,
        status: c.status,
        statusColor:
          c.status === 'FINALIZADA'
            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
            : c.status === 'CONFIRMADA'
            ? 'text-sky-700 bg-sky-50 border-sky-200'
            : c.status === 'AGENDADA'
            ? 'text-blue-700 bg-blue-50 border-blue-200'
            : 'text-rose-700 bg-rose-50 border-rose-200',
        valor: c.valor,
        pagamento: c.statusPagamento,
        canCancel: isPending,
        concurrentServicesCount: concurrent.length,
        concurrentServicesSummary: concurrent,
        canalAgendamento: c.canalAgendamento,
        confirmadoPeloCliente: c.confirmadoPeloCliente,
        needsClientConfirmation: c.confirmadoPeloCliente === false && c.status === 'AGENDADA',
      };
    }),
    ...baseReservas.map((r) => {
      const pet = pets.find((p) => p.id === r.petId);
      const tutor = pet ? tutors.find((t) => t.id === pet.tutorId) : undefined;
      const room = acomodacoes.find((a) => a.id === r.acomodacaoId);
      const isPending = r.status === 'RESERVADA';
      const checkinStr = new Date(r.dataCheckinPrevista).toLocaleDateString('pt-BR');
      const checkoutStr = new Date(r.dataCheckoutPrevista).toLocaleDateString('pt-BR');
      const concurrent = getPetConcurrentServices(r.petId, `hotel-${r.id}`);

      return {
        id: `hotel-${r.id}`,
        originalId: r.id,
        type: 'HOTEL' as ServiceType,
        petId: r.petId,
        petName: pet ? pet.nome : 'Pet',
        petBreed: pet ? `${pet.especie} • ${pet.raca}` : '',
        tutorId: tutor?.id || '',
        tutorName: tutor?.nome || 'Cliente',
        tutorPhone: tutor?.telefone || '',
        title: `Hospedagem Hotel (${room ? room.identificacao : 'Acomodação'})`,
        detail: `${r.totalDiarias} diária(s) contratada(s)`,
        dateFormatted: `${checkinStr} até ${checkoutStr}`,
        rawDate: r.dataCheckinPrevista,
        status: r.status,
        statusColor:
          r.status === 'HOSPEDADO'
            ? 'text-purple-700 bg-purple-50 border-purple-200'
            : r.status === 'RESERVADA'
            ? 'text-amber-700 bg-amber-50 border-amber-200'
            : r.status === 'FINALIZADA'
            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
            : 'text-rose-700 bg-rose-50 border-rose-200',
        valor: r.valorTotal,
        pagamento: r.statusPagamento,
        canCancel: isPending,
        concurrentServicesCount: concurrent.length,
        concurrentServicesSummary: concurrent,
        canalAgendamento: r.canalAgendamento,
        confirmadoPeloCliente: r.confirmadoPeloCliente,
        needsClientConfirmation: r.confirmadoPeloCliente === false && r.status === 'RESERVADA',
      };
    }),
    ...baseCreche.map((cr) => {
      const pet = pets.find((p) => p.id === cr.petId);
      const tutor = pet ? tutors.find((t) => t.id === pet.tutorId) : undefined;
      const isPending = cr.status === 'AGENDADO';
      const concurrent = getPetConcurrentServices(cr.petId, `creche-${cr.id}`);

      return {
        id: `creche-${cr.id}`,
        originalId: cr.id,
        type: 'CRECHE' as ServiceType,
        petId: cr.petId,
        petName: pet ? pet.nome : 'Pet',
        petBreed: pet ? `${pet.especie} • ${pet.raca}` : '',
        tutorId: tutor?.id || '',
        tutorName: tutor?.nome || 'Cliente',
        tutorPhone: tutor?.telefone || '',
        title: `Creche / Daycare (${cr.turno})`,
        detail: `Monitor: ${cr.responsavelNome}`,
        dateFormatted: new Date(cr.dataFrequencia + 'T12:00:00').toLocaleDateString('pt-BR'),
        rawDate: cr.dataFrequencia,
        status: cr.status,
        statusColor:
          cr.status === 'PRESENTE'
            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
            : cr.status === 'AGENDADO'
            ? 'text-sky-700 bg-sky-50 border-sky-200'
            : cr.status === 'FINALIZADO'
            ? 'text-slate-700 bg-slate-100 border-slate-200'
            : 'text-rose-700 bg-rose-50 border-rose-200',
        valor: cr.valor,
        pagamento: cr.statusPagamento,
        canCancel: isPending,
        concurrentServicesCount: concurrent.length,
        concurrentServicesSummary: concurrent,
        canalAgendamento: cr.canalAgendamento,
        confirmadoPeloCliente: cr.confirmadoPeloCliente,
        needsClientConfirmation: cr.confirmadoPeloCliente === false && cr.status === 'AGENDADO',
      };
    }),
  ].sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

  // Pets that currently have more than 1 service scheduled
  const availableFilterPets = isStaff
    ? selectedTutorFilter === 'TODOS'
      ? pets
      : pets.filter((p) => p.tutorId === selectedTutorFilter)
    : myPets;

  const petsWithMultipleServices = availableFilterPets.filter((pet) => {
    const petConsultas = consultas.filter((c) => c.petId === pet.id && c.status !== 'CANCELADA').length;
    const petReservas = reservas.filter((r) => r.petId === pet.id && r.status !== 'CANCELADA').length;
    const petCreche = creche.filter((cr) => cr.petId === pet.id && cr.status !== 'CANCELADO').length;
    return petConsultas + petReservas + petCreche > 1;
  });

  // Filter unified list
  const filteredBookings = unifiedBookings.filter((item) => {
    let matchesTab = true;
    if (activeTab === 'MULTIPLOS') {
      matchesTab = item.concurrentServicesCount > 0;
    } else if (activeTab !== 'TODOS') {
      matchesTab = item.type === activeTab;
    }

    const matchesPet = selectedPetFilter === 'TODOS' || item.petId === selectedPetFilter;
    return matchesTab && matchesPet;
  });

  const handleCancelBooking = (booking: UnifiedBooking) => {
    if (!window.confirm(`Deseja realmente cancelar este agendamento (${booking.title})?`)) return;

    if (booking.type === 'CLINICA') {
      updateConsulta(booking.originalId, { status: 'CANCELADA' });
    } else if (booking.type === 'HOTEL') {
      updateReservaStatus(booking.originalId, 'CANCELADA');
    } else if (booking.type === 'CRECHE') {
      updatePresencaCreche(booking.originalId, { status: 'CANCELADO' });
    }
  };

  const activeServicesCount =
    (selectedServices.clinica ? 1 : 0) +
    (selectedServices.hotel ? 1 : 0) +
    (selectedServices.creche ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 p-6 rounded-2xl text-white shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {isStaff ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> Visão Atendimento / Recepção
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs flex items-center gap-1">
                <CalendarCheck className="w-3.5 h-3.5" /> Portal do Tutor
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-100 backdrop-blur-xs flex items-center gap-1 border border-emerald-400/30">
              <Sparkles className="w-3.5 h-3.5" /> Agendamento Múltiplo & Integrado
            </span>
          </div>
          <h1 className="text-2xl font-bold">
            {isStaff ? 'Central de Agendamentos Online (Atendimento)' : 'Central de Agendamentos Online'}
          </h1>
          <p className="text-sm text-sky-100 mt-1 max-w-xl">
            {isStaff
              ? 'Consulte solicitações de agendamento online de clientes, agende combos integrados e registre atendimentos presenciais ou remotos (WhatsApp / Telefone) com checagem de conflitos.'
              : 'Reserve consultas clínicas, hospedagem no hotel e dias na creche para seus animais, de forma individual ou combinada em um único pedido.'}
          </p>
        </div>

        <button
          onClick={() => {
            if (isStaff) {
              const initialTutor = tutors[0];
              setSelectedTutorId(initialTutor ? initialTutor.id : '');
              const tPets = initialTutor ? pets.filter((p) => p.tutorId === initialTutor.id) : [];
              setSelectedPetId(tPets[0]?.id || '');
              setCanalAgendamento('BALCAO_PRESENCIAL');
            } else {
              if (myPets.length > 0 && !selectedPetId) {
                setSelectedPetId(myPets[0].id);
              }
            }
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-3.5 bg-white text-sky-700 hover:bg-sky-50 font-semibold text-sm rounded-xl shadow-md transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Novo Agendamento (Individual ou Combo)
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Multi-Service Pets Spotlight Alert */}
      {petsWithMultipleServices.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-200/80 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-indigo-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-indigo-950 text-sm block">
                Animais com Múltiplos Serviços Concorrentes ({petsWithMultipleServices.length})
              </span>
              <span className="text-indigo-700">
                {isStaff ? 'Pacientes com serviços simultâneos: ' : 'Seus animais: '}
                {petsWithMultipleServices.map((p) => (
                  <strong key={p.id} className="text-indigo-950 font-semibold mr-1.5">
                    {p.nome}
                  </strong>
                ))}{' '}
                possuem mais de um serviço agendado ou ativo no complexo.
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('MULTIPLOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors shrink-0 ${
              activeTab === 'MULTIPLOS'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
            }`}
          >
            Visualizar Combos & Concorrentes
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clínica</span>
            <div className="text-2xl font-bold text-slate-900">{baseConsultas.length}</div>
            <span className="text-xs text-slate-500">atendimentos registrados</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <BedDouble className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hotel Pet</span>
            <div className="text-2xl font-bold text-slate-900">{baseReservas.length}</div>
            <span className="text-xs text-slate-500">reservas de hospedagem</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Sun className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Creche / Daycare</span>
            <div className="text-2xl font-bold text-slate-900">{baseCreche.length}</div>
            <span className="text-xs text-slate-500">frequências agendadas</span>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        {/* Service Type Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('TODOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'TODOS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({unifiedBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('CLINICA')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'CLINICA'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            Clínica ({baseConsultas.length})
          </button>
          <button
            onClick={() => setActiveTab('HOTEL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'HOTEL'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BedDouble className="w-3.5 h-3.5" />
            Hotel ({baseReservas.length})
          </button>
          <button
            onClick={() => setActiveTab('CRECHE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'CRECHE'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            Creche ({baseCreche.length})
          </button>
          {petsWithMultipleServices.length > 0 && (
            <button
              onClick={() => setActiveTab('MULTIPLOS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'MULTIPLOS'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-600 hover:text-indigo-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Múltiplos Serviços Concorrentes
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Staff: Filter by Tutor */}
          {isStaff && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" /> Tutor:
              </span>
              <select
                value={selectedTutorFilter}
                onChange={(e) => {
                  setSelectedTutorFilter(e.target.value);
                  setSelectedPetFilter('TODOS');
                }}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 max-w-[180px]"
              >
                <option value="TODOS">Todos os Clientes</option>
                {tutors.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome} ({t.telefone})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Pet Filter */}
          {availableFilterPets.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <Dog className="w-3.5 h-3.5 text-slate-400" /> Pet:
              </span>
              <select
                value={selectedPetFilter}
                onChange={(e) => setSelectedPetFilter(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 max-w-[160px]"
              >
                <option value="TODOS">Todos os Pets</option>
                {availableFilterPets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} ({p.raca})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 px-4">
            <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">Nenhum agendamento encontrado</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Nenhum registro corresponde aos filtros selecionados. Clique no botão abaixo para iniciar um agendamento individual ou combo.
            </p>
            <button
              onClick={() => {
                if (isStaff) {
                  const initialTutor = tutors[0];
                  setSelectedTutorId(initialTutor ? initialTutor.id : '');
                  const tPets = initialTutor ? pets.filter((p) => p.tutorId === initialTutor.id) : [];
                  setSelectedPetId(tPets[0]?.id || '');
                  setCanalAgendamento('BALCAO_PRESENCIAL');
                } else {
                  if (myPets.length > 0 && !selectedPetId) {
                    setSelectedPetId(myPets[0].id);
                  }
                }
                setIsModalOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Realizar Agendamento
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredBookings.map((b) => (
              <div
                key={b.id}
                className="p-4 sm:p-5 flex flex-col gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        b.type === 'CLINICA'
                          ? 'bg-blue-50 text-blue-600'
                          : b.type === 'HOTEL'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {b.type === 'CLINICA' && <Stethoscope className="w-5 h-5" />}
                      {b.type === 'HOTEL' && <BedDouble className="w-5 h-5" />}
                      {b.type === 'CRECHE' && <Sun className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-slate-900 text-sm">{b.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${b.statusColor}`}>
                          {b.status}
                        </span>
                        {b.canalAgendamento && (
                          <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                            {b.canalAgendamento === 'BALCAO_PRESENCIAL'
                              ? 'Origem: Balcão'
                              : b.canalAgendamento === 'WHATSAPP'
                              ? 'Origem: WhatsApp'
                              : b.canalAgendamento === 'TELEFONE'
                              ? 'Origem: Telefone'
                              : 'Origem: Portal do Tutor'}
                          </span>
                        )}
                        {b.confirmadoPeloCliente === false && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Aguardando Aceite do Tutor
                          </span>
                        )}
                        {b.confirmadoPeloCliente === true && b.canalAgendamento && b.canalAgendamento !== 'PORTAL_TUTOR' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Aceite Confirmado
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 mt-1">
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Dog className="w-3.5 h-3.5 text-slate-400" />
                          {b.petName} <span className="text-slate-400 font-normal">({b.petBreed})</span>
                        </span>
                        <span>•</span>
                        {isStaff && (
                          <>
                            <span className="flex items-center gap-1 font-semibold text-slate-700">
                              <User className="w-3.5 h-3.5 text-sky-600" />
                              Tutor: {b.tutorName} <span className="text-slate-400 font-normal">({b.tutorPhone})</span>
                            </span>
                            <span>•</span>
                          </>
                        )}
                        <span className="flex items-center gap-1 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {b.dateFormatted}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 mt-1">{b.detail}</div>

                      {/* Multi-service concurrent indicator */}
                      {b.concurrentServicesCount > 0 && (
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Layers className="w-3 h-3 text-indigo-600" />
                            + {b.concurrentServicesCount} serviço(s) concorrente(s) para {b.petName}:
                          </span>
                          {b.concurrentServicesSummary.map((svc, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md border border-slate-200"
                            >
                              {svc}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(b.valor)}
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          b.pagamento === 'PAGO'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {b.pagamento === 'PAGO' ? 'Pago' : 'Pagamento no Local'}
                      </span>
                    </div>

                    {b.canCancel && !b.needsClientConfirmation && (
                      <button
                        onClick={() => handleCancelBooking(b)}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
                        title="Cancelar este agendamento"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>

                {/* Banner de Confirmação Pendente pelo Cliente */}
                {b.needsClientConfirmation && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 mt-1">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        {isStaff ? (
                          <span>
                            <strong>Solicitação Remota Pendente de Aceite:</strong> Registrada via{' '}
                            {b.canalAgendamento === 'WHATSAPP'
                              ? 'WhatsApp'
                              : b.canalAgendamento === 'TELEFONE'
                              ? 'Telefone'
                              : 'Canal Remoto'}. Aguarda aceite do tutor pelo portal online ou validação da recepção.
                          </span>
                        ) : (
                          <span>
                            <strong>Confirmação de Agendamento Solicitada:</strong> Este serviço foi registrado pela recepção ({b.canalAgendamento === 'WHATSAPP' ? 'via WhatsApp' : b.canalAgendamento === 'TELEFONE' ? 'via Telefone' : 'no Balcão'}) e aguarda o seu aceite.
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          confirmarAgendamentoCliente(b.type, b.originalId);
                          setSuccessMessage(
                            isStaff
                              ? `Aceite do cliente registrado com sucesso para ${b.title} (${b.petName} - Tutor: ${b.tutorName})!`
                              : `Agendamento de ${b.title} para ${b.petName} confirmado com sucesso!`
                          );
                          setTimeout(() => setSuccessMessage(null), 5000);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {isStaff ? 'Registrar Aceite do Cliente' : 'Confirmar'}
                      </button>
                      <button
                        onClick={() => {
                          recusarAgendamentoCliente(
                            b.type,
                            b.originalId,
                            isStaff ? 'Cancelado pelo atendimento' : 'Recusado pelo tutor no portal'
                          );
                          setSuccessMessage(`Agendamento cancelado.`);
                          setTimeout(() => setSuccessMessage(null), 5000);
                        }}
                        className="px-3 py-1.5 bg-white text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg font-semibold transition-colors"
                      >
                        {isStaff ? 'Cancelar Agendamento' : 'Recusar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Novo Agendamento (Com suporte a múltiplos serviços simultâneos e consulta ao cliente) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {isStaff ? 'Novo Agendamento (Visão Atendimento / Recepção)' : 'Novo Agendamento Online'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Selecione o cliente, animal, canal de solicitação e um ou mais serviços integrados
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBooking} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-medium">{formError}</span>
                </div>
              )}

              {/* Step 1 for Staff: Consultar Cliente (Tutor Responsável) */}
              {isStaff && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-sky-600" />
                    1. Consultar Cliente (Tutor Responsável) *
                  </label>
                  <select
                    value={selectedTutorId}
                    onChange={(e) => handleTutorSelectChange(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    {tutors.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome} (CPF: {t.cpf} • Tel: {t.telefone})
                      </option>
                    ))}
                  </select>

                  {/* Ficha de Contato Rápido do Cliente */}
                  {modalSelectedTutor && (
                    <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-600">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span><strong>{modalSelectedTutor.nome}</strong> (CPF: {modalSelectedTutor.cpf})</span>
                      </div>
                      <div className="flex items-center gap-3 font-medium text-slate-700">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {modalSelectedTutor.telefone}
                        </span>
                        <span className="text-slate-400">|</span>
                        <span className="text-slate-500">{modalSelectedTutor.email}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step: Selecionar Animal */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Dog className="w-4 h-4 text-sky-600" />
                  {isStaff ? '2. Selecionar Animal do Cliente *' : '1. Selecione o Animal *'}
                </label>
                {modalPets.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    {isStaff
                      ? 'Este cliente não possui animais cadastrados no momento. Por favor, adicione o animal antes de agendar.'
                      : 'Nenhum animal cadastrado no seu perfil. Por favor, cadastre um animal antes de agendar.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {modalPets.map((pet) => (
                      <button
                        key={pet.id}
                        type="button"
                        onClick={() => setSelectedPetId(pet.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selectedPetId === pet.id
                            ? 'border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{pet.nome}</span>
                          {selectedPetId === pet.id && <Check className="w-3.5 h-3.5 text-sky-600" />}
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {pet.especie} • {pet.raca} • Porte {pet.porte}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Step for Staff: Canal de Solicitação / Origem */}
              {isStaff && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <PhoneCall className="w-4 h-4 text-sky-600" />
                    3. Canal de Solicitação / Origem do Agendamento *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setCanalAgendamento('BALCAO_PRESENCIAL')}
                      className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                        canalAgendamento === 'BALCAO_PRESENCIAL'
                          ? 'border-sky-600 bg-sky-50 text-sky-900 font-semibold ring-2 ring-sky-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-sky-600" />
                        <span className="text-xs font-bold">Balcão</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-normal">Presencial (Autorizado no ato)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCanalAgendamento('WHATSAPP')}
                      className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                        canalAgendamento === 'WHATSAPP'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold ring-2 ring-emerald-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-bold">WhatsApp</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-normal">Aguardando Aceite do Tutor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCanalAgendamento('TELEFONE')}
                      className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                        canalAgendamento === 'TELEFONE'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold ring-2 ring-indigo-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-xs font-bold">Telefone</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-normal">Aguardando Aceite do Tutor</span>
                    </button>
                  </div>

                  {canalAgendamento !== 'BALCAO_PRESENCIAL' && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mt-2 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Solicitação Remota:</strong> O agendamento nascerá com status <strong>AGENDADA (Aguardando Aceite do Tutor)</strong>. O tutor poderá confirmar pelo portal do cliente ou a recepção poderá registrar o aceite após contato telefônico/WhatsApp.
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* Multi-Service Selection (Checkboxes) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    {isStaff ? '4. Escolha os Serviços Desejados' : '2. Escolha os Serviços Desejados'}
                  </label>
                  <span className="text-[11px] text-sky-600 font-semibold">
                    {activeServicesCount} selecionado(s)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2.5">
                  Você pode selecionar múltiplos serviços para agendar em conjunto (ex: Hospedagem + Consulta Clínica durante a estadia):
                </p>

                <div className="grid grid-cols-3 gap-2.5">
                  {/* Option Clinica */}
                  <button
                    type="button"
                    onClick={() => toggleService('clinica')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                      selectedServices.clinica
                        ? 'border-blue-500 bg-blue-50/70 text-blue-800 ring-2 ring-blue-500/25'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Stethoscope className="w-4 h-4 text-blue-600" />
                      <input
                        type="checkbox"
                        checked={selectedServices.clinica}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-blue-600 pointer-events-none"
                      />
                    </div>
                    <span className="text-xs font-bold">Clínica Veterinária</span>
                    <span className="text-[10px] text-slate-500">Consultas & Exames</span>
                  </button>

                  {/* Option Hotel */}
                  <button
                    type="button"
                    onClick={() => toggleService('hotel')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                      selectedServices.hotel
                        ? 'border-amber-500 bg-amber-50/70 text-amber-800 ring-2 ring-amber-500/25'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <BedDouble className="w-4 h-4 text-amber-600" />
                      <input
                        type="checkbox"
                        checked={selectedServices.hotel}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-amber-600 pointer-events-none"
                      />
                    </div>
                    <span className="text-xs font-bold">Hotel Pet</span>
                    <span className="text-[10px] text-slate-500">Hospedagem 24h</span>
                  </button>

                  {/* Option Creche */}
                  <button
                    type="button"
                    onClick={() => toggleService('creche')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                      selectedServices.creche
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-800 ring-2 ring-emerald-500/25'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Sun className="w-4 h-4 text-emerald-600" />
                      <input
                        type="checkbox"
                        checked={selectedServices.creche}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-emerald-600 pointer-events-none"
                      />
                    </div>
                    <span className="text-xs font-bold">Creche / Daycare</span>
                    <span className="text-[10px] text-slate-500">Recreação por Turno</span>
                  </button>
                </div>
              </div>

              {/* Service Specific Fields */}
              <div className="space-y-4">
                {/* Hotel Form Section */}
                {selectedServices.hotel && (
                  <div className="space-y-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-200 text-xs">
                    <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
                      <BedDouble className="w-4 h-4 text-amber-600" />
                      <span>Dados da Hospedagem (Hotel Pet)</span>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Acomodação Compatível {selectedPet ? `(Porte ${selectedPet.porte})` : ''}
                      </label>
                      <select
                        value={acomodacaoId}
                        onChange={(e) => setAcomodacaoId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
                        required={selectedServices.hotel}
                      >
                        <option value="">Selecione uma acomodação...</option>
                        {compatibleRooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.identificacao} • Porte {room.portePermitido} • R${' '}
                            {room.valorDiaria.toFixed(2)}/diária
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Check-in Previsto</label>
                        <input
                          type="datetime-local"
                          value={dataCheckin}
                          onChange={(e) => setDataCheckin(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
                          required={selectedServices.hotel}
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Check-out Previsto</label>
                        <input
                          type="datetime-local"
                          value={dataCheckout}
                          onChange={(e) => setDataCheckout(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
                          required={selectedServices.hotel}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Instruções de Alimentação / Cuidados
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Ração Golden 100g pela manhã e 100g à noite..."
                        value={hotelInstrucoes}
                        onChange={(e) => setHotelInstrucoes(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
                      />
                    </div>
                  </div>
                )}

                {/* Clinic Form Section */}
                {selectedServices.clinica && (
                  <div className="space-y-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-200 text-xs">
                    <div className="flex items-center gap-2 font-bold text-blue-900 text-xs">
                      <Stethoscope className="w-4 h-4 text-blue-600" />
                      <span>Dados do Atendimento Clínico</span>
                      {selectedServices.hotel && (
                        <span className="ml-auto text-[10px] font-semibold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                          Pode ser realizado durante a hospedagem
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Tipo de Atendimento</label>
                        <select
                          value={tipoAtendimento}
                          onChange={(e) => setTipoAtendimento(e.target.value as TipoAtendimento)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
                        >
                          <option value="CONSULTA">Consulta Geral (R$ 150)</option>
                          <option value="RETORNO">Retorno (R$ 80)</option>
                          <option value="EXAME">Exame Clínico (R$ 180)</option>
                          <option value="CIRURGIA">Avaliação Cirúrgica (R$ 200)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Data e Horário</label>
                        <input
                          type="datetime-local"
                          value={dataHoraConsulta}
                          onChange={(e) => setDataHoraConsulta(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
                          required={selectedServices.clinica}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Motivo / Sintomas Observados (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Check-up de rotina, animal apático, vacinação..."
                        value={clinicaObservacoes}
                        onChange={(e) => setClinicaObservacoes(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
                      />
                    </div>
                  </div>
                )}

                {/* Daycare Form Section */}
                {selectedServices.creche && (
                  <div className="space-y-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 text-xs">
                    <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs">
                      <Sun className="w-4 h-4 text-emerald-600" />
                      <span>Dados da Creche / Daycare</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Data da Frequência</label>
                        <input
                          type="date"
                          value={dataCreche}
                          onChange={(e) => setDataCreche(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
                          required={selectedServices.creche}
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Turno</label>
                        <select
                          value={turnoCreche}
                          onChange={(e) => setTurnoCreche(e.target.value as TurnoCreche)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
                        >
                          <option value="INTEGRAL">Integral (08:00 às 18:00) • R$ 75</option>
                          <option value="MANHA">Manhã (08:00 às 12:00) • R$ 45</option>
                          <option value="TARDE">Tarde (13:30 às 18:00) • R$ 45</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Observações Comportamentais (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Sociável com cães de mesmo porte, adora brincar com bolinha..."
                        value={crecheObservacoes}
                        onChange={(e) => setCrecheObservacoes(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Alerta de Conflitos ou Sobreposições em Tempo Real */}
              {uniqueModalConflicts.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Conflitos e Serviços Concorrentes Detectados ({uniqueModalConflicts.length})</span>
                  </div>
                  {uniqueModalConflicts.map((conf) => (
                    <div
                      key={conf.id}
                      className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                        conf.isSobreposicaoHorario
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}
                    >
                      <AlertCircle
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          conf.isSobreposicaoHorario ? 'text-rose-600' : 'text-amber-600'
                        }`}
                      />
                      <div className="space-y-0.5">
                        <div className="font-bold flex items-center gap-1.5">
                          <span>
                            {conf.isSobreposicaoHorario
                              ? 'Atenção: Choque Direto de Horário'
                              : 'Serviço Já Cadastrado na Mesma Data (Combo)'}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/70 font-mono">
                            {conf.servico}
                          </span>
                        </div>
                        <p className="text-[11px] leading-tight">
                          {conf.titulo} ({conf.detalhes})
                        </p>
                        <p className="text-[10px] opacity-80">
                          {conf.isSobreposicaoHorario
                            ? 'O animal já possui atendimento clínico agendado próximo a este horário. Verifique os horários antes de confirmar.'
                            : 'O animal já possui outro serviço agendado nesta mesma data/período. Os agendamentos constarão de forma integrada no histórico do pet.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total Estimated Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block font-medium">
                    Valor Estimado do Pacote ({activeServicesCount} serviço{activeServicesCount > 1 ? 's' : ''}):
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {isStaff
                      ? canalAgendamento === 'BALCAO_PRESENCIAL'
                        ? 'Acerto no balcão presencial ou faturamento posterior'
                        : 'Pagamento a acertar com o cliente'
                      : 'Pagamento liquidado no balcão ou check-in'}
                  </span>
                </div>
                <span className="text-xl font-bold font-mono text-slate-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    calculateEstimatedTotal()
                  )}
                </span>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalPets.length === 0}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Confirmar Agendamento {activeServicesCount > 1 ? `(${activeServicesCount} Serviços)` : ''}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
