export type TrendRangeKey = 'jan-jun' | 'apr-sep' | 'jul-dec';

export type ReservationMonth = {
  label: string;
  active?: boolean;
};

export type TrendRangeOption = {
  label: string;
  value: TrendRangeKey;
};

export type TrendRangeConfig = {
  months: string[];
  values: number[];
  activeIndex: number;
  count: number;
  growth: string;
};

export type NotificationItem = {
  id: number;
  type: 'new' | 'cancel' | 'confirm';
  title: string;
  subtitle: string;
  time: string;
};

export type ReservationRow = {
  id: string;
  image: string;
  guest: string;
  room: string;
  duration: string;
  dates: string;
  status: string;
};

export type PropertyCard = {
  id: string;
  image: string;
  title: string;
  city: string;
  typeLabel: string;
  statusLabel: string;
  price: string;
};
