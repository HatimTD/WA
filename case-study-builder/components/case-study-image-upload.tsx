'use client';

import { useState, useRef } from 'react';
import { X, Loader2, Plus, Camera, Box, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { waUploadImage, waDeleteImage } from '@/lib/actions/waImageUploadActions';
import Image from 'next/image';

// Image view types with their icons and labels
const VIEW_TYPES = [
  { id: 'front', label: 'Front View', icon: Box },
  { id: 'back', label: 'Back View', icon: Box },
  { id: 'general', label: 'General View', icon: Eye },
] as const;

type ViewType = typeof VIEW_TYPES[number]['id'];

interface ImageData {
  url: string;
  publicId: string;
  viewType: ViewType | 'additional';
}

interface Props {
  onImagesChange: (images: string[]) => void;
  existingImages?: string[];
  maxAdditionalImages?: number;
}

export default function CaseStudyImageUpload({
  onImagesChange,
  existingImages = [],
  maxAdditionalImages = 5
}: Props) {
  // Parse existing images - first 3 are view-specific, rest are additional
  const waParseExistingImages = (): Record<ViewType | 'additional', ImageData[]> => {
    const result: Record<ViewType | 'additional', ImageData[]> = {
      front: [],
      back: [],
      general: [],
      additional: [],
    };

    existingImages.forEach((url, index) => {
      const imageData: ImageData = {
        url,
        publicId: url.split('/').pop()?.split('.')[0] || '',
        viewType: index < 3 ? VIEW_TYPES[index].id : 'additional',
      };

      if (index === 0) result.front = [imageData];
      else if (index === 1) result.back = [imageData];
      else if (index === 2) result.general = [imageData];
      else result.additional.push({ ...imageData, viewType: 'additional' });
    });

    return result;
  };

  const [images, setImages] = useState<Record<ViewType | 'additional', ImageData[]>>(waParseExistingImages);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const waGetAllImageUrls = (imageState: Record<ViewType | 'additional', ImageData[]>): string[] => {
    const urls: string[] = [];
    VIEW_TYPES.forEach(vt => {
      if (imageState[vt.id].length > 0) {
        urls.push(imageState[vt.id][0].url);
      }
    });
    urls.push(...imageState.additional.map(img => img.url));
    return urls;
  };

  const waHandleFileSelect = async (viewType: ViewType | 'additional', files: FileList | null) => {
    if (!files || files.length === 0) return;

    // For view-specific slots, only allow 1 image
    if (viewType !== 'additional' && files.length > 1) {
      toast.error('Only one image allowed for this view');
      return;
    }

    // Check additional images limit
    if (viewType === 'additional' && images.additional.length + files.length > maxAdditionalImages) {
      toast.error(`Maximum ${maxAdditionalImages} additional images allowed`);
      return;
    }

    setUploading(viewType);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const result = await waUploadImage(formData);

        if (result.success && result.url && result.publicId) {
          return {
            url: result.url,
            publicId: result.publicId,
            viewType,
          } as ImageData;
        } else {
          toast.error(result.error || 'Failed to upload image');
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((r): r is ImageData => r !== null);

      if (successfulUploads.length > 0) {
        const newImages = { ...images };

        if (viewType === 'additional') {
          newImages.additional = [...newImages.additional, ...successfulUploads];
        } else {
          // Replace existing image for view-specific slots
          if (newImages[viewType].length > 0) {
            // Delete old image from Cloudinary
            const oldImage = newImages[viewType][0];
            if (!existingImages.includes(oldImage.url)) {
              await waDeleteImage(oldImage.publicId);
            }
          }
          newImages[viewType] = successfulUploads;
        }

        setImages(newImages);
        onImagesChange(waGetAllImageUrls(newImages));
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      console.error('[CaseStudyImageUpload] Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(null);
    }
  };

  const waHandleRemoveImage = async (viewType: ViewType | 'additional', index: number = 0) => {
    const imageToRemove = viewType === 'additional'
      ? images.additional[index]
      : images[viewType][0];

    if (!imageToRemove) return;

    try {
      // Only delete from Cloudinary if it's not an existing image
      if (!existingImages.includes(imageToRemove.url)) {
        await waDeleteImage(imageToRemove.publicId);
      }

      const newImages = { ...images };

      if (viewType === 'additional') {
        newImages.additional = newImages.additional.filter((_, i) => i !== index);
      } else {
        newImages[viewType] = [];
      }

      setImages(newImages);
      onImagesChange(waGetAllImageUrls(newImages));
      toast.success('Image removed');
    } catch (error) {
      console.error('[CaseStudyImageUpload] Error removing image:', error);
      toast.error('Failed to remove image');
    }
  };

  const waHandleSlotClick = (viewType: ViewType | 'additional') => {
    fileInputRefs.current[viewType]?.click();
  };

  const waRenderViewSlot = (viewType: ViewType, IconComponent: typeof Box, label: string) => {
    const hasImage = images[viewType].length > 0;
    const isUploading = uploading === viewType;

    return (
      <div
        key={viewType}
        className="relative"
      >
        <div
          onClick={() => !hasImage && !isUploading && waHandleSlotClick(viewType)}
          className={`
            aspect-square rounded-xl border-2 border-dashed transition-all cursor-pointer
            flex flex-col items-center justify-center gap-2 p-3
            ${hasImage
              ? 'border-wa-green-300 bg-wa-green-50 dark:border-wa-green-700 dark:bg-wa-green-950'
              : 'border-gray-300 dark:border-gray-600 hover:border-wa-green-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }
          `}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-wa-green-500 animate-spin" />
          ) : hasImage ? (
            <div className="relative w-full h-full group">
              <Image
                src={images[viewType][0].url}
                alt={label}
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 768px) 33vw, 150px"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  waHandleRemoveImage(viewType);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    waHandleRemoveImage(viewType);
                  }
                }}
                className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-black/60 hover:bg-red-500 text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
              </span>
            </div>
          ) : (
            <>
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <IconComponent className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </div>
              <span className="text-xs text-center text-gray-600 dark:text-gray-400 font-medium">
                {label}
              </span>
            </>
          )}
        </div>

        <input
          ref={(el) => { fileInputRefs.current[viewType] = el; }}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={(e) => {
            waHandleFileSelect(viewType, e.target.files);
            e.target.value = '';
          }}
          className="hidden"
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* View-specific slots */}
      <div className="grid grid-cols-4 gap-3">
        {VIEW_TYPES.map((vt) => waRenderViewSlot(vt.id, vt.icon, vt.label))}

        {/* Add more button */}
        <div
          onClick={() => waHandleSlotClick('additional')}
          className={`
            aspect-square rounded-xl border-2 border-dashed transition-all cursor-pointer
            flex flex-col items-center justify-center gap-2 p-3
            border-gray-300 dark:border-gray-600 hover:border-wa-green-400 hover:bg-gray-50 dark:hover:bg-gray-800
            ${uploading === 'additional' ? 'opacity-50' : ''}
          `}
        >
          {uploading === 'additional' ? (
            <Loader2 className="h-8 w-8 text-wa-green-500 animate-spin" />
          ) : (
            <>
              <div className="p-2 rounded-full border-2 border-gray-400 dark:border-gray-500">
                <Plus className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
              <span className="text-xs text-center text-gray-600 dark:text-gray-400 font-medium">
                Add More
              </span>
            </>
          )}
        </div>

        <input
          ref={(el) => { fileInputRefs.current['additional'] = el; }}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          multiple
          onChange={(e) => {
            waHandleFileSelect('additional', e.target.files);
            e.target.value = '';
          }}
          className="hidden"
        />
      </div>

      {/* Additional images grid */}
      {images.additional.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Additional Images ({images.additional.length}/{maxAdditionalImages})</p>
          <div className="grid grid-cols-5 gap-2">
            {images.additional.map((image, index) => (
              <div key={image.url} className="relative aspect-square group">
                <Image
                  src={image.url}
                  alt={`Additional ${index + 1}`}
                  fill
                  className="object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  sizes="(max-width: 768px) 20vw, 100px"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => waHandleRemoveImage('additional', index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      waHandleRemoveImage('additional', index);
                    }
                  }}
                  className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center bg-black/60 hover:bg-red-500 text-white rounded-full transition-colors cursor-pointer"
                >
                  <X className="h-2.5 w-2.5" />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        Upload images of the component: Front, Back, and General views. Add more images as needed.
      </p>
    </div>
  );
}
