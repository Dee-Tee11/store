import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { button, escape, layout, sendEmail } from "../lib/email"

type PasswordResetEvent = {
  entity_id: string
  actor_type: string
  token: string
}

/**
 * Sem isto, o pedido de "esqueci-me da password" é aceite e o cliente nunca
 * recebe nada — que era exactamente o que acontecia antes.
 */
export default async function passwordResetHandler({
  event: { data },
  container,
}: SubscriberArgs<PasswordResetEvent>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const { entity_id: email, actor_type: actor, token } = data

  const url = resetUrl(actor, email, token)

  if (!url) {
    logger.warn(
      `auth.password_reset: sem URL base para "${actor}", email não enviado.`
    )
    return
  }

  await sendEmail({
    to: email,
    subject: "Reset your password",
    html: layout(`
      <h1 style="font-size:20px;margin:0 0 8px">Reset your password</h1>
      <p style="margin:0;color:#6f6a63;font-size:14px;line-height:22px">
        We received a request to reset the password for ${escape(email)}.
        Click the button below to choose a new one.
      </p>
      ${button("Choose a new password", url)}
      <p style="margin:0;color:#6f6a63;font-size:13px;line-height:20px">
        If you didn't ask for this, you can ignore this email — your password stays as it is.
      </p>
    `),
    context: "auth.password_reset",
    logger,
  })
}

/**
 * O cliente repõe a password no storefront; o administrador no Admin, que é
 * servido pelo próprio backend.
 */
function resetUrl(
  actor: string,
  email: string,
  token: string
): string | null {
  const query = `email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`

  if (actor === "customer") {
    const base = process.env.STOREFRONT_URL

    // Sem código de país no caminho — o middleware do storefront acrescenta-o
    // e preserva a query string.
    return base
      ? `${base.replace(/\/$/, "")}/auth/forgot-password/reset?${query}`
      : null
  }

  const base = process.env.MEDUSA_BACKEND_URL

  return base ? `${base.replace(/\/$/, "")}/app/reset-password?${query}` : null
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
