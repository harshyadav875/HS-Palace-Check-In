import React, { useState, useCallback } from 'react';
import type { GuestDetails, LoadingState } from './types';
import GuestForm from './components/GuestForm';
import { extractAadharData } from './services/geminiService';
import { generateCheckInPDF } from './utils/pdfGenerator';
import Spinner from './components/Spinner';
import ImageCropper from './components/ImageCropper';
import { compressImage } from './utils/imageUtils';

const initialGuestState: GuestDetails = {
  name: '',
  dob: '',
  address: '',
  frontImage: null,
  frontImageUrl: '',
  backImage: null,
  backImageUrl: '',
};

interface CroppingState {
  guestIndex: number;
  side: 'front' | 'back';
  imageUrl: string;
  originalFileName: string;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const App: React.FC = () => {
  const [guests, setGuests] = useState<[GuestDetails, GuestDetails]>([
    { ...initialGuestState },
    { ...initialGuestState },
  ]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [serverCode, setServerCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<LoadingState>({
    guest1Front: false,
    guest1Back: false,
    guest2Front: false,
    guest2Back: false,
    pdf: false,
  });
  const [croppingState, setCroppingState] = useState<CroppingState | null>(null);

  const handleFileSelect = useCallback((guestIndex: number, side: 'front' | 'back', file: File) => {
    setError(null);
    const imageUrl = URL.createObjectURL(file);
    setCroppingState({
      guestIndex,
      side,
      imageUrl,
      originalFileName: file.name
    });
  }, []);

  const handleCropComplete = useCallback(async (croppedImageBlob: Blob) => {
    if (!croppingState) return;

    const { guestIndex, side, originalFileName } = croppingState;
    const originalCropperUrl = croppingState.imageUrl;
    setCroppingState(null); // Close cropper UI immediately

    const loadingKey = `guest${guestIndex + 1}${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof LoadingState;
    setLoading(prev => ({ ...prev, [loadingKey]: true }));

    let compressedFile: File | null = null;
    let compressedImageUrl: string | null = null;

    try {
      const compressedBlob = await compressImage(croppedImageBlob, { quality: 0.7, maxWidth: 1024 });
      compressedFile = new File([compressedBlob], originalFileName, { type: 'image/jpeg' });
      compressedImageUrl = URL.createObjectURL(compressedFile);

      const extractedData = await extractAadharData(compressedFile, side);

      setGuests(prev => {
        const newGuests = [...prev] as [GuestDetails, GuestDetails];
        const currentGuest = { ...newGuests[guestIndex] };

        // Revoke the old URL before assigning the new one
        if (side === 'front' && currentGuest.frontImageUrl) {
          URL.revokeObjectURL(currentGuest.frontImageUrl);
        } else if (side === 'back' && currentGuest.backImageUrl) {
          URL.revokeObjectURL(currentGuest.backImageUrl);
        }

        // Update with new data
        if (side === 'front') {
          currentGuest.frontImage = compressedFile;
          currentGuest.frontImageUrl = compressedImageUrl!;
          currentGuest.name = extractedData.name || currentGuest.name;
          currentGuest.dob = extractedData.dob || currentGuest.dob;
        } else { // back
          currentGuest.backImage = compressedFile;
          currentGuest.backImageUrl = compressedImageUrl!;
          currentGuest.address = extractedData.address || currentGuest.address;
        }
        
        newGuests[guestIndex] = currentGuest;
        return newGuests;
      });
      
      // Set to null on success so it doesn't get revoked in the `finally` block
      compressedImageUrl = null;

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      // Clean up the object URLs to prevent memory leaks
      URL.revokeObjectURL(originalCropperUrl);
      if (compressedImageUrl) {
        // This only runs if an error occurred after URL creation
        URL.revokeObjectURL(compressedImageUrl);
      }
      setLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  }, [croppingState]);
  
  const handleCropCancel = () => {
    if (croppingState) {
        URL.revokeObjectURL(croppingState.imageUrl);
    }
    setCroppingState(null);
  };
  
  const resetForm = () => {
    setGuests(prevGuests => {
      // Clean up old object URLs to prevent memory leaks
      prevGuests.forEach(guest => {
        if (guest.frontImageUrl) URL.revokeObjectURL(guest.frontImageUrl);
        if (guest.backImageUrl) URL.revokeObjectURL(guest.backImageUrl);
      });
      // Return new initial state
      return [
        { ...initialGuestState },
        { ...initialGuestState },
      ];
    });
    setPhoneNumber('');
    setServerCode('');
    setError(null);
  };

  const handleCheckIn = async () => {
    setError(null);
    setLoading(prev => ({ ...prev, pdf: true }));
    try {
      const checkInTime = new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      // Convert images to base64 for reliable PDF generation
      const guestsWithBase64Images = await Promise.all(
        guests.map(async (guest) => ({
          ...guest,
          frontImageUrl: guest.frontImage ? await fileToBase64(guest.frontImage) : '',
          backImageUrl: guest.backImage ? await fileToBase64(guest.backImage) : '',
        }))
      ) as [GuestDetails, GuestDetails];

      await generateCheckInPDF(guestsWithBase64Images, phoneNumber, serverCode, checkInTime);
      
      // Reset form on success
      resetForm();

    } catch (err) {
      setError("Failed to generate PDF. Please try again.");
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, pdf: false }));
    }
  };

  const isCheckInDisabled = 
    !guests[0].frontImage || !guests[0].backImage ||
    !guests[1].frontImage || !guests[1].backImage ||
    !guests[0].name || !guests[0].address ||
    !guests[1].name || !guests[1].address ||
    !phoneNumber || !serverCode ||
    Object.values(loading).some(v => v);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      {croppingState && (
        <ImageCropper
          imageUrl={croppingState.imageUrl}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-center text-gray-800">HS Palace</h1>
          <p className="text-center text-gray-600 mt-1">Guest Check-in Portal</p>
        </div>
      </header>
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <GuestForm 
            guestNumber={1}
            guestData={guests[0]}
            onFileChange={handleFileSelect}
            isLoading={{ front: loading.guest1Front, back: loading.guest1Back }}
          />

          <GuestForm 
            guestNumber={2}
            guestData={guests[1]}
            onFileChange={handleFileSelect}
            isLoading={{ front: loading.guest2Front, back: loading.guest2Back }}
          />
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Contact & Booking</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input 
                  type="tel" 
                  id="phone" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                  placeholder="Enter contact number"
                />
              </div>
              <div>
                <label htmlFor="serverCode" className="block text-sm font-medium text-gray-700">Server Code</label>
                <input 
                  type="text" 
                  id="serverCode" 
                  value={serverCode}
                  onChange={(e) => setServerCode(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                  placeholder="Enter server code"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-center pt-4">
            <button 
              onClick={handleCheckIn}
              disabled={isCheckInDisabled}
              className="relative w-full md:w-1/2 flex justify-center items-center py-3 px-6 border border-transparent text-lg font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading.pdf && <span className="absolute left-4"><Spinner/></span>}
              Check In & Generate PDF
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
