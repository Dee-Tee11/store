# CLAUDE.md

Instruções para o Claude Code neste repositório.

## Regras do projeto

- **Nunca correr migrações sem autorização explícita.** Isto inclui `medusa db:migrate`,
  `medusa db:sync-links`, `medusa db:rollback`, scripts em `apps/backend/src/migration-scripts/`
  e qualquer DDL (`CREATE`/`ALTER`/`DROP`) contra a base de dados. Propõe o SQL/comando e espera
  pelo OK.
- **Nunca escrever na base de dados directamente.** A BD é partilhada (Supabase). Entrega o SQL
  para o utilizador executar; não o corras.
- Não fazer commit nem push sem pedido explícito.

## Arquitectura

Monorepo com duas aplicações independentes (não partilham workspace):

- `backend/` — turborepo, npm workspaces. A app está em `backend/apps/backend/`.
  Medusa **2.17**, TypeScript. Código em `src/`: `api`, `admin`, `modules`, `workflows`,
  `links`, `subscribers`, `jobs`, `migration-scripts`. Corre na porta **9000**.
- `fashion-starter/storefront/` — Next.js 15 (App Router) + React 19, `@medusajs/js-sdk`.
  Corre na porta **8000**. Integrações: Stripe, PayPal, Meilisearch.

## Infraestrutura

- **Postgres: Supabase** (`DATABASE_URL` em `backend/apps/backend/.env`). O `docker-compose.yml`
  na raiz tem um Postgres local que **não** é o que está em uso.
- **Sem Redis.** O event bus, a cache e o workflow engine correm em memória. Implica
  instância única — o backend não pode ser escalado horizontalmente.

## Comandos

```bash
# backend (a partir de backend/apps/backend/)
npm run dev            # medusa develop  -> :9000, admin em /app
npm run build
npm run test:unit
npm run test:integration:http

# storefront (a partir de fashion-starter/storefront/)
npm run dev            # -> :8000
npm run build
npm run lint
npm run test-e2e       # playwright
```

## Notas

- O storefront precisa de uma publishable API key (`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`)
  em todos os pedidos `/store`.
- Autenticação de admin: tabelas `user` + `auth_identity` + `provider_identity`
  (provider `emailpass`). A password é `scrypt-kdf` (`logN:15, r:8, p:1`) em base64 —
  não é reproduzível em SQL puro.
