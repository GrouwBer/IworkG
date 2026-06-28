**Documento de Requisitos do Sistema**

**Projeto:** IWork MVP  
**Equipe:** Carlos Felipe Barbosa, Eduardo Tenório Nunes, Gustavo Rodrigues de Souza, João Guilherme Garcia Mangueira, João Victor Borges Carvalho, Kauan Felipe Simão1. Introdução

Este documento especifica os requisitos do sistema IWork, fornecendo aos desenvolvedores as informações necessárias para o projeto e implementação, assim como para a realização dos testes e homologação do sistema.1.1 Convenções e Prioridades

Para estabelecer a prioridade dos requisitos, foram adotadas as seguintes denominações:

* **Essencial:** Requisito sem o qual o sistema não entra em funcionamento. É imprescindível.  
* **Importante:** Requisito que deve ser implementado, mas, se não for, o sistema poderá ser implantado de forma básica.  
* **Desejável:** Requisito que não compromete as funcionalidades básicas do sistema e pode ser deixado para versões posteriores.

2\. Descrição Geral do Sistema

O sistema IWork MVP atua na intermediação de serviços técnicos de construção civil, reparos domésticos e manutenção predial. Trata-se de um *marketplace* bidirecional focado em alta confiança e baixa fricção. O software funcionará como uma vitrine inteligente onde o cliente encontra o profissional por proximidade, e também como um "Mural de Pedidos", onde os clientes publicam demandas para que os prestadores se candidatem ativamente. O foco é resolver o problema do encontro (*matchmaking*) entre a demanda qualificada e a mão de obra verificada.3. Requisitos Funcionais (Casos de Uso)3.1 Autenticação e Gestão de Conta

**\[RF001\] Realizar Login**

* **Descrição do caso de uso:** Permite que clientes, prestadores e administradores acessem o sistema.  
* **Prioridade:** Essencial  
* **Entradas e pré-condições:** O usuário precisa ter um cadastro. Entradas: credenciais de acesso (ex: OTP ou Google).  
* **Saídas e pós-condição:** O usuário é autenticado e recebe acesso às funcionalidades do seu perfil.

**\[RF002\] Recuperar Senha / Acesso**

* **Descrição do caso de uso:** Permite que o usuário recupere seu acesso caso perca a forma de login.  
* **Prioridade:** Essencial  
* **Entradas e pré-condições:** O usuário deve informar o telefone ou e-mail cadastrado.  
* **Saídas e pós-condição:** Um link ou código de recuperação é enviado, permitindo a restauração do acesso.

**\[RF003\] Editar Dados Pessoais**

* **Descrição do caso de uso:** Permite que o usuário atualize suas informações de contato e foto.  
* **Prioridade:** Importante  
* **Entradas e pré-condições:** O usuário deve estar logado.  
* **Saídas e pós-condição:** Os dados são atualizados no banco de dados do sistema.

**\[RF004\] Excluir Conta**

* **Descrição do caso de uso:** Permite a exclusão definitiva dos dados do usuário, em conformidade com a LGPD.  
* **Prioridade:** Essencial  
* **Entradas e pré-condições:** O usuário deve estar logado e confirmar a ação.  
* **Saídas e pós-condição:** Todos os dados pessoais do usuário são anonimizados ou apagados.

**\[RF005\] Encerrar Sessão**

* **Descrição do caso de uso:** Permite que o usuário faça o logoff seguro do dispositivo.  
* **Prioridade:** Essencial  
* **Entradas e pré-condições:** O usuário deve estar com uma sessão ativa.  
* **Saídas e pós-condição:** A sessão é encerrada e o aplicativo retorna à tela de entrada.

3.2 Busca e Engajamento (Cliente)

**\[RF006\] Informar Localização**

* **Descrição do caso de uso:** Captura a localização atual do cliente para basear a listagem.  
* **Prioridade:** Essencial  
* **Entradas e pré-condições:** O cliente deve conceder permissão de GPS ou digitar um CEP válido.  
* **Saídas e pós-condição:** O sistema armazena a coordenada (Lat/Long) em cache para realizar a busca.

**\[RF007\] Buscar Profissionais**

* **Descrição do caso de uso:** Exibe uma vitrine de prestadores próximos ao cliente.  
* **Prioridade:** Essencial  
* **Entradas e pré-condições:** O sistema deve ter a localização do cliente informada \[RF006\].  
* **Saídas e pós-condição:** Uma lista ordenada por proximidade geográfica e avaliações é apresentada.

**\[RF008\] Aplicar Filtros**

* **Descrição do caso de uso:** Refina a busca de profissionais com base na categoria de serviço.  
* **Prioridade:** Importante  
* **Entradas e pré-condições:** O cliente deve estar na tela de busca. Entrada: seleção de categoria (ex: Eletricista).  
* **Saídas e pós-condição:** A lista de profissionais é atualizada para exibir apenas os que atendem ao filtro.

**\[RF009\] Iniciar Contato**

* **Descrição do caso de uso:** Gera a ponte de comunicação direta com o prestador.  
* **Prioridade:** Essencial  
* **Entradas e pré-condições:** O cliente deve estar logado e visualizar o perfil de um prestador disponível.  
* **Saídas e pós-condição:** O cliente é redirecionado para o canal de contato direto com o prestador.

**\[RF010\] Avaliar Prestador**

* **Descrição do caso de uso:** Permite atribuir uma nota e comentário após o serviço.  
* **Prioridade:** Essencial  
* **Entradas e pré-condições:** O cliente deve estar logado e ter visualizado/contatado o perfil do prestador.  
* **Saídas e pós-condição:** A avaliação é anexada ao perfil do prestador, atualizando sua média geral.

**\[RF011\] Denunciar Irregularidade**

* **Descrição do caso de uso:** Canal para reportar comportamento inadequado ou perfil falso.  
* **Prioridade:** Essencial  
* **Entradas e pré-condições:** O cliente deve estar logado e acessar o perfil do infrator.  
* **Saídas e pós-condição:** Um alerta é gerado no painel do Administrador.

**\[RF012\] Favoritar Prestador**

* **Descrição do caso de uso:** Salva o perfil de um prestador para consulta rápida futura.  
* **Prioridade:** Desejável  
* **Entradas e pré-condições:** O cliente deve estar logado.  
* **Saídas e pós-condição:** O perfil do prestador é adicionado à lista pessoal de favoritos do cliente.

**\[RF013\] Visualizar Histórico de Contatos**

* **Descrição do caso de uso:** Exibe os últimos profissionais contatados pelo cliente.  
* **Prioridade:** Importante  
* **Entradas e pré-condições:** O cliente deve estar logado.  
* **Saídas e pós-condição:** Retorna uma lista com os perfis dos prestadores acessados recentemente.

**\[RF014\] Compartilhar Perfil**

* **Descrição do caso de uso:** Permite enviar o link do perfil de um prestador para terceiros.  
* **Prioridade:** Desejável  
* **Entradas e pré-condições:** Estar visualizando o perfil de um prestador.  
* **Saídas e pós-condição:** Um link compartilhável é gerado e integrado aos menus do sistema operacional.

3.3 Mural de Pedidos (Matchmaking Bidirecional)

**\[RF015\] Publicar Pedido de Serviço**

* **Descrição do caso de uso:** O cliente descreve sua necessidade e publica para a rede de prestadores.  
* **Prioridade:** Essencial  
* **Entradas e pré-condições:** O cliente deve estar logado. Entradas: Descrição do problema, categoria e foto.  
* **Saídas e pós-condição:** O pedido é registrado no banco de dados e fica visível no Mural local.

**\[RF016\] Buscar Pedidos Abertos**

* **Descrição do caso de uso:** Permite ao prestador visualizar as demandas publicadas pelos clientes na sua região.  
* **Prioridade:** Essencial  
* **Entradas e pré-condições:** O prestador deve estar logado e com localização ativada.  
* **Saídas e pós-condição:** Uma lista de pedidos não resolvidos próximos ao prestador é exibida.

**\[RF017\] Demonstrar Interesse no Pedido**

* **Descrição do caso de uso:** O prestador sinaliza ao cliente que deseja assumir o serviço publicado.  
* **Prioridade:** Essencial  
* **Entradas e pré-condições:** O prestador deve estar logado e visualizar um pedido aberto.  
* **Saídas e pós-condição:** O cliente recebe uma notificação com o perfil do prestador interessado.

3.4 Módulo Prestador

**\[RF018\] Cadastrar Perfil**

* **Descrição do caso de uso:** Fluxo de criação da vitrine profissional (Wizard).  
* **Prioridade:** Essencial  
* **Entradas e pré-condições:** Nenhuma. O usuário escolhe criar conta como Prestador.  
* **Saídas e pós-condição:** Um novo perfil de prestador é ativado no sistema.

**\[RF019\] Gerenciar Portfólio**

* **Descrição do caso de uso:** Upload e exclusão de fotos de "Antes e Depois" dos serviços executados.  
* **Prioridade:** Essencial  
* **Entradas e pré-condições:** O prestador deve estar logado.  
* **Saídas e pós-condição:** As imagens são processadas e publicadas na galeria pública do prestador.

**\[RF020\] Alterar Status (Disponibilidade)**

* **Descrição do caso de uso:** Alterna a visibilidade do prestador entre "Disponível" e "Ocupado".  
* **Prioridade:** Essencial  
* **Entradas e pré-condições:** O prestador deve estar logado.  
* **Saídas e pós-condição:** Se "Ocupado", o perfil deixa de aparecer nas buscas dos clientes.

**\[RF021\] Definir Raio de Atuação**

* **Descrição do caso de uso:** Configura a distância máxima que o prestador aceita viajar.  
* **Prioridade:** Importante  
* **Entradas e pré-condições:** O prestador deve estar logado. Entrada: valor numérico em Quilômetros.  
* **Saídas e pós-condição:** O filtro geográfico do prestador é atualizado.

**\[RF022\] Visualizar Notificações**

* **Descrição do caso de uso:** Exibe alertas sobre novas avaliações ou interesses em serviços.  
* **Prioridade:** Importante  
* **Entradas e pré-condições:** O prestador deve estar logado.  
* **Saídas e pós-condição:** Uma lista cronológica de alertas é apresentada.

**\[RF023\] Responder Avaliação**

* **Descrição do caso de uso:** Permite que o prestador dê uma resposta pública ao feedback de um cliente.  
* **Prioridade:** Desejável  
* **Entradas e pré-condições:** O prestador deve estar logado e possuir uma avaliação recebida.  
* **Saídas e pós-condição:** A resposta fica visível logo abaixo da avaliação do cliente.

3.5 Módulo Suporte e Legal

**\[RF024\] Configurar Notificações**

* **Descrição do caso de uso:** Ativa ou desativa os alertas Push enviados pelo aplicativo.  
* **Prioridade:** Desejável  
* **Entradas e pré-condições:** O usuário deve estar logado.  
* **Saídas e pós-condição:** As preferências de comunicação são salvas no perfil do usuário.

**\[RF025\] Acessar Central de Ajuda**

* **Descrição do caso de uso:** Disponibiliza tutoriais e FAQ para os usuários.  
* **Prioridade:** Importante  
* **Entradas e pré-condições:** Nenhuma.  
* **Saídas e pós-condição:** O usuário visualiza a base de conhecimento de suporte.

**\[RF026\] Consultar Termos de Uso**

* **Descrição do caso de uso:** Exibe os documentos legais e políticas de privacidade da empresa.  
* **Prioridade:** Essencial  
* **Entradas e pré-condições:** Nenhuma.  
* **Saídas e pós-condição:** O usuário acessa os textos de formatação legal em conformidade com as lojas de aplicativos.

3.6 Módulo Administrativo

**\[RF027\] Moderar Usuários e Fotos**

* **Descrição do caso de uso:** Permite excluir imagens impróprias ou avaliações ofensivas.  
* **Prioridade:** Essencial  
* **Entradas e pré-condições:** O ator deve ser um Administrador autenticado.  
* **Saídas e pós-condição:** O conteúdo irregular é removido da plataforma pública.

**\[RF028\] Banir Usuário Infrator**

* **Descrição do caso de uso:** Bloqueia permanentemente uma conta que violou as regras.  
* **Prioridade:** Essencial  
* **Entradas e pré-condições:** O ator deve ser um Administrador autenticado e possuir denúncias contra o usuário.  
* **Saídas e pós-condição:** A conta do infrator é inativada e ele não consegue mais realizar login.

**\[RF029\] Gerenciar Categorias de Serviço**

* **Descrição do caso de uso:** Permite criar, editar ou apagar as tags de especialidades (ex: "Jardineiro").  
* **Prioridade:** Importante  
* **Entradas e pré-condições:** O ator deve ser um Administrador autenticado.  
* **Saídas e pós-condição:** O catálogo base do sistema é atualizado para todos os usuários.

**\[RF030\] Visualizar Dashboard de Métricas**

* **Descrição do caso de uso:** Exibe dados de uso, número de contatos iniciados e taxa de conversão.  
* **Prioridade:** Importante  
* **Entradas e pré-condições:** O ator deve ser um Administrador autenticado.  
* **Saídas e pós-condição:** Gráficos e indicadores gerenciais são apresentados na tela.

4\. Requisitos Não-Funcionais

**\[NF001\] Usabilidade**  
A interface com o usuário é de vital importância para o sucesso do sistema. O aplicativo deve focar no mínimo esforço cognitivo, especialmente para o Prestador, apresentando botões grandes e alto contraste, minimizando a digitação livre.

**\[NF002\] Desempenho**  
O sistema deve realizar os cálculos de GPS e carregar as vitrines de profissionais em até 3 segundos em conexões 4G para garantir uma experiência fluida. Embora o documento base cite que não seja o mais essencial em alguns contextos, para a nossa busca geolocalizada a velocidade é mandatória.

**\[NF003\] Segurança e Privacidade**  
Os dados pessoais devem ser trafegados em ambiente criptografado e o aplicativo precisa seguir estritamente as diretrizes da Lei Geral de Proteção de Dados (LGPD).

**\[NF004\] Compatibilidade e Hardware**  
O aplicativo deverá operar sem restrições nos principais sistemas operacionais móveis (Android e iOS). Em vez de depender de uma máquina única, ele operará nativamente em smartphones comunicando-se com bancos de dados em nuvem.

**\[NF005\] Tolerância a Falhas de Rede**  
O sistema deve possuir capacidade de persistência de dados local (cache). Se o cliente perder o sinal de internet, ele ainda deverá conseguir visualizar os perfis dos prestadores favoritados ou acessados na sessão atual.  
