import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { escape, layout, money, sendEmail } from "../lib/email"

export type OrderEmail = { subject: string; html: string }

/**
 * Constrói os dois emails de uma encomenda. É uma função pura — não envia nada —
 * para dar para pré-visualizar sem fazer encomendas (src/scripts/preview-emails.ts).
 */
export function orderEmails(order: any): {
  customer: OrderEmail
  manager: OrderEmail
} {
  const currency = order.currency_code
  const number = order.display_id ? `#${order.display_id}` : order.id
  const address = order.shipping_address
  const name = [address?.first_name, address?.last_name].filter(Boolean).join(" ")

  const items = (order.items ?? [])
    .map(
      (item: any) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #e4e0da">
          ${escape(item.product_title || item.title)}
          ${item.variant_title ? `<br><span style="color:#6f6a63;font-size:13px">${escape(item.variant_title)}</span>` : ""}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #e4e0da;text-align:center">${escape(item.quantity)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e4e0da;text-align:right;white-space:nowrap">${money(item.total, currency)}</td>
      </tr>`
    )
    .join("")

  const table = `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;margin:24px 0">
      ${items}
      <tr>
        <td colspan="2" style="padding:12px 0;font-weight:600">Total</td>
        <td style="padding:12px 0;text-align:right;font-weight:600;white-space:nowrap">${money(order.total, currency)}</td>
      </tr>
    </table>`

  const shipping = address
    ? [
        name,
        address.address_1,
        address.address_2,
        [address.postal_code, address.city].filter(Boolean).join(" "),
        address.country_code?.toUpperCase(),
        address.phone,
      ]
        .filter(Boolean)
        .map(escape)
        .join("<br>")
    : ""

  return {
    // 1. Confirmação para o cliente
    customer: {
      subject: `Order ${number} confirmed`,
      html: layout(`
        <h1 style="font-size:20px;margin:0 0 8px">Thank you for your order</h1>
        <p style="margin:0;color:#6f6a63;font-size:14px">
          ${name ? `Hi ${escape(name)}, we` : "We"}'ve received your order ${escape(number)} and we'll email you again as soon as it ships.
        </p>
        ${table}
        ${shipping ? `<p style="font-size:14px;line-height:22px"><strong>Shipping to</strong><br>${shipping}</p>` : ""}
      `),
    },

    // 2. Aviso ao gestor para preparar o envio
    manager: {
      subject: `New order ${number} — ${money(order.total, currency)} — to ship`,
      html: layout(`
        <h1 style="font-size:20px;margin:0 0 8px">New order ${escape(number)}</h1>
        <p style="margin:0;color:#6f6a63;font-size:14px">
          ${escape(order.email ?? "")}${order.shipping_methods?.[0]?.name ? ` · ${escape(order.shipping_methods[0].name)}` : ""}
        </p>
        ${table}
        ${shipping ? `<p style="font-size:14px;line-height:22px"><strong>Ship to</strong><br>${shipping}</p>` : ""}
        ${process.env.MEDUSA_BACKEND_URL ? `<p style="font-size:14px"><a href="${process.env.MEDUSA_BACKEND_URL}/app/orders/${order.id}">Open in Admin</a></p>` : ""}
      `),
    },
  }
}

/**
 * Quando uma encomenda é concluída saem dois emails: a confirmação para o
 * cliente e o aviso de envio para o gestor.
 */
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const manager =
    process.env.ORDER_NOTIFICATION_EMAIL || process.env.RESEND_FROM_EMAIL

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "currency_code",
      "total",
      "items.title",
      "items.product_title",
      "items.variant_title",
      "items.quantity",
      "items.total",
      "shipping_address.*",
      "shipping_methods.name",
    ],
    filters: { id: data.id },
  })

  const order = orders?.[0]

  if (!order) {
    logger.warn(`order.placed: encomenda ${data.id} não encontrada.`)
    return
  }

  const emails = orderEmails(order)

  if (order.email) {
    // Se o cliente responder à confirmação, a resposta vai para a caixa da
    // loja — o `from` é um endereço que só envia.
    await sendEmail({
      to: order.email,
      replyTo: manager,
      ...emails.customer,
      context: "order.placed",
      logger,
    })
  }

  if (manager) {
    await sendEmail({
      to: manager,
      ...emails.manager,
      context: "order.placed",
      logger,
    })
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
