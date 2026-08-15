import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { Modules } from '@medusajs/framework/utils';
import { z } from 'zod';

import { TEMPLATE_IMAGE_KEYS, buildDefaults } from '../../shared/template-images';

const imageSchema = z
  .object({ id: z.string(), url: z.string().url() })
  .nullable()
  .optional();

const templateImagesMetadataSchema = z.object(
  Object.fromEntries(TEMPLATE_IMAGE_KEYS.map((key) => [key, imageSchema])),
);

const METADATA_KEY = 'template_images';

// The storefront serves these from its own /public folder, so relative paths are correct here.
const DEFAULTS = buildDefaults();

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const storeModule = req.scope.resolve(Modules.STORE);
  const [store] = await storeModule.listStores();
  const raw = (store.metadata as Record<string, unknown>)?.[METADATA_KEY];
  const parsed = templateImagesMetadataSchema.safeParse(raw ?? {});

  const resolve = (key: string) =>
    parsed.success && (parsed.data as Record<string, unknown>)[key]
      ? (parsed.data as Record<string, unknown>)[key]
      : DEFAULTS[key];

  res.json(
    Object.fromEntries(TEMPLATE_IMAGE_KEYS.map((key) => [key, resolve(key)])),
  );
}
