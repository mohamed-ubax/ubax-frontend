export type ReservationContactItem = {
  readonly label: string;
  readonly value: string;
  readonly icon: string;
  readonly href?: string;
  readonly external?: boolean;
};

export type ReservationPricingRow = {
  readonly label: string;
  readonly value: string;
};
