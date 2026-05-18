export type RoomType = 'chambre' | 'conference' | 'evenement';
export type DiscountType = 'none' | '5' | '10' | '15' | '30' | 'promo';

export type ExtraOption = {
  id: string;
  label: string;
  selected: boolean;
  custom?: boolean;
};

export type PaymentMethod = {
  label: string;
  value: string;
  logoSrc?: string;
  badge?: string;
};
