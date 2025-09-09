import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import type { Crop, PixelCrop } from 'react-image-crop';

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (blob: Blob) => void;
  onCancel: () => void;
}

function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  canvas: HTMLCanvasElement
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No 2d context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  
  canvas.width = crop.width;
  canvas.height = crop.height;

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageUrl, onCropComplete, onCancel }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const ID_CARD_ASPECT_RATIO = 85.60 / 53.98;

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        ID_CARD_ASPECT_RATIO,
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
  }
  
  const handleDoneClick = () => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) {
        return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    getCroppedImg(image, completedCrop, canvas);

    canvas.toBlob((blob) => {
        if (blob) {
            onCropComplete(blob);
        }
    }, 'image/jpeg', 0.95);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-3xl max-h-[90vh] bg-gray-800 p-4 rounded-lg shadow-xl flex flex-col">
            <h2 className="text-xl font-semibold text-white text-center mb-4">Crop Aadhar Card</h2>
            <div className="flex-grow overflow-auto flex items-center justify-center min-h-0">
                <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={ID_CARD_ASPECT_RATIO}
                    minWidth={100}
                >
                    <img
                        ref={imgRef}
                        alt="Crop me"
                        src={imageUrl}
                        onLoad={onImageLoad}
                        className="max-h-[65vh] object-contain"
                    />
                </ReactCrop>
            </div>
            <canvas ref={previewCanvasRef} className="hidden" />
            <div className="flex justify-center items-center gap-4 mt-4 flex-shrink-0">
                <button
                    onClick={onCancel}
                    className="py-2 px-6 border border-gray-500 text-lg font-medium rounded-md text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    aria-label="Cancel cropping"
                >
                    Cancel
                </button>
                <button
                    onClick={handleDoneClick}
                    disabled={!completedCrop?.width || !completedCrop?.height}
                    className="py-2 px-8 bg-indigo-600 text-white text-lg font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    aria-label="Confirm crop"
                >
                    Done
                </button>
            </div>
        </div>
    </div>
  );
};

export default ImageCropper;