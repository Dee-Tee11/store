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

interface TemplateImagesData {
  hero_image: ImageValue | null;
  about_image: ImageValue | null;
  inspiration_hero_image: ImageValue | null;
  inspiration_section1_wide: ImageValue | null;
  inspiration_section2_wide: ImageValue | null;
  inspiration_astrid_curve: ImageValue | null;
  inspiration_nordic_haven: ImageValue | null;
  inspiration_nordic_breeze: ImageValue | null;
  inspiration_oslo_drift: ImageValue | null;
  defaults?: {
    hero_image: ImageValue;
    about_image: ImageValue;
    inspiration_hero_image: ImageValue;
    inspiration_section1_wide: ImageValue;
    inspiration_section2_wide: ImageValue;
    inspiration_astrid_curve: ImageValue;
    inspiration_nordic_haven: ImageValue;
    inspiration_nordic_breeze: ImageValue;
    inspiration_oslo_drift: ImageValue;
  };
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
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
        <div className="flex items-center gap-2 shrink-0">
          {!isDefaultImage && (
            <Button
              variant="secondary"
              size="small"
              onClick={onReset}
              disabled={isUploading}
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
  const [draft, setDraft] = React.useState<Partial<TemplateImagesData>>({});
  const [uploadingSlot, setUploadingSlot] = React.useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<TemplateImagesData>({
    queryKey: ['template-images'],
    queryFn: () =>
      fetch('/admin/template-images', { credentials: 'include' }).then((r) =>
        r.json(),
      ),
  });

  // Merge saved data with local draft
  const merged: TemplateImagesData = React.useMemo(
    () => ({
      hero_image: draft.hero_image !== undefined ? draft.hero_image : (data?.hero_image ?? null),
      about_image: draft.about_image !== undefined ? draft.about_image : (data?.about_image ?? null),
      inspiration_hero_image: draft.inspiration_hero_image !== undefined ? draft.inspiration_hero_image : (data?.inspiration_hero_image ?? null),
      inspiration_section1_wide: draft.inspiration_section1_wide !== undefined ? draft.inspiration_section1_wide : (data?.inspiration_section1_wide ?? null),
      inspiration_section2_wide: draft.inspiration_section2_wide !== undefined ? draft.inspiration_section2_wide : (data?.inspiration_section2_wide ?? null),
      inspiration_astrid_curve: draft.inspiration_astrid_curve !== undefined ? draft.inspiration_astrid_curve : (data?.inspiration_astrid_curve ?? null),
      inspiration_nordic_haven: draft.inspiration_nordic_haven !== undefined ? draft.inspiration_nordic_haven : (data?.inspiration_nordic_haven ?? null),
      inspiration_nordic_breeze: draft.inspiration_nordic_breeze !== undefined ? draft.inspiration_nordic_breeze : (data?.inspiration_nordic_breeze ?? null),
      inspiration_oslo_drift: draft.inspiration_oslo_drift !== undefined ? draft.inspiration_oslo_drift : (data?.inspiration_oslo_drift ?? null),
      defaults: data?.defaults,
    }),
    [data, draft],
  );

  const isDirty = Object.keys(draft).length > 0;

  const uploadImage = useAdminUploadImage();

  const handleUpload =
    (slot: keyof Omit<TemplateImagesData, 'defaults'>) =>
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

  const handleRemove =
    (slot: keyof Omit<TemplateImagesData, 'defaults'>) => () => {
      setDraft((prev) => ({ ...prev, [slot]: null }));
    };

  // Reset to default — removes custom override so the site falls back to the static file
  const handleReset =
    (slot: keyof Omit<TemplateImagesData, 'defaults'>) => () => {
      setDraft((prev) => ({
        ...prev,
        [slot]: merged.defaults?.[slot] ?? null,
      }));
    };

  const saveMutation = useMutation({
    mutationKey: ['template-images', 'save'],
    mutationFn: async (values: Omit<TemplateImagesData, 'defaults'>) => {
      // Strip __default__ images — don't persist them, let the backend fall back
      const payload = {
        hero_image: isDefault(values.hero_image) ? null : values.hero_image,
        about_image: isDefault(values.about_image) ? null : values.about_image,
        inspiration_hero_image: isDefault(values.inspiration_hero_image) ? null : values.inspiration_hero_image,
        inspiration_section1_wide: isDefault(values.inspiration_section1_wide) ? null : values.inspiration_section1_wide,
        inspiration_section2_wide: isDefault(values.inspiration_section2_wide) ? null : values.inspiration_section2_wide,
        inspiration_astrid_curve: isDefault(values.inspiration_astrid_curve) ? null : values.inspiration_astrid_curve,
        inspiration_nordic_haven: isDefault(values.inspiration_nordic_haven) ? null : values.inspiration_nordic_haven,
        inspiration_nordic_breeze: isDefault(values.inspiration_nordic_breeze) ? null : values.inspiration_nordic_breeze,
        inspiration_oslo_drift: isDefault(values.inspiration_oslo_drift) ? null : values.inspiration_oslo_drift,
      };
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

      {/* Homepage — Hero */}
      <Container className="p-6">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-ui-border-base">
          <Heading level="h2">Homepage</Heading>
          <Badge color="blue" size="2xsmall">Hero</Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 justify-center h-64 text-fg-subtle">
            <Spinner className="animate-spin" />
            <Text>Loading…</Text>
          </div>
        ) : (
          <ImageSlot
            label="Hero Banner"
            description="Full-screen hero image displayed at the top of the homepage."
            recommendation="2880 × 1500 recommended · JPG, PNG, WebP · up to 10 MB"
            value={merged.hero_image}
            isUploading={uploadingSlot === 'hero_image'}
            isDefault={isDefault(merged.hero_image)}
            onUpload={handleUpload('hero_image')}
            onRemove={handleRemove('hero_image')}
            onReset={handleReset('hero_image')}
          />
        )}
      </Container>

      {/* About section */}
      <Container className="p-6">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-ui-border-base">
          <Heading level="h2">About Section</Heading>
          <Badge color="green" size="2xsmall">Content</Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 justify-center h-64 text-fg-subtle">
            <Spinner className="animate-spin" />
            <Text>Loading…</Text>
          </div>
        ) : (
          <ImageSlot
            label="About Image"
            description='Wide image displayed in the "About" section on the homepage.'
            recommendation="2496 × 1400 recommended · JPG, PNG, WebP · up to 10 MB"
            value={merged.about_image}
            isUploading={uploadingSlot === 'about_image'}
            isDefault={isDefault(merged.about_image)}
            onUpload={handleUpload('about_image')}
            onRemove={handleRemove('about_image')}
            onReset={handleReset('about_image')}
          />
        )}
      </Container>

      {/* Inspiration Page */}
      <Container className="p-6">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-ui-border-base">
          <Heading level="h2">Inspiration Page</Heading>
          <Badge color="purple" size="2xsmall">Inspiration</Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 justify-center h-64 text-fg-subtle">
            <Spinner className="animate-spin" />
            <Text>Loading…</Text>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            <ImageSlot
              label="Hero Banner"
              description="Full-screen hero image displayed at the top of the inspiration page."
              recommendation="2880 × 1500 recommended · JPG, PNG, WebP · up to 10 MB"
              value={merged.inspiration_hero_image}
              isUploading={uploadingSlot === 'inspiration_hero_image'}
              isDefault={isDefault(merged.inspiration_hero_image)}
              onUpload={handleUpload('inspiration_hero_image')}
              onRemove={handleRemove('inspiration_hero_image')}
              onReset={handleReset('inspiration_hero_image')}
            />

            <ImageSlot
              label="Section 1 Wide Banner"
              description="Wide image displayed in the middle of the page."
              recommendation="2496 × 1404 recommended · JPG, PNG, WebP · up to 10 MB"
              value={merged.inspiration_section1_wide}
              isUploading={uploadingSlot === 'inspiration_section1_wide'}
              isDefault={isDefault(merged.inspiration_section1_wide)}
              onUpload={handleUpload('inspiration_section1_wide')}
              onRemove={handleRemove('inspiration_section1_wide')}
              onReset={handleReset('inspiration_section1_wide')}
            />
            
            <ImageSlot
              label="Section 2 Wide Banner"
              description="Wide image displayed in the lower part of the page."
              recommendation="2880 × 1618 recommended · JPG, PNG, WebP · up to 10 MB"
              value={merged.inspiration_section2_wide}
              isUploading={uploadingSlot === 'inspiration_section2_wide'}
              isDefault={isDefault(merged.inspiration_section2_wide)}
              onUpload={handleUpload('inspiration_section2_wide')}
              onRemove={handleRemove('inspiration_section2_wide')}
              onReset={handleReset('inspiration_section2_wide')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-ui-border-base pt-10 mt-2">
              <ImageSlot
                label="Product: Astrid Curve"
                description="Thumbnail image for the Astrid Curve product."
                recommendation="768 × 572 recommended · JPG, PNG, WebP · up to 10 MB"
                value={merged.inspiration_astrid_curve}
                isUploading={uploadingSlot === 'inspiration_astrid_curve'}
                isDefault={isDefault(merged.inspiration_astrid_curve)}
                onUpload={handleUpload('inspiration_astrid_curve')}
                onRemove={handleRemove('inspiration_astrid_curve')}
                onReset={handleReset('inspiration_astrid_curve')}
              />

              <ImageSlot
                label="Product: Nordic Haven"
                description="Thumbnail image for the Nordic Haven product."
                recommendation="768 × 572 recommended · JPG, PNG, WebP · up to 10 MB"
                value={merged.inspiration_nordic_haven}
                isUploading={uploadingSlot === 'inspiration_nordic_haven'}
                isDefault={isDefault(merged.inspiration_nordic_haven)}
                onUpload={handleUpload('inspiration_nordic_haven')}
                onRemove={handleRemove('inspiration_nordic_haven')}
                onReset={handleReset('inspiration_nordic_haven')}
              />

              <ImageSlot
                label="Product: Nordic Breeze"
                description="Thumbnail image for the Nordic Breeze product."
                recommendation="768 × 572 recommended · JPG, PNG, WebP · up to 10 MB"
                value={merged.inspiration_nordic_breeze}
                isUploading={uploadingSlot === 'inspiration_nordic_breeze'}
                isDefault={isDefault(merged.inspiration_nordic_breeze)}
                onUpload={handleUpload('inspiration_nordic_breeze')}
                onRemove={handleRemove('inspiration_nordic_breeze')}
                onReset={handleReset('inspiration_nordic_breeze')}
              />

              <ImageSlot
                label="Product: Oslo Drift"
                description="Thumbnail image for the Oslo Drift product."
                recommendation="768 × 572 recommended · JPG, PNG, WebP · up to 10 MB"
                value={merged.inspiration_oslo_drift}
                isUploading={uploadingSlot === 'inspiration_oslo_drift'}
                isDefault={isDefault(merged.inspiration_oslo_drift)}
                onUpload={handleUpload('inspiration_oslo_drift')}
                onRemove={handleRemove('inspiration_oslo_drift')}
                onReset={handleReset('inspiration_oslo_drift')}
              />
            </div>
          </div>
        )}
      </Container>

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
