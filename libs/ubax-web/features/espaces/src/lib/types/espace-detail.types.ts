export type GuestProfile = {
  readonly clientId: string;
  readonly name: string;
  readonly code: string;
  readonly avatar: string;
};

export type ReservationDetail = {
  readonly title: string;
  readonly type: string;
  readonly capacity: string;
  readonly bookingDate: string;
  readonly bookingTime: string;
  readonly stayDuration: string;
  readonly facilities: readonly string[];
};

export type GalleryPhoto = {
  readonly key: string;
  readonly src: string | null;
  readonly alt: string;
  readonly isPlaceholder: boolean;
  readonly previewCount?: number;
};

export type HistoryRow = {
  readonly id: number;
  readonly clientId: string;
  readonly guestName: string;
  readonly property: string;
  readonly duration: string;
  readonly period: string;
  readonly status: 'Confirme';
  readonly avatar: string;
};

export type LegalDocument = {
  readonly id: string;
  readonly name: string;
  readonly fileUrl: string;
  readonly extension: string;
  readonly kindLabel: string;
};
