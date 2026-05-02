import {
  create5,
  findAll,
  findAllByType,
  findAllByTypeAdmin,
  findById,
  update1,
} from '@ubax-workspace/shared-api-types';

export type CodeListApiConfig = {
  list: typeof findAll;
  getById: typeof findById;
  create: typeof create5;
  update: typeof update1;
  findAllByType: typeof findAllByType;
  findAllByTypeAdmin: typeof findAllByTypeAdmin;};

export const codeListApiConfig = {
  list: findAll,
  getById: findById,
  create: create5,
  update: update1,
  findAllByType,
  findAllByTypeAdmin,
} satisfies CodeListApiConfig;
