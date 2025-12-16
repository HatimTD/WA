'use client';

import { useState, useRef, DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { waUploadImage, waDeleteImage } from '@/lib/actions/waImageUploadActions';
import Image from 'next/image';

interface UploadedImage {
  url: string;
  publicId: string;
}

interface Props {
  onImagesChange: (images: string[]) => void;
  existingImages?: string[];
  maxImages?: number;
}

export default function ImageUpload({ onImagesChange, existingImages = [], maxImages = 5 }: Props) {
  const [images, setImages] = useState<UploadedImage[]>(
    existingImages.map((url) => ({
      url,
      publicId: url.split('/').pop()?.split('.')[0] || '',
    }))
  );
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        console.log('[ImageUpload] Uploading file:', file.name);
        const result = await waUploadImage(formData);

        if (result.success && result.url && result.publicId) {
          console.log('[ImageUpload] Upload successful:', result.url);
          return {
            url: result.url,
            publicId: result.publicId,
          };
        } else {
          console.error('[ImageUpload] Upload failed:', result.error);
          toast.error(result.error || 'Failed to upload image');
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((r): r is UploadedImage => r !== null);

      const newImages = [...images, ...successfulUploads];
      setImages(newImages);
      onImagesChange(newImages.map((img) => img.url));

      toast.success(`${successfulUploads.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('[ImageUpload] Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (index: number) => {
    const imageToRemove = images[index];

    try {
      console.log('[ImageUpload] Removing image:', imageToRemove.publicId);

      // Only delete from Cloudinary if it's not an existing image
      if (!existingImages.includes(imageToRemove.url)) {
        await waDeleteImage(imageToRemove.publicId);
      }

      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
      onImagesChange(newImages.map((img) => img.url));

      toast.success('Image removed');
    } catch (error) {
      console.error('[ImageUpload] Error removing image:', error);
      toast.error('Failed to remove image');
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {images.length < maxImages && (
        <Card
          className={`p-8 border-2 border-dashed transition-colors cursor-pointer ${
            isDragging ? 'border-wa-green-500 bg-wa-green-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            {uploading ? (
              <>
                <Loader2 className="h-12 w-12 text-wa-green-500 animate-spin" />
                <p className="text-sm text-gray-600">Uploading images...</p>
              </>
            ) : (
              <>
                <div className="p-4 bg-wa-green-100 rounded-full">
                  <Upload className="h-8 w-8 text-wa-green-600" />
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-700">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    PNG, JPG, WebP or GIF (max 10MB each)
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {images.length} / {maxImages} images uploaded
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleButtonClick}>
                  Select Files
                </Button>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </Card>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={image.url} className="relative group">
              <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                <Image
                  src={image.url}
                  alt={`Upload ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !uploading && (
        <div className="text-center py-8">
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No images uploaded yet</p>
        </div>
      )}
    </div>
  );
}
