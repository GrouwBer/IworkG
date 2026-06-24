## Melhorias de UX — Header, Perfil, Pedidos, Seeds e README

### O que foi feito

#### Header padronizado
- Novo componente `Header.tsx` usado em **todas** as páginas
- Layout: ← Voltar (esquerda) | IworkG (centro) | PERFIL + Sair (direita)
- Botão Sair vermelho (#dc2626), botão PERFIL com borda branca
- Voltar usa histórico do navegador (volta pra página anterior, não fixo)

#### Perfil de prestador
- Favoritar/desfavoritar funcionando (❤️)
- Perfil público mostra avaliações, descrição, stats
- Editar perfil com Header padronizado
- Meu Perfil com Header padronizado

#### Pedidos
- Campo **valor máximo (R$)** opcional no formulário
- Exibe "💰 Até R$ XX" ou "💰 A combinar" no Mural e Meus Pedidos
- Botão **✏️ Editar** nos pedidos abertos (título, descrição, valor)
- Backend: PATCH aceita edição de campos + status
- Coluna `budget` adicionada ao banco

#### Mural de pedidos
- Timeout de 5s no GPS (não trava mais)
- `ready` state em vez de `useRef` (dispara re-render corretamente)
- Botão + Novo Pedido no topo
- Exibe valor do pedido

#### Seeds
- 30 prestadores com perfis completos
- 25+ pedidos de clientes variados
- 10 avaliações de 4-5 estrelas

#### Dashboard
- Cards de navegação: Buscar, Favoritos, Contatos, Meus Pedidos
- Painel do Prestador (Meu Perfil + Mural) ou Tornar-se Prestador
- Notificações com badge no botão
- Placeholder de Sprint removido

#### Outros
- CORS permite localhost:5173 e 5174
- Bug de coluna `token_jti` → `token` corrigido
- Bug índice `provider_profiles` fora de ordem corrigido
- Bug `provider_portfolio` → `portfolio_photos` corrigido
- Bug URL wizard: `/api/providers/` → `/api/provider/`
