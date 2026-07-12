import { Modules } from '@medusajs/framework/utils';
import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { z } from 'zod';

const imageSchema = z
  .object({ id: z.string(), url: z.string().url() })
  .nullable()
  .optional();

const templateImagesMetadataSchema = z.object({
  // Homepage
  hero_image: imageSchema,
  about_image: imageSchema,
  // Inspiration page
  inspiration_hero_image: imageSchema,
  inspiration_section1_wide: imageSchema,
  inspiration_section2_wide: imageSchema,
  inspiration_astrid_curve: imageSchema,
  inspiration_nordic_haven: imageSchema,
  inspiration_nordic_breeze: imageSchema,
  inspiration_oslo_drift: imageSchema,
});

export type TemplateImagesMetadata = z.infer<typeof templateImagesMetadataSchema>;

const METADATA_KEY = 'template_images';

const STOREFRONT = 'http://localhost:8000';

export const DEFAULTS: Record<string, { id: string; url: string }> = {
  hero_image: { id: '__default__', url: `${STOREFRONT}/images/content/living-room-gray-armchair-two-seater-sofa.png` },
  about_image: { id: '__default__', url: `${STOREFRONT}/images/content/gray-sofa-against-concrete-wall.png` },
  inspiration_hero_image: { id: '__default__', url: `${STOREFRONT}/images/content/living-room-dark-green-three-seater-sofa.png` },
  inspiration_section1_wide: { id: '__default__', url: `${STOREFRONT}/images/content/living-room-brown-armchair-gray-corner-sofa.png` },
  inspiration_section2_wide: { id: '__default__', url: `${STOREFRONT}/images/content/living-room-gray-two-seater-puffy-sofa.png` },
  inspiration_astrid_curve: { id: '__default__', url: `${STOREFRONT}/images/content/dark-gray-three-seater-sofa.png` },
  inspiration_nordic_haven: { id: '__default__', url: `${STOREFRONT}/images/content/gray-three-seater-sofa.png` },
  inspiration_nordic_breeze: { id: '__default__', url: `${STOREFRONT}/images/content/gray-arm-chair.png` },
  inspiration_oslo_drift: { id: '__default__', url: `${STOREFRONT}/images/content/white-two-seater-sofa.png` },
};

function resolveImage(
  parsed: z.SafeParseReturnType<typeof templateImagesMetadataSchema._type, typeof templateImagesMetadataSchema._type>,
  key: keyof TemplateImagesMetadata,
) {
  return parsed.success && parsed.data[key] ? parsed.data[key] : DEFAULTS[key];
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const storeModule = req.scope.resolve(Modules.STORE);
  const [store] = await storeModule.listStores();
  const raw = (store.metadata as Record<string, unknown>)?.[METADATA_KEY];
  const parsed = templateImagesMetadataSchema.safeParse(raw ?? {});

  res.json({
    hero_image: resolveImage(parsed, 'hero_image'),
    about_image: resolveImage(parsed, 'about_image'),
    inspiration_hero_image: resolveImage(parsed, 'inspiration_hero_image'),
    inspiration_section1_wide: resolveImage(parsed, 'inspiration_section1_wide'),
    inspiration_section2_wide: resolveImage(parsed, 'inspiration_section2_wide'),
    inspiration_astrid_curve: resolveImage(parsed, 'inspiration_astrid_curve'),
    inspiration_nordic_haven: resolveImage(parsed, 'inspiration_nordic_haven'),
    inspiration_nordic_breeze: resolveImage(parsed, 'inspiration_nordic_breeze'),
    inspiration_oslo_drift: resolveImage(parsed, 'inspiration_oslo_drift'),
    defaults: DEFAULTS,
  });
}

export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const customFields = templateImagesMetadataSchema.parse(body);

  const storeModule = req.scope.resolve(Modules.STORE);
  const [store] = await storeModule.listStores();

  const existingMeta = (store.metadata as Record<string, unknown>) ?? {};
  const existingImages = (existingMeta[METADATA_KEY] as Record<string, unknown>) ?? {};

  const updated = await storeModule.updateStores(store.id, {
    metadata: {
      ...existingMeta,
      [METADATA_KEY]: { ...existingImages, ...customFields },
    },
  });

  res.json(updated);
}
