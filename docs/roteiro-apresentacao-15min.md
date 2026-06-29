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

Stack: React + Express + TypeScript + SQLite. 86 testes. Docker.
Resultado: 37 dos 39 requisitos implementados — 94,9%."


═══════════════════════════════════════════════════════════════
PESSOA 2 — Requisitos (2 min)
═══════════════════════════════════════════════════════════════

TELA: docs/Documento de Requisitos — rolar pela tabela de requisitos

(Vá rolando o documento calmamente e lendo os requisitos para a banca)

"Aqui está a nossa lista completa de Requisitos Funcionais:
(Leia a lista rolando a tela, por exemplo):
- RF01 e RF02: Cadastro e Login (Cliente, Prestador e Admin).
- RF03 a RF06: Edição de perfil, Busca e Filtro de prestadores.
- RF07 a RF09: Favoritar, Avaliar e Histórico de Contatos.
- RF10 a RF14: Publicar, Editar, Cancelar pedidos e Demonstrar Interesse.
- RF15 a RF21: Fluxo do Prestador (Wizard, Portfólio, Raio de atuação, Status).
- RF22 a RF30: Funcionalidades Gerais e Painel Admin (Dashboard, Moderação, Banimento e Categorias)."

(Continue lendo/mostrando até chegar no final, e conclua):

"Como documentamos aqui com os ícones de check (✅), nós entregamos 37 de 39 requisitos. Só não implementamos GPS automático e compartilhamento de perfil externo."


═══════════════════════════════════════════════════════════════
PESSOA 3 — Casos de Uso e Visão Geral (2 min)
═══════════════════════════════════════════════════════════════

TELA: diagrama de casos de uso (PNG ou PlantUML)

"Nossos Casos de uso cobrem 3 perfis:
- O Cliente busca prestadores, publica pedidos, avalia e favorita.
- O Prestador faz o Wizard de cadastro, gerencia seu perfil, visualiza o Mural de Pedidos e demonstra interesse.
- O Admin tem poder para moderar denúncias, gerenciar categorias e banir/desbanir usuários."

APONTAR caso vermelho (se houver) ou apenas citar:
"O único recurso que planejamos e ficou de fora do MVP foi compartilhar perfil, tudo o restante está rodando."


═══════════════════════════════════════════════════════════════
PESSOA 4 — Modelagem: Do Diagrama para o Código (2 min)
═══════════════════════════════════════════════════════════════

TELA: diagrama de classes

"Aqui temos nosso Diagrama de Classes. Ele reflete as 18 tabelas reais do nosso SQLite, separadas por contexto. 
(Aponte com o mouse para a tabela 'reports' e depois para 'provider_profiles').
Vejam que documentamos todas as colunas, tipos e chaves estrangeiras de tabelas vitais como usuários, relatórios e perfis."

─── TROCA DE TELA PARA O VS CODE ───

TELA: VS Code — abra o arquivo backend/src/db.ts (mostre perto da linha 148, e depois a linha 200)

"E aqui provamos que o que foi modelado foi programado.
Esta é a criação da tabela provider_profiles e reports direto no nosso banco de dados. 
A estrutura é exatamente a mesma. E mais: criamos um sistema de migrations (Role até a linha 372) que adicionou novas regras (como o raio de serviço em KM e anos de experiência) sem quebrar o esquema original."

─── TROCA RÁPIDA ───

TELA: backend/src/server.ts

"Toda essa base de dados é consumida por 10 módulos de rota no Express. Cada rota tem responsabilidade única (auth, search, admin, etc)."


═══════════════════════════════════════════════════════════════
PESSOA 5 — Testes e CI/CD (2 min)
═══════════════════════════════════════════════════════════════

TELA: auth.test.ts

"Temos 86 testes em 9 arquivos. Exemplo real: auth.test.ts testa o fluxo
completo de OTP — envia código, lê do banco, verifica na API e
confirma que recebeu accessToken. Sem mock, banco real."

TELA: requests.test.ts

"requests.test.ts: cria usuário fake, perfil de prestador, publica
pedido e testa demonstrar interesse — inclusive casos de erro como
interesse duplicado (409) e cliente sem perfil tentando (403)."

TELA: .github/workflows/test.yml

"CI/CD: a cada push em main ou dev, GitHub Actions roda 3 jobs em
paralelo — typecheck + 86 testes no backend, typecheck + build no
frontend, e build Docker. Se quebrar, o merge é bloqueado."


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

"O prestador demonstra interesse e o cliente recebe uma notificação. O cliente também pode editar e cancelar pedidos."

TROCAR ABA: Admin (ou mostrar pelo próprio cliente se for admin)

"E no Painel Admin, nós gerenciamos as métricas globais, moderamos denúncias feitas por usuários e aplicamos ou removemos banimentos."


═══════════════════════════════════════════════════════════════
FECHAMENTO — Pessoa 1 (1 min)
═══════════════════════════════════════════════════════════════

"IworkG: marketplace web full-stack, 94,9% dos requisitos entregues,
CI/CD automatizado, 86 testes, Docker. Código aberto no GitHub:
github.com/GrouwBer/IworkG. Obrigado."


═══════════════════════════════════════════════════════════════
CRONOMETRAGEM
═══════════════════════════════════════════════════════════════

P1: 2 min (problema + stack + números)
P2: 2 min (requisitos + status)
P3: 2 min (diagrama de casos de uso)
P4: 2 min (diagrama de classes + código)
P5: 2 min (testes + CI/CD)
P6: 3 min (demo ao vivo)
Fechamento P1: 1 min
TOTAL: ~14 min + margem = 15 min
