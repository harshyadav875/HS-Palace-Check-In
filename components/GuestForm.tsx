import React from 'react';
import type { GuestDetails } from '../types';
import Spinner from './Spinner';

interface GuestFormProps {
  guestNumber: number;
  guestData: GuestDetails;
  onFileChange: (guestIndex: number, side: 'front' | 'back', file: File) => void;
  isLoading: { front: boolean; back: boolean };
}

const FileInput: React.FC<{
  id: string;
  label: string;
  imageUrl: string;
  isLoading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ id, label, imageUrl, isLoading, onChange }) => (
  <div className="w-full">
    {/* This is now just a text label above the input area */}
    <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
    {/* The main box is now a label, which makes the whole area clickable and triggers the file input. */}
    <label htmlFor={id} className="mt-1 relative flex justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md h-48 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
      {isLoading && <Spinner />}
      {imageUrl ? (
        <img src={imageUrl} alt={label} className="h-full object-contain" />
      ) : (
        <div className="space-y-1 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex text-sm text-gray-600">
            <p className="pl-1">Click to upload a file</p>
          </div>
          <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
        </div>
      )}
      <input id={id} name={id} type="file" className="sr-only" onChange={onChange} accept="image/png, image/jpeg" />
    </label>
  </div>
);


const GuestForm: React.FC<GuestFormProps> = ({ guestNumber, guestData, onFileChange, isLoading }) => {
  const guestIndex = guestNumber - 1;

  const handleFileChange = (side: 'front' | 'back') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(guestIndex, side, e.target.files[0]);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Guest {guestNumber}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <FileInput 
          id={`guest${guestNumber}-front`}
          label="Aadhar Card (Front)"
          imageUrl={guestData.frontImageUrl}
          isLoading={isLoading.front}
          onChange={handleFileChange('front')}
        />
        <FileInput 
          id={`guest${guestNumber}-back`}
          label="Aadhar Card (Back)"
          imageUrl={guestData.backImageUrl}
          isLoading={isLoading.back}
          onChange={handleFileChange('back')}
        />
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input type="text" value={guestData.name} readOnly className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm p-2 cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
          <input type="text" value={guestData.dob} readOnly className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm p-2 cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <textarea value={guestData.address} readOnly rows={3} className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm p-2 cursor-not-allowed" />
        </div>
      </div>
    </div>
  );
};

export default GuestForm;