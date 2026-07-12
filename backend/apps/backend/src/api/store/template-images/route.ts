import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { Modules } from '@medusajs/framework/utils';
import { z } from 'zod';

const imageSchema = z
  .object({ id: z.string(), url: z.string().url() })
  .nullable()
  .optional();

const templateImagesMetadataSchema = z.object({
  hero_image: imageSchema,
  about_image: imageSchema,
  inspiration_hero_image: imageSchema,
  inspiration_section1_wide: imageSchema,
  inspiration_section2_wide: imageSchema,
  inspiration_astrid_curve: imageSchema,
  inspiration_nordic_haven: imageSchema,
  inspiration_nordic_breeze: imageSchema,
  inspiration_oslo_drift: imageSchema,
});

const METADATA_KEY = 'template_images';

const DEFAULTS: Record<string, { id: string; url: string }> = {
  hero_image: { id: '__default__', url: '/images/content/living-room-gray-armchair-two-seater-sofa.png' },
  about_image: { id: '__default__', url: '/images/content/gray-sofa-against-concrete-wall.png' },
  inspiration_hero_image: { id: '__default__', url: '/images/content/living-room-dark-green-three-seater-sofa.png' },
  inspiration_section1_wide: { id: '__default__', url: '/images/content/living-room-brown-armchair-gray-corner-sofa.png' },
  inspiration_section2_wide: { id: '__default__', url: '/images/content/living-room-gray-two-seater-puffy-sofa.png' },
  inspiration_astrid_curve: { id: '__default__', url: '/images/content/dark-gray-three-seater-sofa.png' },
  inspiration_nordic_haven: { id: '__default__', url: '/images/content/gray-three-seater-sofa.png' },
  inspiration_nordic_breeze: { id: '__default__', url: '/images/content/gray-arm-chair.png' },
  inspiration_oslo_drift: { id: '__default__', url: '/images/content/white-two-seater-sofa.png' },
};

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const storeModule = req.scope.resolve(Modules.STORE);
  const [store] = await storeModule.listStores();
  const raw = (store.metadata as Record<string, unknown>)?.[METADATA_KEY];
  const parsed = templateImagesMetadataSchema.safeParse(raw ?? {});

  const resolve = (key: string) =>
    parsed.success && (parsed.data as Record<string, unknown>)[key]
      ? (parsed.data as Record<string, unknown>)[key]
      : DEFAULTS[key];

  res.json({
    hero_image: resolve('hero_image'),
    about_image: resolve('about_image'),
    inspiration_hero_image: resolve('inspiration_hero_image'),
    inspiration_section1_wide: resolve('inspiration_section1_wide'),
    inspiration_section2_wide: resolve('inspiration_section2_wide'),
    inspiration_astrid_curve: resolve('inspiration_astrid_curve'),
    inspiration_nordic_haven: resolve('inspiration_nordic_haven'),
    inspiration_nordic_breeze: resolve('inspiration_nordic_breeze'),
    inspiration_oslo_drift: resolve('inspiration_oslo_drift'),
  });
}
