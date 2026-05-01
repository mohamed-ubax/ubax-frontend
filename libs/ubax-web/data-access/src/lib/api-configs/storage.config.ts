import {
  generatePresignedUrl,
  presignAgencyLogo,
  presignPropertyDocument,
  presignPropertyMedia,
  presignTenantDocument,
  presignTicketAttachment,
  upload,
  uploadAgencyLogo,
} from '@ubax-workspace/shared-api-types';

export interface StorageApiConfig {
  generatePresignedUrl: typeof generatePresignedUrl;
  upload: typeof upload;
  uploadAgencyLogo: typeof uploadAgencyLogo;
  presignAgencyLogo: typeof presignAgencyLogo;
  presignTicketAttachment: typeof presignTicketAttachment;
  presignTenantDocument: typeof presignTenantDocument;
  presignPropertyMedia: typeof presignPropertyMedia;
  presignPropertyDocument: typeof presignPropertyDocument;
}

export const storageApiConfig = {
  generatePresignedUrl,
  upload,
  uploadAgencyLogo,
  presignAgencyLogo,
  presignTicketAttachment,
  presignTenantDocument,
  presignPropertyMedia,
  presignPropertyDocument,
} satisfies StorageApiConfig;
