export type { LaCodeListDto } from '@ubax-workspace/shared-api-types';

import type { LaCodeListDto } from '@ubax-workspace/shared-api-types';

export type CodeListResponse = {
  status: string;
  statusCode: number;
  message: string;
  data: LaCodeListDto[];
};
