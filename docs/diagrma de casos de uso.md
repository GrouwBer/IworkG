@startuml
left to right direction
skinparam packageStyle rectangle
skinparam nodesep 10
skinparam ranksep 20

actor "Usuário Base" as U
actor "Cliente" as C
actor "Prestador" as P
actor "Administrador" as ADM

' Herança: Cliente e Prestador possuem tudo que um Usuário Base possui
C -up-|> U
P -up-|> U
ADM -up-|> U

rectangle "IWork App (MVP)" {

  package "Gestão de Conta e Institucional" {
    usecase "Realizar Login" as UC_Login
    usecase "Recuperar Acesso" as UC_Recuperar
    usecase "Editar Dados Pessoais" as UC_EditarDados
    usecase "Configurar Notificações" as UC_ConfigNotif
    usecase "Encerrar Sessão" as UC_Encerrar
    usecase "Excluir Conta" as UC_Excluir
    usecase "Termos e Privacidade" as UC_Termos
    usecase "Acessar Ajuda" as UC_Ajuda
  }

  package "Serviços do Cliente" {
    usecase "Buscar Profissionais" as UC_Buscar
    usecase "Aplicar Filtros" as UC_Filtros
    usecase "Informar Localização" as UC_InfLocalizacao
    usecase "Publicar Pedido de Serviço" as UC_PublicarPedido
    usecase "Editar / Cancelar Pedido" as UC_EditarPedido
    usecase "Avaliar Prestador" as UC_Avaliar
    usecase "Favoritar Prestador" as UC_Favoritar
    usecase "Denunciar Irregularidade" as UC_Denunciar
    usecase "Visualizar Histórico de Contatos" as UC_HistContatos
    usecase "Iniciar Contato" as UC_IniciarContato
  }

  package "Recursos do Prestador" {
    usecase "Dashboard do Prestador" as UC_DashPrestador
    usecase "Buscar Pedidos (Mural)" as UC_BuscarPedidos
    usecase "Demonstrar Interesse" as UC_DemoInteresse
    usecase "Cadastrar / Editar Perfil" as UC_CadPerfil
    usecase "Gerenciar Portfólio" as UC_GenPortfolio
    usecase "Alterar Status de Disponibilidade" as UC_AltStatus
    usecase "Definir Raio de Atuação" as UC_RaioAtuacao
  }

  package "Painel Administrativo" {
    usecase "Visualizar Dashboard" as UC_Dashboard
    usecase "Gerenciar Categorias" as UC_GenCategorias
    usecase "Moderar Denúncias" as UC_Moderar
    usecase "Banir / Desbanir Usuário" as UC_Banir
  }

  ' Relacionamentos Include e Extend
  UC_IniciarContato ..> UC_Login : <<include>>
  UC_PublicarPedido ..> UC_Login : <<include>>
  UC_DemoInteresse ..> UC_Login : <<include>>
  UC_Avaliar ..> UC_Login : <<include>>
  UC_Recuperar ..> UC_Login : <<include>>

  UC_Filtros .up.> UC_Buscar : <<extend>>
  UC_Denunciar .up.> UC_Buscar : <<extend>>
  UC_Favoritar .up.> UC_Buscar : <<extend>>
  UC_Buscar ..> UC_InfLocalizacao : <<include>>
}

' ═══ Conexões do Usuário Base ═══
U --> UC_Login
U --> UC_Recuperar
U --> UC_EditarDados
U --> UC_ConfigNotif
U --> UC_Encerrar
U --> UC_Excluir
U --> UC_Termos
U --> UC_Ajuda

' ═══ Conexões Exclusivas do Cliente ═══
C --> UC_Buscar
C --> UC_HistContatos
C --> UC_PublicarPedido
C --> UC_EditarPedido
C --> UC_IniciarContato

' ═══ Conexões Exclusivas do Prestador ═══
P --> UC_DashPrestador
P --> UC_BuscarPedidos
P --> UC_DemoInteresse
P --> UC_CadPerfil
P --> UC_GenPortfolio
P --> UC_AltStatus
P --> UC_RaioAtuacao

' ═══ Conexões Exclusivas do Administrador ═══
ADM --> UC_Dashboard
ADM --> UC_GenCategorias
ADM --> UC_Moderar
ADM --> UC_Banir

@enduml
