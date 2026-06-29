@startuml
!theme plain
left to right direction
skinparam classAttributeIconSize 0
skinparam shadowing false
skinparam roundcorner 6
skinparam nodesep 10
skinparam ranksep 10
skinparam defaultFontSize 11
skinparam packageStyle rectangle

title Diagrama de Classes — IworkG MVP

' ═══════════════════════════════════════════════════════
' CAMADA 1 — MODEL
' ═══════════════════════════════════════════════════════

package "Model — SQLite" #E8F8F5 {

  together {
    class users {
      id | name | email | phone
      avatar_url | google_id | role
      banned | deleted_at | created_at | updated_at
    }
    class refresh_tokens {
      id | user_id | token | expires_at
      revoked | created_at
    }
    class otp_codes {
      id | phone | code | expires_at
      used | identifier_type | created_at
    }
    class blacklisted_tokens {
      id | token_jti | expires_at | created_at
    }
    class recovery_tokens {
      id | user_id | identifier | token
      expires_at | used | created_at
    }
    class provider_profiles {
      id | user_id | category_id
      description | rating | review_count
      latitude | longitude | city | state
      experience_years | service_radius_km
      address | active | contact_count
      created_at | updated_at
    }
    class categories {
      id | name | slug | icon
      deleted_at | created_at
    }
    class provider_wizard_state {
      id | user_id | current_step
      step_data | created_at | updated_at
    }
  }

  together {
    class reviews {
      id | client_id | provider_id
      contact_id | rating | comment
      created_at
    }
    class portfolio_photos {
      id | provider_id | filename
      original_name | mime_type | size_bytes
      tag | sort_order | created_at
    }
    class service_requests {
      id | client_id | title | description
      category_id | city | state
      latitude | longitude | status
      urgency | photo_url | address
      created_at | updated_at
    }
    class interests {
      id | request_id | provider_id | created_at
    }
    class contact_history {
      id | client_id | provider_id
      contact_type | created_at
    }
  }

  together {
    class favorites {
      id | client_id | provider_id | created_at
    }
    class notifications {
      id | user_id | type | title
      body | data | read | created_at
    }
    class notification_preferences {
      user_id | new_requests | interests
      reviews | promotions
    }
    class reports {
      id | reporter_id | target_type
      target_id | reason | description
      status | resolution | created_at
      resolved_at | resolved_by
    }
    class bans {
      id | user_id | admin_id | reason
      revoked | created_at | revoked_at | revoked_by
    }
    class admin_actions {
      id | admin_id | action_type
      target_type | target_id | justification
      created_at
    }
    class provider_categories <<M:N>> {
      provider_id | category_id
    }
  }

  ' ═══ Relacionamentos e Multiplicidades ═══
  users "1" -- "0..*" refresh_tokens : > gera
  users "1" -- "0..*" recovery_tokens : > solicita
  users "1" -- "0..1" provider_wizard_state : > mantém
  users "1" -- "0..1" provider_profiles : > possui (se prestador)
  users "1" -- "0..*" service_requests : > publica
  users "1" -- "0..*" reviews : > escreve (como cliente)
  users "1" -- "0..*" favorites : > favorita
  users "1" -- "0..*" contact_history : > inicia
  users "1" -- "0..*" notifications : > recebe
  users "1" -- "1" notification_preferences : > configura
  users "1" -- "0..*" reports : > envia
  users "1" -- "0..*" bans : > sofre / aplica
  users "1" -- "0..*" admin_actions : > executa

  provider_profiles "0..*" -- "1" categories : > possui principal
  provider_profiles "1" -- "1..*" provider_categories : > atende
  provider_categories "0..*" -- "1" categories : > referencia
  provider_profiles "1" -- "0..*" portfolio_photos : > exibe
  provider_profiles "1" -- "0..*" reviews : > recebe (avaliações)

  service_requests "1" -- "0..*" interests : > atrai
  interests "0..*" -- "1" users : > demonstrado por (prestador)
}

' ═══════════════════════════════════════════════════════
' CAMADA 2 — DAO
' ═══════════════════════════════════════════════════════

package "DAO — db.ts" #FCF3CF {

  class CategoryDAO {
    getAll()
    create()
    update()
    softDelete()
  }
  class ProviderDAO {
    search()
    getProfile()
    createProfile()
    setCategories()
  }
  class PortfolioDAO {
    addPhoto()
    getPhotos()
    deletePhoto()
  }
  class WizardDAO {
    getState()
    updateState()
    deleteState()
  }
  class RequestDAO {
    searchOpen()
  }
  class ReviewDAO {
    getForProvider()
    createReview()
  }
  class ReportDAO {
    createReport()
    getPending()
  }
  class AdminDAO {
    getStats()
  }
}

' ═══════════════════════════════════════════════════════
' CAMADA 3 — CONTROLLER
' ═══════════════════════════════════════════════════════

package "Controller — Express" #E8EAF6 {

  class "auth.ts" as A {
    POST /google
    POST /otp/* | /refresh
    POST /recover/send
    POST /recover/verify
    POST /recover/reset
    POST /logout
    GET /me
    DELETE /account
  }

  class "search.ts" as B {
    GET /categories
    GET /providers/search
  }

  class "requests.ts" as C {
    POST / (criar)
    GET /mine | GET /open
    PATCH /:id
    POST /:id/interest
  }

  class "provider.ts" as D {
    GET/PUT /wizard
    POST /wizard/complete
    GET/PUT /me
    POST /me/portfolio
    DELETE /me/portfolio/:id
  }

  class "providers.ts" as E {
    GET /:id
    PUT /profile
    POST /:id/reviews
    POST /:id/report
  }

  class "notifications.ts" as F {
    GET / | PATCH /read-all
    GET/PUT /preferences
  }

  class "favorites.ts" as G {
    GET / | POST /:id
  }
  class "contacts.ts" as G2 {
    GET / | POST /
  }

  class "admin.ts" as H {
    CRUD /categories
    GET /stats | GET /reports | PATCH /reports/:id
    POST /users/:id/ban | POST /users/:id/unban
  }
}

' ═══════════════════════════════════════════════════════
' CAMADA 4 — VIEW
' ═══════════════════════════════════════════════════════

package "View — React" #FDEBD0 {

  class "Cliente" as VC {
    LoginPage | OTPPage
    DashboardPage
    SearchPage
    ProviderProfilePage
    NewRequestPage
    MyRequestsPage
    FavoritesPage
    ContactsPage
  }

  class "Prestador" as VP {
    ProviderRegisterPage
    ProviderEditPage
    RequestBoardPage
    MyProviderPage
  }

  class "Geral" as VG {
    NotificationsPage
    NotificationPreferencesPage
    HelpPage
    TermsPage
    PrivacyPage
  }

  class "Admin" as VA {
    AdminDashboardPage
    AdminCategoriesPage
    AdminPage
  }

  class "Componentes" as VX {
    Header | ProtectedRoute
    StarRating | ReviewSection
    PortfolioGallery
    ReportModal | ContactModal
    Toast | Modal | ProgressBar
  }
}

note bottom : View —▸ Controller (HTTP REST)\nController —▸ DAO (import)\nDAO —▸ Model (SQL / better-sqlite3)

@enduml
