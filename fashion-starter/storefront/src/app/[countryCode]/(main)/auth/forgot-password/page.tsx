import { Metadata } from "next"
import Image from "next/image"
import {
  getTemplateImages,
  isExternalImage,
} from "@lib/data/template-images"
import { ForgotPasswordForm } from "@modules/auth/components/ForgotPasswordForm"
import { Reveal } from "@/components/Reveal"

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your password",
}

export default async function ForgotPasswordPage() {
  const { auth_image: authImage } = await getTemplateImages()

  return (
    <div className="flex min-h-screen overflow-x-clip">
      <Reveal
        direction="left"
        immediate
        className="max-lg:hidden lg:w-1/2 shrink-0"
      >
        <Image
          src={authImage}
          width={1440}
          height={1632}
          alt="South Store"
          className="w-full h-full object-cover"
          unoptimized={isExternalImage(authImage)}
        />
      </Reveal>
      <Reveal
        direction="right"
        immediate
        delay={150}
        className="shrink-0 max-w-100 lg:max-w-96 w-full mx-auto pt-30 lg:pt-37 pb-16 max-sm:px-4"
      >
        <ForgotPasswordForm />
      </Reveal>
    </div>
  )
}
