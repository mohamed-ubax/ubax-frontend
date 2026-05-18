export type CalendarView = 'jour' | 'semaine' | 'mois' | 'annee';

export type EmployeDocument = {
  nom: string;
};

export type SalaryPayment = {
  label: string;
  date: string;
  mois: string;
  montant: string;
};

export type CalendarEvent = {
  type: 'shift' | 'conge';
  label: string;
};

export type CalendarDay = {
  date: number;
  isGhost: boolean;
  events: CalendarEvent[];
};

export type EmployePageAction = {
  readonly label: string;
  readonly iconSrc: string;
  readonly variant: 'edit' | 'archive';
};

export type EmployeProfileContact = {
  readonly label: string;
  readonly value: string;
  readonly iconSrc: string;
  readonly hasFramedIcon?: boolean;
};
