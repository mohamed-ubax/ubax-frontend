export type DashboardCommercialPlanningStatus = 'confirmed' | 'upcoming' | 'cancelled';
export type DashboardCommercialActivityPeriod = 'week' | 'month' | 'quarter';
export type DashboardCommercialProspectCode =
  | 'lun'
  | 'mar'
  | 'mer'
  | 'jeu'
  | 'ven'
  | 'sam'
  | 'dim';
export type DashboardCommercialStateTone = 'orange' | 'blue' | 'red' | 'green';

export type DashboardCommercialKpiCard = {
  label: string;
  value: string;
  iconSrc: string;
  iconAlt: string;
  variant: 'properties' | 'prospects' | 'appointments' | 'closed';
};

export type DashboardCommercialPlanningTimeLabel = {
  label: string;
  hour: number;
};

export type DashboardCommercialPlanningEventRecord = {
  id: string;
  customer: string;
  property: string;
  date: string;
  startHour: number;
  durationHours: 1 | 2 | 3;
  avatarFile: string;
  status: DashboardCommercialPlanningStatus;
  route: string;
};

export type DashboardCommercialPlanningEventView = {
  id: string;
  customer: string;
  property: string;
  dateKey: string;
  startHour: number;
  avatarSrc: string;
  arrowSrc: string;
  status: DashboardCommercialPlanningStatus;
  startClass: string;
  spanClass: string;
  route: string;
};

export type DashboardCommercialPlanningDay = {
  key: string;
  label: string;
  date: string;
  events: readonly DashboardCommercialPlanningEventView[];
};

export type DashboardCommercialActivityOption = {
  label: string;
  value: DashboardCommercialActivityPeriod;
};

export type DashboardCommercialProspectPoint = {
  code: DashboardCommercialProspectCode;
  label: string;
  value: number;
  highlighted: boolean;
};

export type DashboardCommercialStateItem = {
  label: string;
  value: number;
  tone: DashboardCommercialStateTone;
};

export type DashboardCommercialActivitySnapshot = {
  totalProperties: number;
  newProspects: number;
  closedDeals: number;
  highlightedProspectCode: DashboardCommercialProspectCode;
  prospects: readonly Omit<DashboardCommercialProspectPoint, 'highlighted'>[];
  stateItems: readonly DashboardCommercialStateItem[];
};

export type DashboardCommercialPropertyCard = {
  id: string;
  imageSrc: string;
  ownerAvatarSrc: string;
  title: string;
  location: string;
  owner: string;
  role: string;
  price: string;
  badge: string;
  route: string;
};

export type DashboardCommercialPlanningRecordInput = Omit<
  DashboardCommercialPlanningEventRecord,
  'route'
> & {
  route?: string;
};

export type DashboardCommercialPropertyCardInput = Omit<
  DashboardCommercialPropertyCard,
  'imageSrc' | 'ownerAvatarSrc' | 'route'
> & {
  propertyFile: string;
  ownerFile: string;
};
