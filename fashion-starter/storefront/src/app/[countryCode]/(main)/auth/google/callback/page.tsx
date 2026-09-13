import { Metadata } from "next"

import { GoogleCallback } from "@modules/auth/components/GoogleCallback"

export const metadata: Metadata = {
  title: "Signing in",
  robots: { index: false },
}

/**
 * Para onde o Google devolve o cliente. O URL registado no Google não tem
 * código de país (`/auth/google/callback`); o middleware acrescenta-o e mantém
 * a query string com o `code` e o `state`.
 */
export default async function GoogleCallbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { countryCode } = await params
  const { code, state, error } = await searchParams

  return (
    <div className="max-w-100 lg:max-w-96 w-full mx-auto min-h-screen pt-30 lg:pt-37 pb-16 max-sm:px-4">
      <GoogleCallback
        countryCode={countryCode}
        code={typeof code === "string" ? code : undefined}
        state={typeof state === "string" ? state : undefined}
        error={typeof error === "string" ? error : undefined}
      />
    </div>
  )
}
