# Shell autenticado

## Arquitetura

`AppShell` mantém a estrutura única: sidebar, barra mobile e conteúdo autenticado. O `ToastProvider` fica no shell, portanto sobrevive à navegação cliente.

Rotas da navegação: `/dashboard`, `/transactions`, `/cards`, `/recurring`, `/accounts`, `/holdings`, `/trips`, `/import`. A configuração está em `lib/navigation/navigation.ts`.

## Sidebar

`components/app-shell/app-shell.tsx`: sidebar grafite (`neutral-950`) de 248px no desktop, grupos **Acompanhar**, **Patrimônio** e **Dados** definidos em `lib/navigation/navigation.ts` (`navigationGroups`, `isActive`). No mobile vira barra superior com navegação horizontal. Menu do usuário (`user-menu.tsx`) no rodapé com sair.

## Visual

Tokens do design system Apgees no bloco `@theme` de `app/globals.css`; ver `../../docs/design-system.md`. O conteúdo do app fica dentro de `.ds-app`.

## Componentes

- `PageContainer`: tamanhos `default`, `wide`, `form`.
- `PageHeader`: eyebrow, título, descrição, ações e voltar.
- `LoadingState`/skeletons: estrutura sem valores financeiros falsos.
- `EmptyState` e `ErrorState`: estados reutilizáveis e seguros.
- `ToastProvider`: quatro variantes, máximo de três, fechamento manual e auto-dismiss de cinco segundos; erros permanecem.
- `ConfirmDialog`: confirmação destrutiva, Escape e foco inicial no cancelamento.

## Perfil e logout

O shell recebe `displayName` e `email` da sessão. Avatar usa iniciais locais. O menu só oferece sair; não há edição de perfil. Logout chama `/api/v1/auth/logout`, bloqueia repetição e exibe erro genérico.

## Acessibilidade

Há skip link, `main#main-content`, navegação semântica, `aria-current`, labels de controles, live regions para toast, diálogo modal, foco visível e suporte a `prefers-reduced-motion`.

## Extensão futura

Para adicionar navegação, primeiro crie rota real e depois inclua item em `navigationGroups`. Não adicionar links especulativos ou módulos sem página.

## Validação manual

1. Abrir dashboard, contas e nova conta.
2. Recolher sidebar; recarregar e confirmar persistência.
3. Em viewport mobile, abrir drawer, pressionar Escape e testar overlay.
4. Testar navegação por teclado e skip link.
5. Arquivar/excluir conta e verificar confirmação/toast.
6. Compartilhar conta e verificar toast.
7. Testar erro de rede e botão de retry.
