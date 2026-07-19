import { HttpTypes } from '@medusajs/framework/types';
import { UseMutationOptions, useMutation } from '@tanstack/react-query';

const getFileBase64EncodedContent = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(
        (reader.result as string).replace('data:', '').replace(/^.+,/, ''),
      );
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// ---------------------------------------------------------------------------
// Normalize EXIF orientation: bakes the correct rotation into the pixels
// and strips the orientation metadata, so it displays correctly everywhere
// regardless of how the backend/storage serves the file afterwards.
// ---------------------------------------------------------------------------
const normalizeImageOrientation = async (file: File): Promise<File> => {
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: 'from-image',
    });

    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, file.type || 'image/jpeg', 0.92),
    );

    if (!blob) return file;

    return new File([blob], file.name, {
      type: file.type || 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch {
    // If the browser doesn't support this (very old browsers), fall back
    // to the original file rather than blocking the upload.
    return file;
  }
};

const createPayload = async (payload: HttpTypes.AdminUploadFile) => {
  if (payload instanceof FileList) {
    const formData = new FormData();
    for (const file of payload) {
      const normalized = await normalizeImageOrientation(file);
      formData.append('files', normalized);
    }
    return formData;
  }

  if (payload.files.every((f) => f instanceof File)) {
    const formData = new FormData();
    for (const file of payload.files) {
      const normalized = await normalizeImageOrientation(file as File);
      formData.append('files', normalized);
    }
    return formData;
  }

  const obj: {
    files: {
      name: string;
      content: string;
    }[];
  } = {
    files: [],
  };

  for (const file of payload.files) {
    if (file instanceof File) {
      const normalized = await normalizeImageOrientation(file);
      obj.files.push({
        name: normalized.name,
        content: await getFileBase64EncodedContent(normalized),
      });
    } else {
      obj.files.push(file);
    }
  }

  return JSON.stringify(obj);
};

export const useAdminUploadImage = (
  options?: UseMutationOptions<
    HttpTypes.AdminFileListResponse,
    Error,
    HttpTypes.AdminUploadFile
  >,
) => {
  return useMutation<
    HttpTypes.AdminFileListResponse,
    Error,
    HttpTypes.AdminUploadFile
  >({
    mutationKey: ['admin-upload-image'],
    mutationFn: async (payload) => {
      const res = await fetch(`/admin/uploads`, {
        method: 'POST',
        body: await createPayload(payload),
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(res.statusText);
      }

      return res.json();
    },
    ...options,
  });
};