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
  id: number;
  image: string;
  guest: string;
  room: string;
  duration: string;
  dates: string;
  status: string;
};

export type PropertyCard = {
  id: number;
  image: string;
  tenantAvatar: string;
  tenantName: string;
  price: string;
};
