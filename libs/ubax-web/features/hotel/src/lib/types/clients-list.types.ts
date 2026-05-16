export type StatusFilter = 'all' | 'active' | 'inactive';
export type VerifFilter = 'all' | 'verified' | 'unverified';

export type KpiCard = {
  label: string;
  value: number;
  accent: string;
  bg: string;
  icon: string;
};
