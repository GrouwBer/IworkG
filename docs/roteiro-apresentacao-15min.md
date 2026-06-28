═══════════════════════════════════════════════════════════════
ROTEIRO DE APRESENTAÇÃO — IworkG MVP (15 min)
6 pessoas | ~2 min cada + 2 min demo rápida
═══════════════════════════════════════════════════════════════

ANTES DE COMEÇAR — abrir:
- Aba 1: http://localhost (Docker) — cliente logado
- Aba 2: http://localhost — prestador logado
- GitHub: github.com/GrouwBer/IworkG


═══════════════════════════════════════════════════════════════
PESSOA 1 — O Problema e a Solução (2 min)
═══════════════════════════════════════════════════════════════

"A IWork é uma empresa de intermediação de serviços — eletricista,
pedreiro, encanador. Hoje opera 100% manual: 5 funcionários no
telefone e uma planilha Excel pra achar profissionais.

4 problemas: não escala, não tem confiança (cliente não sabe se o
profissional é bom), busca geográfica é lenta e manual, e prestador
age passivo esperando o telefone tocar.

Nossa solução: IworkG, marketplace bidirecional. Cliente busca
prestadores com avaliação e portfólio comprovado. Prestador vê um
Mural de Pedidos e se candidata ativamente. É o 'Tinder da
Construção'.

Stack: React + Express + TypeScript + SQLite. 72 testes. Docker.
Resultado: 37 dos 39 requisitos implementados — 94,9%."


═══════════════════════════════════════════════════════════════
PESSOA 2 — Requisitos (2 min)
═══════════════════════════════════════════════════════════════

TELA: docs/Documento de Requisitos — rolar pela seção 3

"Partimos de 30 requisitos funcionais com 3 atores: Cliente,
Prestador, Administrador. Cada RF tem descrição, prioridade e
status de implementação."

MOSTRAR ícones: ✅ ⚠️ ❌

"Destaques: login com Google e OTP, busca com filtro por categoria,
avaliações com nota e comentário, wizard de cadastro do prestador
em 6 passos, mural de pedidos, notificações, painel admin com
banimento e dashboard de métricas."

MOSTRAR seção 3.7

"Durante o desenvolvimento surgiram mais 9 requisitos: editar e
cancelar pedidos, orçamento opcional, múltiplas categorias por
prestador, seed de dados, Docker, CI/CD."

MOSTRAR tabela-resumo na seção 6

"37 de 39 implementados. Só ficou de fora GPS automático (web MVP
usa busca textual) e compartilhar perfil."


═══════════════════════════════════════════════════════════════
PESSOA 3 — Diagramas (2 min)
═══════════════════════════════════════════════════════════════

TELA: diagrama de casos de uso (PNG ou PlantUML)

"Casos de uso: Cliente busca, publica pedido, avalia, favorita.
Prestador faz wizard, vê mural, demonstra interesse, gerencia
portfólio. Admin modera denúncias, bane usuários, gerencia
categorias."

APONTAR caso vermelho

"Único não implementado: compartilhar perfil."

─── TROCA RÁPIDA DE TELA ───

TELA: diagrama de classes

"Diagrama de classes = 18 tabelas reais do SQLite. users,
provider_profiles, service_requests, reviews, notifications...
Tudo com colunas reais, relações e FK documentadas."


═══════════════════════════════════════════════════════════════
PESSOA 4 — Código Real (2 min)
═══════════════════════════════════════════════════════════════

TELA: VS Code — backend/src/db.ts (~linha 148)

"Comparação direta: o que está no diagrama é o que está no código.
A tabela provider_profiles tem 16 colunas com tipos, defaults e
FKs. Migrations adicionaram experience_years e service_radius_km
depois sem quebrar o schema original."

─── TROCA ───

TELA: backend/src/server.ts

"10 módulos de rota, cada um com responsabilidade única: auth,
search, requests, provider, providers, notifications, favorites,
contacts, admin. Cada módulo tem seus testes na pasta __tests__."


═══════════════════════════════════════════════════════════════
PESSOA 5 — Testes e CI/CD (2 min)
═══════════════════════════════════════════════════════════════

TELA: auth.test.ts

"72 testes em 9 arquivos. Exemplo real: auth.test.ts testa o fluxo
completo de OTP — envia código, lê do banco, verifica na API e
confirma que recebeu accessToken. Sem mock, banco real."

TELA: requests.test.ts

"requests.test.ts: cria usuário fake, perfil de prestador, publica
pedido e testa demonstrar interesse — inclusive casos de erro como
interesse duplicado (409) e cliente sem perfil tentando (403)."

TELA: .github/workflows/test.yml

"CI/CD: a cada push em main ou dev, GitHub Actions roda 3 jobs em
paralelo — typecheck + 72 testes no backend, typecheck + build no
frontend, e build Docker. Se quebrar, merge é bloqueado."


═══════════════════════════════════════════════════════════════
PESSOA 6 — Demo ao Vivo (3 min)
═══════════════════════════════════════════════════════════════

TELA: http://localhost — cliente logado

[MOSTRAR em sequência rápida, sem explicar cada detalhe — só narrar]

"Login com Google → dashboard."

CLICAR: Buscar Prestadores → digitar "eletricista"

"Busca com filtro por categoria. 12 categorias. Card com foto,
nome, nota e cidade."

CLICAR: perfil de um prestador

"Perfil: descrição, avaliações, portfólio com antes/depois, contato."

CLICAR: Publicar Pedido → preencher rápido

"Cliente publica pedido com título, descrição, categoria. Budget
opcional. Vai pro Mural."

TROCAR ABA: prestador logado → Mural de Pedidos

"Prestador vê Mural com pedidos abertos."

CLICAR: Demonstrar Interesse

"Demonstra interesse. Cliente recebe notificação. Editar e cancelar
pedido em Meus Pedidos. Painel Admin com métricas, moderação e bans."


═══════════════════════════════════════════════════════════════
FECHAMENTO — Pessoa 1 (1 min)
═══════════════════════════════════════════════════════════════

"IworkG: marketplace web full-stack, 94,9% dos requisitos entregues,
CI/CD automatizado, 72 testes, Docker. Código aberto no GitHub:
github.com/GrouwBer/IworkG. Obrigado."


═══════════════════════════════════════════════════════════════
CRONOMETRAGEM
═══════════════════════════════════════════════════════════════

P1: 2 min (problema + stack + números)
P2: 2 min (requisitos + status)
P3: 2 min (casos de uso + classes)
P4: 2 min (código db.ts + server.ts)
P5: 2 min (testes + CI/CD)
P6: 3 min (demo ao vivo)
Fechamento P1: 1 min
TOTAL: ~14 min + margem = 15 min
