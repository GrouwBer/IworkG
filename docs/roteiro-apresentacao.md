═══════════════════════════════════════════════════════════════
ROTEIRO DE APRESENTAÇÃO — IworkG MVP
6 pessoas | Duração sugerida: 25-35 minutos
═══════════════════════════════════════════════════════════════

O que abrir antes de começar:
- Navegador: GitHub do projeto (github.com/GrouwBer/IworkG)
- Terminal: pasta do projeto aberta
- VS Code: backend/src/db.ts e backend/src/types.ts
- Site: http://localhost:5174 (ou porta do frontend)
- Ter um usuário cliente e um prestador já logados em abas separadas


═══════════════════════════════════════════════════════════════
PESSOA 1 — Visão Geral e Problema (4-5 min)
═══════════════════════════════════════════════════════════════

TELA: Abrir docs/o que é o projeto.md.txt

FALA:

"Bom dia/tarde. Vamos apresentar o IworkG, um marketplace de serviços
locais — o 'Tinder da Construção e Manutenção'.

O problema é real: a empresa IWork Soluções em Manutenção opera de forma
totalmente manual. São 5 funcionários, ligações telefônicas e uma planilha
Excel compartilhada. Quando um cliente liga pedindo um eletricista, um
atendente busca na planilha qual profissional está mais perto."

MOSTRAR: Rolar o doc até a seção 5 (Problemas da Empresa)

"A empresa sofre com 4 problemas graves:
1. Falta de escalabilidade — dobrar atendimentos = dobrar funcionários
2. Crise de confiança — cliente não sabe se o profissional é bom
3. Ineficiência geográfica — busca manual é lenta e imprecisa
4. Baixa fidelização — prestador tenta fechar por fora"

"A nossa solução: um marketplace bidirecional focado em matchmaking.
O cliente busca profissionais com portfólio e avaliações comprovadas.
O prestador, por sua vez, pode ver um Mural de Pedidos e se candidatar
ativamente — não fica mais passivo esperando o telefone tocar."

MOSTRAR: Rolar até a Parte 2 — Stack Tecnológica

"O sistema foi implementado como aplicação web full-stack:
React 19 + Express 4 + TypeScript + SQLite.
Autenticação via Google OAuth e telefone com OTP.
72 testes automatizados. CI/CD com GitHub Actions. Docker."

"E o resultado: 94,9% dos requisitos implementados — 37 de 39."

Passar para Pessoa 2.


═══════════════════════════════════════════════════════════════
PESSOA 2 — Requisitos e Documentação (4-5 min)
═══════════════════════════════════════════════════════════════

TELA: Abrir docs/Cópia de Documento de Requisitos do Sistema.md

FALA:

"O projeto partiu de um Documento de Requisitos com 30 requisitos
funcionais e 5 não-funcionais, baseados em 3 atores: Cliente,
Prestador e Administrador."

MOSTRAR: Rolar pela seção 3 mostrando os RFs com ícones ✅

"Cada requisito tem: descrição do caso de uso, prioridade — essencial,
importante ou desejável —, pré-condições e pós-condições. E agora,
na versão final, cada um recebeu status de implementação."

APONTAR para os ícones: ✅ implementado, ⚠️ parcial, ❌ não implementado

"Olhem os módulos. Autenticação: login com Google e OTP, recuperação
de acesso, encerrar sessão — todos implementados. O RF002 de recuperar
senha ficou mais completo que o planejado: implementamos um fluxo de
3 passos com envio de código, verificação e redefinição."

MOSTRAR: Rolar até 3.7 — Requisitos Descobertos na Implementação

"Durante o desenvolvimento, 9 novos requisitos surgiram naturalmente.
Por exemplo: editar e cancelar pedidos, orçamento opcional, seed de
dados com 30 prestadores e 15 pedidos, Docker, CI/CD..."

MOSTRAR: Tabela de resumo na seção 6

"Resumo final: 37 de 39 requisitos implementados. 94,9% de cobertura.
Os únicos itens não 100% são: GPS automático — que ficou simplificado
para busca textual no MVP web — e compartilhamento de perfil."

MOSTRAR: Seção 5 — Stack Tecnológica

"E quanto aos requisitos não-funcionais: todos atendidos. Usabilidade
com header padronizado e wizard com progresso salvo. Segurança com
JWT + refresh token + blacklist. LGPD com soft delete."

Passar para Pessoa 3.


═══════════════════════════════════════════════════════════════
PESSOA 3 — Diagramas UML (4-5 min)
═══════════════════════════════════════════════════════════════

TELA: Abrir docs/diagrma de casos de uso.md.txt (PlantUML)
      OU mostrar o PNG: docs/diagrama de casos de uso.png

FALA:

"Este é o diagrama de casos de uso do sistema. Temos 3 atores
principais: Cliente, Prestador e Administrador."

APONTAR para cada ator e seus casos de uso

"O Cliente pode: buscar profissionais, publicar pedidos, editar
e cancelar pedidos, avaliar, favoritar, denunciar, ver histórico
de contatos e configurar notificações."

"O Prestador, além das funções comuns como login e termos de uso,
tem: wizard de cadastro em 6 passos, gerenciar portfólio, mural de
pedidos abertos, demonstrar interesse, alterar disponibilidade e
responder avaliações."

"O Administrador gerencia: categorias, moderação de denúncias,
banimento de usuários e dashboard de métricas."

APONTAR para o caso de uso vermelho

"Reparem que tem um caso de uso destacado em vermelho: Compartilhar
Perfil. Esse é o único requisito não implementado — ficou planejado
para a versão mobile futura."

"As relações include mostram dependências: para publicar pedido
precisa estar logado. As extend mostram funcionalidades opcionais
que estendem a busca."

─── TROCA DE TELA ───

TELA: Abrir docs/diagrama de classes.txt (PlantUML)

"Agora o diagrama de classes — mas aqui não são classes Java e sim
o modelo de dados real do banco SQLite, com 18 tabelas."

APONTAR para o pacote "Domínio Principal"

"O coração do sistema: users, provider_profiles, categories,
service_requests, interests, reviews, favorites..."

"Muita atenção pras relações: um usuário tem no máximo UM perfil de
prestador, mas um prestador pode ter MÚLTIPLAS categorias — isso é
resolvido com a tabela provider_categories, uma relação many-to-many."

APONTAR para os pacotes auxiliares

"Temos tabelas de autenticação: refresh_tokens, otp_codes,
blacklisted_tokens. Tabelas de notificações com preferências
granulares. E o módulo de administração: reports, bans e
admin_actions para auditoria."

"O legal desse diagrama é que cada coluna listada existe de verdade
no banco. Não é conceitual — é o schema real."

Passar para Pessoa 4.


═══════════════════════════════════════════════════════════════
PESSOA 4 — Do Diagrama ao Código Real (4-5 min)
═══════════════════════════════════════════════════════════════

TELA: VS Code — abrir backend/src/db.ts na linha da tabela provider_profiles (~148)

FALA:

"Vamos ver como o diagrama de classes se traduz em código real.
Peguei o exemplo da tabela provider_profiles."

MOSTRAR: db.ts linhas 148-168 (CREATE TABLE provider_profiles)

"Comparem com o diagrama. No diagrama temos os campos:
id, user_id, category_id, description, rating, review_count,
latitude, longitude, city, state, active, experience_years,
service_radius_km, address..."

"No código SQL, exatamente a mesma estrutura."

LER em voz alta alguns campos:
"CREATE TABLE IF NOT EXISTS provider_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  category_id TEXT NOT NULL,
  description TEXT,
  rating REAL DEFAULT 0,
  ... FOREIGN KEY (user_id) REFERENCES users(id)
)"

"Reparem nas migrations — como adicionamos experience_years,
service_radius_km e address DEPOIS do schema inicial. Isso mostra
que o sistema evoluiu sem quebrar o que já existia."

─── TROCA DE TELA ───

TELA: VS Code — abrir backend/src/types.ts

"Agora o arquivo de tipos TypeScript. Isso é a 'ponte' entre o
banco de dados e o código da aplicação."

MOSTRAR a interface User e ProviderRow

"No TypeScript definimos interfaces que espelham as linhas do banco:

interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: 'client' | 'provider' | 'admin';
  banned?: number;
}

interface ProviderRow {
  id: string;
  user_id: string;
  category_id: string;
  rating: number;
  review_count: number;
  ...
}"

"Isso garante que o TypeScript valide em tempo de compilação se
estamos usando os campos corretos. Se alguém tentar acessar um
campo que não existe, o VS Code já acusa erro."

─── TROCA DE TELA ───

TELA: VS Code — abrir backend/src/server.ts

"Por fim, o arquivo server.ts mostra como as rotas são montadas.
Temos 10 módulos de rota, cada um num arquivo separado:

- auth.ts: Google OAuth, OTP, refresh, logout
- search.ts: categorias e busca de prestadores
- requests.ts: CRUD de pedidos, interesses, mural
- provider.ts: wizard, portfólio
- providers.ts: perfil público, reviews, reports
- notifications.ts, favorites.ts, contacts.ts, admin.ts"

"Cada arquivo de rota tem seus testes correspondentes na pasta
__tests__. Isso nos leva ao próximo tópico."

Passar para Pessoa 5.


═══════════════════════════════════════════════════════════════
PESSOA 5 — Testes e CI/CD (4-5 min)
═══════════════════════════════════════════════════════════════

TELA: VS Code — mostrar a pasta backend/src/__tests__ com os 9 arquivos

FALA:

"O projeto tem 72 testes automatizados em 9 arquivos, organizados
por módulo: auth, search, requests, providers, favorites, contacts,
notifications, admin e integration."

MOSTRAR: Abrir auth.test.ts

"Vou mostrar um exemplo real. No auth.test.ts, testamos o fluxo
completo de autenticação por telefone."

APONTAR para o código:

"describe('POST /api/auth/otp/verify', () => {
  it('deve autenticar com código OTP válido', async () => {
    const phone = '55...';
    await request(app).post('/api/auth/otp/send').send({ phone });
    const code = getOTPCode(phone);
    const res = await request(app)
      .post('/api/auth/otp/verify').send({ phone, code });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });
});"

"O que esse teste faz: envia um código OTP, lê o código gerado no
banco, verifica com a API e confirma que recebeu um accessToken.
Isso testa o fluxo REAL, sem mock — o banco é recriado a cada
execução de teste."

MOSTRAR: Abrir requests.test.ts

"Outro exemplo: no requests.test.ts, testamos o fluxo de demonstrar
interesse em um pedido. O teste cria usuário fake, cria perfil de
prestador, gera token JWT real, publica um pedido e então testa
se o interesse é registrado."

APONTAR para o teste de erro 409 (duplicado) e 403 (cliente tentando)

"Reparem que testamos também os casos de erro: interesse duplicado
retorna 409, cliente sem perfil de prestador tentando demonstrar
interesse retorna 403."

─── TROCA DE TELA ───

TELA: Abrir .github/workflows/test.yml no GitHub

"Agora o CI/CD. Toda vez que alguém faz push ou abre um PR nas
branches main ou dev, o GitHub Actions dispara automaticamente."

MOSTRAR o workflow:

"São 3 jobs paralelos:
1. Backend: instala dependências, roda typecheck com tsc --noEmit,
   e executa os 72 testes com vitest
2. Frontend: typecheck + build de produção com Vite
3. Docker: build das imagens para garantir que o container sobe"

"Se qualquer um desses falhar, o merge é bloqueado. Isso garante
que a branch main nunca quebra — proteção contínua."

"O legal é que tudo roda em Ubuntu limpo no GitHub. Não depende
da máquina de ninguém. O banco SQLite é perfeito pra isso porque
não precisa instalar serviço nenhum."

Passar para Pessoa 6.


═══════════════════════════════════════════════════════════════
PESSOA 6 — Demonstração ao Vivo (6-8 min)
═══════════════════════════════════════════════════════════════

Preparação: Ter o backend rodando (localhost:3001) e frontend
(localhost:5174) abertos no navegador.

TELA: Navegador — http://localhost:5174

─── PARTE A: Login ───

FALA:

"Agora vou mostrar o sistema funcionando. Começando pela tela
de login."

CLICAR em "Entrar com Google" e fazer login OU usar telefone

"O login aceita Google OAuth 2.0 — o fluxo completo com redirect,
callback e troca de tokens — ou telefone com OTP. Em desenvolvimento
o código aparece no terminal do backend."

─── PARTE B: Dashboard e Header ───

"Após login, caímos no dashboard. Reparem no header padronizado:
logo central, botão ← Voltar, e menu PERFIL com a opção Sair
destacada em vermelho. Esse header está presente em TODAS as
páginas do sistema."

─── PARTE C: Buscar Prestadores ───

CLICAR em "Buscar Prestadores"

"Esta é a busca. O cliente pode pesquisar por nome ou filtrar
por categoria. Temos 12 categorias padrão: Eletricista, Pedreiro,
Encanador, Pintor, Marceneiro, Jardineiro..."

DIGITAR "eletricista" e mostrar os cards

"Cada card mostra: foto, nome, categoria com ícone, avaliação
em estrelas e cidade. Clicando no perfil, vemos mais detalhes."

─── PARTE D: Perfil do Prestador ───

CLICAR em um prestador

"No perfil público vemos: descrição, anos de experiência, raio de
atuação, endereço, avaliações com nota e comentários, portfólio
com fotos de antes e depois, e botões de contato."

MOSTRAR a seção de avaliações e o portfólio

"Aqui também é possível: favoritar, avaliar (se já contatou) e
denunciar perfis irregulares."

─── PARTE E: Publicar Pedido ───

VOLTAR ao dashboard e clicar em "Publicar Pedido" ou "Novo Pedido"

"O cliente publica um pedido. Preenche: título, descrição, categoria,
cidade e estado. O valor máximo é opcional — budget."

PREENCHER um pedido rápido: "Trocar resistência do chuveiro"

"Após publicar, o pedido aparece em 'Meus Pedidos' e também no
Mural de Pedidos, visível para todos os prestadores."

─── PARTE F: Mural de Pedidos (visão prestador) ───

TROCAR para a aba do prestador logado

CLICAR em "Mural de Pedidos"

"Agora na visão do prestador. O Mural mostra pedidos abertos de
clientes. Cada card exibe o título, descrição e categoria."

CLICAR em "Demonstrar Interesse" em um pedido

"O prestador demonstra interesse. Uma notificação é gerada para
o cliente avisando que fulano se interessou pelo pedido."

MOSTRAR a página de notificações

─── PARTE G: Editar Pedido ───

VOLTAR para a aba do cliente

IR em "Meus Pedidos"

"Em Meus Pedidos, pedidos abertos mostram botão Editar. O cliente
pode alterar título, descrição e valor máximo. Também pode cancelar
o pedido se não precisar mais."

─── PARTE H: Admin (se houver tempo) ───

TROCAR para um usuário admin

MOSTRAR o dashboard admin com métricas e a lista de denúncias

"Por fim, o painel admin. Dashboard com total de usuários,
prestadores e pedidos. Tabela de denúncias pendentes. CRUD de
categorias — criar, editar, remover. E sistema de banimento com
registro de auditoria."


═══════════════════════════════════════════════════════════════
ENCERRAMENTO (Pessoa 1 volta — 1-2 min)
═══════════════════════════════════════════════════════════════

TELA: Voltar para o GitHub com o README

FALA:

"Recapitulando: o IworkG resolve 4 problemas reais da IWork com
um marketplace web full-stack. 37 de 39 requisitos implementados.
Stack moderna: React, Express, TypeScript, SQLite. CI/CD rodando.
72 testes automatizados garantindo qualidade. Docker para deploy
com um comando."

"O código está aberto no GitHub: github.com/GrouwBer/IworkG.
A documentação completa está na pasta docs/ e o README tem
instruções passo a passo pra rodar localmente."

"Abrimos pra perguntas."


═══════════════════════════════════════════════════════════════
MATERIAIS DE APOIO (deixar abertos em abas)
═══════════════════════════════════════════════════════════════

Aba 1: http://localhost:5174 — Site rodando (cliente logado)
Aba 2: http://localhost:5174 — Site rodando (prestador logado)
Aba 3: http://localhost:5174 — Site rodando (admin logado)
Aba 4: github.com/GrouwBer/IworkG — README
Aba 5: github.com/GrouwBer/IworkG/blob/dev/docs — Documentação
Aba 6: github.com/GrouwBer/IworkG/actions — CI/CD executions

VS Code: backend/src/db.ts, backend/src/types.ts, backend/src/server.ts
VS Code: backend/src/__tests__/auth.test.ts
Terminal: pronto pra rodar `cd backend && npm test`
