import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { AccessDenied } from '../../components/common/AccessDenied';
import type { CategoriaProduto, FormaPagamento, Produto, ItemVenda } from '../../types';
import {
  Plus,
  Search,
  ShoppingCart,
  AlertTriangle,
  CreditCard,
  Banknote,
  QrCode,
  Trash2,
  CheckCircle,
  X,
} from 'lucide-react';

export const ShopPage = () => {
  const { products, tutors, addProduct, processSale } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');

  // Modal: Novo Produto
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState<CategoriaProduto>('Ração');
  const [precoCusto, setPrecoCusto] = useState('50');
  const [precoVenda, setPrecoVenda] = useState('85');
  const [quantidadeEstoque, setQuantidadeEstoque] = useState('10');
  const [estoqueMinimo, setEstoqueMinimo] = useState('5');
  const [codigoBarras, setCodigoBarras] = useState('');

  // PDV / Carrinho
  const [isPdvOpen, setIsPdvOpen] = useState(false);
  const [cart, setCart] = useState<ItemVenda[]>([]);
  const [selectedTutorId, setSelectedTutorId] = useState<string>('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('PIX');
  const [pdvError, setPdvError] = useState('');
  const [pdvSuccess, setPdvSuccess] = useState(false);

  const { currentUser, canAccessUnit } = useAuth();

  if (!currentUser) return null;

  if (!canAccessUnit('PETSHOP')) {
    return <AccessDenied moduleName="Pet Shop & PDV" />;
  }

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigoBarras?.includes(searchTerm);
    const matchesCat = selectedCategory === 'TODAS' || p.categoria === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;

    addProduct({
      nome,
      descricao,
      categoria,
      precoCusto: parseFloat(precoCusto) || 0,
      precoVenda: parseFloat(precoVenda) || 0,
      quantidadeEstoque: parseInt(quantidadeEstoque) || 0,
      estoqueMinimo: parseInt(estoqueMinimo) || 5,
      codigoBarras,
      ativo: true,
    });

    setNome('');
    setDescricao('');
    setIsNewProductOpen(false);
  };

  const addToCart = (product: Produto) => {
    setPdvError('');
    const existing = cart.find((item) => item.produtoId === product.id);

    if (existing) {
      if (existing.quantidade + 1 > product.quantidadeEstoque) {
        setPdvError(`Limite de estoque atingido para ${product.nome}. Disponível: ${product.quantidadeEstoque}`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.produtoId === product.id
            ? {
                ...item,
                quantidade: item.quantidade + 1,
                subtotal: (item.quantidade + 1) * item.precoUnitario,
              }
            : item
        )
      );
    } else {
      if (product.quantidadeEstoque < 1) {
        setPdvError('Produto sem unidades disponíveis em estoque.');
        return;
      }
      setCart([
        ...cart,
        {
          id: `item-${product.id}-${cart.length + 1}`,
          produtoId: product.id,
          produtoNome: product.nome,
          quantidade: 1,
          precoUnitario: product.precoVenda,
          subtotal: product.precoVenda,
        },
      ]);
    }
  };

  const removeFromCart = (produtoId: string) => {
    setCart(cart.filter((i) => i.produtoId !== produtoId));
  };

  const cartTotal = cart.reduce((acc, curr) => acc + curr.subtotal, 0);

  const handleFinishSale = () => {
    if (cart.length === 0) return;

    const tutor = tutors.find((t) => t.id === selectedTutorId);

    const success = processSale({
      tutorId: tutor?.id,
      tutorNome: tutor?.nome,
      operadorId: currentUser.id,
      operadorNome: currentUser.nome,
      itens: cart,
      valorTotal: cartTotal,
      formaPagamento,
      statusPagamento: 'PAGO',
    });

    if (success) {
      setPdvSuccess(true);
      setCart([]);
      setTimeout(() => {
        setPdvSuccess(false);
        setIsPdvOpen(false);
      }, 1500);
    } else {
      setPdvError('Erro ao finalizar venda: estoque insuficiente em um ou mais itens.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Pet Shop & PDV
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Catálogo de produtos, controle de estoque e ponto de venda de balcão integrado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPdvOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-emerald-600/25 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Abrir Caixa PDV {cart.length > 0 ? `(${cart.length})` : ''}</span>
          </button>
          <button
            onClick={() => setIsNewProductOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-sky-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar produto por nome ou código de barras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['TODAS', 'Ração', 'Medicamento', 'Higiene', 'Acessório'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((p) => {
          const isLowStock = p.quantidadeEstoque <= p.estoqueMinimo;
          const isOutOfStock = p.quantidadeEstoque <= 0;

          return (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                isLowStock ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200 hover:border-sky-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">
                      {p.categoria}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5">{p.nome}</h3>
                  </div>

                  {isLowStock && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      Estoque Crítico
                    </span>
                  )}
                </div>

                {p.descricao && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{p.descricao}</p>
                )}

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Preço de Venda</span>
                    <span className="font-bold text-slate-900 text-base font-mono">
                      R$ {p.precoVenda.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Estoque Atual</span>
                    <span
                      className={`font-bold font-mono ${
                        isOutOfStock
                          ? 'text-rose-600'
                          : isLowStock
                          ? 'text-amber-600'
                          : 'text-emerald-700'
                      }`}
                    >
                      {p.quantidadeEstoque} unid.
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">
                  Cód: {p.codigoBarras || 'S/N'}
                </span>

                <button
                  disabled={isOutOfStock}
                  onClick={() => addToCart(p)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isOutOfStock
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white'
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>{isOutOfStock ? 'Esgotado' : '+ Adicionar ao PDV'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: PDV (Caixa de Venda) */}
      {isPdvOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Ponto de Venda (PDV) - Balcão</h2>
              </div>
              <button onClick={() => setIsPdvOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {pdvSuccess ? (
              <div className="py-12 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h3 className="text-lg font-bold text-slate-900">Venda Realizada com Sucesso!</h3>
                <p className="text-xs text-slate-500">
                  Estoque atualizado e transação registrada com sucesso no caixa.
                </p>
              </div>
            ) : (
              <div className="space-y-4 mt-4 text-xs">
                {pdvError && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200">
                    {pdvError}
                  </div>
                )}

                {/* Tutor Selection */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cliente / Tutor (Opcional)
                  </label>
                  <select
                    value={selectedTutorId}
                    onChange={(e) => setSelectedTutorId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="">Consumidor Final (Venda Avulsa)</option>
                    {tutors.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome} (CPF: {t.cpf})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Items in cart */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-3 py-2 font-semibold text-slate-600 border-b border-slate-200 flex justify-between">
                    <span>Itens do Pedido</span>
                    <span>{cart.length} item(ns)</span>
                  </div>

                  {cart.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                      Carrinho vazio. Adicione produtos na listagem.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.produtoId} className="p-3 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900">{item.produtoNome}</div>
                            <div className="text-slate-400 text-[11px]">
                              {item.quantidade}x R$ {item.precoUnitario.toFixed(2)}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-slate-800">
                              R$ {item.subtotal.toFixed(2)}
                            </span>
                            <button
                              onClick={() => removeFromCart(item.produtoId)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {cart.length > 0 && (
                    <div className="bg-slate-50 p-3 border-t border-slate-200 flex items-center justify-between font-bold text-sm">
                      <span>Total Geral:</span>
                      <span className="font-mono text-emerald-700 text-base">
                        R$ {cartTotal.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Forma de Pagamento *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'PIX', label: 'PIX', icon: QrCode },
                      { id: 'CARTAO_CREDITO', label: 'Crédito', icon: CreditCard },
                      { id: 'CARTAO_DEBITO', label: 'Débito', icon: CreditCard },
                      { id: 'DINHEIRO', label: 'Dinheiro', icon: Banknote },
                    ].map((m) => {
                      const Icon = m.icon;
                      return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => setFormaPagamento(m.id as FormaPagamento)}
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1 font-semibold transition-all ${
                            formaPagamento === m.id
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPdvOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={handleFinishSale}
                    className={`px-5 py-2 rounded-xl text-white text-xs font-semibold shadow-xs ${
                      cart.length === 0
                        ? 'bg-slate-300 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    Finalizar Venda (R$ {cartTotal.toFixed(2)})
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Novo Produto */}
      {isNewProductOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Novo Produto para o Pet Shop</h2>
              <button onClick={() => setIsNewProductOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Ração Golden Frango 15kg"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as CategoriaProduto)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="Ração">Ração</option>
                    <option value="Higiene">Higiene</option>
                    <option value="Brinquedo">Brinquedo</option>
                    <option value="Medicamento">Medicamento</option>
                    <option value="Acessório">Acessório</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cód. Barras</label>
                  <input
                    type="text"
                    value={codigoBarras}
                    onChange={(e) => setCodigoBarras(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preço Custo (R$)</label>
                  <input
                    type="number"
                    value={precoCusto}
                    onChange={(e) => setPrecoCusto(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preço Venda (R$) *</label>
                  <input
                    type="number"
                    required
                    value={precoVenda}
                    onChange={(e) => setPrecoVenda(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Qtd em Estoque *</label>
                  <input
                    type="number"
                    required
                    value={quantidadeEstoque}
                    onChange={(e) => setQuantidadeEstoque(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    value={estoqueMinimo}
                    onChange={(e) => setEstoqueMinimo(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewProductOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
