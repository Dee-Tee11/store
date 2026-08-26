"use client"

import { useElements, useStripe } from "@stripe/react-stripe-js"
import * as React from "react"
import { HttpTypes } from "@medusajs/types"

import { isStripe } from "@lib/constants"
import { Button } from "@/components/Button"
import { usePathname, useRouter } from "next/navigation"
import { useInitiatePaymentSession } from "hooks/cart"
import { withReactQueryProvider } from "@lib/util/react-query"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  isLoading: boolean
  setIsLoading: (value: boolean) => void
  paymentComplete?: boolean
  createQueryString: (name: string, value: string) => string
  selectedPaymentMethod: string
  setError: (value: string | null) => void
}

const PaymentCardButton: React.FC<PaymentButtonProps> = ({
  cart,
  isLoading,
  setIsLoading,
  paymentComplete,
  createQueryString,
  selectedPaymentMethod,
  setError,
}) => {
  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  // Só quando a sessão activa já é do Stripe é que o PaymentElement está montado
  // e há alguma coisa para validar. Caso contrário há primeiro que criar a sessão.
  if (isStripe(session?.provider_id) && isStripe(selectedPaymentMethod)) {
    return (
      <StripeCardPaymentButton
        setError={setError}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        paymentComplete={paymentComplete}
        createQueryString={createQueryString}
      />
    )
  }

  return (
    <PaymentMethodButton
      setError={setError}
      isLoading={isLoading}
      setIsLoading={setIsLoading}
      createQueryString={createQueryString}
      selectedPaymentMethod={selectedPaymentMethod}
    />
  )
}

const StripeCardPaymentButton = ({
  isLoading,
  setIsLoading,
  paymentComplete,
  createQueryString,
  setError,
}: {
  isLoading: boolean
  setIsLoading: (value: boolean) => void
  paymentComplete?: boolean
  createQueryString: (name: string, value: string) => string
  setError: (value: string | null) => void
}) => {
  const stripe = useStripe()
  const elements = useElements()

  const router = useRouter()
  const pathname = usePathname()

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (!stripe || !elements) {
        setError("Payment form is still loading. Please try again.")
        return
      }

      // Valida o PaymentElement e mostra os erros inline antes de avançar.
      // O pagamento em si só é confirmado no passo de review.
      const { error: submitError } = await elements.submit()

      if (submitError) {
        setError(submitError.message ?? "Please check your payment details.")
        return
      }

      router.push(pathname + "?" + createQueryString("step", "review"), {
        scroll: false,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : `${err}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      className="mt-6"
      onPress={handleSubmit}
      isLoading={isLoading}
      isDisabled={!paymentComplete}
      data-testid="submit-payment-button"
    >
      Continue to review
    </Button>
  )
}

const PaymentMethodButton = ({
  isLoading,
  setIsLoading,
  createQueryString,
  selectedPaymentMethod,
  setError,
}: {
  isLoading: boolean
  setIsLoading: (value: boolean) => void
  createQueryString: (name: string, value: string) => string
  selectedPaymentMethod: string
  setError: (value: string | null) => void
}) => {
  const router = useRouter()
  const pathname = usePathname()

  const initiatePaymentSession = useInitiatePaymentSession()

  const handleSubmit = () => {
    setIsLoading(true)
    setError(null)
    initiatePaymentSession.mutate(
      {
        providerId: selectedPaymentMethod,
      },
      {
        onSuccess: () => {
          // Com o Stripe ficamos no mesmo passo: a sessão acabou de nascer e é
          // ela que traz o client_secret com que o PaymentElement é montado.
          if (!isStripe(selectedPaymentMethod)) {
            return router.push(
              pathname + "?" + createQueryString("step", "review"),
              {
                scroll: false,
              }
            )
          }
          setIsLoading(false)
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : `${err}`)
          setIsLoading(false)
        },
      }
    )
  }

  return (
    <Button
      className="mt-6"
      onPress={handleSubmit}
      isLoading={isLoading}
      data-testid="submit-payment-button"
      isDisabled={!selectedPaymentMethod}
    >
      {isStripe(selectedPaymentMethod)
        ? "Enter card details"
        : "Continue to review"}
    </Button>
  )
}

export default withReactQueryProvider(PaymentCardButton)
