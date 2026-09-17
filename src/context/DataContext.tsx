import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type {
  Tutor,
  Pet,
  Produto,
  Consulta,
  VacinaProcedimento,
  Acomodacao,
  ReservaHospedagem,
  RegistroPresencaCreche,
  RegistroFinanceiro,
  TrilhaAuditoria,
  Venda,
  AcaoAuditoria,
  PetOperationalStatus,
  ConflitoAgendamento,
  TurnoCreche,
} from '../types';
import {
  INITIAL_TUTORS,
  INITIAL_PETS,
  INITIAL_PRODUCTS,
  INITIAL_CONSULTAS,
  INITIAL_VACINAS,
  INITIAL_ACOMODACOES,
  INITIAL_RESERVAS,
  INITIAL_CRECHE,
  INITIAL_FINANCE,
  INITIAL_AUDIT,
} from '../data/mockData';
import { useAuth } from './AuthContext';

interface DataContextType {
  tutors: Tutor[];
  pets: Pet[];
  products: Produto[];
  consultas: Consulta[];
  vacinas: VacinaProcedimento[];
  acomodacoes: Acomodacao[];
  reservas: ReservaHospedagem[];
  creche: RegistroPresencaCreche[];
  finances: RegistroFinanceiro[];
  audits: TrilhaAuditoria[];

  addTutor: (tutor: Omit<Tutor, 'id' | 'dataCadastro'>) => Tutor;
  addPet: (pet: Omit<Pet, 'id'>) => Pet;
  addProduct: (product: Omit<Produto, 'id'>) => Produto;
  updateProductStock: (productId: string, quantitySold: number) => boolean;
  processSale: (venda: Omit<Venda, 'id' | 'dataHora'>) => boolean;
  addConsulta: (consulta: Omit<Consulta, 'id'>) => Consulta;
  updateConsulta: (id: string, updates: Partial<Consulta>) => void;
  addVacina: (vacina: Omit<VacinaProcedimento, 'id'>) => VacinaProcedimento;
  addReserva: (reserva: Omit<ReservaHospedagem, 'id'>) => ReservaHospedagem;
  updateReservaStatus: (id: string, status: ReservaHospedagem['status']) => void;
  addPresencaCreche: (presenca: Omit<RegistroPresencaCreche, 'id'>) => RegistroPresencaCreche;
  updatePresencaCreche: (id: string, updates: Partial<RegistroPresencaCreche>) => void;
  addFinanceEntry: (entry: Omit<RegistroFinanceiro, 'id'>) => void;
  logAudit: (acao: AcaoAuditoria, entidade: string, registroId: string, detalhes: string) => void;
  getPetOperationalStatus: (petId: string) => PetOperationalStatus;
  getPetOperationalStatuses: (petId: string) => PetOperationalStatus[];
  checkPetScheduleConflicts: (
    petId: string,
    date: string,
    options?: { excludeId?: string; time?: string; turno?: TurnoCreche }
  ) => ConflitoAgendamento[];
  confirmarAgendamentoCliente: (tipo: 'CLINICA' | 'HOTEL' | 'CRECHE', id: string) => void;
  recusarAgendamentoCliente: (tipo: 'CLINICA' | 'HOTEL' | 'CRECHE', id: string, motivo?: string) => void;
  resetDemoData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const CURRENT_DATA_VERSION = 'v2026_09_16_multiservice_v4';

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();

  // Auto-migração transparente para atualizar dados de demonstração salvos no navegador
  if (typeof window !== 'undefined') {
    const savedVersion = localStorage.getItem('pethub_storage_version');
    if (savedVersion !== CURRENT_DATA_VERSION) {
      localStorage.setItem('pethub_storage_version', CURRENT_DATA_VERSION);
      localStorage.removeItem('pethub_consultas');
      localStorage.removeItem('pethub_reservas');
      localStorage.removeItem('pethub_creche');
    }
  }

  const [tutors, setTutors] = useState<Tutor[]>(() => {
    const saved = localStorage.getItem('pethub_tutors');
    return saved ? JSON.parse(saved) : INITIAL_TUTORS;
  });

  const [pets, setPets] = useState<Pet[]>(() => {
    const saved = localStorage.getItem('pethub_pets');
    return saved ? JSON.parse(saved) : INITIAL_PETS;
  });

  const [products, setProducts] = useState<Produto[]>(() => {
    const saved = localStorage.getItem('pethub_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [consultas, setConsultas] = useState<Consulta[]>(() => {
    const saved = localStorage.getItem('pethub_consultas');
    return saved ? JSON.parse(saved) : INITIAL_CONSULTAS;
  });

  const [vacinas, setVacinas] = useState<VacinaProcedimento[]>(() => {
    const saved = localStorage.getItem('pethub_vacinas');
    return saved ? JSON.parse(saved) : INITIAL_VACINAS;
  });

  const [acomodacoes, setAcomodacoes] = useState<Acomodacao[]>(() => {
    const saved = localStorage.getItem('pethub_acomodacoes');
    return saved ? JSON.parse(saved) : INITIAL_ACOMODACOES;
  });

  const [reservas, setReservas] = useState<ReservaHospedagem[]>(() => {
    const saved = localStorage.getItem('pethub_reservas');
    return saved ? JSON.parse(saved) : INITIAL_RESERVAS;
  });

  const [creche, setCreche] = useState<RegistroPresencaCreche[]>(() => {
    const saved = localStorage.getItem('pethub_creche');
    return saved ? JSON.parse(saved) : INITIAL_CRECHE;
  });

  const [finances, setFinances] = useState<RegistroFinanceiro[]>(() => {
    const saved = localStorage.getItem('pethub_finances');
    return saved ? JSON.parse(saved) : INITIAL_FINANCE;
  });

  const [audits, setAudits] = useState<TrilhaAuditoria[]>(() => {
    const saved = localStorage.getItem('pethub_audits');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT;
  });

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('pethub_tutors', JSON.stringify(tutors));
  }, [tutors]);

  useEffect(() => {
    localStorage.setItem('pethub_pets', JSON.stringify(pets));
  }, [pets]);

  useEffect(() => {
    localStorage.setItem('pethub_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pethub_consultas', JSON.stringify(consultas));
  }, [consultas]);

  useEffect(() => {
    localStorage.setItem('pethub_vacinas', JSON.stringify(vacinas));
  }, [vacinas]);

  useEffect(() => {
    localStorage.setItem('pethub_acomodacoes', JSON.stringify(acomodacoes));
  }, [acomodacoes]);

  useEffect(() => {
    localStorage.setItem('pethub_reservas', JSON.stringify(reservas));
  }, [reservas]);

  useEffect(() => {
    localStorage.setItem('pethub_creche', JSON.stringify(creche));
  }, [creche]);

  useEffect(() => {
    localStorage.setItem('pethub_finances', JSON.stringify(finances));
  }, [finances]);

  useEffect(() => {
    localStorage.setItem('pethub_audits', JSON.stringify(audits));
  }, [audits]);

  // Audit Logger
  const logAudit = (
    acao: AcaoAuditoria,
    entidade: string,
    registroId: string,
    detalhes: string
  ) => {
    const newAudit: TrilhaAuditoria = {
      id: `aud-${Date.now()}`,
      usuarioId: currentUser?.id || 'sys',
      usuarioNome: currentUser?.nome || 'Sistema',
      acaoExecutada: acao,
      entidadeAlvo: entidade,
      registroId,
      detalhes,
      timestampEvento: new Date().toISOString(),
    };
    setAudits((prev) => [newAudit, ...prev]);
  };

  // Tutor
  const addTutor = (data: Omit<Tutor, 'id' | 'dataCadastro'>): Tutor => {
    const newTutor: Tutor = {
      ...data,
      id: `tut-${Date.now()}`,
      dataCadastro: new Date().toISOString(),
    };
    setTutors((prev) => [newTutor, ...prev]);
    logAudit('INSERT', 'Tutor', newTutor.id, `Novo tutor cadastrado: ${newTutor.nome} (CPF: ${newTutor.cpf})`);
    return newTutor;
  };

  // Pet
  const addPet = (data: Omit<Pet, 'id'>): Pet => {
    const newPet: Pet = {
      ...data,
      id: `pet-${Date.now()}`,
    };
    setPets((prev) => [newPet, ...prev]);
    logAudit('INSERT', 'Pet', newPet.id, `Novo animal registrado: ${newPet.nome} (${newPet.especie}, ${newPet.porte})`);
    return newPet;
  };

  // Product
  const addProduct = (data: Omit<Produto, 'id'>): Produto => {
    const newProduct: Produto = {
      ...data,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [newProduct, ...prev]);
    logAudit('INSERT', 'Produto', newProduct.id, `Item adicionado ao Pet Shop: ${newProduct.nome} (${newProduct.categoria})`);
    return newProduct;
  };

  const updateProductStock = (productId: string, quantitySold: number): boolean => {
    const prod = products.find((p) => p.id === productId);
    if (!prod || prod.quantidadeEstoque < quantitySold) {
      return false;
    }
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, quantidadeEstoque: p.quantidadeEstoque - quantitySold } : p
      )
    );
    return true;
  };

  // POS (PDV) Sale Execution
  const processSale = (vendaData: Omit<Venda, 'id' | 'dataHora'>): boolean => {
    // Check stock for all items
    for (const item of vendaData.itens) {
      const prod = products.find((p) => p.id === item.produtoId);
      if (!prod || prod.quantidadeEstoque < item.quantidade) {
        return false;
      }
    }

    // Deduct stock
    for (const item of vendaData.itens) {
      updateProductStock(item.produtoId, item.quantidade);
    }

    const saleId = `venda-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    // Auto-create Financial Entry for Pet Shop (Sócio A)
    const newFinance: RegistroFinanceiro = {
      id: `fin-${Date.now()}`,
      unidadeOrigem: 'PETSHOP',
      tipoLancamento: 'RECEITA',
      categoria: 'Venda de Balcão (PDV)',
      descricao: `Venda #${saleId.slice(-4)} (${vendaData.itens.length} itens) - Pgto: ${vendaData.formaPagamento}`,
      valor: vendaData.valorTotal,
      dataCompetencia: today,
      referenciaId: saleId,
      statusLiquidacao: vendaData.statusPagamento,
    };
    setFinances((prev) => [newFinance, ...prev]);

    logAudit(
      'INSERT',
      'Venda',
      saleId,
      `Venda PDV de R$ ${vendaData.valorTotal.toFixed(2)} finalizada por ${vendaData.operadorNome}`
    );
    return true;
  };

  // Clinic
  const addConsulta = (data: Omit<Consulta, 'id'>): Consulta => {
    const newConsulta: Consulta = {
      ...data,
      id: `cons-${Date.now()}`,
    };
    setConsultas((prev) => [newConsulta, ...prev]);

    // Financial revenue if paid
    if (newConsulta.statusPagamento === 'PAGO') {
      const newFinance: RegistroFinanceiro = {
        id: `fin-${Date.now()}`,
        unidadeOrigem: 'CLINICA',
        tipoLancamento: 'RECEITA',
        categoria: 'Atendimento Clínico',
        descricao: `${newConsulta.tipoAtendimento} veterinário - ${newConsulta.veterinarioNome}`,
        valor: newConsulta.valor,
        dataCompetencia: new Date().toISOString().split('T')[0],
        referenciaId: newConsulta.id,
        statusLiquidacao: 'PAGO',
      };
      setFinances((prev) => [newFinance, ...prev]);
    }

    logAudit('INSERT', 'Consulta', newConsulta.id, `Atendimento agendado: ${newConsulta.tipoAtendimento} no valor de R$ ${newConsulta.valor.toFixed(2)}`);
    return newConsulta;
  };

  const updateConsulta = (id: string, updates: Partial<Consulta>) => {
    setConsultas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    logAudit('UPDATE', 'Consulta', id, `Prontuário/Status atualizado por ${currentUser?.nome || 'Veterinário'}`);
  };

  const addVacina = (data: Omit<VacinaProcedimento, 'id'>): VacinaProcedimento => {
    const newVacina: VacinaProcedimento = {
      ...data,
      id: `vac-${Date.now()}`,
    };
    setVacinas((prev) => [newVacina, ...prev]);
    logAudit('INSERT', 'VacinaProcedimento', newVacina.id, `Aplicação registrada: ${newVacina.descricao}`);
    return newVacina;
  };

  // Hotel
  const addReserva = (data: Omit<ReservaHospedagem, 'id'>): ReservaHospedagem => {
    const newReserva: ReservaHospedagem = {
      ...data,
      id: `res-${Date.now()}`,
    };
    setReservas((prev) => [newReserva, ...prev]);

    // Mark accommodation as occupied if active
    if (newReserva.status === 'HOSPEDADO') {
      setAcomodacoes((prev) =>
        prev.map((a) => (a.id === newReserva.acomodacaoId ? { ...a, status: 'OCUPADA' } : a))
      );
    }

    logAudit('INSERT', 'ReservaHospedagem', newReserva.id, `Nova reserva no hotel: ${newReserva.totalDiarias} diárias (R$ ${newReserva.valorTotal.toFixed(2)})`);
    return newReserva;
  };

  const updateReservaStatus = (id: string, status: ReservaHospedagem['status']) => {
    const res = reservas.find((r) => r.id === id);
    if (!res) return;

    setReservas((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const checkinReal = status === 'HOSPEDADO' ? new Date().toISOString() : r.dataCheckinReal;
          const checkoutReal = status === 'FINALIZADA' ? new Date().toISOString() : r.dataCheckoutReal;
          return { ...r, status, dataCheckinReal: checkinReal, dataCheckoutReal: checkoutReal };
        }
        return r;
      })
    );

    if (status === 'FINALIZADA') {
      // Liberate accommodation
      setAcomodacoes((prev) =>
        prev.map((a) => (a.id === res.acomodacaoId ? { ...a, status: 'DISPONIVEL' } : a))
      );
      // Create financial revenue for Hotel (Sócio B)
      const newFinance: RegistroFinanceiro = {
        id: `fin-${Date.now()}`,
        unidadeOrigem: 'HOTEL',
        tipoLancamento: 'RECEITA',
        categoria: 'Hospedagem e Diárias',
        descricao: `Diárias Hotel Pet - Check-out Reserva #${res.id.slice(-4)}`,
        valor: res.valorTotal,
        dataCompetencia: new Date().toISOString().split('T')[0],
        referenciaId: res.id,
        statusLiquidacao: 'PAGO',
      };
      setFinances((prev) => [newFinance, ...prev]);
    } else if (status === 'HOSPEDADO') {
      setAcomodacoes((prev) =>
        prev.map((a) => (a.id === res.acomodacaoId ? { ...a, status: 'OCUPADA' } : a))
      );
    }

    logAudit('UPDATE', 'ReservaHospedagem', id, `Status da reserva alterado para: ${status}`);
  };

  // Daycare
  const addPresencaCreche = (data: Omit<RegistroPresencaCreche, 'id'>): RegistroPresencaCreche => {
    const newPresenca: RegistroPresencaCreche = {
      ...data,
      id: `creche-${Date.now()}`,
    };
    setCreche((prev) => [newPresenca, ...prev]);

    if (newPresenca.statusPagamento === 'PAGO') {
      const newFinance: RegistroFinanceiro = {
        id: `fin-${Date.now()}`,
        unidadeOrigem: 'CRECHE',
        tipoLancamento: 'RECEITA',
        categoria: 'Mensalidade / Diária Daycare',
        descricao: `Creche Turno ${newPresenca.turno}`,
        valor: newPresenca.valor,
        dataCompetencia: new Date().toISOString().split('T')[0],
        referenciaId: newPresenca.id,
        statusLiquidacao: 'PAGO',
      };
      setFinances((prev) => [newFinance, ...prev]);
    }

    logAudit('INSERT', 'RegistroPresencaCreche', newPresenca.id, `Frequência na creche: Turno ${newPresenca.turno}`);
    return newPresenca;
  };

  const updatePresencaCreche = (id: string, updates: Partial<RegistroPresencaCreche>) => {
    setCreche((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    logAudit('UPDATE', 'RegistroPresencaCreche', id, `Presença na creche atualizada`);
  };

  // Finance
  const addFinanceEntry = (entry: Omit<RegistroFinanceiro, 'id'>) => {
    const newEntry: RegistroFinanceiro = {
      ...entry,
      id: `fin-${Date.now()}`,
    };
    setFinances((prev) => [newEntry, ...prev]);
    logAudit(
      'INSERT',
      'RegistroFinanceiro',
      newEntry.id,
      `Lançamento de ${newEntry.tipoLancamento} (R$ ${newEntry.valor.toFixed(2)}) na unidade ${newEntry.unidadeOrigem}`
    );
  };

  const getPetOperationalStatuses = (petId: string): PetOperationalStatus[] => {
    const statuses: PetOperationalStatus[] = [];

    // 1. Ativo no Hotel (HOSPEDADO)
    const activeHotel = reservas.filter((r) => r.petId === petId && r.status === 'HOSPEDADO');
    activeHotel.forEach((r) => {
      const room = acomodacoes.find((a) => a.id === r.acomodacaoId);
      statuses.push({
        id: `hotel-active-${r.id}`,
        type: 'HOTEL',
        label: 'Hospedado no Hotel',
        detail: room ? room.identificacao : 'Acomodação Ativa',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        dotColor: 'bg-blue-500',
      });
    });

    // 2. Presente na Creche (PRESENTE)
    const activeDaycare = creche.filter((c) => c.petId === petId && c.status === 'PRESENTE');
    activeDaycare.forEach((c) => {
      const turnoLabel =
        c.turno === 'INTEGRAL'
          ? 'Turno Integral'
          : c.turno === 'MANHA'
          ? 'Turno Manhã'
          : 'Turno Tarde';
      statuses.push({
        id: `creche-active-${c.id}`,
        type: 'CRECHE',
        label: 'Presente na Creche',
        detail: turnoLabel,
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotColor: 'bg-amber-500',
      });
    });

    // 3. Em atendimento clínico (CONFIRMADA)
    const activeConsultations = consultas.filter(
      (c) => c.petId === petId && c.status === 'CONFIRMADA'
    );
    activeConsultations.forEach((c) => {
      statuses.push({
        id: `clinic-active-${c.id}`,
        type: 'CLINICA',
        label: 'Em Atendimento Clínico',
        detail: `${c.tipoAtendimento} • ${c.veterinarioNome.split(' ')[0]}`,
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
        dotColor: 'bg-sky-500',
      });
    });

    // 4. Reservas futuras no Hotel (RESERVADA)
    const upcomingHotel = reservas.filter((r) => r.petId === petId && r.status === 'RESERVADA');
    upcomingHotel.forEach((r) => {
      const checkinStr = new Date(r.dataCheckinPrevista).toLocaleDateString('pt-BR');
      const room = acomodacoes.find((a) => a.id === r.acomodacaoId);
      statuses.push({
        id: `hotel-upcoming-${r.id}`,
        type: 'AGENDADO',
        label: 'Reserva Hotel Agendada',
        detail: `${room ? room.identificacao : 'Hotel'} • Check-in ${checkinStr}`,
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dotColor: 'bg-indigo-500',
      });
    });

    // 5. Presenças futuras na Creche (AGENDADO)
    const upcomingCreche = creche.filter((c) => c.petId === petId && c.status === 'AGENDADO');
    upcomingCreche.forEach((c) => {
      const dateStr = new Date(c.dataFrequencia + 'T12:00:00').toLocaleDateString('pt-BR');
      statuses.push({
        id: `creche-upcoming-${c.id}`,
        type: 'AGENDADO',
        label: 'Creche Agendada',
        detail: `${c.turno} em ${dateStr}`,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotColor: 'bg-emerald-500',
      });
    });

    // 6. Consultas futuras na Clínica (AGENDADA)
    const upcomingConsultations = consultas.filter(
      (c) => c.petId === petId && c.status === 'AGENDADA'
    );
    upcomingConsultations.forEach((c) => {
      const dateStr = new Date(c.dataHoraAgendada).toLocaleDateString('pt-BR');
      statuses.push({
        id: `clinic-upcoming-${c.id}`,
        type: 'AGENDADO',
        label: 'Consulta Agendada',
        detail: `${c.tipoAtendimento} em ${dateStr}`,
        badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
        dotColor: 'bg-violet-500',
      });
    });

    // 7. Padrão se não houver atividades ativas nem agendadas: Com o Tutor
    if (statuses.length === 0) {
      return [
        {
          id: 'disponivel',
          type: 'DISPONIVEL',
          label: 'Com o Tutor',
          detail: 'Sem agendamentos ativos',
          badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
          dotColor: 'bg-slate-400',
        },
      ];
    }

    return statuses;
  };

  const getPetOperationalStatus = (petId: string): PetOperationalStatus => {
    const statuses = getPetOperationalStatuses(petId);
    return statuses[0];
  };

  const checkPetScheduleConflicts = (
    petId: string,
    date: string,
    options?: { excludeId?: string; time?: string; turno?: TurnoCreche }
  ): ConflitoAgendamento[] => {
    if (!petId || !date) return [];
    const conflicts: ConflitoAgendamento[] = [];

    // 1. Consultas na mesma data
    consultas
      .filter((c) => c.petId === petId && c.status !== 'CANCELADA' && c.id !== options?.excludeId)
      .forEach((c) => {
        const cDate = c.dataHoraAgendada.split('T')[0];
        if (cDate === date) {
          const cTime = c.dataHoraAgendada.split('T')[1]?.slice(0, 5) || '';
          let isSobreposicao = false;
          if (options?.time && cTime) {
            const [h1, m1] = options.time.split(':').map(Number);
            const [h2, m2] = cTime.split(':').map(Number);
            if (!isNaN(h1) && !isNaN(h2)) {
              const diffMin = Math.abs(h1 * 60 + m1 - (h2 * 60 + m2));
              isSobreposicao = diffMin < 60; // Conflito direto se menor que 1h
            }
          }
          conflicts.push({
            servico: 'CLINICA',
            id: c.id,
            titulo: `Consulta Clínica (${c.tipoAtendimento})`,
            data: date,
            detalhes: `${cTime ? `às ${cTime}` : ''} com ${c.veterinarioNome.split(' ')[0]} - Status: ${c.status}`,
            status: c.status,
            isSobreposicaoHorario: isSobreposicao,
          });
        }
      });

    // 2. Creche na mesma data
    creche
      .filter((cr) => cr.petId === petId && cr.status !== 'CANCELADO' && cr.id !== options?.excludeId)
      .forEach((cr) => {
        if (cr.dataFrequencia === date) {
          let isSobreposicao = false;
          if (options?.turno) {
            isSobreposicao =
              cr.turno === 'INTEGRAL' ||
              options.turno === 'INTEGRAL' ||
              cr.turno === options.turno;
          }
          conflicts.push({
            servico: 'CRECHE',
            id: cr.id,
            titulo: `Creche / Daycare`,
            data: date,
            detalhes: `Turno ${cr.turno} - Status: ${cr.status}`,
            status: cr.status,
            isSobreposicaoHorario: isSobreposicao,
          });
        }
      });

    // 3. Hotel no período
    reservas
      .filter((r) => r.petId === petId && r.status !== 'CANCELADA' && r.id !== options?.excludeId)
      .forEach((r) => {
        const checkinDate = r.dataCheckinPrevista.split('T')[0];
        const checkoutDate = r.dataCheckoutPrevista.split('T')[0];
        if (date >= checkinDate && date <= checkoutDate) {
          const room = acomodacoes.find((a) => a.id === r.acomodacaoId);
          conflicts.push({
            servico: 'HOTEL',
            id: r.id,
            titulo: `Hospedagem no Hotel`,
            data: `${checkinDate} a ${checkoutDate}`,
            detalhes: `${room?.identificacao || 'Acomodação'} - Status: ${r.status}`,
            status: r.status,
            isSobreposicaoHorario: false, // Hotel convive com serviços se for combo
          });
        }
      });

    return conflicts;
  };

  const confirmarAgendamentoCliente = (tipo: 'CLINICA' | 'HOTEL' | 'CRECHE', id: string) => {
    const timestamp = new Date().toISOString();
    if (tipo === 'CLINICA') {
      setConsultas((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                confirmadoPeloCliente: true,
                dataConfirmacaoCliente: timestamp,
                status: c.status === 'AGENDADA' ? 'CONFIRMADA' : c.status,
              }
            : c
        )
      );
      logAudit('UPDATE', 'Consulta', id, 'Cliente confirmou o agendamento da consulta.');
    } else if (tipo === 'HOTEL') {
      setReservas((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, confirmadoPeloCliente: true, dataConfirmacaoCliente: timestamp }
            : r
        )
      );
      logAudit('UPDATE', 'ReservaHospedagem', id, 'Cliente confirmou a reserva de hospedagem.');
    } else if (tipo === 'CRECHE') {
      setCreche((prev) =>
        prev.map((cr) =>
          cr.id === id
            ? { ...cr, confirmadoPeloCliente: true, dataConfirmacaoCliente: timestamp }
            : cr
        )
      );
      logAudit('UPDATE', 'RegistroPresencaCreche', id, 'Cliente confirmou a diária na creche.');
    }
  };

  const recusarAgendamentoCliente = (tipo: 'CLINICA' | 'HOTEL' | 'CRECHE', id: string, motivo?: string) => {
    if (tipo === 'CLINICA') {
      setConsultas((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'CANCELADA' } : c))
      );
      logAudit('UPDATE', 'Consulta', id, `Cliente recusou/cancelou a consulta. Motivo: ${motivo || 'Solicitação do cliente'}`);
    } else if (tipo === 'HOTEL') {
      setReservas((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'CANCELADA' } : r))
      );
      logAudit('UPDATE', 'ReservaHospedagem', id, `Cliente recusou/cancelou a reserva. Motivo: ${motivo || 'Solicitação do cliente'}`);
    } else if (tipo === 'CRECHE') {
      setCreche((prev) =>
        prev.map((cr) => (cr.id === id ? { ...cr, status: 'CANCELADO' } : cr))
      );
      logAudit('UPDATE', 'RegistroPresencaCreche', id, `Cliente recusou/cancelou a creche. Motivo: ${motivo || 'Solicitação do cliente'}`);
    }
  };

  const resetDemoData = () => {
    localStorage.removeItem('pethub_tutors');
    localStorage.removeItem('pethub_pets');
    localStorage.removeItem('pethub_products');
    localStorage.removeItem('pethub_consultas');
    localStorage.removeItem('pethub_vacinas');
    localStorage.removeItem('pethub_acomodacoes');
    localStorage.removeItem('pethub_reservas');
    localStorage.removeItem('pethub_creche');
    localStorage.removeItem('pethub_finances');
    localStorage.removeItem('pethub_audits');
    localStorage.setItem('pethub_storage_version', CURRENT_DATA_VERSION);
    setTutors(INITIAL_TUTORS);
    setPets(INITIAL_PETS);
    setProducts(INITIAL_PRODUCTS);
    setConsultas(INITIAL_CONSULTAS);
    setVacinas(INITIAL_VACINAS);
    setAcomodacoes(INITIAL_ACOMODACOES);
    setReservas(INITIAL_RESERVAS);
    setCreche(INITIAL_CRECHE);
    setFinances(INITIAL_FINANCE);
    setAudits(INITIAL_AUDIT);
  };

  return (
    <DataContext.Provider
      value={{
        tutors,
        pets,
        products,
        consultas,
        vacinas,
        acomodacoes,
        reservas,
        creche,
        finances,
        audits,
        addTutor,
        addPet,
        addProduct,
        updateProductStock,
        processSale,
        addConsulta,
        updateConsulta,
        addVacina,
        addReserva,
        updateReservaStatus,
        addPresencaCreche,
        updatePresencaCreche,
        addFinanceEntry,
        logAudit,
        getPetOperationalStatus,
        getPetOperationalStatuses,
        checkPetScheduleConflicts,
        confirmarAgendamentoCliente,
        recusarAgendamentoCliente,
        resetDemoData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData deve ser usado dentro de um DataProvider');
  }
  return context;
};
