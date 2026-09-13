import "server-only"
import { cookies } from "next/headers"

export const getAuthHeaders = async (): Promise<
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  { authorization: string } | {}
> => {
  const token = (await cookies()).get("_medusa_jwt")?.value

  if (token) {
    return { authorization: `Bearer ${token}` }
  }

  return {}
}

export const setAuthToken = async (token: string) => {
  return (await cookies()).set("_medusa_jwt", token, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeAuthToken = async () => {
  return (await cookies()).set("_medusa_jwt", "", {
    maxAge: -1,
  })
}

// O Medusa só confirma que o `state` do OAuth existe, não que foi este browser
// a pedi-lo. Sem guardar aqui o nosso, um link de callback gerado por outra
// pessoa iniciava sessão na conta dela (login CSRF).
export const setOAuthState = async (state: string) => {
  return (await cookies()).set("_medusa_oauth_state", state, {
    maxAge: 60 * 20,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const getOAuthState = async () => {
  return (await cookies()).get("_medusa_oauth_state")?.value
}

export const removeOAuthState = async () => {
  return (await cookies()).set("_medusa_oauth_state", "", { maxAge: -1 })
}

export const getCartId = async () => {
  return (await cookies()).get("_medusa_cart_id")?.value
}

export const setCartId = async (cartId: string) => {
  return (await cookies()).set("_medusa_cart_id", cartId, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeCartId = async () => {
  return (await cookies()).set("_medusa_cart_id", "", { maxAge: -1 })
}
