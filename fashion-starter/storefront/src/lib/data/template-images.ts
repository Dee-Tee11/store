/**
 * Layout images that are managed from the Medusa admin
 * ("Template Images" page). Every key falls back to a static file in
 * /public/images/content until a custom image is uploaded.
 */
export const TEMPLATE_IMAGE_DEFAULTS = {
  // Homepage
  hero_image: "/images/content/living-room-gray-armchair-two-seater-sofa.png",
  about_image: "/images/content/gray-sofa-against-concrete-wall.png",
  // About page
  about_page_hero: "/images/content/living-room-gray-three-seater-sofa.png",
  about_page_image1:
    "/images/content/living-room-black-armchair-dark-gray-sofa.png",
  about_page_image2:
    "/images/content/gray-one-seater-sofa-wooden-coffee-table.png",
  about_page_wide:
    "/images/content/living-room-gray-three-seater-puffy-sofa.png",
  // Brands page
  brands_hero_image: "/images/content/living-room-dark-green-three-seater-sofa.png",
  brands_section1_wide:
    "/images/content/living-room-brown-armchair-gray-corner-sofa.png",
  brands_section2_wide:
    "/images/content/living-room-gray-two-seater-puffy-sofa.png",
  brands_brand1_image: "/images/content/dark-gray-three-seater-sofa.png",
  brands_brand2_image: "/images/content/gray-three-seater-sofa.png",
  brands_brand3_image: "/images/content/gray-arm-chair.png",
  brands_brand4_image: "/images/content/white-two-seater-sofa.png",
  // Shared
  auth_image: "/images/content/gray-backrest-sofa-wooden-coffee-table.png",
  collection_default_image:
    "/images/content/living-room-dark-gray-corner-sofa-coffee-table.png",
} as const

export type TemplateImageKey = keyof typeof TEMPLATE_IMAGE_DEFAULTS

type TemplateImagesResponse = Partial<
  Record<TemplateImageKey, { id: string; url: string } | null>
>

/**
 * Images uploaded through the admin are served from the backend, so they can't
 * go through the Next.js image optimizer without being whitelisted.
 */
export const isExternalImage = (src: string) => !src.startsWith("/")

/**
 * Resolves every managed image to a URL, falling back to the static default
 * when the backend is unreachable or the slot was never customised.
 */
export async function getTemplateImages(): Promise<
  Record<TemplateImageKey, string>
> {
  let data: TemplateImagesResponse = {}

  try {
    const backendUrl =
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""
    const res = await fetch(`${backendUrl}/store/template-images`, {
      headers: { "x-publishable-api-key": publishableKey },
      next: { revalidate: 60 }, // cache for 60s, stays fresh without full rebuild
    })

    if (res.ok) {
      data = await res.json()
    }
  } catch {
    // fall through to the static defaults
  }

  return Object.fromEntries(
    Object.entries(TEMPLATE_IMAGE_DEFAULTS).map(([key, fallback]) => [
      key,
      data[key as TemplateImageKey]?.url ?? fallback,
    ])
  ) as Record<TemplateImageKey, string>
}
