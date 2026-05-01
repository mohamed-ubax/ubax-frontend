import {
  create3,
  create4,
  delete1,
  delete2,
  getById3,
  getById4,
  list2,
  list3,
} from '@ubax-workspace/shared-api-types';
import { defineApiResourceConfig } from '@ubax-workspace/shared-data-access';

/**
 * Config API pour les dépenses comptables (/v1/expenses).
 *
 * Usage dans un composant :
 *
 *   const DepensesStore = createApiStore(depensesApiConfig);
 *
 *   @Component({ providers: [DepensesStore] })
 *   export class DepensesPageComponent {
 *     store = inject(DepensesStore);
 *
 *     totalDepenses = computed(() =>
 *       this.store.entities().reduce((s, d) => s + (d.amount ?? 0), 0)
 *     );
 *
 *     ngOnInit() {
 *       this.store.load({ pageable: { page: 0, size: 50, sort: [] } });
 *     }
 *   }
 */
export const depensesApiConfig = defineApiResourceConfig({
  list: list3,
  getById: getById4,
  create: create4,
  delete: delete2,
  mapList: (raw: unknown) => {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') {
      const record = raw as { content?: unknown; data?: unknown };

      if (Array.isArray(record.content)) return record.content;
      if (Array.isArray(record.data)) return record.data;
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

/**
 * Config API pour les paiements (/v1/payments).
 *
 * Usage :
 *   const PaiementsStore = createApiStore(paiementsApiConfig);
 */
export const paiementsApiConfig = defineApiResourceConfig({
  list: list2,
  getById: getById3,
  create: create3,
  delete: delete1,
  mapList: (raw: unknown) => {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') {
      const record = raw as { content?: unknown; data?: unknown };

      if (Array.isArray(record.content)) return record.content;
      if (Array.isArray(record.data)) return record.data;
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
