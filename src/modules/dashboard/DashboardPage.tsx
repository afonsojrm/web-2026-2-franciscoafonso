import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Users,
  Dog,
  DollarSign,
  AlertTriangle,
  Stethoscope,
  ShoppingBag,
  BedDouble,
  Sun,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  CalendarCheck,
  Syringe,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage = () => {
  const { currentUser, canAccessUnit, canManageFinancial } = useAuth();
  const {
    tutors,
    pets,
    products,
    consultas,
    vacinas,
    acomodacoes,
    reservas,
    creche,
    finances,
    getPetOperationalStatuses,
  } = useData();

  if (!currentUser) return null;

  // Tutor scoped data if currentUser is TUTOR
  const currentTutor =
    currentUser.perfil === 'TUTOR'
      ? tutors.find((t) => t.email.toLowerCase() === currentUser.email.toLowerCase())
      : null;

  const tutorPets = currentTutor ? pets.filter((p) => p.tutorId === currentTutor.id) : [];
  const tutorPetIds = tutorPets.map((p) => p.id);
  const tutorConsultas = consultas.filter((c) => tutorPetIds.includes(c.petId));
  const tutorVacinas = vacinas.filter((v) => tutorPetIds.includes(v.petId));
  const tutorReservas = reservas.filter((r) => tutorPetIds.includes(r.petId));
  const tutorCreche = creche.filter((cr) => tutorPetIds.includes(cr.petId));

  // Low stock alert products (< estoqueMinimo)
  const lowStockProducts = products.filter((p) => p.quantidadeEstoque <= p.estoqueMinimo);

  // Active hotel occupancy
  const occupiedRooms = acomodacoes.filter((a) => a.status === 'OCUPADA').length;

  // Daycare present today
  const daycarePresent = creche.filter((c) => c.status === 'PRESENTE').length;

  // Next clinic appointments
  const pendingAppointments = consultas.filter(
    (c) => c.status === 'AGENDADA' || c.status === 'CONFIRMADA'
  ).length;

  // Financial calculations strictly segregated by user profile
  const filteredFinances = finances.filter((f) => canAccessUnit(f.unidadeOrigem));

  const totalReceitas = filteredFinances
    .filter((f) => f.tipoLancamento === 'RECEITA')
    .reduce((acc, curr) => acc + curr.valor, 0);

  const totalDespesas = filteredFinances
    .filter((f) => f.tipoLancamento === 'DESPESA')
    .reduce((acc, curr) => acc + curr.valor, 0);

  const saldoLiquido = totalReceitas - totalDespesas;

  // Build sector shortcuts strictly by unit access
  const availableSectors = [
    ...(canAccessUnit('CLINICA')
      ? [
          {
            title: 'Clínica Veterinária',
            path: '/clinica',
            icon: Stethoscope,
            desc: `${consultas.length} atendimentos registrados • ${pendingAppointments} agendados`,
            badge: `${consultas.length} registros`,
          },
        ]
      : []),
    ...(canAccessUnit('PETSHOP')
      ? [
          {
            title: 'Pet Shop & PDV',
            path: '/shop',
            icon: ShoppingBag,
            desc: `${products.length} produtos cadastrados • Ponto de venda ativo`,
            badge: `${products.length} itens`,
          },
        ]
      : []),
    ...(canAccessUnit('HOTEL')
      ? [
          {
            title: 'Hotel Pet',
            path: '/hotel',
            icon: BedDouble,
            desc: `${occupiedRooms} acomodações ocupadas de ${acomodacoes.length} disponíveis`,
            badge: `${occupiedRooms}/${acomodacoes.length} ocupação`,
          },
        ]
      : []),
    ...(canAccessUnit('CRECHE')
      ? [
          {
            title: 'Creche Daycare',
            path: '/creche',
            icon: Sun,
            desc: `${daycarePresent} pets presentes hoje • Atendimento por turno`,
            badge: `${daycarePresent} hoje`,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-blue-800 rounded-3xl p-7 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-sky-100 text-xs font-semibold mb-3 border border-white/20">
            Painel de Controle
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Olá, {currentUser.nome.split(' ')[0]}!
          </h1>
          <p className="text-sm text-sky-100 mt-1 max-w-2xl font-normal leading-relaxed">
            {currentUser.perfil === 'SOCIO_A' &&
              'Acompanhe o faturamento, agendamentos clínicos e movimentação do Pet Shop.'}
            {currentUser.perfil === 'SOCIO_B' &&
              'Gerencie a taxa de ocupação das acomodações do Hotel e frequência no Daycare.'}
            {currentUser.perfil === 'ADMIN' &&
              'Visão executiva de todas as unidades operacionais e dados corporativos.'}
            {currentUser.perfil === 'VET' &&
              'Acompanhe a agenda clínica, prontuários de atendimento e vacinação.'}
            {currentUser.perfil === 'FUNCIONARIO' &&
              'Acesso às operações de frente de caixa, check-in no Hotel e recepção da Creche.'}
            {currentUser.perfil === 'TUTOR' &&
              'Acompanhe o histórico de atendimentos e hospedagem dos seus animais.'}
          </p>
        </div>

        {/* Right Metric in Banner */}
        {canManageFinancial() ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right shrink-0 min-w-44">
            <span className="text-xs text-sky-200 block font-medium">Resultado Líquido</span>
            <span className="text-2xl font-bold font-mono">
              R$ {saldoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        ) : currentUser.perfil === 'VET' ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right shrink-0 min-w-44">
            <span className="text-xs text-sky-200 block font-medium">Consultas Agendadas</span>
            <span className="text-2xl font-bold font-mono">{pendingAppointments}</span>
          </div>
        ) : currentUser.perfil === 'TUTOR' ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right shrink-0 min-w-36">
              <span className="text-xs text-sky-200 block font-medium">Meus Animais</span>
              <span className="text-2xl font-bold font-mono">{tutorPets.length}</span>
            </div>
            <Link
              to="/agendamentos"
              className="px-4 py-3.5 bg-white text-sky-700 hover:bg-sky-50 font-semibold text-xs rounded-2xl shadow-md transition-all shrink-0 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <CalendarCheck className="w-4 h-4 text-sky-600" />
              <span>Agendar Serviço Online</span>
            </Link>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right shrink-0 min-w-44">
            <span className="text-xs text-sky-200 block font-medium">Hóspedes Ativos</span>
            <span className="text-2xl font-bold font-mono">{occupiedRooms + daycarePresent}</span>
          </div>
        )}
      </div>

      {/* KPI Stats Grid - Scoped by Role */}
      {currentUser.perfil === 'TUTOR' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Meus Animais */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Meus Animais
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{tutorPets.length}</div>
              <span className="text-[11px] text-sky-600 font-medium">Animais sob sua tutela</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Dog className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Consultas */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Consultas Clínicas
              </span>
              <div className="text-2xl font-extrabold text-sky-600 mt-1">
                {tutorConsultas.filter((c) => c.status === 'AGENDADA' || c.status === 'CONFIRMADA').length}
              </div>
              <span className="text-[11px] text-slate-500">Agendamentos futuros</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Vacinas */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Vacinação
              </span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                {tutorVacinas.length}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">Doses registradas</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Syringe className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Estadias & Creche */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Hotel & Creche
              </span>
              <div className="text-2xl font-extrabold text-indigo-600 mt-1">
                {tutorReservas.length + tutorCreche.length}
              </div>
              <span className="text-[11px] text-indigo-600 font-medium">Histórico de frequência</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BedDouble className="w-6 h-6" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Tutores */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tutores Ativos
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{tutors.length}</div>
              <span className="text-[11px] text-emerald-600 font-medium">Base de clientes</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Pets */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Animais Cadastrados
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{pets.length}</div>
              <span className="text-[11px] text-sky-600 font-medium">Ficha cadastral</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Dog className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Receita ou Fila */}
          {canManageFinancial() ? (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Receita Operacional
                </span>
                <div className="text-2xl font-extrabold text-emerald-600 mt-1 font-mono">
                  R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[11px] text-slate-500">
                  {currentUser.perfil === 'SOCIO_A'
                    ? 'Clínica & Pet Shop'
                    : currentUser.perfil === 'SOCIO_B'
                    ? 'Hotel & Creche'
                    : 'Consolidado'}
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {currentUser.perfil === 'VET' ? 'Consultas' : 'Atendimentos'}
                </span>
                <div className="text-2xl font-extrabold text-sky-600 mt-1">
                  {currentUser.perfil === 'VET' ? pendingAppointments : occupiedRooms + daycarePresent}
                </div>
                <span className="text-[11px] text-slate-500">
                  {currentUser.perfil === 'VET' ? 'Agendamentos na fila' : 'Hóspedes no complexo'}
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          )}

          {/* Card 4: Status Operacional Relevante */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {canAccessUnit('HOTEL')
                  ? 'Ocupação Hotel'
                  : canAccessUnit('CLINICA')
                  ? 'Agenda Clínica'
                  : 'Catálogo'}
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {canAccessUnit('HOTEL')
                  ? `${occupiedRooms}/${acomodacoes.length}`
                  : canAccessUnit('CLINICA')
                  ? `${pendingAppointments} Agendados`
                  : `${products.length} Produtos`}
              </div>
              <span className="text-[11px] text-amber-600 font-medium">
                {lowStockProducts.length > 0 && canAccessUnit('PETSHOP')
                  ? `${lowStockProducts.length} itens a repor`
                  : 'Fluxo regular'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Operational Highlights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {availableSectors.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">
                  Acesso aos Setores Autorizados
                </h2>
                <span className="text-xs text-slate-400">Atalhos diretos</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableSectors.map((sector) => {
                  const Icon = sector.icon;
                  return (
                    <Link
                      key={sector.path}
                      to={sector.path}
                      className="p-4 rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/40 bg-white transition-all flex items-start gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-slate-900 text-sm">{sector.title}</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{sector.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Animals List Scoped by Access */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {currentUser.perfil === 'TUTOR' ? 'Meus Animais' : 'Atividades Recentes dos Animais'}
              </h2>
              <Link to="/pets" className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
                <span>{currentUser.perfil === 'TUTOR' ? 'Ver meus animais' : 'Ver cadastro completo'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {(currentUser.perfil === 'TUTOR' ? tutorPets : pets.slice(0, 4)).map((pet) => {
                const tutor = tutors.find((t) => t.id === pet.tutorId);
                const opStatuses = getPetOperationalStatuses(pet.id);

                return (
                  <div key={pet.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={pet.fotoUrl}
                        alt={pet.nome}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{pet.nome}</span>
                          {opStatuses.map((s) => (
                            <span
                              key={s.id || s.label}
                              className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.badgeClass}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${s.dotColor} ${
                                  s.type !== 'DISPONIVEL' ? 'animate-pulse' : ''
                                }`}
                              />
                              {s.label}
                              {s.detail && <span className="opacity-80 font-normal">({s.detail})</span>}
                            </span>
                          ))}
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          {pet.especie} • {pet.raca} ({pet.porte})
                        </div>
                      </div>
                    </div>

                    {currentUser.perfil !== 'TUTOR' && (
                      <div className="text-right shrink-0">
                        <div className="font-medium text-slate-700">{tutor?.nome.split(' ')[0]}</div>
                        <div className="text-slate-400 text-[11px]">{tutor?.telefone}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Scoped to User Profile */}
        <div className="space-y-4">
          {currentUser.perfil === 'TUTOR' ? (
            /* Tutor Agenda & Upcoming Appointments Widget */
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  <span>Agenda dos Meus Pets</span>
                </div>
                <span className="text-[10px] text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                  Próximos
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {tutorConsultas
                  .filter((c) => c.status === 'AGENDADA' || c.status === 'CONFIRMADA')
                  .map((c) => {
                    const pet = pets.find((p) => p.id === c.petId);
                    return (
                      <div key={c.id} className="p-3 rounded-xl bg-sky-50/60 border border-sky-100 space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{c.tipoAtendimento} • {pet?.nome}</span>
                          <span className="text-sky-600 font-mono text-[11px]">
                            {new Date(c.dataHoraAgendada).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{c.veterinarioNome}</p>
                      </div>
                    );
                  })}

                {tutorReservas
                  .filter((r) => r.status === 'RESERVADA' || r.status === 'HOSPEDADO')
                  .map((r) => {
                    const pet = pets.find((p) => p.id === r.petId);
                    const room = acomodacoes.find((a) => a.id === r.acomodacaoId);
                    return (
                      <div key={r.id} className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>Hospedagem • {pet?.nome}</span>
                          <span className="text-blue-600 font-mono text-[11px]">
                            {r.status === 'HOSPEDADO' ? 'Hospedado agora' : 'Reservado'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {room?.identificacao} • Check-in previsto {new Date(r.dataCheckinPrevista).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    );
                  })}

                {tutorCreche
                  .filter((cr) => cr.status === 'AGENDADO' || cr.status === 'PRESENTE')
                  .map((cr) => {
                    const pet = pets.find((p) => p.id === cr.petId);
                    return (
                      <div key={cr.id} className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>Creche • {pet?.nome}</span>
                          <span className="text-emerald-600 font-mono text-[11px]">
                            {cr.status === 'PRESENTE'
                              ? 'Presente agora'
                              : new Date(cr.dataFrequencia + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Turno {cr.turno} • Monitor: {cr.responsavelNome}
                        </p>
                      </div>
                    );
                  })}

                {tutorConsultas.filter((c) => c.status === 'AGENDADA' || c.status === 'CONFIRMADA').length === 0 &&
                  tutorReservas.filter((r) => r.status === 'RESERVADA' || r.status === 'HOSPEDADO').length === 0 &&
                  tutorCreche.filter((cr) => cr.status === 'AGENDADO' || cr.status === 'PRESENTE').length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      Nenhum agendamento futuro no momento.
                    </div>
                  )}

                <Link
                  to="/agendamentos"
                  className="mt-3 block text-center py-2.5 px-3 text-xs font-semibold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100/80 rounded-xl transition-colors border border-sky-100"
                >
                  Central de Agendamentos & Novo Pedido →
                </Link>
              </div>
            </div>
          ) : (
            /* Staff / Manager Operational Snapshot */
            <>
              {/* Low stock alert */}
              {canAccessUnit('PETSHOP') && lowStockProducts.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Alerta de Reposição de Estoque</span>
                  </div>
                  <p className="text-xs text-amber-900/80 mb-3">
                    Os seguintes itens estão próximos do limite mínimo:
                  </p>
                  <div className="space-y-2 text-xs">
                    {lowStockProducts.map((p) => (
                      <div key={p.id} className="bg-white p-2.5 rounded-xl border border-amber-200 flex justify-between items-center">
                        <span className="font-medium text-slate-800">{p.nome}</span>
                        <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[11px]">
                          {p.quantidadeEstoque} unid.
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Agenda Snapshot */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <Clock className="w-4 h-4 text-sky-600" />
                    <span>Status Operacional</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Ativo
                  </span>
                </div>
                <div className="space-y-2 text-xs text-slate-600">
                  {canAccessUnit('CLINICA') && (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Atendimentos na Clínica:</span>
                      <strong className="text-slate-900">{consultas.length}</strong>
                    </div>
                  )}
                  {canAccessUnit('PETSHOP') && (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Itens no Pet Shop:</span>
                      <strong className="text-slate-900">{products.length}</strong>
                    </div>
                  )}
                  {canAccessUnit('HOTEL') && (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Hóspedes no Hotel:</span>
                      <strong className="text-slate-900">{occupiedRooms}</strong>
                    </div>
                  )}
                  {canAccessUnit('CRECHE') && (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Pets no Daycare:</span>
                      <strong className="text-slate-900">{daycarePresent}</strong>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
