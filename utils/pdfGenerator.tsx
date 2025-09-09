import React from 'react';
import ReactDOM from 'react-dom/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { GuestDetails } from '../types';

interface PDFDocumentProps {
    guests: [GuestDetails, GuestDetails];
    phoneNumber: string;
    serverCode: string;
    checkInTime: string;
}

const PDFDocument: React.FC<PDFDocumentProps> = ({ guests, phoneNumber, serverCode, checkInTime }) => {
    return (
        <div className="p-8 bg-white text-black" style={{ width: '210mm', minHeight: '297mm' }}>
            <div className="text-center mb-8 border-b-2 border-black pb-4">
                <h1 className="text-4xl font-bold">HS Palace</h1>
                <p className="text-lg">Guest Check-in Record</p>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <h2 className="text-2xl font-semibold mb-2 border-b border-gray-400 pb-1">Guest 1 Details</h2>
                    <p><strong>Name:</strong> {guests[0].name || 'N/A'}</p>
                    <p><strong>Date of Birth:</strong> {guests[0].dob || 'N/A'}</p>
                    <p><strong>Address:</strong> {guests[0].address || 'N/A'}</p>
                </div>
                <div>
                    <h2 className="text-2xl font-semibold mb-2 border-b border-gray-400 pb-1">Guest 2 Details</h2>
                    <p><strong>Name:</strong> {guests[1].name || 'N/A'}</p>
                    <p><strong>Date of Birth:</strong> {guests[1].dob || 'N/A'}</p>
                    <p><strong>Address:</strong> {guests[1].address || 'N/A'}</p>
                </div>
            </div>
            
            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-2 border-b border-gray-400 pb-1">Booking Information</h2>
                <p><strong>Contact Number:</strong> {phoneNumber || 'N/A'}</p>
                <p><strong>Server Code:</strong> {serverCode || 'N/A'}</p>
                <p><strong>Check-in Time:</strong> {checkInTime}</p>
            </div>


            <div className="mb-16">
                <h2 className="text-2xl font-semibold mb-4 border-b border-gray-400 pb-1">Aadhar Card Copies</h2>
                <div className="mb-6">
                    <h3 className="text-xl font-medium mb-2 text-center">Front Side</h3>
                    <div className="flex justify-around items-start gap-4">
                        <img src={guests[0].frontImageUrl} alt="Guest 1 Aadhar Front" className="w-[45%] border-2 border-black p-1" />
                        <img src={guests[1].frontImageUrl} alt="Guest 2 Aadhar Front" className="w-[45%] border-2 border-black p-1" />
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-medium mb-2 text-center">Back Side</h3>
                    <div className="flex justify-around items-start gap-4">
                        <img src={guests[0].backImageUrl} alt="Guest 1 Aadhar Back" className="w-[45%] border-2 border-black p-1" />
                        <img src={guests[1].backImageUrl} alt="Guest 2 Aadhar Back" className="w-[45%] border-2 border-black p-1" />
                    </div>
                </div>
            </div>

            <div className="mt-16 pt-8">
                <div className="flex justify-around items-center gap-12 text-center">
                    <div className="w-1/3">
                        <p className="border-t-2 border-dotted border-black pt-2 font-semibold">Guest 1 Signature</p>
                    </div>
                    <div className="w-1/3">
                        <p className="border-t-2 border-dotted border-black pt-2 font-semibold">Guest 2 Signature</p>
                    </div>
                </div>
            </div>
        </div>
    );
};


export const generateCheckInPDF = async (guests: [GuestDetails, GuestDetails], phoneNumber: string, serverCode: string, checkInTime: string): Promise<void> => {
    const pdfContainer = document.createElement('div');
    pdfContainer.style.position = 'absolute';
    pdfContainer.style.left = '-9999px';
    document.body.appendChild(pdfContainer);

    const root = ReactDOM.createRoot(pdfContainer);
    root.render(<PDFDocument guests={guests} phoneNumber={phoneNumber} serverCode={serverCode} checkInTime={checkInTime} />);
    
    // Allow images to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    const canvas = await html2canvas(pdfContainer.children[0] as HTMLElement, {
      scale: 2,
      useCORS: true,
    });
    
    document.body.removeChild(pdfContainer);
    root.unmount();
    
    const imgData = canvas.toDataURL('image/jpeg', 0.7);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`HS_Palace_Check-in_${guests[0].name || 'Guest'}_${new Date().toLocaleDateString()}.pdf`);
};