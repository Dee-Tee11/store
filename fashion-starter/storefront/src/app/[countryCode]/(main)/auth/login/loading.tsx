import Image from "next/image"

import { TEMPLATE_IMAGE_DEFAULTS } from "@lib/data/template-images"
import { LocalizedLink } from "@/components/LocalizedLink"
import { Button } from "@/components/Button"
import { Input } from "@/components/Forms"
import { GoogleLoginButton } from "@modules/auth/components/GoogleLoginButton"

export default async function LoginLoadingPage() {
  return (
    <div className="flex min-h-screen">
      <Image
        src={TEMPLATE_IMAGE_DEFAULTS.auth_image}
        width={1440}
        height={1632}
        alt="South Store"
        className="max-lg:hidden lg:w-1/2 shrink-0 object-cover"
      />
      <div className="shrink-0 max-w-100 lg:max-w-96 w-full mx-auto pt-30 lg:pt-37 pb-16 max-sm:px-4">
        <h1 className="text-xl md:text-2xl mb-10 md:mb-16">
          Welcome back to South Store!
        </h1>
        <GoogleLoginButton className="mb-6 md:mb-8" isDisabled />
        <form className="flex flex-col gap-6 md:gap-8 mb-8 md:mb-16">
          <Input
            placeholder="Email"
            name="email"
            required
            wrapperClassName="flex-1"
            autoComplete="email"
            disabled
          />
          <Input
            placeholder="Password"
            name="password"
            type="password"
            required
            wrapperClassName="flex-1"
            autoComplete="current-password"
            disabled
          />
          <LocalizedLink
            href="/auth/forgot-password"
            variant="underline"
            className="self-start !pb-0 text-grayscale-500 leading-none"
          >
            Forgot password?
          </LocalizedLink>
          <Button isLoading>Log in</Button>
        </form>
        <p className="text-grayscale-500">
          Don&apos;t have an account yet? You can{" "}
          <LocalizedLink
            href="/auth/register"
            variant="underline"
            className="text-black md:pb-0.5"
          >
            register here
          </LocalizedLink>
          .
        </p>
      </div>
    </div>
  )
}
