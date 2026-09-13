"use client"

import * as React from "react"
import { twMerge } from "tailwind-merge"

import { Button } from "@/components/Button"
import { startGoogleLogin } from "@lib/data/customer"

/**
 * O Google só aceita um redirect URI fixo, sem código de país, por isso o
 * destino depois do login fica guardado na sessão do separador até voltarmos.
 */
export const GOOGLE_LOGIN_RETURN_KEY = "google_login_return"

export const isGoogleLoginEnabled =
  process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === "true"

export const GoogleLoginButton: React.FC<{
  redirectUrl?: string
  isDisabled?: boolean
  className?: string
}> = ({ redirectUrl, isDisabled, className }) => {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Quem volta do Google com o "retroceder" pode receber a página tal como a
  // deixou (bfcache), com o spinner ligado e o botão bloqueado.
  React.useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setIsLoading(false)
      }
    }

    window.addEventListener("pageshow", onPageShow)
    return () => window.removeEventListener("pageshow", onPageShow)
  }, [])

  if (!isGoogleLoginEnabled) {
    return null
  }

  const onPress = async () => {
    setIsLoading(true)
    setError(null)

    const result = await startGoogleLogin()

    if (!result.success) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    try {
      if (redirectUrl) {
        sessionStorage.setItem(GOOGLE_LOGIN_RETURN_KEY, redirectUrl)
      }
    } catch {
      // Sem sessionStorage (modo privado em alguns browsers) volta à conta.
    }

    // Fica em loading até o browser sair da página.
    window.location.assign(result.location)
  }

  return (
    <div className={twMerge("flex flex-col gap-6 md:gap-8", className)}>
      <Button
        variant="outline"
        isFullWidth
        isLoading={isLoading}
        isDisabled={isDisabled}
        onPress={onPress}
        className="gap-3"
      >
        <GoogleLogo />
        Continue with Google
      </Button>
      {error && <p className="text-red-primary text-sm">{error}</p>}
      <div className="flex items-center gap-4 text-grayscale-500 text-xs">
        <span className="h-px flex-1 bg-grayscale-200" />
        or
        <span className="h-px flex-1 bg-grayscale-200" />
      </div>
    </div>
  )
}

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#FFC107"
      d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"
    />
    <path
      fill="#FF3D00"
      d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"
    />
  </svg>
)
