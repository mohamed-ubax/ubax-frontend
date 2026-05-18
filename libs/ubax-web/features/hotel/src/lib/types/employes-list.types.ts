export type TabId = 'all' | 'active' | 'inactive';
export type EmployeStatusTone = 'active' | 'inactive';

export type EmployeRow = {
  readonly id: string;
  readonly nom: string;
  readonly poste: string;
  readonly description: string;
  readonly joursTravail: string;
  readonly horaires: string;
  readonly telephone: string;
  readonly avatarSrc: string;
  readonly statusTone: EmployeStatusTone;
};

export type EmployeTab = {
  readonly id: TabId;
  readonly label: string;
  readonly count: number;
};
