export type LocataireInfoItem = {
  readonly icon: string;
  readonly text: string;
  readonly tone: 'phone' | 'mail' | 'id-card' | 'work' | 'calendar' | 'file';
};

export type LocataireDocument = {
  readonly name: string;
};

export type LocatairePaymentItem = {
  readonly logo: string;
  readonly title: string;
  readonly amount: string;
  readonly period: string;
  readonly date: string;
  readonly widePeriod: boolean;
};
