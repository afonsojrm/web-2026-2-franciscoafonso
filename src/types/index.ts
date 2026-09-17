export type UserProfile = 'ADMIN' | 'SOCIO_A' | 'SOCIO_B' | 'VET' | 'FUNCIONARIO' | 'TUTOR';

export type OperatingUnit = 'CLINICA' | 'PETSHOP' | 'HOTEL' | 'CRECHE';

export interface User {
  id: string;
  nome: string;
  email: string;
  perfil: UserProfile;
  unidadesAutorizadas: OperatingUnit[];
  ativo: boolean;
  crmv?: string; // Para veterinários
}

export interface Tutor {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  endereco: {
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  dataCadastro: string;
}

export type PetEspecie = 'Cão' | 'Gato' | 'Ave' | 'Outro';
export type PetPorte = 'Mini' | 'Pequeno' | 'Médio' | 'Grande' | 'Gigante';
export type PetSexo = 'M' | 'F';

export interface Pet {
  id: string;
  tutorId: string;
  nome: string;
  especie: PetEspecie;
  raca: string;
  dataNascimento: string;
  pesoKg: number;
  porte: PetPorte;
  sexo: PetSexo;
  castrado: boolean;
  observacoesClinicas?: string;
  fotoUrl?: string;
}

export interface PetOperationalStatus {
  id?: string;
  type: 'HOTEL' | 'CRECHE' | 'CLINICA' | 'AGENDADO' | 'DISPONIVEL';
  label: string;
  detail?: string;
  badgeClass: string;
  dotColor: string;
}

export type TipoAtendimento = 'CONSULTA' | 'RETORNO' | 'CIRURGIA' | 'EXAME';
export type StatusConsulta = 'AGENDADA' | 'CONFIRMADA' | 'FINALIZADA' | 'CANCELADA';
export type StatusPagamento = 'PENDENTE' | 'PAGO';

export type CanalAgendamento = 'BALCAO_PRESENCIAL' | 'WHATSAPP' | 'TELEFONE' | 'PORTAL_TUTOR';

export interface ConflitoAgendamento {
  servico: 'CLINICA' | 'HOTEL' | 'CRECHE';
  id: string;
  titulo: string;
  data: string;
  detalhes: string;
  status: string;
  isSobreposicaoHorario: boolean;
}

export interface Consulta {
  id: string;
  petId: string;
  veterinarioId: string;
  veterinarioNome: string;
  dataHoraAgendada: string;
  dataHoraRealizada?: string;
  tipoAtendimento: TipoAtendimento;
  status: StatusConsulta;
  diagnostico?: string;
  prescricao?: string;
  valor: number;
  statusPagamento: StatusPagamento;
  canalAgendamento?: CanalAgendamento;
  confirmadoPeloCliente?: boolean;
  dataConfirmacaoCliente?: string;
  observacoesAgendamento?: string;
}

export type TipoProcedimento = 'VACINA' | 'VERMIFUGO' | 'ANTIPULGAS';

export interface VacinaProcedimento {
  id: string;
  petId: string;
  veterinarioId: string;
  tipo: TipoProcedimento;
  descricao: string;
  dataAplicacao: string;
  dataProximaDose?: string;
  lote?: string;
}

export type CategoriaProduto = 'Ração' | 'Higiene' | 'Brinquedo' | 'Medicamento' | 'Acessório';

export interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  categoria: CategoriaProduto;
  precoCusto: number;
  precoVenda: number;
  quantidadeEstoque: number;
  estoqueMinimo: number;
  codigoBarras?: string;
  ativo: boolean;
}

export type FormaPagamento = 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO';

export interface ItemVenda {
  id: string;
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface Venda {
  id: string;
  tutorId?: string;
  tutorNome?: string;
  operadorId: string;
  operadorNome: string;
  itens: ItemVenda[];
  valorTotal: number;
  formaPagamento: FormaPagamento;
  statusPagamento: StatusPagamento;
  dataHora: string;
}

export type StatusAcomodacao = 'DISPONIVEL' | 'OCUPADA' | 'MANUTENCAO';

export interface Acomodacao {
  id: string;
  identificacao: string;
  portePermitido: PetPorte;
  status: StatusAcomodacao;
  capacidadeAnimais: number;
  valorDiaria: number;
}

export type StatusReserva = 'RESERVADA' | 'HOSPEDADO' | 'FINALIZADA' | 'CANCELADA';

export interface ReservaHospedagem {
  id: string;
  petId: string;
  acomodacaoId: string;
  dataCheckinPrevista: string;
  dataCheckoutPrevista: string;
  dataCheckinReal?: string;
  dataCheckoutReal?: string;
  status: StatusReserva;
  totalDiarias: number;
  valorTotal: number;
  statusPagamento: StatusPagamento;
  instrucoesAlimentacao?: string;
  canalAgendamento?: CanalAgendamento;
  confirmadoPeloCliente?: boolean;
  dataConfirmacaoCliente?: string;
}

export type TurnoCreche = 'MANHA' | 'TARDE' | 'INTEGRAL';
export type StatusPresencaCreche = 'AGENDADO' | 'PRESENTE' | 'FINALIZADO' | 'CANCELADO';

export interface RegistroPresencaCreche {
  id: string;
  petId: string;
  responsavelId: string;
  responsavelNome: string;
  dataFrequencia: string;
  turno: TurnoCreche;
  horaEntrada?: string;
  horaSaida?: string;
  status: StatusPresencaCreche;
  valor: number;
  statusPagamento: StatusPagamento;
  relatorioDiario?: string;
  canalAgendamento?: CanalAgendamento;
  confirmadoPeloCliente?: boolean;
  dataConfirmacaoCliente?: string;
}

export type TipoLancamento = 'RECEITA' | 'DESPESA';

export interface RegistroFinanceiro {
  id: string;
  unidadeOrigem: OperatingUnit;
  tipoLancamento: TipoLancamento;
  categoria: string;
  descricao: string;
  valor: number;
  dataCompetencia: string;
  referenciaId?: string;
  statusLiquidacao: StatusPagamento;
}

export type AcaoAuditoria = 'INSERT' | 'UPDATE' | 'DELETE';

export interface TrilhaAuditoria {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  acaoExecutada: AcaoAuditoria;
  entidadeAlvo: string;
  registroId: string;
  detalhes: string;
  timestampEvento: string;
}
