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
  ]
})
