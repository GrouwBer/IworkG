# IworkG — Marketplace de Serviços Locais

Conecta clientes a prestadores de serviços (eletricistas, encanadores, pedreiros, pintores, etc.) com busca georreferenciada, portfólio visual e sistema de pedidos.

---

## Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| Backend | Node.js + Express 4 + TypeScript 5 |
| Frontend | React 19 + Vite 8 + TypeScript |
| Banco de Dados | SQLite (better-sqlite3) |
| Autenticação | Google OAuth 2.0 + SMS OTP (código via terminal em dev) |
| Testes | Vitest + Supertest (72 testes) |
| CI/CD | GitHub Actions (typecheck + testes + build) |
| Docker | docker-compose com nginx + Node |

---

## Como Rodar

### Pré-requisitos
- Node.js ≥ 18
- npm ≥ 9

### Passo 1 — Clonar e instalar

```bash
git clone https://github.com/GrouwBer/IworkG.git
cd IworkG
npm run install:all
```

### Passo 2 — Configurar .env

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edite `backend/.env` com suas credenciais:
```
PORT=3001
JWT_SECRET=sua-chave-secreta
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
FRONTEND_URL=http://localhost:5173
```

Edite `frontend/.env`:
```
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=mesmo-client-id-acima
```

### Passo 3 — Rodar

```bash
# Terminal 1 — Backend (porta 3001)
cd backend && npm run dev

# Terminal 2 — Frontend (porta 5173, ou 5174 se 5173 já estiver em uso)
cd frontend && npm run dev
```

Acesse **http://localhost:5173** (ou a porta exibida no terminal do Vite)

### Opção Docker

```bash
docker compose up -d --build
```
Acesse **http://localhost** (tudo num container só).

---

## Como Usar

### Login
- **Google** — clique em "Entrar com Google"
- **Telefone** — digite o número, o código aparece no terminal do backend

### Cliente
1. Faça login → Dashboard
2. Clique em **Buscar Prestadores** — pesquise por nome ou categoria
3. Clique no perfil de um prestador → veja avaliações e portfólio
4. Clique em **Publicar Pedido** — descreva o serviço, defina valor máximo (opcional)
5. Acompanhe em **Meus Pedidos** — veja quem demonstrou interesse
6. Entre em contato com o prestador escolhido

### Prestador
1. Dashboard → **Tornar-se Prestador** — preencha o wizard de 6 passos
2. Após cadastro, acesse o **Mural de Pedidos** para ver demandas de clientes
3. Clique em **Demonstrar Interesse** nos pedidos que quiser pegar
4. Também pode **criar seus próprios pedidos** como cliente
5. Gerencie seu perfil em **Meu Perfil** → **Editar Perfil**

### Editar Pedidos
- Em **Meus Pedidos**, pedidos abertos têm botão **✏️ Editar**
- Altere título, descrição e valor máximo
- Ou **Cancelar** se não precisar mais

---

## Estrutura do Projeto

```
IworkG/
├── backend/
│   ├── src/
│   │   ├── config.ts            # Variáveis de ambiente
│   │   ├── db.ts                # Schema + seed + queries
│   │   ├── server.ts            # Servidor Express + CORS
│   │   ├── types.ts             # Tipos TypeScript
│   │   ├── middleware/
│   │   │   ├── auth.ts          # requireAuth + requireRole
│   │   │   └── rateLimit.ts     # Rate limiting
│   │   ├── routes/
│   │   │   ├── auth.ts          # Google OAuth, OTP, refresh, logout
│   │   │   ├── search.ts        # Categorias + busca prestadores
│   │   │   ├── provider.ts      # Wizard, perfil próprio, portfólio
│   │   │   ├── providers.ts     # Perfil público, edição, reviews, reports
│   │   │   ├── requests.ts      # CRUD pedidos, interesse, mural
│   │   │   ├── contacts.ts      # Histórico de contatos
│   │   │   ├── favorites.ts     # Favoritos (toggle)
│   │   │   ├── notifications.ts # Notificações + preferências
│   │   │   └── admin.ts         # Painel admin (dashboard, categorias)
│   │   ├── services/            # OTP, Token, Image, Notifications
│   │   └── __tests__/           # 72 testes de integração
│   ├── data/                    # Banco SQLite (gitignored)
│   └── uploads/                 # Imagens de portfólio
├── frontend/
│   ├── src/
│   │   ├── components/          # Header, ProtectedRoute, Toast, Modal, etc.
│   │   ├── contexts/            # AuthContext (JWT + refresh)
│   │   ├── pages/               # 20+ páginas (Login, Busca, Perfil, etc.)
│   │   └── services/            # API client + serviços
│   └── nginx.conf               # Config nginx para Docker
├── docs/                       # Documentação do projeto
│   ├── o que é o projeto.md.txt
│   ├── Documento de Requisitos do Sistema.md
│   ├── diagrama de casos de uso.png
│   ├── diagrma de casos de uso.md.txt
│   └── diagrama de classes.txt
│   ├── roteiro-apresentacao.md  # Roteiro para apresentação
├── docker-compose.yml
├── .github/workflows/test.yml   # CI pipeline
└── README.md
```

---

## API — Principais Rotas

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/google` | Login com Google |
| POST | `/api/auth/otp/send` | Enviar código OTP |
| POST | `/api/auth/otp/verify` | Verificar OTP |
| GET | `/api/categories` | Listar categorias |
| GET | `/api/providers/search?query=&category_id=` | Buscar prestadores |
| GET | `/api/providers/:userId` | Perfil público do prestador |
| GET | `/api/provider/wizard` | Estado do wizard de cadastro |
| PUT | `/api/provider/wizard` | Salvar progresso do wizard |
| POST | `/api/provider/wizard/complete` | Finalizar cadastro |
| GET | `/api/requests/mine` | Meus pedidos |
| POST | `/api/requests` | Criar pedido |
| PATCH | `/api/requests/:id` | Editar/cancelar pedido |
| GET | `/api/requests/open` | Mural de pedidos (prestador) |
| POST | `/api/requests/:id/interest` | Demonstrar interesse |
| POST | `/api/favorites/:userId` | Toggle favorito |
| GET | `/api/notifications` | Listar notificações |

---

## Documentação do Projeto

A pasta [`docs/`](docs/) contém os artefatos de análise e design:

| Documento | Descrição |
|---|---|
| `o que é o projeto.md.txt` | Visão geral: cliente fictício, empresa, problemas e escopo |
| `Documento de Requisitos do Sistema.md` | 30 requisitos funcionais + 5 não-funcionais |
| `diagrama de casos de uso.png` | Diagrama UML de casos de uso |
| `diagrma de casos de uso.md.txt` | Fonte PlantUML do diagrama de casos de uso |
| `diagrama de classes.txt` | Fonte PlantUML do diagrama de classes (18 tabelas SQLite) |
| `roteiro-apresentacao.md` | Roteiro completo para apresentação em grupo (6 pessoas) |

---

## Testes

```bash
cd backend && npm test    # 72 testes automatizados
```

---

## CI/CD

Toda pull request ou push em `main`/`dev` dispara:
- ✅ TypeScript typecheck (backend + frontend)
- ✅ 72 testes automatizados (Vitest)
- ✅ Build de produção (Vite)
- ✅ Build Docker

---

## Licença

MIT
