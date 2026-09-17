import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { AccessDenied } from '../../components/common/AccessDenied';
import { Users, Search, Plus, Phone, Mail, MapPin, Dog, X } from 'lucide-react';

export const TutorsPage = () => {
  const { tutors, pets, addTutor } = useData();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('Mossoró');
  const [uf, setUf] = useState('RN');
  const [cep, setCep] = useState('59607-000');

  if (!currentUser) return null;

  if (currentUser.perfil === 'TUTOR') {
    return <AccessDenied moduleName="Gestão Geral de Tutores" />;
  }

  const filteredTutors = tutors.filter(
    (t) =>
      t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.cpf.includes(searchTerm) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !cpf || !email || !telefone) return;

    addTutor({
      nome,
      cpf,
      email,
      telefone,
      endereco: {
        logradouro,
        numero,
        bairro,
        cidade,
        uf,
        cep,
      },
    });

    // Reset
    setNome('');
    setCpf('');
    setEmail('');
    setTelefone('');
    setLogradouro('');
    setNumero('');
    setBairro('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Tutores
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de clientes, contatos e informações cadastrais.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-sky-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Tutor</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar tutor por nome, CPF ou e-mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
        />
      </div>

      {/* Tutors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTutors.map((tutor) => {
          const tutorPets = pets.filter((p) => p.tutorId === tutor.id);

          return (
            <div
              key={tutor.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-sky-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{tutor.nome}</h3>
                    <span className="font-mono text-[11px] text-slate-500">
                      CPF: {tutor.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md border border-sky-100">
                    <Dog className="w-3 h-3" />
                    {tutorPets.length} pet{tutorPets.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{tutor.telefone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{tutor.email}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      {tutor.endereco.logradouro}, {tutor.endereco.numero} - {tutor.endereco.bairro}, {tutor.endereco.cidade}/{tutor.endereco.uf}
                    </span>
                  </div>
                </div>

                {/* Tutor's Pets Pills */}
                {tutorPets.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Animais vinculados:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {tutorPets.map((p) => (
                        <span
                          key={p.id}
                          className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1"
                        >
                          <Dog className="w-3 h-3 text-sky-600" />
                          {p.nome} ({p.raca})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>Cadastrado em {new Date(tutor.dataCadastro).toLocaleDateString('pt-BR')}</span>
                <span className="font-mono text-emerald-600 font-semibold">ATIVO</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Novo Tutor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Novo Tutor (Cliente)</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Mariana Silva"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CPF (apenas números) *</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))}
                    placeholder="12345678900"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefone Celular *</label>
                  <input
                    type="text"
                    required
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(84) 99999-9999"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">E-mail *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-800 block mb-2">Endereço (Objeto JSONB)</span>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={logradouro}
                      onChange={(e) => setLogradouro(e.target.value)}
                      placeholder="Rua / Avenida"
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      placeholder="Número"
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <input
                      type="text"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      placeholder="Bairro"
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      placeholder="Cidade"
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={uf}
                      onChange={(e) => setUf(e.target.value)}
                      placeholder="UF"
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs uppercase"
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    placeholder="CEP (ex: 59607-000)"
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs"
                >
                  Salvar Tutor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
