# Amora — web

App Next.js do Amora (SaaS internacional de finanças pessoais e familiares, multimoeda). Diretrizes: [`../AGENTS.md`](../AGENTS.md) e [`AGENTS.md`](AGENTS.md).

## Executar

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm dev
```

Consulte [docs/accounts.md](docs/accounts.md) para regras de contas, payloads e API.
Consulte [docs/app-shell.md](docs/app-shell.md) para shell, navegação, estados e acessibilidade.

## Rotas

- `/`: landing pública demonstrativa;
- `/login`: login por código OTP enviado por e-mail;
- `/dashboard`: visão geral (central de comando);
- `/transactions`: lançamentos, filtros e edição de tipo/categoria;
- `/cards`: faturas, limite, parcelas e cashback;
- `/recurring`: recorrentes e parcelamentos;
- `/accounts`: contas por país, conferência de saldo e câmbio (formulários `/accounts/new` e `/accounts/:id` ainda no visual antigo);
- `/holdings`: bens e investimentos;
- `/trips`: viagens por tag;
- `/import`: importação CSV/OFX com revisão;
- `/api/v1`: Route Handlers autenticados.

## Contas, carteiras e cartões

- Regras centralizadas em `lib/accounts/account-types.ts`.
- Países vêm de allowlist local ISO 3166-1 alpha-2; a API persiste apenas `BR`, `UY`, etc.
- `openingDate` é data civil `YYYY-MM-DD`; backend converte para `12:00:00.000Z`.
- Saldos iniciais usam strings decimais. Valor zero cria `AccountBalance`, sem lançamento `OPENING_BALANCE`.
- Edição nunca sobrescreve ledger. Nova moeda usa `POST /api/v1/accounts/:id/balances`.
- Apenas owner edita metadados e adiciona moedas.

## Limitações

- migration de autenticação ainda pendente;
- catálogo `Asset` vazio até provisionamento;
- sem lançamentos gerais, câmbio, banco conectado ou billing;
- bypass de verificação não pode ser habilitado em produção.

## Prisma

- Prisma `6.19.0` configurado para PostgreSQL;
- schema em `prisma/schema.prisma`;
- cliente singleton em `lib/prisma.ts`;
- `DATABASE_URL` em `.env`.
- `WEB_URL`, `RESEND_API_KEY` e `RESEND_FROM` em `.env`.

## Seed local de ativos

`prisma/seed.mjs` provisiona ativos iniciais de forma idempotente. Não remove contas, saldos ou ativos.

SUGERIR comando, com `DATABASE_URL` configurada:

```bash
node prisma/seed.mjs
```

O envio usa somente templates publicados no Resend. Templates e IDs estão documentados no README da raiz.

Validar schema:

```bash
pnpm db:validate
```
