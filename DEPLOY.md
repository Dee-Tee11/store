# Lançamento — South Store

Backend Medusa no **Render**, storefront Next.js na **Cloudflare Workers**,
base de dados no **Supabase**, domínio `southstore.net` gerido na Cloudflare.

---

## A ordem importa

O build do storefront vai buscar dados ao backend durante a compilação (as
páginas de colecções e a "about" fazem `generateStaticParams`). Se o backend não
estiver de pé e acessível, **o build do storefront falha**. Daí esta ordem:

```
1. R2 (imagens)  →  2. Render (backend)  →  3. DNS api.  →  4. Cloudflare (storefront)  →  5. DNS raiz  →  6. Stripe
```

---

## Modo demonstração (sem Stripe)

Para mostrar o site ao dono, sem clientes reais, simplifica-se bastante:

| Passo | Demonstração |
|---|---|
| 1. R2 | Igual — para as imagens novas não se perderem entre deploys |
| 2. Render | Igual, mas sem `STRIPE_*` |
| 3. DNS `api.` | Igual |
| 4. Cloudflare | Igual |
| 5. DNS raiz | Igual |
| 6. Stripe webhook | **Salta** |

Duas ressalvas:

- **O `NEXT_PUBLIC_STRIPE_KEY` não pode ficar vazio.** O `check-env-variables.js`
  aborta o build se faltar. Deixa lá a chave `pk_test_` que já tens.
- **Sem `STRIPE_API_KEY` no backend**, o Medusa usa pagamento manual
  (`pp_system_default`). O checkout chega ao fim, cria a encomenda e dispara os
  emails — bom para demonstrar o fluxo completo — mas não cobra nada.

E antes de abrir a clientes: chaves live do Stripe, webhook, R2, e trocar
`JWT_SECRET`/`COOKIE_SECRET`.

---

## Corrigir os URLs das imagens (obrigatório)

As imagens dos produtos foram carregadas com o backend em `localhost`, e é isso
que está gravado na base de dados:

```
http://localhost:9000/static/1784487589691-....png
```

Fora do teu computador, esses endereços não existem — **a loja apareceria sem
fotografias nenhumas**. Os ficheiros vão no git e o Medusa serve-os em `/static`,
por isso basta corrigir o endereço guardado.

Corre isto no **SQL Editor do Supabase**, depois do backend estar no ar.

Primeiro vê o que vai ser alterado:

```sql
SELECT 'product.thumbnail' AS onde, count(*) FROM product
WHERE thumbnail LIKE 'http://localhost:9000/static/%'
UNION ALL
SELECT 'image.url', count(*) FROM image
WHERE url LIKE 'http://localhost:9000/static/%'
UNION ALL
SELECT 'store.metadata', count(*) FROM store
WHERE metadata::text LIKE '%http://localhost:9000/static/%';
```

Se os números fizerem sentido, aplica:

```sql
UPDATE product
SET thumbnail = replace(thumbnail,
      'http://localhost:9000/static/', 'https://api.southstore.net/static/')
WHERE thumbnail LIKE 'http://localhost:9000/static/%';

UPDATE image
SET url = replace(url,
      'http://localhost:9000/static/', 'https://api.southstore.net/static/')
WHERE url LIKE 'http://localhost:9000/static/%';

-- Imagens do template (hero, about, brands), guardadas no metadata da loja
UPDATE store
SET metadata = replace(metadata::text,
      'http://localhost:9000/static/', 'https://api.southstore.net/static/')::jsonb
WHERE metadata::text LIKE '%http://localhost:9000/static/%';
```

> Isto altera dados a sério, e a base é a mesma que usas em desenvolvimento.
> Depois disto, as imagens deixam de aparecer no teu `localhost` — passam a vir
> de `api.southstore.net`, o que funciona na mesma desde que o backend esteja no ar.

O `medusa-config.ts` já está configurado para que **novos** uploads usem o
`MEDUSA_BACKEND_URL` em vez de `localhost`.

---

## Antes de começar

### Gerar os segredos

As chaves actuais são `supersecret`, o valor público do starter. Enquanto
estiverem assim, qualquer pessoa pode forjar sessões de administrador.

```bash
openssl rand -base64 32   # JWT_SECRET
openssl rand -base64 32   # COOKIE_SECRET
```

No Render estas estão marcadas como `generateValue: true` — ele gera-as sozinho.
Basta não as sobrepores com os valores antigos.

> Ao trocá-las, as sessões abertas caem e tens de entrar de novo no Admin.
> As passwords dos clientes não são afectadas.

### Ter à mão

| O quê | Onde se obtém |
|---|---|
| Chaves **live** do Stripe | Dashboard Stripe > Developers > API keys |
| Domínio verificado no Resend | Resend > Domains > `southstore.net` |
| Publishable key do Medusa | Admin > Settings > Publishable API Keys |
| Connection string do Supabase | Supabase > Project Settings > Database |

> **Supabase:** usa a string do **Session pooler**, não a directa. O Render liga
> por IPv4 e a ligação directa do Supabase só responde em IPv6.

---

## 1. R2 — imagens dos produtos

Sem isto, as imagens ficam no disco do Render e **desaparecem a cada deploy**.

1. Cloudflare > R2 > **Create bucket**, nome `southstore`, com uma pasta `southstore_images`
2. No bucket > Settings > **Custom Domains** > Add > `images.southstore.net`
   (evita o `pub-xxxx.r2.dev`: a Cloudflare limita-lhe o tráfego e diz que não é
   para produção)
3. R2 > **Manage API tokens** > Create token, permissão *Object Read & Write*,
   limitado ao bucket `southstore`
   → guarda o Access Key ID, o Secret e o endpoint `https://<conta>.r2.cloudflarestorage.com`
   (o Secret só é mostrado uma vez)

O bucket e a pasta já estão no `render.yaml`. Os outros quatro preenches tu:

```
R2_BUCKET=southstore
R2_PREFIX=southstore_images
R2_ENDPOINT=https://<id-da-conta>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_PUBLIC_URL=https://images.southstore.net
```

Põe estes valores **também no `.env` local** do backend. Assim os uploads feitos
em desenvolvimento vão para o R2 e o URL gravado na base de dados funciona em
todo o lado — sem commit das imagens nem deploy.

> As imagens que já tens em `backend/apps/backend/static/` **não migram
> sozinhas**. Depois do deploy, ou voltas a carregá-las pelo Admin, ou copias
> a pasta para o bucket com o `rclone`.

---

## 2. Render — backend

O ficheiro [`render.yaml`](render.yaml) na raiz já define o serviço.

1. Render > **New** > **Blueprint** > liga o repositório
2. Ele lê o `render.yaml` e propõe o serviço `southstore-backend`
3. Preenche as variáveis marcadas como *sync: false*:
   `DATABASE_URL`, `RESEND_API_KEY`, `STRIPE_API_KEY`,
   `STRIPE_WEBHOOK_SECRET`, `R2_ACCESS_KEY_ID` e `R2_SECRET_ACCESS_KEY`
   (os mesmos valores do teu `.env` local)
4. Deploy

Notas sobre a configuração:

- **Plano `starter`**, não o grátis. O grátis adormece ao fim de 15 minutos sem
  tráfego e o primeiro cliente do dia esperava quase um minuto pela página.
- **Região `frankfurt`**, a mais perto de PT.
- **Instância única.** Não aumentes o número de instâncias: sem Redis, a fila de
  eventos vive na memória do processo. Com duas instâncias, os emails de
  encomenda sairiam a dobrar ou nenhuma vez.

### Migrações da base de dados

**Não correm automaticamente**, de propósito. A base é partilhada com o
desenvolvimento local e uma migração indevida estraga dados a sério.

A base já tem o esquema actual, por isso **no primeiro deploy não é preciso
fazer nada**. Se um dia acrescentares módulos ou modelos, corre à mão na shell
do Render:

```bash
cd apps/backend/.medusa/server && npx medusa db:migrate
```

> ⚠️ O backend de produção usa **a mesma base de dados** que o teu ambiente
> local. Tudo o que testares aqui mexe em dados reais. Quando houver calma,
> vale a pena criar um projecto Supabase separado para desenvolvimento.

---

## 3. DNS — `api.southstore.net`

No Render, no serviço > Settings > **Custom Domain** > `api.southstore.net`.
Ele dá-te um destino do tipo `southstore-backend.onrender.com`.

Na Cloudflare > DNS:

| Tipo | Nome | Destino | Proxy |
|---|---|---|---|
| CNAME | `api` | `southstore-backend.onrender.com` | **DNS only** (nuvem cinzenta) |

> Desliga o proxy neste registo. Com a nuvem laranja, a Cloudflare mete-se entre
> o Stripe e o teu webhook e pode interferir com a validação da assinatura.

Confirma que responde:

```bash
curl https://api.southstore.net/health
```

O Admin fica em `https://api.southstore.net/app`.

---

## 4. Cloudflare — storefront

O build acontece **na tua máquina** e depois é enviado. Isto é importante por
causa das variáveis.

### As variáveis `NEXT_PUBLIC_*` são fixadas no build

Não basta defini-las no painel da Cloudflare: o Next escreve-as dentro do código
no momento da compilação. Cria `fashion-starter/storefront/.env.production`:

```
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.southstore.net
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_BASE_URL=https://southstore.net
NEXT_PUBLIC_DEFAULT_REGION=pt
NEXT_PUBLIC_STRIPE_KEY=pk_live_...
```

Esse ficheiro **não vai para o git** (já está ignorado).

### Compilar e enviar

```bash
cd fashion-starter/storefront
npx wrangler login        # só da primeira vez
npm run cf:build
npm run cf:preview        # opcional: vê o resultado local antes de publicar
npm run cf:deploy
```

O `cf:build` corre o `next build` primeiro, por isso **o backend do passo 2 tem
de estar já a responder** ou falha a recolher as colecções.

---

## 5. DNS — `southstore.net`

Depois do primeiro `cf:deploy`, na Cloudflare > Workers & Pages >
`southstore-storefront` > Settings > **Domains & Routes** > Add custom domain:

- `southstore.net`
- `www.southstore.net`

A Cloudflare cria os registos DNS sozinha.

---

## 6. Stripe — webhook

Stripe > Developers > Webhooks > **Add endpoint**:

```
https://api.southstore.net/hooks/payment/stripe_stripe
```

Eventos a subscrever:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.amount_capturable_updated`

Copia o *signing secret* (`whsec_...`) para o `STRIPE_WEBHOOK_SECRET` no Render
e reinicia o serviço.

---

## Verificar depois de lançar

- [ ] `curl https://api.southstore.net/health` responde
- [ ] O Admin abre em `https://api.southstore.net/app` e entras
- [ ] `https://southstore.net` abre e mostra produtos **com imagens**
- [ ] Carregar uma imagem nova pelo Admin e confirmar que o URL é do R2
- [ ] Uma compra de teste de ponta a ponta:
  - [ ] o pagamento passa no Stripe
  - [ ] o cliente recebe o email de confirmação
  - [ ] `southstorept1990@gmail.com` recebe o aviso de nova encomenda
  - [ ] a encomenda aparece no Admin
- [ ] "Esqueci-me da password" chega ao email e o link funciona
- [ ] Criar conta nova funciona

---

## Pontos por resolver

**Imagens sem optimização.** O adaptador da Cloudflare serve as imagens no
tamanho original porque não há binding de imagens configurado. Funciona, mas as
páginas ficam mais pesadas do que precisavam. Resolve-se depois, acrescentando o
binding `IMAGES` ao `wrangler.jsonc`.

**Lockfile a mais.** O storefront tem um `yarn.lock` herdado do template que já
não corresponde a nada — o que instala é o npm. Convém apagá-lo para não haver
ambiguidade sobre qual é usado no build.

**Emails em inglês.** Os emails de encomenda e de password acompanham o
storefront, que está em inglês. Mudar é editar as strings em
`src/lib/email.ts` e `src/subscribers/`.
