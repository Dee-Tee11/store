"use client"

import { Stripe, StripeElementsOptions } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { HttpTypes } from "@medusajs/types"

type StripeWrapperProps = {
  paymentSession: HttpTypes.StorePaymentSession
  stripeKey?: string
  stripePromise: Promise<Stripe | null> | null
  children: React.ReactNode
}

const StripeWrapper: React.FC<StripeWrapperProps> = ({
  paymentSession,
  stripeKey,
  stripePromise,
  children,
}) => {
  const clientSecret = paymentSession?.data?.client_secret as string | undefined

  // Sem chave ou sem client secret não há Elements para montar. Antes isto fazia
  // `throw` e rebentava a página inteira de checkout; agora o resto dos passos
  // continua a funcionar e o passo de pagamento é que fica sem o formulário.
  if (!stripeKey || !stripePromise || !clientSecret) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[stripe] Elements não montado.",
        !stripeKey
          ? "Falta NEXT_PUBLIC_STRIPE_KEY."
          : !clientSecret
            ? "A payment session não trouxe client_secret — confirma STRIPE_API_KEY no backend."
            : ""
      )
    }
    return <>{children}</>
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      variables: {
        fontFamily: "Inter, sans-serif",
        fontSizeBase: "16px",
        colorPrimary: "#050505",
        colorText: "#050505",
        colorTextPlaceholder: "#808080",
        colorDanger: "#DF4718",
        borderRadius: "4px",
      },
      rules: {
        ".Input": {
          border: "1px solid #D1D1D1",
          boxShadow: "none",
          padding: "16px",
        },
        ".Input:hover": {
          border: "1px solid #808080",
        },
        ".Input:focus": {
          border: "1px solid #808080",
          boxShadow: "none",
          outline: "none",
        },
        ".Label": {
          color: "#545457",
        },
      },
    },
  }

  return (
    <Elements options={options} stripe={stripePromise}>
      {children}
    </Elements>
  )
}

export default StripeWrapper
