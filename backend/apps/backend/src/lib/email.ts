import { Resend } from "resend"

type Logger = {
  info: (m: string) => void
  warn: (m: string) => void
  error: (m: string) => void
}

/**
 * Envia e regista o erro em vez de o propagar — um email falhado nunca pode
 * rebentar a encomenda ou o pedido que o originou.
 */
export async function sendEmail({
  logger,
  context,
  ...email
}: {
  to: string
  subject: string
  html: string
  replyTo?: string
  context: string
  logger: Logger
}) {
  const from = process.env.RESEND_FROM_EMAIL

  if (!process.env.RESEND_API_KEY || !from) {
    logger.warn(
      `${context}: RESEND_API_KEY/RESEND_FROM_EMAIL em falta, email não enviado.`
    )
    return
  }

  const { data, error } = await new Resend(
    process.env.RESEND_API_KEY
  ).emails.send({ from, ...email })

  if (error) {
    logger.error(`${context}: falhou o email para ${email.to} — ${error.message}`)
    return
  }

  logger.info(`${context}: email enviado para ${email.to} (${data?.id})`)
}

export function escape(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

/** Os totais vêm como BigNumber: chega aqui como número, string ou { numeric }. */
export function money(value: unknown, currency: string): string {
  const amount =
    typeof value === "object" && value !== null && "numeric" in value
      ? Number((value as { numeric: unknown }).numeric)
      : Number(value)

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(Number.isFinite(amount) ? amount : 0)
}

export function button(label: string, url: string): string {
  return `<p style="margin:24px 0">
    <a href="${escape(url)}" style="display:inline-block;background:#17161a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:4px;font-size:14px">${escape(label)}</a>
  </p>`
}

/** Envelope comum: tabela e estilos inline, que é o que o Gmail e o Outlook aceitam. */
export function layout(content: string): string {
  return `<div style="background:#f5f3f0;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#17161a">
    <div style="max-width:560px;margin:0 auto">
      <p style="text-align:center;letter-spacing:.14em;text-transform:uppercase;font-size:16px;margin:0 0 24px">${escape(process.env.STORE_NAME || "South Store")}</p>
      <div style="background:#fff;border:1px solid #e4e0da;border-radius:8px;padding:28px">${content}</div>
    </div>
  </div>`
}
