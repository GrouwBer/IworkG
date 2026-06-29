Projeto - Cliente Fictício e Casos de uso

Parte 1: Cliente Fictício

Nomes: Carlos Felipe Barbosa, Eduardo Tenório Nunes, Gustavo Rodrigues de Souza, João Guilherme Garcia Mangueira, João Victor Borges Carvalho, Kauan Felipe Simão

1. Papel do Cliente na Empresa
Diretor Executivo (CEO). Combina a visão estratégica do negócio com a atuação direta na linha de frente da operação, liderando a rede de prestadores de serviço e garantindo pessoalmente o mais alto padrão de qualidade na entrega e no atendimento final ao consumidor.

2. Nome da Empresa
IWork Soluções em Manutenção Ltda.

3. Ramo de Atuação
Intermediação de serviços técnicos de construção civil, reparos domésticos e manutenção predial em áreas urbanas.

4. Funcionamento Atual (Infraestrutura e Equipe)
Atualmente, a IWork opera de forma estritamente analógica e manual. Contamos com uma equipe de 5 funcionários alocados em um escritório físico:

Equipe: 3 atendentes comerciais, 1 administrativo e 1 gestor.

Operação: O processo depende 100% de ligações telefônicas e trocas de mensagens manuais. Quando um cliente precisa de um serviço, ele liga para o escritório; um atendente busca em uma planilha compartilhada (Excel) qual profissional cadastrado mora mais perto e está disponível.

Infraestrutura: Telefonia VoIP, computadores básicos e uma base de dados manual que frequentemente fica desatualizada.

5. Problemas da Empresa
Falta de Escalabilidade: Para dobrar o número de atendimentos, seria necessário dobrar o número de funcionários no telefone, o que torna o custo operacional proibitivo.

Crise de Confiança: Clientes hesitam em contratar profissionais informais por medo de golpes ou má execução. Hoje, não há como provar a qualidade de um pedreiro para o cliente antes da visita.

Ineficiência Geográfica: A seleção manual de profissionais por proximidade é lenta e sujeita a erros, resultando em prestadores que demoram a chegar ou que não aceitam o serviço por ser longe demais.

Baixa Fidelização e Passividade: O trabalhador se sente "vigiado" pelo modelo manual e atua de forma puramente passiva (esperando o telefone tocar). Muitos tentam fechar serviços por fora para não dar satisfação à empresa.


6. Processos a Informatizar
Catálogo e Portfólio Digital: Substituir a planilha por um sistema de perfis com fotos reais de serviços anteriores ("Antes e Depois").

Matchmaking Geolocalizado: Automatizar a exibição de profissionais com base no GPS do usuário, eliminando a busca manual da equipe interna.

Mural de Pedidos (Matchmaking Bidirecional): Criar um espaço onde os clientes possam publicar suas necessidades e os prestadores disponíveis possam visualizar e se voluntariar para o serviço, gerando uma dinâmica ativa de contratação.

Sistema de Reputação: Digitalizar a avaliação dos clientes para que a "prova social" valide os melhores profissionais automaticamente.

7. Sistema a ser Desenvolvido
O sistema será o IWork MVP (o "Tinder da Construção e Manutenção").

Trata-se de um marketplace de serviços locais focado em alta confiança e baixa fricção. O software funcionará como um ecossistema bidirecional: por um lado, atua como uma vitrine inteligente onde o cliente encontra o profissional por proximidade, visualiza seu histórico de avaliações e portfólio, e inicia o contato direto. Por outro, permite que clientes publiquem demandas para que os prestadores se candidatem ativamente.

O foco da plataforma não é gerenciar o pagamento, mas sim resolver o problema estrutural do encontro (matchmaking) entre a demanda qualificada e a mão de obra verificada, reduzindo drasticamente a carga cognitiva e o tempo de espera de ambos os usuários.


═══════════════════════════════════════════════════════════════
PARTE 2: Resultado Final — MVP Entregue (Junho/2026)
═══════════════════════════════════════════════════════════════

8. O que foi construído

O sistema IworkG foi implementado como uma aplicação web full-stack, superando o escopo original de app mobile. A decisão por web foi pragmática — permitiu desenvolvimento mais rápido, deploy simplificado e alcance universal (qualquer navegador moderno).

Stack Tecnológica Real:

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite 8 + TypeScript |
| Backend | Node.js + Express 4 + TypeScript |
| Banco de Dados | SQLite (better-sqlite3, WAL mode) |
| Autenticação | Google OAuth 2.0 + OTP via SMS (simulado) |
| Testes | Vitest + Supertest — 72 testes de integração |
| CI/CD | GitHub Actions (typecheck + testes + build automático) |
| Containerização | Docker + docker-compose + nginx |

9. Funcionalidades Entregues

O MVP cobre 37 dos 39 requisitos funcionais (94,9%), incluindo 9 requisitos que emergiram durante o desenvolvimento:

Jornada do Cliente:
- Login com Google ou telefone (OTP) e recuperação de acesso
- Busca de prestadores por nome, categoria e localização
- Perfil público do prestador com avaliações, portfólio e contato
- Publicação, edição e cancelamento de pedidos de serviço
- Acompanhamento dos próprios pedidos e interesses recebidos
- Avaliação (1-5 estrelas) com comentário após contato
- Favoritos e histórico de contatos
- Denúncia de perfis irregulares
- Configuração granular de notificações

Jornada do Prestador:
- Wizard de cadastro em 6 passos com progresso salvo
- Portfólio com upload de fotos (antes/depois/geral)
- Mural de Pedidos com busca de demandas de clientes
- Demonstrar interesse em pedidos
- Dashboard pessoal com métricas (avaliações, contatos)
- Edição de perfil completa (descrição, categorias, experiência, raio)
- Alternar disponibilidade (ativo/ocupado)
- Resposta pública a avaliações de clientes
- Múltiplas categorias de atuação

Painel Administrativo:
- Dashboard com métricas gerais da plataforma
- Gerenciamento de denúncias (aprovar/rejeitar)
- Banimento e revogação de ban de usuários
- CRUD de categorias de serviço (12 categorias padrão)
- Registro de auditoria (admin_actions)

Infraestrutura:
- Docker: `docker compose up` sobe tudo num comando
- CI/CD: push/PR em main/dev dispara typecheck + 72 testes + build
- Seed: 30 prestadores + 15 pedidos + avaliações para testes
- JWT com refresh token e blacklist para segurança
- Soft delete (LGPD) para exclusão de contas
- Rate limiting em endpoints sensíveis

10. O que ficou para versões futuras

- RF014 — Compartilhar Perfil de prestador
- GPS automático (hoje localização é textual)
- App mobile nativo (Android/iOS)
- Pagamentos integrados
- Chat em tempo real
- Notificações push reais

11. Links

- Repositório: https://github.com/GrouwBer/IworkG
- README completo com instruções de instalação e uso
- Documentação técnica: pasta `docs/` com requisitos, diagramas e modelos
