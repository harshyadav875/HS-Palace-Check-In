
export interface GuestDetails {
  name: string;
  dob: string;
  address: string;
  frontImage: File | null;
  frontImageUrl: string;
  backImage: File | null;
  backImageUrl: string;
}

export interface LoadingState {
  guest1Front: boolean;
  guest1Back: boolean;
  guest2Front: boolean;
  guest2Back: boolean;
  pdf: boolean;
}
