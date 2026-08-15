import { Modules } from '@medusajs/framework/utils';
import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
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

const STOREFRONT = process.env.STOREFRONT_URL ?? 'http://localhost:8000';

// Absolute URLs so the admin can preview the storefront's static defaults.
export const DEFAULTS = buildDefaults(STOREFRONT);

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
    ...Object.fromEntries(TEMPLATE_IMAGE_KEYS.map((key) => [key, resolve(key)])),
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
