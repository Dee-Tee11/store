import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { button, escape, layout, sendEmail } from "../lib/email"

/**
 * Constrói o email de boas-vindas. Função pura, como a `orderEmails`, para dar
 * para pré-visualizar (src/scripts/preview-emails.ts).
 */
export function welcomeEmail(customer: {
  email: string
  first_name?: string | null
}): { subject: string; html: string } {
  const store = process.env.STORE_NAME || "South Store"
  const base = process.env.STOREFRONT_URL

  return {
    subject: `Welcome to ${store}`,
    html: layout(`
      <h1 style="font-size:20px;margin:0 0 8px">Your account is ready</h1>
      <p style="margin:0;color:#6f6a63;font-size:14px;line-height:22px">
        ${customer.first_name ? `Hi ${escape(customer.first_name)}, thanks` : "Thanks"} for creating an account at ${escape(store)}.
        You can now follow your orders, save your addresses and check out faster.
      </p>
      ${base ? button("Go to my account", `${base.replace(/\/$/, "")}/account`) : ""}
      <p style="margin:${base ? "0" : "24px 0 0"};color:#6f6a63;font-size:13px;line-height:20px">
        The account was created for ${escape(customer.email)}. If that wasn't you,
        just reply to this email and we'll sort it out.
      </p>
    `),
  }
}

/**
 * O `customer.created` dispara em qualquer criação de cliente — registo com
 * password, primeiro login com Google, mas também clientes criados no Admin.
 * Só quem tem conta (`has_account`) recebe as boas-vindas.
 */
export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "first_name", "has_account"],
    filters: { id: data.id },
  })

  const customer = customers?.[0]

  if (!customer?.has_account || !customer.email) {
    return
  }

  await sendEmail({
    to: customer.email,
    // O `from` só envia; uma resposta ("não fui eu") tem de chegar a alguém.
    replyTo:
      process.env.ORDER_NOTIFICATION_EMAIL || process.env.RESEND_FROM_EMAIL,
    ...welcomeEmail({
      email: customer.email,
      first_name: customer.first_name,
    }),
    context: "customer.created",
    logger,
  })
}

export const config: SubscriberConfig = {
  event: "customer.created",
}
