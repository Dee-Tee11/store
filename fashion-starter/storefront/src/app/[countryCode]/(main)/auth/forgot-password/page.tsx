import { Metadata } from "next"
import Image from "next/image"
import {
  getTemplateImages,
  isExternalImage,
} from "@lib/data/template-images"
import { ForgotPasswordForm } from "@modules/auth/components/ForgotPasswordForm"

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your password",
}

export default async function ForgotPasswordPage() {
  const { auth_image: authImage } = await getTemplateImages()

  return (
    <div className="flex min-h-screen">
      <Image
        src={authImage}
        width={1440}
        height={1632}
        alt="South Store"
        className="max-lg:hidden lg:w-1/2 shrink-0 object-cover"
        unoptimized={isExternalImage(authImage)}
      />
      <div className="shrink-0 max-w-100 lg:max-w-96 w-full mx-auto pt-30 lg:pt-37 pb-16 max-sm:px-4">
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
