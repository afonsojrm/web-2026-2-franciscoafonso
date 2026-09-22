import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { AccessDenied } from '../../components/common/AccessDenied';
import { FormField } from '../../components/common/FormField';
import { validateCPF, validateEmail, validatePhone, validateCEP } from '../../utils/validators';
import { maskCPF, maskPhone, maskCEP, unmaskDigits, fetchAddressByCEP } from '../../utils/masks';
import { Users, Search, Plus, Phone, Mail, MapPin, Dog, X, Loader2 } from 'lucide-react';

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

  // Form Validation & Feedback State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSearchingCEP, setIsSearchingCEP] = useState(false);
  const [cepNotice, setCepNotice] = useState('');

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

  const handleOpenModal = () => {
    setErrors({});
    setCepNotice('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setErrors({});
    setCepNotice('');
  };

  const handleCepChange = async (value: string) => {
    const masked = maskCEP(value);
    setCep(masked);
    setCepNotice('');

    if (errors.cep) {
      setErrors((prev) => ({ ...prev, cep: '' }));
    }

    const clean = unmaskDigits(masked);
    if (clean.length === 8) {
      setIsSearchingCEP(true);
      setCepNotice('Consultando CEP...');
      const address = await fetchAddressByCEP(clean);
      setIsSearchingCEP(false);

      if (address) {
        if (address.logradouro) setLogradouro(address.logradouro);
        if (address.bairro) setBairro(address.bairro);
        if (address.localidade) setCidade(address.localidade);
        if (address.uf) setUf(address.uf);
        setCepNotice('Endereço autocompletado com sucesso!');
      } else {
        setCepNotice('CEP não localizado na base dos Correios. Preencha manualmente.');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Validação de Nome
    if (!nome.trim() || nome.trim().length < 3) {
      newErrors.nome = 'Informe o nome completo do tutor (mínimo de 3 caracteres).';
    }

    // Validação de CPF
    const cleanCpf = unmaskDigits(cpf);
    if (!cleanCpf) {
      newErrors.cpf = 'O CPF é obrigatório.';
    } else if (!validateCPF(cleanCpf)) {
      newErrors.cpf = 'CPF inválido. Verifique os dígitos verificadores.';
    } else if (tutors.some((t) => unmaskDigits(t.cpf) === cleanCpf)) {
      newErrors.cpf = 'Este CPF já está cadastrado para outro tutor.';
    }

    // Validação de Telefone
    const cleanPhone = unmaskDigits(telefone);
    if (!cleanPhone) {
      newErrors.telefone = 'O telefone de contato é obrigatório.';
    } else if (!validatePhone(telefone)) {
      newErrors.telefone = 'Telefone inválido. Informe DDD + 8 ou 9 dígitos (ex: (84) 99999-9999).';
    }

    // Validação de E-mail
    if (!email.trim()) {
      newErrors.email = 'O e-mail é obrigatório.';
    } else if (!validateEmail(email)) {
      newErrors.email = 'E-mail inválido. Utilize o formato seu.nome@provedor.com';
    }

    // Validação de CEP
    if (cep && !validateCEP(cep)) {
      newErrors.cep = 'O CEP deve conter 8 dígitos válidos.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    addTutor({
      nome: nome.trim(),
      cpf: unmaskDigits(cpf),
      email: email.trim().toLowerCase(),
      telefone: telefone.trim(),
      endereco: {
        logradouro: logradouro.trim(),
        numero: numero.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        uf: uf.trim().toUpperCase(),
        cep: cep.trim(),
      },
    });

    // Reset Form
    setNome('');
    setCpf('');
    setEmail('');
    setTelefone('');
    setLogradouro('');
    setNumero('');
    setBairro('');
    setCepNotice('');
    setErrors({});
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
          onClick={handleOpenModal}
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
                      CPF: {maskCPF(tutor.cpf)}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md border border-sky-100">
                    <Dog className="w-3 h-3" />
                    {tutorPets.length} {tutorPets.length === 1 ? 'pet' : 'pets'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{maskPhone(tutor.telefone)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{tutor.email}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-slate-500 line-clamp-2">
                      {tutor.endereco.logradouro}, {tutor.endereco.numero} • {tutor.endereco.bairro},{' '}
                      {tutor.endereco.cidade}/{tutor.endereco.uf}
                    </span>
                  </div>
                </div>

                {/* Pets List preview */}
                {tutorPets.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Animais Vinculados
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {tutorPets.map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                          {p.nome} <span className="text-slate-400">({p.raca})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>ID: {tutor.id}</span>
                <span>Desde {new Date(tutor.dataCadastro).toLocaleDateString('pt-BR')}</span>
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
                onClick={handleCloseModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4 mt-4 text-xs">
              <FormField label="Nome Completo" required error={errors.nome}>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => {
                    setNome(e.target.value);
                    if (errors.nome) setErrors((prev) => ({ ...prev, nome: '' }));
                  }}
                  placeholder="Ex: Mariana Silva"
                  className={`w-full border rounded-xl px-3 py-2 text-xs transition-colors focus:outline-none ${
                    errors.nome
                      ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                      : 'border-slate-200 focus:ring-2 focus:ring-sky-500'
                  }`}
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="CPF (com validação oficial)" required error={errors.cpf}>
                  <input
                    type="text"
                    maxLength={14}
                    value={cpf}
                    onChange={(e) => {
                      setCpf(maskCPF(e.target.value));
                      if (errors.cpf) setErrors((prev) => ({ ...prev, cpf: '' }));
                    }}
                    placeholder="000.000.000-00"
                    className={`w-full border rounded-xl px-3 py-2 text-xs transition-colors focus:outline-none font-mono ${
                      errors.cpf
                        ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                        : 'border-slate-200 focus:ring-2 focus:ring-sky-500'
                    }`}
                  />
                </FormField>

                <FormField label="Telefone Celular" required error={errors.telefone}>
                  <input
                    type="text"
                    maxLength={15}
                    value={telefone}
                    onChange={(e) => {
                      setTelefone(maskPhone(e.target.value));
                      if (errors.telefone) setErrors((prev) => ({ ...prev, telefone: '' }));
                    }}
                    placeholder="(84) 99999-9999"
                    className={`w-full border rounded-xl px-3 py-2 text-xs transition-colors focus:outline-none ${
                      errors.telefone
                        ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                        : 'border-slate-200 focus:ring-2 focus:ring-sky-500'
                    }`}
                  />
                </FormField>
              </div>

              <FormField label="E-mail" required error={errors.email}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder="mariana@exemplo.com.br"
                  className={`w-full border rounded-xl px-3 py-2 text-xs transition-colors focus:outline-none ${
                    errors.email
                      ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                      : 'border-slate-200 focus:ring-2 focus:ring-sky-500'
                  }`}
                />
              </FormField>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800">Endereço Residencial</span>
                  {isSearchingCEP && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-sky-600 font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Consultando ViaCEP...
                    </span>
                  )}
                </div>

                <div className="mb-2">
                  <FormField
                    label="CEP (com busca automática)"
                    error={errors.cep}
                    helperText={cepNotice}
                  >
                    <input
                      type="text"
                      maxLength={9}
                      value={cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="59607-000"
                      className={`w-full border rounded-xl px-3 py-2 text-xs transition-colors focus:outline-none font-mono ${
                        errors.cep
                          ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                          : 'border-slate-200 focus:ring-2 focus:ring-sky-500'
                      }`}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Logradouro</label>
                    <input
                      type="text"
                      value={logradouro}
                      onChange={(e) => setLogradouro(e.target.value)}
                      placeholder="Rua / Avenida"
                      className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Número</label>
                    <input
                      type="text"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      placeholder="Nº"
                      className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bairro</label>
                    <input
                      type="text"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      placeholder="Bairro"
                      className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cidade</label>
                    <input
                      type="text"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      placeholder="Cidade"
                      className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">UF</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={uf}
                      onChange={(e) => setUf(e.target.value.toUpperCase())}
                      placeholder="UF"
                      className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs uppercase focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors"
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
