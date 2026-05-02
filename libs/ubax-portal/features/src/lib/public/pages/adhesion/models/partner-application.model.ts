import type {
  ApplicationStatusLogResponse,
  PartnerApplicationResponse,
} from '@ubax-workspace/shared-api-types';

export type { ApplicationStatusLogResponse, PartnerApplicationResponse };

export type ApplicationStatus = NonNullable<
  PartnerApplicationResponse['status']
>;

export type PartnerApplyRequest = {
  partnerType: string;
  companyName: string;
  legalRepresentative: string;
  phone: string;
  email: string;
  country: string;
  city?: string;
  postalAddress?: string;
  zone?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  legalStatus: string;
  registrationNumber: string;
};

export type PartnerApplyApiResponse = {
  status: string;
  statusCode: number;
  message: string;
  data: PartnerApplicationResponse;
};
