import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', __dirname)

// O SDK do Stripe rebenta no arranque se receber uma chave vazia, por isso o
// provider só é registado quando STRIPE_API_KEY existe. Sem ele, o módulo de
// pagamentos continua a arrancar com o `pp_system_default` (pagamento manual).
const stripeApiKey = process.env.STRIPE_API_KEY

const paymentProviders = stripeApiKey
  ? [
      {
        id: 'stripe',
        resolve: '@medusajs/medusa/payment-stripe',
        options: {
          apiKey: stripeApiKey,
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
          // Cobra no momento da encomenda. Com `false` fica só autorizado
          // e tem de ser capturado à mão no Admin (a autorização expira em 7 dias).
          capture: true,
          // Os métodos activos passam a ser controlados no dashboard Stripe,
          // por isso acrescentar MB WAY/Multibanco não exige mexer no código.
          automaticPaymentMethods: true,
        },
      },
    ]
  : []

// As imagens dos produtos vão para o Cloudflare R2 (compatível com S3). Sem
// estas variáveis o Medusa cai no provider `local`, que grava em disco — bom
// em desenvolvimento, mas em produção os ficheiros desaparecem a cada deploy.
const r2Bucket = process.env.R2_BUCKET

// Pasta dentro do bucket. O provider concatena o prefixo directamente ao nome
// do ficheiro, por isso a barra final é obrigatória — sem ela os ficheiros
// iam para a raiz com nomes tipo "southstore_imagesfoto.png".
const r2Prefix = process.env.R2_PREFIX
  ? process.env.R2_PREFIX.replace(/^\/+|\/+$/g, '') + '/'
  : ''

const fileModule = r2Bucket
  ? [
      {
        resolve: '@medusajs/medusa/file',
        options: {
          providers: [
            {
              id: 's3',
              resolve: '@medusajs/medusa/file-s3',
              options: {
                bucket: r2Bucket,
                prefix: r2Prefix,
                endpoint: process.env.R2_ENDPOINT,
                // O provider junta `${file_url}/${chave}`; uma barra final dava "//".
                file_url: process.env.R2_PUBLIC_URL?.replace(/\/+$/, ''),
                access_key_id: process.env.R2_ACCESS_KEY_ID,
                secret_access_key: process.env.R2_SECRET_ACCESS_KEY,
                // O R2 não tem ACLs por objecto como a AWS; o acesso público
                // é definido no bucket. Enviar o cabeçalho faria falhar o upload.
                acl: false,
                region: 'auto',
              },
            },
          ],
        },
      },
    ]
  : // Sem R2: fica o provider local, mas com o endereço certo. O valor por
    // omissão é `http://localhost:9000/static`, que ficaria gravado na base de
    // dados a cada upload e daria imagens partidas fora deste computador.
    // Atenção: em hosts containerizados o disco é efémero — ficheiros carregados
    // depois do deploy desaparecem no deploy seguinte. Serve para demonstrações,
    // não para uma loja a sério.
    process.env.MEDUSA_BACKEND_URL
    ? [
        {
          resolve: '@medusajs/medusa/file',
          options: {
            providers: [
              {
                id: 'local',
                resolve: '@medusajs/medusa/file-local',
                options: {
                  backend_url: `${process.env.MEDUSA_BACKEND_URL.replace(/\/$/, '')}/static`,
                },
              },
            ],
          },
        },
      ]
    : []

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  modules: [
    {
      resolve: '@medusajs/medusa/payment',
      options: {
        providers: paymentProviders,
      },
    },
    ...fileModule,
  ]
})
