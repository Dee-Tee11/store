"use client"

import * as React from "react"

import { Icon } from "@/components/Icon"
import { LocalizedLink } from "@/components/LocalizedLink"
import { completeGoogleLogin } from "@lib/data/customer"
import { GOOGLE_LOGIN_RETURN_KEY } from "@modules/auth/components/GoogleLoginButton"

/**
 * A troca do código é feita a partir do browser (server action) e não num
 * route handler: o Google chega aqui por navegação cross-site, e os cookies
 * `SameSite=Strict` — sessão e carrinho — não iam nesse pedido nem no redirect
 * seguinte. Assim o cliente entrava sem carrinho e aparecia como deslogado.
 */
export const GoogleCallback: React.FC<{
  countryCode: string
  code?: string
  state?: string
  error?: string
}> = ({ countryCode, code, state, error: googleError }) => {
  const [error, setError] = React.useState<string | null>(() => {
    if (googleError === "access_denied") {
      return "Google sign-in was cancelled."
    }

    if (googleError || !code || !state) {
      return "We couldn't sign you in with Google. Please try again."
    }

    return null
  })

  // O código só pode ser trocado uma vez e, em desenvolvimento, o StrictMode
  // corre os efeitos duas vezes.
  const started = React.useRef(false)

  React.useEffect(() => {
    if (started.current || error || !code || !state) {
      return
    }

    started.current = true

    completeGoogleLogin({ code, state })
      .then((result) => {
        if (!result.success) {
          setError(result.error)
          return
        }

        // Navegação completa (e `replace`): o header e o carrinho voltam a ler
        // a sessão, e o "voltar" do browser não regressa a um código já gasto.
        window.location.replace(returnUrl(countryCode))
      })
      .catch(() => {
        setError("We couldn't sign you in with Google. Please try again.")
      })
  }, [code, state, error, countryCode])

  if (!error) {
    return (
      <div className="flex items-center gap-3">
        <Icon name="loader" className="animate-spin" />
        <h1 className="text-xl md:text-2xl">Signing you in…</h1>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-xl md:text-2xl mb-6">Sign-in failed</h1>
      <p className="text-grayscale-500 mb-10">{error}</p>
      <LocalizedLink
        href="/auth/login"
        variant="underline"
        className="text-black md:pb-0.5"
      >
        Back to log in
      </LocalizedLink>
    </>
  )
}

function returnUrl(countryCode: string): string {
  const fallback = `/${countryCode}/account`

  try {
    const stored = sessionStorage.getItem(GOOGLE_LOGIN_RETURN_KEY)
    sessionStorage.removeItem(GOOGLE_LOGIN_RETURN_KEY)

    // Só caminhos internos: "//site.com" ou "/\site.com" saíam da loja.
    return stored && /^\/(?![/\\])/.test(stored) ? stored : fallback
  } catch {
    return fallback
  }
}
