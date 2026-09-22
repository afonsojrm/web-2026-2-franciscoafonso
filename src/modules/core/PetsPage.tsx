import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import type { PetEspecie, PetPorte, PetSexo } from '../../types';
import { FormField } from '../../components/common/FormField';
import { validateDate, validatePositiveNumber } from '../../utils/validators';
import { Dog, Plus, Search, Heart, User, X, Phone } from 'lucide-react';

export const PetsPage = () => {
  const { pets, tutors, addPet, getPetOperationalStatuses } = useData();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [tutorId, setTutorId] = useState(tutors[0]?.id || '');
  const [nome, setNome] = useState('');
  const [especie, setEspecie] = useState<PetEspecie>('Cão');
  const [raca, setRaca] = useState('');
  const [dataNascimento, setDataNascimento] = useState('2023-01-01');
  const [pesoKg, setPesoKg] = useState('10');
  const [porte, setPorte] = useState<PetPorte>('Médio');
  const [sexo, setSexo] = useState<PetSexo>('M');
  const [castrado, setCastrado] = useState(true);
  const [observacoesClinicas, setObservacoesClinicas] = useState('');
  const [fotoUrl, setFotoUrl] = useState('https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=300&h=300&fit=crop');

  // Form Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!currentUser) return null;

  const userTutor =
    currentUser.perfil === 'TUTOR'
      ? tutors.find((t) => t.email.toLowerCase() === currentUser.email.toLowerCase())
      : null;

  const accessiblePets = userTutor
    ? pets.filter((p) => p.tutorId === userTutor.id)
    : pets;

  const filteredPets = accessiblePets.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.raca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.especie.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = () => {
    setErrors({});
    if (!tutorId && tutors.length > 0) {
      setTutorId(tutors[0].id);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!tutorId) {
      newErrors.tutorId = 'Selecione o tutor responsável.';
    }

    if (!nome.trim() || nome.trim().length < 2) {
      newErrors.nome = 'Informe o nome do pet (pelo menos 2 caracteres).';
    }

    if (!raca.trim()) {
      newErrors.raca = 'Informe a raça do animal (ou SRD/Mestiço).';
    }

    if (dataNascimento && !validateDate(dataNascimento, true)) {
      newErrors.dataNascimento = 'A data de nascimento não pode ser futura.';
    }

    if (!validatePositiveNumber(pesoKg)) {
      newErrors.pesoKg = 'Informe um peso válido maior que zero (ex: 8.5).';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    addPet({
      tutorId,
      nome: nome.trim(),
      especie,
      raca: raca.trim(),
      dataNascimento,
      pesoKg: parseFloat(pesoKg) || 0,
      porte,
      sexo,
      castrado,
      observacoesClinicas: observacoesClinicas.trim(),
      fotoUrl,
    });

    setNome('');
    setRaca('');
    setObservacoesClinicas('');
    setErrors({});
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {currentUser.perfil === 'TUTOR' ? 'Meus Animais' : 'Animais'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {currentUser.perfil === 'TUTOR'
              ? 'Acompanhe os dados e o histórico dos seus animais cadastrados.'
              : 'Gestão cadastral, histórico clínico e acompanhamento dos animais atendidos.'}
          </p>
        </div>

        {currentUser.perfil !== 'TUTOR' && (
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-sky-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Animal</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar pet por nome, raça ou espécie..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
        />
      </div>

      {/* Pets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPets.map((pet) => {
          const tutor = tutors.find((t) => t.id === pet.tutorId);
          const opStatuses = getPetOperationalStatuses(pet.id);
          const hasActiveServices = opStatuses.some((s) => s.type !== 'DISPONIVEL');

          return (
            <div
              key={pet.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-sky-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={pet.fotoUrl}
                    alt={pet.nome}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
                      {pet.especie}
                    </span>
                    <span className="bg-sky-600/90 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
                      Porte: {pet.porte}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="bg-white/90 backdrop-blur-md text-slate-800 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs">
                      {pet.sexo === 'M' ? 'Macho' : 'Fêmea'}
                    </span>
                  </div>
                </div>

                {/* Real-time Operational Activity Statuses (Múltiplos Serviços Concorrentes) */}
                <div className="mx-4 mt-4 space-y-1.5">
                  {hasActiveServices && opStatuses.length > 1 && (
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      <span>Serviços Ativos / Agendados</span>
                      <span className="bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full font-mono text-[10px]">
                        {opStatuses.length}
                      </span>
                    </div>
                  )}
                  {opStatuses.map((s) => (
                    <div
                      key={s.id || s.label}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${s.badgeClass}`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.dotColor} ${
                            s.type !== 'DISPONIVEL' ? 'animate-pulse' : ''
                          }`}
                        />
                        <span className="font-bold">{s.label}</span>
                      </div>
                      {s.detail && (
                        <span className="text-[11px] font-medium opacity-90">{s.detail}</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{pet.nome}</h3>
                      <p className="text-xs text-slate-500">{pet.raca}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                      {pet.pesoKg} kg
                    </span>
                  </div>

                  {currentUser.perfil !== 'TUTOR' && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <User className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>Tutor: <strong className="text-slate-800">{tutor?.nome}</strong></span>
                    </div>
                  )}

                  {pet.observacoesClinicas && (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600">
                      <strong className="text-slate-700 block mb-0.5">Observações Clínicas:</strong>
                      <p className="line-clamp-2">{pet.observacoesClinicas}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1 text-[11px]">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
                        pet.castrado ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Heart className="w-3 h-3" />
                      {pet.castrado ? 'Castrado' : 'Não Castrado'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Nasc.: {new Date(pet.dataNascimento).toLocaleDateString('pt-BR')}</span>
                <span className="font-semibold text-slate-700">
                  {hasActiveServices
                    ? `${opStatuses.length} serviço(s) ativo(s)/agendado(s)`
                    : 'Disponível com Tutor'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Novo Pet */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Dog className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Novo Animal (Pet)</h2>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-3.5 mt-4 text-xs">
              <FormField label="Tutor Responsável (Cliente)" required error={errors.tutorId}>
                <select
                  value={tutorId}
                  onChange={(e) => {
                    setTutorId(e.target.value);
                    if (errors.tutorId) setErrors((prev) => ({ ...prev, tutorId: '' }));
                  }}
                  className={`w-full border rounded-xl px-3 py-2 text-xs transition-colors focus:outline-none ${
                    errors.tutorId
                      ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                      : 'border-slate-200 focus:ring-2 focus:ring-sky-500'
                  }`}
                >
                  {tutors.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome} (CPF: {t.cpf} • Tel: {t.telefone})
                    </option>
                  ))}
                </select>

                {(() => {
                  const selTutor = tutors.find((t) => t.id === tutorId);
                  return selTutor ? (
                    <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[11px] text-slate-600">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span><strong>{selTutor.nome}</strong> (CPF: {selTutor.cpf})</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{selTutor.telefone}</span>
                      </div>
                    </div>
                  ) : null;
                })()}
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Nome do Pet" required error={errors.nome}>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => {
                      setNome(e.target.value);
                      if (errors.nome) setErrors((prev) => ({ ...prev, nome: '' }));
                    }}
                    placeholder="Ex: Rex"
                    className={`w-full border rounded-xl px-3 py-2 text-xs transition-colors focus:outline-none ${
                      errors.nome
                        ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                        : 'border-slate-200 focus:ring-2 focus:ring-sky-500'
                    }`}
                  />
                </FormField>

                <FormField label="Espécie" required>
                  <select
                    value={especie}
                    onChange={(e) => setEspecie(e.target.value as PetEspecie)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="Cão">Cão</option>
                    <option value="Gato">Gato</option>
                    <option value="Ave">Ave</option>
                    <option value="Outro">Outro</option>
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Raça" required error={errors.raca}>
                  <input
                    type="text"
                    value={raca}
                    onChange={(e) => {
                      setRaca(e.target.value);
                      if (errors.raca) setErrors((prev) => ({ ...prev, raca: '' }));
                    }}
                    placeholder="Ex: Golden Retriever"
                    className={`w-full border rounded-xl px-3 py-2 text-xs transition-colors focus:outline-none ${
                      errors.raca
                        ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                        : 'border-slate-200 focus:ring-2 focus:ring-sky-500'
                    }`}
                  />
                </FormField>

                <FormField label="Data de Nascimento" error={errors.dataNascimento}>
                  <input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => {
                      setDataNascimento(e.target.value);
                      if (errors.dataNascimento) setErrors((prev) => ({ ...prev, dataNascimento: '' }));
                    }}
                    className={`w-full border rounded-xl px-3 py-2 text-xs transition-colors focus:outline-none ${
                      errors.dataNascimento
                        ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                        : 'border-slate-200 focus:ring-2 focus:ring-sky-500'
                    }`}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <FormField label="Peso (kg)" error={errors.pesoKg}>
                  <input
                    type="number"
                    step="0.1"
                    value={pesoKg}
                    onChange={(e) => {
                      setPesoKg(e.target.value);
                      if (errors.pesoKg) setErrors((prev) => ({ ...prev, pesoKg: '' }));
                    }}
                    className={`w-full border rounded-xl px-3 py-2 text-xs transition-colors focus:outline-none ${
                      errors.pesoKg
                        ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                        : 'border-slate-200 focus:ring-2 focus:ring-sky-500'
                    }`}
                  />
                </FormField>

                <FormField label="Porte" required>
                  <select
                    value={porte}
                    onChange={(e) => setPorte(e.target.value as PetPorte)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="Mini">Mini</option>
                    <option value="Pequeno">Pequeno</option>
                    <option value="Médio">Médio</option>
                    <option value="Grande">Grande</option>
                    <option value="Gigante">Gigante</option>
                  </select>
                </FormField>

                <FormField label="Sexo" required>
                  <select
                    value={sexo}
                    onChange={(e) => setSexo(e.target.value as PetSexo)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="M">Macho</option>
                    <option value="F">Fêmea</option>
                  </select>
                </FormField>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="castrado"
                  checked={castrado}
                  onChange={(e) => setCastrado(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="castrado" className="font-semibold text-slate-700 cursor-pointer">
                  Animal Castrado
                </label>
              </div>

              <FormField label="Observações Clínicas / Histórico">
                <textarea
                  rows={2}
                  value={observacoesClinicas}
                  onChange={(e) => setObservacoesClinicas(e.target.value)}
                  placeholder="Alergias, medicações de uso contínuo, etc."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                ></textarea>
              </FormField>

              <FormField label="Foto (URL)">
                <input
                  type="url"
                  value={fotoUrl}
                  onChange={(e) => setFotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </FormField>

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
                  Salvar Animal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
