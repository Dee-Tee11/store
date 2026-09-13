import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { button, escape, layout, sendEmail } from "../lib/email"

type AccountCustomer = {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
}

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

/** Aviso interno de conta nova, para a caixa da loja. */
export function newAccountEmail(
  customer: AccountCustomer,
  method: string | null
): { subject: string; html: string } {
  const name = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ")

  const rows = [
    ["Name", name || "—"],
    ["Email", customer.email],
    ...(method ? [["Signed up with", method]] : []),
  ]
    .map(
      ([label, value]) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #e4e0da;color:#6f6a63;width:130px">${escape(label)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e4e0da">${escape(value)}</td>
      </tr>`
    )
    .join("")

  return {
    subject: `New account — ${name ? `${name} (${customer.email})` : customer.email}`,
    html: layout(`
      <h1 style="font-size:20px;margin:0 0 8px">New customer account</h1>
      <p style="margin:0;color:#6f6a63;font-size:14px">Someone just created an account in the store.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;margin:24px 0">
        ${rows}
      </table>
      ${process.env.MEDUSA_BACKEND_URL ? `<p style="font-size:14px"><a href="${process.env.MEDUSA_BACKEND_URL}/app/customers/${customer.id}">Open in Admin</a></p>` : ""}
    `),
  }
}

/**
 * O `customer.created` dispara em qualquer criação de cliente — registo com
 * password, primeiro login com Google, mas também clientes criados no Admin.
 * Só quem tem conta (`has_account`) conta: sai a boas-vindas para o cliente e
 * o aviso para a caixa da loja.
 */
export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const manager =
    process.env.ORDER_NOTIFICATION_EMAIL || process.env.RESEND_FROM_EMAIL

  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "first_name", "last_name", "has_account"],
    filters: { id: data.id },
  })

  const customer = customers?.[0]

  if (!customer?.has_account || !customer.email) {
    return
  }

  const account: AccountCustomer = {
    id: customer.id,
    email: customer.email,
    first_name: customer.first_name,
    last_name: customer.last_name,
  }

  await sendEmail({
    to: account.email,
    // O `from` só envia; uma resposta ("não fui eu") tem de chegar a alguém.
    replyTo: manager,
    ...welcomeEmail(account),
    context: "customer.created",
    logger,
  })

  if (manager) {
    await sendEmail({
      to: manager,
      ...newAccountEmail(account, await signupMethod(container, account.email)),
      context: "customer.created",
      logger,
    })
  }
}

/**
 * O cliente não guarda como se registou; isso está nas identidades do módulo
 * de auth. Os clientes só podem entrar com password ou Google
 * (`authMethodsPerActor`), por isso sem identidade `emailpass` foi o Google.
 * Se a consulta falhar, o aviso sai na mesma, só sem esta linha.
 */
async function signupMethod(
  container: MedusaContainer,
  email: string
): Promise<string | null> {
  try {
    const identities = await container
      .resolve(Modules.AUTH)
      .listProviderIdentities({ provider: "emailpass", entity_id: email })

    return identities.length ? "Email & password" : "Google"
  } catch {
    return null
  }
}

export const config: SubscriberConfig = {
  event: "customer.created",
}
