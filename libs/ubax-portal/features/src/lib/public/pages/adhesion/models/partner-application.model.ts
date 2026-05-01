export type ApplicationStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'INCOMPLETE'
  | 'APPROVED'
  | 'REJECTED';

export interface PartnerApplyRequest {
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
}

export interface ApplicationStatusLogResponse {
  id: string;
  previousStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  changedByName: string;
  comment?: string;
  changedAt: string;
}

export interface PartnerApplicationResponse {
  id: string;
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
  rccmUrl?: string;
  dfeUrl?: string;
  bailUrl?: string;
  logoUrl?: string;
  status: ApplicationStatus;
  submittedAt: string;
  reviewedByName?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: ApplicationStatusLogResponse[];
}

export interface PartnerApplyApiResponse {
  status: string;
  statusCode: number;
  message: string;
  data: PartnerApplicationResponse;
}
