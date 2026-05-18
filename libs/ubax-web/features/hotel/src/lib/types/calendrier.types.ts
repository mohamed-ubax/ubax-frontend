export type CalReservation = {
  id: string;
  guest: string;
  property: string;
  amount: string;
  dateRange: string;
  start: Date;
  end: Date;
  image: string;
  color: 'green' | 'blue' | 'orange';
};

export type CalReservationTemplate = {
  id: string;
  guest: string;
  property: string;
  amount: string;
  startDay: number;
  durationDays: number;
  image: string;
  color: 'green' | 'blue' | 'orange';
};

export type CalendarDay = {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};

export type CalendarWeekEvent = CalReservation & {
  startCol: number;
  endCol: number;
  row: number;
  spanDays: number;
};

export type WeekWithEvents = {
  days: CalendarDay[];
  events: CalendarWeekEvent[];
  rowCount: number;
  minHeight: number;
};
