**Documento de Requisitos do Sistema**

**Projeto:** IWork MVP (IworkG)
**Equipe:** Carlos Felipe Barbosa, Eduardo Tenório Nunes, Gustavo Rodrigues de Souza, João Guilherme Garcia Mangueira, João Victor Borges Carvalho, Kauan Felipe Simão
**Status:** MVP Concluído — Junho/2026

---

## 1. Introdução

Este documento especifica os requisitos do sistema IworkG, fornecendo aos desenvolvedores as informações necessárias para o projeto e implementação, assim como para a realização dos testes e homologação do sistema.

A versão final entregue é uma **aplicação web full-stack** (React + Express + SQLite) com autenticação Google OAuth e OTP via SMS, deployável via Docker com CI/CD automatizado.

### 1.1 Convenções e Prioridades

Para estabelecer a prioridade dos requisitos, foram adotadas as seguintes denominações:

- **Essencial:** Requisito sem o qual o sistema não entra em funcionamento. É imprescindível.
- **Importante:** Requisito que deve ser implementado, mas, se não for, o sistema poderá ser implantado de forma básica.
- **Desejável:** Requisito que não compromete as funcionalidades básicas do sistema e pode ser deixado para versões posteriores.

### 1.2 Status de Implementação

Cada requisito funcional recebe um dos seguintes status:

- ✅ **Implementado** — Funcionalidade completa no MVP
- ⚠️ **Parcial** — Implementado com escopo reduzido ou simplificado
- ❌ **Não implementado** — Deixado para versões futuras

---

## 2. Descrição Geral do Sistema

O sistema IworkG atua na intermediação de serviços técnicos de construção civil, reparos domésticos e manutenção predial. Trata-se de um *marketplace* bidirecional focado em alta confiança e baixa fricção. O software funciona como uma vitrine inteligente onde o cliente encontra o profissional por proximidade, e também como um "Mural de Pedidos", onde os clientes publicam demandas para que os prestadores se candidatem ativamente. O foco é resolver o problema do encontro (*matchmaking*) entre a demanda qualificada e a mão de obra verificada.

---

## 3. Requisitos Funcionais (Casos de Uso)

### 3.1 Autenticação e Gestão de Conta

**\[RF001\] Realizar Login** ✅
- **Descrição do caso de uso:** Permite que clientes, prestadores e administradores acessem o sistema.
- **Prioridade:** Essencial
- **Entradas e pré-condições:** O usuário precisa ter um cadastro. Entradas: Google OAuth 2.0 ou OTP via telefone.
- **Saídas e pós-condição:** O usuário é autenticado via JWT (access + refresh token) e recebe acesso às funcionalidades do seu perfil.

**\[RF002\] Recuperar Senha / Acesso** ✅
- **Descrição do caso de uso:** Permite que o usuário recupere seu acesso caso perca a forma de login.
- **Prioridade:** Essencial
- **Entradas e pré-condições:** O usuário deve informar o telefone ou e-mail cadastrado.
- **Saídas e pós-condição:** Fluxo de 3 passos — enviar código → verificar código → redefinir acesso. Um novo token de acesso é gerado.

**\[RF003\] Editar Dados Pessoais** ✅
- **Descrição do caso de uso:** Permite que o usuário atualize suas informações de contato e foto.
- **Prioridade:** Importante
- **Entradas e pré-condições:** O usuário deve estar logado.
- **Saídas e pós-condição:** Os dados são atualizados no banco de dados do sistema. Prestadores podem editar perfil completo (descrição, experiência, raio de atuação, endereço, categorias).

**\[RF004\] Excluir Conta** ✅
- **Descrição do caso de uso:** Permite a exclusão definitiva dos dados do usuário, em conformidade com a LGPD.
- **Prioridade:** Essencial
- **Entradas e pré-condições:** O usuário deve estar logado e confirmar a ação.
- **Saídas e pós-condição:** Todos os dados pessoais do usuário são anonimizados ou apagados (soft delete com `deleted_at`).

**\[RF005\] Encerrar Sessão** ✅
- **Descrição do caso de uso:** Permite que o usuário faça o logoff seguro do dispositivo.
- **Prioridade:** Essencial
- **Entradas e pré-condições:** O usuário deve estar com uma sessão ativa.
- **Saídas e pós-condição:** A sessão é encerrada (JWT adicionado à blacklist, refresh token revogado) e o aplicativo retorna à tela de entrada.

### 3.2 Busca e Engajamento (Cliente)

**\[RF006\] Informar Localização** ⚠️
- **Descrição do caso de uso:** Captura a localização atual do cliente para basear a listagem.
- **Prioridade:** Essencial
- **Entradas e pré-condições:** O cliente digita manualmente cidade/estado ou termos de busca.
- **Saídas e pós-condição:** O sistema usa o texto informado para filtrar prestadores. *(Nota: GPS automático não implementado no MVP web — simplificado para busca textual)*.

**\[RF007\] Buscar Profissionais** ✅
- **Descrição do caso de uso:** Exibe uma vitrine de prestadores próximos ao cliente.
- **Prioridade:** Essencial
- **Entradas e pré-condições:** O sistema recebe query de busca textual e/ou categoria.
- **Saídas e pós-condição:** Uma lista paginada de prestadores ativos, ordenada por avaliação, é apresentada com cards contendo nome, foto, categoria, nota e cidade.

**\[RF008\] Aplicar Filtros** ✅
- **Descrição do caso de uso:** Refina a busca de profissionais com base na categoria de serviço.
- **Prioridade:** Importante
- **Entradas e pré-condições:** O cliente deve estar na tela de busca. Entrada: seleção de categoria (ex: Eletricista).
- **Saídas e pós-condição:** A lista de profissionais é atualizada para exibir apenas os que atendem ao filtro. Categorias são carregadas dinamicamente do banco.

**\[RF009\] Iniciar Contato** ✅
- **Descrição do caso de uso:** Gera a ponte de comunicação direta com o prestador.
- **Prioridade:** Essencial
- **Entradas e pré-condições:** O cliente deve estar logado e visualizar o perfil de um prestador disponível.
- **Saídas e pós-condição:** O contato é registrado no histórico (`contact_history`). O perfil do prestador exibe botão de WhatsApp/telefone.

**\[RF010\] Avaliar Prestador** ✅
- **Descrição do caso de uso:** Permite atribuir uma nota (1-5) e comentário após o serviço.
- **Prioridade:** Essencial
- **Entradas e pré-condições:** O cliente deve estar logado e ter visualizado/contatado o perfil do prestador.
- **Saídas e pós-condição:** A avaliação é anexada ao perfil do prestador, atualizando sua média geral (`rating` e `review_count`).

**\[RF011\] Denunciar Irregularidade** ✅
- **Descrição do caso de uso:** Canal para reportar comportamento inadequado ou perfil falso.
- **Prioridade:** Essencial
- **Entradas e pré-condições:** O cliente deve estar logado e acessar o perfil do infrator.
- **Saídas e pós-condição:** Um alerta é gerado no painel do Administrador. Motivos: Perfil falso, Comportamento inadequado, Golpe, Outro. Rate-limit de 24h por denunciante.

**\[RF012\] Favoritar Prestador** ✅
- **Descrição do caso de uso:** Salva o perfil de um prestador para consulta rápida futura.
- **Prioridade:** Desejável
- **Entradas e pré-condições:** O cliente deve estar logado.
- **Saídas e pós-condição:** O perfil do prestador é adicionado à lista pessoal de favoritos do cliente (toggle: favorita/desfavorita).

**\[RF013\] Visualizar Histórico de Contatos** ✅
- **Descrição do caso de uso:** Exibe os últimos profissionais contatados pelo cliente.
- **Prioridade:** Importante
- **Entradas e pré-condições:** O cliente deve estar logado.
- **Saídas e pós-condição:** Retorna uma lista com os perfis dos prestadores acessados recentemente, ordenada por data do contato.

**\[RF014\] Compartilhar Perfil** ❌
- **Descrição do caso de uso:** Permite enviar o link do perfil de um prestador para terceiros.
- **Prioridade:** Desejável
- **Entradas e pré-condições:** Estar visualizando o perfil de um prestador.
- **Saídas e pós-condição:** Um link compartilhável é gerado e integrado aos menus do sistema operacional.
- **Status:** Não implementado no MVP.

### 3.3 Mural de Pedidos (Matchmaking Bidirecional)

**\[RF015\] Publicar Pedido de Serviço** ✅
- **Descrição do caso de uso:** O cliente descreve sua necessidade e publica para a rede de prestadores.
- **Prioridade:** Essencial
- **Entradas e pré-condições:** O cliente deve estar logado. Entradas: título, descrição, categoria, cidade/estado e valor máximo (opcional — budget).
- **Saídas e pós-condição:** O pedido é registrado no banco e fica visível no Mural de Pedidos. Prestadores podem visualizar e demonstrar interesse.

**\[RF016\] Buscar Pedidos Abertos** ✅
- **Descrição do caso de uso:** Permite ao prestador visualizar as demandas publicadas pelos clientes na sua região.
- **Prioridade:** Essencial
- **Entradas e pré-condições:** O prestador deve estar logado.
- **Saídas e pós-condição:** Uma lista de pedidos com status "open" é exibida no Mural de Pedidos.

**\[RF017\] Demonstrar Interesse no Pedido** ✅
- **Descrição do caso de uso:** O prestador sinaliza ao cliente que deseja assumir o serviço publicado.
- **Prioridade:** Essencial
- **Entradas e pré-condições:** O prestador deve estar logado e visualizar um pedido aberto.
- **Saídas e pós-condição:** O cliente recebe uma notificação com o perfil do prestador interessado. O interesse fica registrado no pedido.

### 3.4 Módulo Prestador

**\[RF018\] Cadastrar Perfil** ✅
- **Descrição do caso de uso:** Fluxo de criação da vitrine profissional (Wizard de 6 passos).
- **Prioridade:** Essencial
- **Entradas e pré-condições:** O usuário escolhe "Tornar-se Prestador" estando logado.
- **Saídas e pós-condição:** Após completar o wizard (categoria → descrição → experiência → localização → raio → portfólio), um novo perfil de prestador é ativado. O progresso do wizard é salvo a cada passo (`provider_wizard_state`).

**\[RF019\] Gerenciar Portfólio** ✅
- **Descrição do caso de uso:** Upload e exclusão de fotos de "Antes e Depois" dos serviços executados.
- **Prioridade:** Essencial
- **Entradas e pré-condições:** O prestador deve estar logado.
- **Saídas e pós-condição:** As imagens (com tags: Antes/Depois/Geral) são processadas e publicadas na galeria pública do prestador. Upload via `multipart/form-data`.

**\[RF020\] Alterar Status (Disponibilidade)** ✅
- **Descrição do caso de uso:** Alterna a visibilidade do prestador entre "Disponível" e "Ocupado".
- **Prioridade:** Essencial
- **Entradas e pré-condições:** O prestador deve estar logado.
- **Saídas e pós-condição:** Se inativo (`active = 0`), o perfil deixa de aparecer nas buscas dos clientes.

**\[RF021\] Definir Raio de Atuação** ✅
- **Descrição do caso de uso:** Configura a distância máxima que o prestador aceita viajar.
- **Prioridade:** Importante
- **Entradas e pré-condições:** O prestador deve estar logado. Entrada: valor numérico em km.
- **Saídas e pós-condição:** O campo `service_radius_km` é atualizado no perfil do prestador.

**\[RF022\] Visualizar Notificações** ✅
- **Descrição do caso de uso:** Exibe alertas sobre novas avaliações, interesses em pedidos e outras interações.
- **Prioridade:** Importante
- **Entradas e pré-condições:** O usuário deve estar logado.
- **Saídas e pós-condição:** Lista cronológica de notificações com indicador de não lidas. Suporta marcar individualmente ou todas como lidas.

**\[RF023\] Responder Avaliação** ✅
- **Descrição do caso de uso:** Permite que o prestador dê uma resposta pública ao feedback de um cliente.
- **Prioridade:** Desejável
- **Entradas e pré-condições:** O prestador deve estar logado e possuir uma avaliação recebida.
- **Saídas e pós-condição:** A resposta é armazenada no campo `response` da avaliação e fica visível no perfil do prestador.

### 3.5 Módulo Suporte e Legal

**\[RF024\] Configurar Notificações** ✅
- **Descrição do caso de uso:** Ativa ou desativa categorias específicas de notificações.
- **Prioridade:** Desejável
- **Entradas e pré-condições:** O usuário deve estar logado.
- **Saídas e pós-condição:** Preferências salvas (`notification_preferences`): novos pedidos, interesses, avaliações e promoções. Cada tipo pode ser ativado/desativado individualmente.

**\[RF025\] Acessar Central de Ajuda** ✅
- **Descrição do caso de uso:** Disponibiliza tutoriais e FAQ para os usuários.
- **Prioridade:** Importante
- **Entradas e pré-condições:** Nenhuma.
- **Saídas e pós-condição:** O usuário visualiza a página de ajuda com instruções de uso da plataforma.

**\[RF026\] Consultar Termos de Uso** ✅
- **Descrição do caso de uso:** Exibe os documentos legais e políticas de privacidade.
- **Prioridade:** Essencial
- **Entradas e pré-condições:** Nenhuma.
- **Saídas e pós-condição:** Páginas separadas para Termos de Uso e Política de Privacidade acessíveis publicamente.

### 3.6 Módulo Administrativo

**\[RF027\] Moderar Usuários e Fotos** ✅
- **Descrição do caso de uso:** Permite visualizar denúncias e tomar ações moderativas.
- **Prioridade:** Essencial
- **Entradas e pré-condições:** O ator deve ser um Administrador autenticado.
- **Saídas e pós-condição:** Lista de denúncias pendentes com opção de resolver (aprovar/rejeitar) com justificativa.

**\[RF028\] Banir Usuário Infrator** ✅
- **Descrição do caso de uso:** Bloqueia permanentemente uma conta que violou as regras.
- **Prioridade:** Essencial
- **Entradas e pré-condições:** O ator deve ser um Administrador autenticado.
- **Saídas e pós-condição:** O usuário é banido (`banned = 1`) e não consegue mais realizar login. Suporte a revogação de ban (`unban`). Registro em tabela `bans` e `admin_actions`.

**\[RF029\] Gerenciar Categorias de Serviço** ✅
- **Descrição do caso de uso:** Permite criar, editar ou remover as categorias de especialidades (ex: "Jardineiro").
- **Prioridade:** Importante
- **Entradas e pré-condições:** O ator deve ser um Administrador autenticado.
- **Saídas e pós-condição:** CRUD completo de categorias com soft delete (`deleted_at`). 12 categorias padrão inclusas no seed.

**\[RF030\] Visualizar Dashboard de Métricas** ✅
- **Descrição do caso de uso:** Exibe dados de uso agregados da plataforma.
- **Prioridade:** Importante
- **Entradas e pré-condições:** O ator deve ser um Administrador autenticado.
- **Saídas e pós-condição:** Dashboard com total de usuários, prestadores, pedidos, denúncias pendentes e lista de bans ativos.

### 3.7 Requisitos Descobertos Durante a Implementação

Os seguintes requisitos emergiram durante o desenvolvimento e foram implementados no MVP:

**\[RF031\] Editar Pedido** ✅
- **Descrição:** O cliente pode editar título, descrição e valor máximo de um pedido enquanto estiver aberto.
- **Prioridade:** Essencial
- **Rota:** `PATCH /api/requests/:id`

**\[RF032\] Cancelar Pedido** ✅
- **Descrição:** O cliente pode cancelar um pedido aberto, alterando seu status para "cancelled".
- **Prioridade:** Essencial
- **Rota:** `PATCH /api/requests/:id` com `{ status: 'cancelled' }`

**\[RF033\] Orçamento Opcional (Budget)** ✅
- **Descrição:** O cliente pode definir um valor máximo ao publicar um pedido, auxiliando o prestador a filtrar serviços dentro do seu alcance financeiro.
- **Prioridade:** Importante
- **Campo:** `max_value` no modelo `service_requests`

**\[RF034\] Header Unificado com Navegação Contextual** ✅
- **Descrição:** Header padronizado em todas as páginas com logo central, botão "← Voltar", e menu PERFIL com opção Sair (destacada em vermelho).
- **Prioridade:** Essencial

**\[RF035\] Seed de Dados para Desenvolvimento** ✅
- **Descrição:** Scripts de seed que populam o banco com 30 prestadores, 15 pedidos e avaliações para testes e demonstrações.
- **Prioridade:** Importante

**\[RF036\] Docker + Deploy** ✅
- **Descrição:** Empacotamento completo via `docker-compose.yml` com nginx servindo frontend estático + proxy reverso para API.
- **Prioridade:** Importante

**\[RF037\] CI/CD com GitHub Actions** ✅
- **Descrição:** Pipeline automatizado em todo push/PR nas branches `main`/`dev`: typecheck (tsc), 72 testes automatizados (Vitest), build de produção (Vite) e build Docker.

**\[RF038\] Dashboard do Prestador (Meu Perfil)** ✅
- **Descrição:** Página dedicada onde o prestador vê status do perfil, acessa edição, portfólio e métricas próprias (avaliações, contatos).

**\[RF039\] Múltiplas Categorias por Prestador** ✅
- **Descrição:** Prestador pode se associar a múltiplas categorias via tabela many-to-many (`provider_categories`), não apenas uma única.

---

## 4. Requisitos Não-Funcionais

**\[NF001\] Usabilidade** ✅
A interface implementada segue boas práticas de UX: header padronizado, cards de prestadores com informações essenciais, wizard com progresso salvo, feedback visual em ações (toasts), e botões de ação com alto contraste (Sair em vermelho `#dc2626`).

**\[NF002\] Desempenho** ✅
O sistema é uma aplicação web (React SPA + Express API + SQLite com WAL mode) com respostas em milissegundos para buscas locais. O frontend é servido como build estático otimizado (Vite) no Docker.

**\[NF003\] Segurança e Privacidade** ✅
Implementado: JWT com refresh token + blacklist, senha não armazenada (apenas OTP e Google OAuth), CORS configurado, soft delete para conformidade LGPD, rate limiting em endpoints sensíveis (OTP, reports), tokens revogáveis individualmente (jti).

**\[NF004\] Compatibilidade** ✅
Aplicação web responsiva — funciona em qualquer navegador moderno (Chrome, Firefox, Edge, Safari). O frontend React 19 + Vite 8 garante compatibilidade cross-browser.

**\[NF005\] Tolerância a Falhas** ⚠️
O sistema é full web (não mobile nativo), portanto depende de conexão ativa. O cache local não foi implementado no MVP. O SQLite com WAL mode oferece resiliência contra crashes do banco.

---

## 5. Stack Tecnológica (Entregue)

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite 8 + TypeScript |
| Backend | Node.js + Express 4 + TypeScript |
| Banco de Dados | SQLite (better-sqlite3, WAL mode) |
| Autenticação | Google OAuth 2.0 + OTP via terminal (SMS simulado em dev) |
| Testes | Vitest + Supertest (72 testes de integração) |
| CI/CD | GitHub Actions (typecheck + testes + build) |
| Containerização | Docker + docker-compose + nginx |

---

## 6. Resumo de Cobertura

| Categoria | Total RFs | Implementados | Parciais | Não Implementados |
|---|---|---|---|---|
| Autenticação e Conta | 5 | 5 | 0 | 0 |
| Busca e Engajamento | 9 | 7 | 1 | 1 |
| Mural de Pedidos | 3 | 3 | 0 | 0 |
| Módulo Prestador | 6 | 6 | 0 | 0 |
| Suporte e Legal | 3 | 3 | 0 | 0 |
| Administrativo | 4 | 4 | 0 | 0 |
| Descobertos na Implementação | 9 | 9 | 0 | 0 |
| **TOTAL** | **39** | **37** | **1** | **1** |

**Taxa de conclusão do MVP: 94,9% dos requisitos implementados.**
