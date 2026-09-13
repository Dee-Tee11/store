import fs from "fs"
import path from "path"

import { loadEnv } from "@medusajs/framework/utils"
import { Resend } from "resend"

import { newAccountEmail, welcomeEmail } from "../subscribers/customer-created"
import { orderEmails } from "../subscribers/order-placed"

/**
 * Escreve os emails da encomenda e o de boas-vindas em HTML com dados de exemplo, para os abrires
 * no browser e afinares o visual sem teres de fazer uma encomenda a sério.
 *
 *   npx ts-node --swc src/scripts/preview-emails.ts
 *
 * Com um email à frente, envia-os mesmo pelo Resend — serve para confirmar que
 * a chave e o domínio estão bons antes de haver encomendas:
 *
 *   npx ts-node --swc src/scripts/preview-emails.ts teu@email.pt
 */

loadEnv(process.env.NODE_ENV || "development", path.join(__dirname, "../.."))

const sampleOrder = {
  id: "order_01JEXAMPLE",
  display_id: 1042,
  email: "cliente@exemplo.pt",
  currency_code: "eur",
  total: 154.9,
  items: [
    {
      product_title: "Linen Shirt",
      variant_title: "M / Ecru",
      quantity: 1,
      total: 89.9,
    },
    {
      product_title: "Wide Leg Trousers",
      variant_title: "38 / Black",
      quantity: 2,
      total: 60,
    },
  ],
  shipping_address: {
    first_name: "Maria",
    last_name: "Silva",
    address_1: "Rua das Flores 12, 3.º Esq.",
    address_2: null,
    postal_code: "1200-192",
    city: "Lisboa",
    country_code: "pt",
    phone: "+351 912 345 678",
  },
  shipping_methods: [{ name: "CTT Expresso" }],
}

const emails = {
  ...orderEmails(sampleOrder),
  welcome: welcomeEmail({ email: sampleOrder.email, first_name: "Maria" }),
  "new-account": newAccountEmail(
    {
      id: "cus_01JEXAMPLE",
      email: sampleOrder.email,
      first_name: "Maria",
      last_name: "Silva",
    },
    "Google"
  ),
}
const recipient = process.argv[2]

async function main() {
  if (!recipient) {
    const outDir = path.join(__dirname, "../../.medusa/email-preview")
    fs.mkdirSync(outDir, { recursive: true })

    for (const [audience, email] of Object.entries(emails)) {
      const file = path.join(outDir, `${audience}.html`)

      fs.writeFileSync(
        file,
        `<!doctype html><meta charset="utf-8"><title>${email.subject}</title>
         <div style="padding:12px 16px;background:#17161a;color:#fff;font:13px/1.5 monospace">
           Assunto: ${email.subject}
         </div>
         ${email.html}`
      )

      console.log(`${audience.padEnd(8)} → ${file}`)
    }

    return
  }

  const from = process.env.RESEND_FROM_EMAIL

  if (!process.env.RESEND_API_KEY || !from) {
    throw new Error("Falta RESEND_API_KEY ou RESEND_FROM_EMAIL no .env")
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  for (const [audience, email] of Object.entries(emails)) {
    const { data, error } = await resend.emails.send({
      from,
      to: recipient,
      subject: `[${audience}] ${email.subject}`,
      html: email.html,
    })

    console.log(
      error
        ? `${audience.padEnd(8)} ✗ ${error.message}`
        : `${audience.padEnd(8)} ✓ enviado para ${recipient} (${data?.id})`
    )
  }
}

main()
