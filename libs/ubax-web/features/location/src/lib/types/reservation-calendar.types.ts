export type CalendarDay = {
  readonly date: Date;
  readonly label: number;
  readonly isCurrentMonth: boolean;
  readonly isActive: boolean;
};

export type CalendarReservationEvent = {
  readonly id: string;
  readonly guest: string;
  readonly property: string;
  readonly amount: string;
  readonly image: string;
  readonly start: Date;
  readonly end: Date;
  readonly tone: 'green' | 'orange' | 'blue';
  readonly dateRange: string;
  readonly startCol: number;
  readonly endCol: number;
  readonly row: number;
  readonly spanDays: number;
};

export type CalendarWeek = {
  readonly days: readonly CalendarDay[];
  readonly events: readonly CalendarReservationEvent[];
  readonly rowCount: number;
};

export type LegendEntry = {
  readonly property: string;
  readonly tone: 'green' | 'orange' | 'blue';
};

export type PropertyFilterOption = {
  readonly value: string;
  readonly label: string;
  readonly tone: 'neutral' | 'green' | 'orange' | 'blue';
};
