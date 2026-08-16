/**
 * Storefront layout images that can be replaced from the admin
 * ("Template Images" page). Each key falls back to a static file shipped with
 * the storefront (/public/images/content) until a custom image is uploaded.
 *
 * Keep these keys in sync with the storefront's
 * `src/lib/data/template-images.ts`.
 */
export const TEMPLATE_IMAGE_DEFAULT_FILES = {
  // Homepage
  hero_image: '/images/content/living-room-gray-armchair-two-seater-sofa.png',
  about_image: '/images/content/gray-sofa-against-concrete-wall.png',
  // About page
  about_page_hero: '/images/content/living-room-gray-three-seater-sofa.png',
  about_page_image1: '/images/content/living-room-black-armchair-dark-gray-sofa.png',
  about_page_image2: '/images/content/gray-one-seater-sofa-wooden-coffee-table.png',
  about_page_wide: '/images/content/living-room-gray-three-seater-puffy-sofa.png',
  // Brands page
  brands_hero_image: '/images/content/living-room-dark-green-three-seater-sofa.png',
  brands_brand1_image: '/images/content/dark-gray-three-seater-sofa.png',
  brands_brand2_image: '/images/content/gray-three-seater-sofa.png',
  brands_brand3_image: '/images/content/gray-arm-chair.png',
  brands_brand4_image: '/images/content/white-two-seater-sofa.png',
  // Shared
  auth_image: '/images/content/gray-backrest-sofa-wooden-coffee-table.png',
  collection_default_image: '/images/content/living-room-dark-gray-corner-sofa-coffee-table.png',
} as const;

export type TemplateImageKey = keyof typeof TEMPLATE_IMAGE_DEFAULT_FILES;

export const TEMPLATE_IMAGE_KEYS = Object.keys(
  TEMPLATE_IMAGE_DEFAULT_FILES,
) as TemplateImageKey[];

export const DEFAULT_IMAGE_ID = '__default__';

/**
 * @param baseUrl prefix for the static files — empty for the storefront (which
 * serves them itself), the storefront origin for the admin preview.
 */
export function buildDefaults(baseUrl = ''): Record<string, { id: string; url: string }> {
  return Object.fromEntries(
    TEMPLATE_IMAGE_KEYS.map((key) => [
      key,
      { id: DEFAULT_IMAGE_ID, url: `${baseUrl}${TEMPLATE_IMAGE_DEFAULT_FILES[key]}` },
    ]),
  );
}
