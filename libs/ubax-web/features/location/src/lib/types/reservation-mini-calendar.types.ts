export type MiniCalendarCell = {
  readonly label: string;
  readonly muted: boolean;
  readonly active: boolean;
};

export type MiniCalendarWeek = readonly MiniCalendarCell[];
