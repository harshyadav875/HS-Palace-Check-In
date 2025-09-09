
import { GoogleGenAI, Type } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const extractAadharData = async (imageFile: File, side: 'front' | 'back'): Promise<Partial<{ name: string; dob: string; address: string }>> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  try {
    const imagePart = await fileToGenerativePart(imageFile);
    let prompt: string;
    let responseSchema: any;

    if (side === 'front') {
      prompt = "From the provided image of an Indian Aadhaar card, extract the person's full name and their date of birth. The date of birth should be in DD/MM/YYYY format.";
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Person's full name" },
          dob: { type: Type.STRING, description: "Date of Birth in DD/MM/YYYY format" },
        },
        required: ["name", "dob"],
      };
    } else {
      prompt = "From the provided image of the back of an Indian Aadhaar card, extract the full address.";
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          address: { type: Type.STRING, description: "Full address including Pincode" },
        },
        required: ["address"],
      };
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    });
    
    const text = response.text.trim();
    return JSON.parse(text);

  } catch (error) {
    console.error("Error extracting Aadhar data:", error);
    throw new Error("Failed to extract data from the image. Please try again with a clearer image.");
  }
};
