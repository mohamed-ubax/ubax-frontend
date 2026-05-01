import {
  archive,
  create2,
  getById,
  list1,
  PropertyResponse,
  update,
} from '@ubax-workspace/shared-api-types';
import { defineApiResourceConfig } from '@ubax-workspace/shared-data-access';

/**
 * Config API pour les biens immobiliers.
 *
 * Usage dans un composant :
 *
 *   import { createApiStore } from '@ubax-workspace/shared-data-access';
 *   import { biensApiConfig } from '@ubax-workspace/ubax-web-data-access';
 *
 *   const BiensStore = createApiStore(biensApiConfig);
 *
 *   @Component({ providers: [BiensStore] })
 *   export class BiensListComponent {
 *     store = inject(BiensStore);
 *
 *     // Computed locaux — propres à ce composant
 *     biensPublies = computed(() => this.store.entities().filter(b => b.status === 'PUBLISHED'));
 *     biensReserves = computed(() => this.store.entities().filter(b => b.status === 'RESERVED'));
 *
 *     ngOnInit() {
 *       this.store.load({ pageable: { page: 0, size: 20, sort: [] } });
 *     }
 *   }
 */
export const biensApiConfig = defineApiResourceConfig({
  list: list1,
  getById: getById,
  create: create2,
  update: update,
  delete: archive,
  mapGetById: (raw) => raw as unknown as PropertyResponse,
  mapList: (raw: unknown) => {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') {
      const record = raw as { content?: unknown; data?: unknown };

      if (Array.isArray(record.content)) return record.content;
      if (record.data && typeof record.data === 'object') {
        const nested = (record.data as { content?: unknown }).content;
        if (Array.isArray(nested)) {
          return nested;
        }
      }
    }

    return [];
  },
});
