/**
 * Compresses an image file by resizing and reducing quality.
 * @param file The image file (as a Blob) to compress.
 * @param options Options for compression.
 * @param options.quality The quality of the output JPEG, from 0 to 1.
 * @param options.maxWidth The maximum width of the output image.
 * @param options.maxHeight The maximum height of the output image.
 * @returns A promise that resolves with the compressed Blob.
 */
export const compressImage = (
  file: Blob,
  options: { quality?: number; maxWidth?: number; maxHeight?: number } = {}
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const { quality = 0.7, maxWidth = 1024, maxHeight = 1024 } = options;
    const imageUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(imageUrl); // Clean up immediately

      let { width, height } = img;

      // Calculate the new dimensions to maintain aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Get the compressed blob as a JPEG
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error('Canvas to Blob conversion failed'));
          }
          resolve(blob);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = (error) => {
      URL.revokeObjectURL(imageUrl);
      reject(error);
    };

    img.src = imageUrl;
  });
};
