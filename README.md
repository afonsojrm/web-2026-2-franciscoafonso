# PetHub - Frontend Web Application

> **Disciplina:** Programação de Projetos Web  
> **Período:** 2026.2  
> **Instituição:** Universidade Federal Rural do Semi-Árido (UFERSA)  
> **Aluno:** Francisco Afonso  
> **GitHub:** [@afonsojrm](https://github.com/afonsojrm)  
> **Repositório:** `web-2026-2-franciscoafonso`

---

## 🐾 Sobre o PetHub

O **PetHub** é uma aplicação web completa e modular para complexos e estabelecimentos pet. A plataforma foi desenvolvida para atender ao modelo de negócio em que múltiplos sócios operam sob o mesmo espaço físico, exigindo:

- **Núcleo Compartilhado (Shared Core):** Cadastro centralizado e unificado de tutores e animais, acabando com a duplicidade de fichas e garantindo histórico clínico perene para cada pet.
- **Segregação Societária Nativa (RN02):**
  - **Sócio A:** Gestão operacional e financeira restrita à Clínica Veterinária e ao Pet Shop / PDV.
  - **Sócio B:** Gestão operacional e financeira restrita ao Hotel Pet e Creche Pet (Daycare).
  - Isolamento estrito de faturamento, custos e balancetes contábeis entre os sócios.
- **Controle de Acesso Baseado em Perfis (RBAC - RF01):**
  - Simulador de perfil interativo na Topbar (`Sócio A`, `Sócio B`, `Admin Geral`, `Médico Veterinário`, `Funcionário`, `Tutor`).
  - Trava automática e avisos de segregação nas rotas e seções não autorizadas.
- **Regras de Negócio e Integridade Transacional (ACID):**
  - **RN01:** Unicidade cadastral de tutores e pets.
  - **RN02:** Segregação financeira absoluta entre as frentes societárias.
  - **RN03:** Prontuários e prescrições médicas restritos a Médicos Veterinários.
  - **RN04:** Garantia de capacidade do hotel e prevenção ativa de overbooking.
  - **RN05:** Controle de lotação na creche com bloqueio automático após esgotamento de vagas no turno.
  - **RN06:** Bloqueio imediato de vendas no PDV sem estoque disponível.
  - **RNF06:** Trilha de auditoria imutável registrando ações (`INSERT`, `UPDATE`, `DELETE`).

---

## 🚀 Stack Tecnológica

- **React 18** (Single Page Application moderna, reativa e componentizada)
- **React Router DOM 7** (Roteamento declarativo com suporte a rotas de módulos)
- **Vite 8** (Ferramenta de build de última geração com HMR instantâneo)
- **TypeScript 5** (Tipagem estática estrita com `verbatimModuleSyntax`)
- **Tailwind CSS v4** (Nova engine CSS de alta performance via `@tailwindcss/vite`)
- **Lucide React** (Ícones semânticos para o design system)

---

## 📁 Estrutura Modular de Diretórios

```
src/
├── types/
│   └── index.ts               # Tipos e interfaces de domínio (Tutor, Pet, Venda, Acomodação, etc.)
├── data/
│   └── mockData.ts            # Base de dados seed com dados realistas (Mossoró/RN, UFERSA)
├── context/
│   ├── AuthContext.tsx        # Gerenciamento de sessão, perfil ativo e permissões RBAC
│   └── DataContext.tsx        # Estado reativo com persistência em LocalStorage e integração cruzada
├── components/
│   └── layout/
│       ├── Topbar.tsx         # Barra superior com branding UFERSA, status AWS e seletor RBAC
│       ├── Sidebar.tsx        # Navegação com travas visuais de segregação societária
│       └── Layout.tsx         # Shell principal da aplicação
├── modules/
│   ├── dashboard/
│   │   └── DashboardPage.tsx  # Métricas e KPIs dinâmicos filtrados pelo perfil logado
│   ├── core/
│   │   ├── TutorsPage.tsx     # Gestão centralizada de tutores (clientes)
│   │   └── PetsPage.tsx       # Gestão unificada de animais (fotos, raça, porte e histórico)
│   ├── clinic/
│   │   └── ClinicPage.tsx     # Consultas, prontuário veterinário e carteira de vacinas
│   ├── shop/
│   │   └── ShopPage.tsx       # Catálogo de produtos, alertas de estoque e checkout PDV
│   ├── hotel/
│   │   └── HotelPage.tsx      # Acomodações por porte, mapa de ocupação e check-in/out
│   ├── daycare/
│   │   └── DaycarePage.tsx    # Controle de turnos na creche e bloqueio de sobrelotação
│   ├── finance/
│   │   └── FinancePage.tsx    # Lançamentos contábeis com segregação estrita Sócio A vs Sócio B
│   └── audit/
│       └── AuditPage.tsx      # Trilha de auditoria imutável (RNF06)
├── App.tsx                    # Roteamento e orquestração dos providers
├── index.css                  # Diretiva oficial Tailwind v4 (@import "tailwindcss";)
└── main.tsx                   # Ponto de entrada React DOM
```

---

## 🛠️ Comandos de Execução

No terminal de `C:\Users\afons\ProgramacaoProjetos\PetHubWeb`:

### Iniciar em Modo de Desenvolvimento
```bash
npm run dev
```

### Compilar para Produção (Typecheck + Vite Build)
```bash
npm run build
```

### Visualizar o Build Localmente
```bash
npm run preview
```
