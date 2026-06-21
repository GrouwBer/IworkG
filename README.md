# IworkG — Marketplace de Serviços

Conecta clientes a prestadores de serviços de construção e manutenção (eletricistas, encanadores, pedreiros, etc.) com busca georreferenciada.

## Stack

| Camada   | Tecnologia                          |
|----------|-------------------------------------|
| Backend  | Node.js + Express + TypeScript      |
| Frontend | React + Vite + TypeScript           |
| Banco    | SQLite (better-sqlite3)             |
| Auth     | Google OAuth 2.0 + SMS (OTP)        |
| Mapa     | Geolocation API + ViaCEP + Haversine|

## Estrutura

```
IworkG/
├── backend/                 # API REST (Express + SQLite)
│   ├── src/
│   │   ├── config.ts        # Variáveis de ambiente
│   │   ├── db.ts            # Schema + seed + queries
│   │   ├── server.ts        # Servidor Express
│   │   ├── types.ts         # Tipos TypeScript
│   │   ├── middleware/
│   │   │   └── auth.ts      # requireAuth + requireRole
│   │   ├── routes/
│   │   │   ├── auth.ts      # Google OAuth, OTP, refresh, logout, me
│   │   │   ├── search.ts    # Categorias + busca de prestadores
│   │   │   ├── contacts.ts  # Histórico de contatos
│   │   │   ├── favorites.ts # Favoritos (toggle)
│   │   │   ├── notifications.ts  # Notificações
│   │   │   └── requests.ts  # Interesse em pedidos
│   │   └── services/
│   │       ├── otp.ts       # Geração/verificação OTP
│   │       └── token.ts     # JWT access + refresh tokens
│   ├── data/                # Banco SQLite (gitignored)
│   ├── .env.example
│   └── package.json
├── frontend/                # SPA React
│   ├── src/
│   │   ├── App.tsx          # Rotas
│   │   ├── config.ts        # Config api URL
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx  # Estado global de auth
│   │   ├── components/
│   │   │   └── ProtectedRoute.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── OTPPage.tsx
│   │   │   ├── AuthCallbackPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── SearchPage.tsx
│   │   │   ├── RequestDetailPage.tsx
│   │   │   ├── ContactsPage.tsx
│   │   │   └── FavoritesPage.tsx
│   │   └── services/
│   │       ├── api.ts       # Axios + interceptors
│   │       ├── auth.ts      # Auth API calls
│   │       ├── search.ts    # Search API calls
│   │       ├── history.ts   # History API calls
│   │       └── requests.ts  # Requests API calls
│   ├── .env.example
│   └── package.json
├── package.json             # Scripts raiz (dev, install:all)
├── .gitignore
└── README.md
```

## Como rodar

### Pré-requisitos

- Node.js ≥ 18
- npm ≥ 9

### Instalação

```bash
npm run install:all
```

### Desenvolvimento

```bash
npm run dev
```

Inicia ambos servidores simultaneamente:
- **Backend:** http://localhost:3001
- **Frontend:** http://localhost:5173

### Variáveis de ambiente

Copie os arquivos `.env.example`:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Configure:
- `GOOGLE_CLIENT_ID` — ID do app Google Cloud Console
- `GOOGLE_CLIENT_SECRET` — Secret do app Google
- `JWT_SECRET` — Chave para assinar tokens JWT

### Build

```bash
cd backend && npm run build
cd ../frontend && npm run build
```

## Rotas da API

| Método | Rota                          | Descrição                    |
|--------|-------------------------------|------------------------------|
| GET    | `/api/health`                 | Health check                 |
| POST   | `/api/auth/google`            | Login Google (token)         |
| GET    | `/api/auth/google/url`        | URL de auth Google           |
| GET    | `/api/auth/google/callback`   | Callback OAuth               |
| POST   | `/api/auth/otp/send`          | Enviar SMS OTP               |
| POST   | `/api/auth/otp/verify`        | Verificar OTP                |
| POST   | `/api/auth/refresh`           | Refresh token                |
| POST   | `/api/auth/logout`            | Logout                       |
| GET    | `/api/auth/me`                | Dados do usuário atual       |
| GET    | `/api/categories`             | Listar categorias            |
| GET    | `/api/providers/search`       | Buscar prestadores           |
| GET    | `/api/contacts`               | Histórico de contatos        |
| POST   | `/api/contacts`               | Registrar contato            |
| GET    | `/api/favorites`              | Listar favoritos             |
| POST   | `/api/favorites/:id`          | Toggle favorito              |
| GET    | `/api/favorites/check/:id`    | Verificar favorito           |
| GET    | `/api/notifications`          | Listar notificações          |
| PATCH  | `/api/notifications/:id/read` | Marcar como lida             |
| PATCH  | `/api/notifications/read-all` | Marcar todas como lidas      |
| POST   | `/api/requests/:id/interest`  | Demonstrar interesse         |
| GET    | `/api/requests/:id/interests` | Ver interessados             |

## Licença

MIT
