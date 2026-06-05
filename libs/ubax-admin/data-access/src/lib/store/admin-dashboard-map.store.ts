import { inject, Injectable, signal } from '@angular/core';
import {
  Api,
  type PropertyResponse,
  listAgencyProperties,
  listHotelProperties,
} from '@ubax-workspace/shared-api-types';
import { resolveHttpErrorMessage } from '@ubax-workspace/shared-data-access';
import { readCollection } from '../admin-response.helpers';

export interface AdminDashboardMapPoint {
  latitude: number;
  longitude: number;
  tone: 'hotel' | 'agency';
}

@Injectable({ providedIn: 'root' })
export class AdminDashboardMapStore {
  private readonly api = inject(Api);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly points = signal<AdminDashboardMapPoint[]>([]);

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const [hotelRaw, agencyRaw] = await Promise.all([
        this.api.invoke(listHotelProperties, {
          pageable: { page: 0, size: 200, sort: ['createdAt,desc'] },
        }),
        this.api.invoke(listAgencyProperties, {
          pageable: { page: 0, size: 200, sort: ['createdAt,desc'] },
        }),
      ]);

      const hotelPoints = this.toPoints(hotelRaw, 'hotel');
      const agencyPoints = this.toPoints(agencyRaw, 'agency');

      const uniquePoints = [...hotelPoints, ...agencyPoints].filter(
        (point, index, list) =>
          list.findIndex(
            (candidate) =>
              candidate.tone === point.tone &&
              Math.abs(candidate.latitude - point.latitude) < 0.000001 &&
              Math.abs(candidate.longitude - point.longitude) < 0.000001,
          ) === index,
      );

      this.points.set(uniquePoints.slice(0, 80));
    } catch (error) {
      this.error.set(
        resolveHttpErrorMessage(
          error,
          'Impossible de charger les points geographiques du dashboard.',
        ),
      );
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  private toPoints(
    raw: unknown,
    tone: 'hotel' | 'agency',
  ): AdminDashboardMapPoint[] {
    return readCollection(raw)
      .map((item) => item as PropertyResponse)
      .filter(
        (property) =>
          typeof property.latitude === 'number' &&
          typeof property.longitude === 'number',
      )
      .map((property) => ({
        latitude: property.latitude as number,
        longitude: property.longitude as number,
        tone,
      }));
  }
}
