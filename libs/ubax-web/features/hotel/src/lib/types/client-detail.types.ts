export type ClientDocument = {
  readonly label: string;
};

export type ReservationCharge = {
  readonly label: string;
  readonly amount: string;
};

export type ClientIdentity = {
  readonly name: string;
  readonly phone: string;
  readonly email: string;
  readonly portrait: string;
  readonly documents: readonly ClientDocument[];
};

export type ClientStayDetails = {
  readonly arrival: string;
  readonly departure: string;
  readonly guestCount: string;
  readonly roomType: string;
  readonly roomNumber: string;
  readonly rate: string;
  readonly category: string;
  readonly address: string;
};

export type ClientReservationSummary = {
  readonly thumbnails: readonly string[];
  readonly charges: readonly ReservationCharge[];
  readonly subtotal: string;
  readonly total: string;
  readonly paymentMethod: string;
  readonly paymentLogo: string;
};

export type ClientDetailData = {
  readonly identity: ClientIdentity;
  readonly stay: ClientStayDetails;
  readonly summary: ClientReservationSummary;
};
