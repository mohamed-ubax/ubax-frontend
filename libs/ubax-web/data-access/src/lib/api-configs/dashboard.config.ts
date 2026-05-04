import { getAgencyDashboard } from '@ubax-workspace/shared-api-types';

export type DashboardApiConfig = {
  get: typeof getAgencyDashboard;};

export const dashboardApiConfig = {
  get: getAgencyDashboard,
} satisfies DashboardApiConfig;
