import * as React from 'react';
import { defineRouteConfig } from '@medusajs/admin-sdk';
import { Photo, CheckCircle, Spinner, ArrowPath } from '@medusajs/icons';
import {
  Container,
  Heading,
  Button,
  Text,
  Badge,
  toast,
} from '@medusajs/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { withQueryClient } from '../../components/QueryClientProvider';
import { useAdminUploadImage } from '../../hooks/images';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImageValue {
  id: string;
  url: string;
}

interface SlotDefinition {
  key: string;
  label: string;
  description: string;
  recommendation: string;
}

interface SectionDefinition {
  title: string;
  badge: { label: string; color: 'blue' | 'green' | 'purple' | 'orange' };
  slots: SlotDefinition[];
  /** Render the slots side by side instead of stacked. */
  grid?: boolean;
}

// The single source of truth for this page — keep the keys in sync with
// src/api/shared/template-images.ts and the storefront.
const SECTIONS: SectionDefinition[] = [
  {
    title: 'Homepage',
    badge: { label: 'Home', color: 'blue' },
    slots: [
      {
        key: 'hero_image',
        label: 'Hero Banner',
        description: 'Full-screen hero image displayed at the top of the homepage.',
        recommendation: '2880 × 1500 recommended · JPG, PNG, WebP · up to 10 MB',
      },
      {
        key: 'about_image',
        label: 'About Image',
        description: 'Wide image displayed in the "About" section on the homepage.',
        recommendation: '2496 × 1400 recommended · JPG, PNG, WebP · up to 10 MB',
      },
    ],
  },
  {
    title: 'About Page',
    badge: { label: 'Content', color: 'green' },
    slots: [
      {
        key: 'about_page_hero',
        label: 'Hero Banner',
        description: 'Full-screen image at the top of the About page.',
        recommendation: '2880 × 1500 recommended · JPG, PNG, WebP · up to 10 MB',
      },
      {
        key: 'about_page_image1',
        label: 'Wide Image',
        description: 'Wide image below the opening paragraphs.',
        recommendation: '2496 × 1404 recommended · JPG, PNG, WebP · up to 10 MB',
      },
      {
        key: 'about_page_image2',
        label: 'Portrait Image',
        description: 'Tall image in the middle of the page.',
        recommendation: '1200 × 1600 recommended · JPG, PNG, WebP · up to 10 MB',
      },
      {
        key: 'about_page_wide',
        label: 'Closing Banner',
        description: 'Wide image near the bottom of the About page.',
        recommendation: '2880 × 1618 recommended · JPG, PNG, WebP · up to 10 MB',
      },
    ],
  },
  {
    title: 'Brands Page',
    badge: { label: 'Brands', color: 'purple' },
    slots: [
      {
        key: 'brands_hero_image',
        label: 'Hero Banner',
        description: 'Full-screen image at the top of the Brands page.',
        recommendation: '2880 × 1500 recommended · JPG, PNG, WebP · up to 10 MB',
      },
      {
        key: 'brands_section1_wide',
        label: 'Section 1 Wide Banner',
        description: 'Wide image in the middle of the page.',
        recommendation: '2496 × 1404 recommended · JPG, PNG, WebP · up to 10 MB',
      },
      {
        key: 'brands_section2_wide',
        label: 'Section 2 Wide Banner',
        description: 'Wide image in the lower part of the page.',
        recommendation: '2880 × 1618 recommended · JPG, PNG, WebP · up to 10 MB',
      },
    ],
  },
  {
    title: 'Brand Cards',
    badge: { label: 'Brands', color: 'purple' },
    grid: true,
    slots: [
      {
        key: 'brands_brand1_image',
        label: 'Card 1 — Apple',
        description: 'Thumbnail for the first brand card (Apple section).',
        recommendation: '768 × 572 recommended · JPG, PNG, WebP · up to 10 MB',
      },
      {
        key: 'brands_brand2_image',
        label: 'Card 2 — JBL',
        description: 'Thumbnail for the second brand card (audio section).',
        recommendation: '768 × 572 recommended · JPG, PNG, WebP · up to 10 MB',
      },
      {
        key: 'brands_brand3_image',
        label: 'Card 3 — Dyson',
        description: 'Thumbnail for the third brand card (personal care section).',
        recommendation: '768 × 572 recommended · JPG, PNG, WebP · up to 10 MB',
      },
      {
        key: 'brands_brand4_image',
        label: 'Card 4 — Perfumes',
        description: 'Thumbnail for the fourth brand card (fragrances section).',
        recommendation: '768 × 572 recommended · JPG, PNG, WebP · up to 10 MB',
      },
    ],
  },
  {
    title: 'Shared',
    badge: { label: 'Site-wide', color: 'orange' },
    grid: true,
    slots: [
      {
        key: 'auth_image',
        label: 'Account Pages',
        description: 'Side image on the login, register and password reset pages.',
        recommendation: '1440 × 1632 recommended · JPG, PNG, WebP · up to 10 MB',
      },
      {
        key: 'collection_default_image',
        label: 'Collection Fallback',
        description:
          'Header image used by collections that have no image of their own.',
        recommendation: '2880 × 1440 recommended · JPG, PNG, WebP · up to 10 MB',
      },
    ],
  },
];

const SLOT_KEYS = SECTIONS.flatMap((section) =>
  section.slots.map((slot) => slot.key),
);

type ImageMap = Record<string, ImageValue | null>;

interface TemplateImagesData {
  images: ImageMap;
  defaults: ImageMap;
}

// Default image IDs so we know when an image is the site default
const DEFAULT_ID = '__default__';

const isDefault = (img: ImageValue | null | undefined) =>
  !img || img.id === DEFAULT_ID;

// ---------------------------------------------------------------------------
// Image upload slot — native drag-and-drop + file input
// ---------------------------------------------------------------------------

interface ImageSlotProps {
  label: string;
  description: string;
  recommendation?: string;
  value: ImageValue | null | undefined;
  isUploading: boolean;
  isDefault: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
  onReset: () => void;
}

const ImageSlot: React.FC<ImageSlotProps> = ({
  label,
  description,
  recommendation = '2880 × 1500 recommended, up to 10 MB',
  value,
  isUploading,
  isDefault: isDefaultImage,
  onUpload,
  onRemove,
  onReset,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    onUpload(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const hasImage = !!value?.url;

  const zoneClass = [
    'relative flex h-72 w-full select-none flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors overflow-hidden',
    isDragging
      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
      : hasImage
      ? 'border-ui-border-base'
      : 'border-ui-border-base bg-ui-bg-component',
    isUploading ? 'pointer-events-none opacity-60' : 'cursor-pointer hover:border-blue-400',
  ].join(' ');

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-64">
          <div className="flex flex-wrap items-center gap-2">
            <Text size="base" weight="plus" className="text-fg-base">
              {label}
            </Text>
            {isDefaultImage && (
              <Badge color="grey" size="2xsmall">
                Default
              </Badge>
            )}
            {!isDefaultImage && (
              <Badge color="green" size="2xsmall">
                Custom
              </Badge>
            )}
          </div>
          <Text size="small" className="text-fg-subtle mt-0.5">
            {description}
          </Text>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {!isDefaultImage && (
            <Button
              variant="secondary"
              size="small"
              onClick={onReset}
              disabled={isUploading}
              className="whitespace-nowrap"
            >
              <ArrowPath />
              Reset to default
            </Button>
          )}
          {hasImage && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="whitespace-nowrap"
            >
              Replace
            </Button>
          )}
          {!isDefaultImage && hasImage && (
            <Button
              variant="secondary"
              size="small"
              onClick={onRemove}
              disabled={isUploading}
              className="whitespace-nowrap"
            >
              Remove
            </Button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={isUploading}
      />

      {/* Drop zone / preview */}
      <div
        className={zoneClass}
        onClick={() => !isUploading && !hasImage && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2 text-fg-subtle">
            <Spinner className="animate-spin text-2xl" />
            <Text size="small">Uploading…</Text>
          </div>
        ) : hasImage ? (
          <>
            <img
              src={value!.url}
              alt={label}
              className="h-full w-full object-cover"
            />
            {/* Drop-to-replace overlay */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Photo className="text-white mb-1" />
              <Text size="small" className="text-white font-medium">
                Drop or click to replace
              </Text>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 text-center">
            <Photo className="text-fg-muted text-2xl" />
            <Text size="small" className="text-fg-subtle">
              {isDragging ? (
                'Drop image here'
              ) : (
                <>
                  Drop your image here, or{' '}
                  <span className="text-blue-500">click to browse</span>
                </>
              )}
            </Text>
            <Text size="xsmall" className="text-fg-muted">
              {recommendation}
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const TemplateImagesPage = () => {
  const queryClient = useQueryClient();
  const [draft, setDraft] = React.useState<ImageMap>({});
  const [uploadingSlot, setUploadingSlot] = React.useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<TemplateImagesData>({
    queryKey: ['template-images'],
    queryFn: () =>
      fetch('/admin/template-images', { credentials: 'include' })
        .then((r) => r.json())
        .then((json) => ({
          images: Object.fromEntries(
            SLOT_KEYS.map((key) => [key, json[key] ?? null]),
          ) as ImageMap,
          defaults: (json.defaults ?? {}) as ImageMap,
        })),
  });

  // Merge saved data with local draft
  const merged: ImageMap = React.useMemo(
    () =>
      Object.fromEntries(
        SLOT_KEYS.map((key) => [
          key,
          draft[key] !== undefined ? draft[key] : (data?.images[key] ?? null),
        ]),
      ),
    [data, draft],
  );

  const isDirty = Object.keys(draft).length > 0;

  const uploadImage = useAdminUploadImage();

  const handleUpload =
    (slot: string) =>
    async (file: File) => {
      setUploadingSlot(slot);
      try {
        const result = await uploadImage.mutateAsync({ files: [file] });
        const uploaded = result.files[0];
        setDraft((prev) => ({
          ...prev,
          [slot]: { id: uploaded.id, url: uploaded.url },
        }));
      } catch (e) {
        toast.error('Upload failed', {
          description: e instanceof Error ? e.message : 'Unknown error',
        });
      } finally {
        setUploadingSlot(null);
      }
    };

  const handleRemove = (slot: string) => () => {
    setDraft((prev) => ({ ...prev, [slot]: null }));
  };

  // Reset to default — removes custom override so the site falls back to the static file
  const handleReset =
    (slot: string) => () => {
      setDraft((prev) => ({
        ...prev,
        [slot]: data?.defaults[slot] ?? null,
      }));
    };

  const saveMutation = useMutation({
    mutationKey: ['template-images', 'save'],
    mutationFn: async (values: ImageMap) => {
      // Strip __default__ images — don't persist them, let the backend fall back
      const payload = Object.fromEntries(
        SLOT_KEYS.map((key) => [
          key,
          isDefault(values[key]) ? null : values[key],
        ]),
      );
      const res = await fetch('/admin/template-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['template-images'] });
      setDraft({});
      toast.success('Template images saved!');
    },
    onError: (e) => {
      toast.error('Failed to save', {
        description: e instanceof Error ? e.message : 'Unknown error',
      });
    },
  });

  const handleSave = () => saveMutation.mutate(merged);
  const handleDiscard = () => setDraft({});

  if (isError) {
    return (
      <Container className="p-6">
        <Text className="text-red-500">Failed to load template images.</Text>
      </Container>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6 max-w-4xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level="h1">Template Images</Heading>
          <Text size="small" className="text-fg-subtle mt-1">
            Manage the storefront layout images. Images marked{' '}
            <strong>Default</strong> are the original template files. Upload a
            custom image to replace them.
          </Text>
        </div>
        {isDirty && (
          <div className="flex items-center gap-2">
            <Badge color="orange" size="2xsmall">
              Unsaved changes
            </Badge>
            <Button
              variant="secondary"
              size="small"
              onClick={handleDiscard}
              disabled={saveMutation.isPending}
            >
              Discard
            </Button>
            <Button
              size="small"
              onClick={handleSave}
              isLoading={saveMutation.isPending}
              disabled={saveMutation.isPending}
            >
              Save changes
            </Button>
          </div>
        )}
      </div>

      {SECTIONS.map((section) => (
        <Container className="p-6" key={section.title}>
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-ui-border-base">
            <Heading level="h2">{section.title}</Heading>
            <Badge color={section.badge.color} size="2xsmall">
              {section.badge.label}
            </Badge>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 justify-center h-64 text-fg-subtle">
              <Spinner className="animate-spin" />
              <Text>Loading…</Text>
            </div>
          ) : (
            <div
              className={
                section.grid
                  ? 'grid grid-cols-1 md:grid-cols-2 gap-10'
                  : 'flex flex-col gap-10'
              }
            >
              {section.slots.map((slot) => (
                <ImageSlot
                  key={slot.key}
                  label={slot.label}
                  description={slot.description}
                  recommendation={slot.recommendation}
                  value={merged[slot.key]}
                  isUploading={uploadingSlot === slot.key}
                  isDefault={isDefault(merged[slot.key])}
                  onUpload={handleUpload(slot.key)}
                  onRemove={handleRemove(slot.key)}
                  onReset={handleReset(slot.key)}
                />
              ))}
            </div>
          )}
        </Container>
      ))}


      {/* Sticky save bar */}
      {isDirty && (
        <div className="sticky bottom-6 flex justify-end">
          <div className="flex items-center gap-3 bg-ui-bg-base border border-ui-border-base rounded-xl px-4 py-3 shadow-elevation-card-rest">
            <CheckCircle className="text-ui-tag-green-icon" />
            <Text size="small" className="text-fg-subtle">
              You have unsaved changes
            </Text>
            <Button
              variant="secondary"
              size="small"
              onClick={handleDiscard}
              disabled={saveMutation.isPending}
            >
              Discard
            </Button>
            <Button
              size="small"
              onClick={handleSave}
              isLoading={saveMutation.isPending}
            >
              Save changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default withQueryClient(TemplateImagesPage);

export const config = defineRouteConfig({
  label: 'Template Images',
  icon: Photo,
});
