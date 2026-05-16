export type TenantStatus =
  | 'INCOMPLETE'
  | 'PENDING_REVIEW'
  | 'QUALIFIED'
  | 'REJECTED'
  | 'BLACKLISTED';

export type SelectOption<T> = { label: string; value: T };

export type KycKpiCard = {
  label: string;
  value: number;
  accent: string;
  bg: string;
  icon: string;
};
