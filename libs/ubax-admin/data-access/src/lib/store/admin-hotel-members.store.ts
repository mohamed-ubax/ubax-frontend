import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiConfiguration } from '@ubax-workspace/shared-api-types';
import { resolveHttpErrorMessage } from '@ubax-workspace/shared-data-access';
import {
  type MemberResponse,
  normalizeMemberCollection,
} from '../admin-response.helpers';

@Injectable({ providedIn: 'root' })
export class AdminHotelMembersStore {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfiguration);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly members = signal<MemberResponse[]>([]);

  private mergeMembers(...collections: MemberResponse[][]): MemberResponse[] {
    const merged = new Map<string, MemberResponse>();

    for (const collection of collections) {
      for (const member of collection) {
        const key = member.userId ?? member.email ?? crypto.randomUUID();
        if (!merged.has(key)) {
          merged.set(key, member);
        }
      }
    }

    return Array.from(merged.values());
  }

  async load(
    hotelId: string,
    options?: { scope?: 'active' | 'inactive' | 'all' },
  ): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const activeMembersRequest = firstValueFrom(
        this.http.get<unknown>(
          `${this.config.rootUrl}/v1/admin/hotels/${hotelId}/members`,
        ),
      );

      if (options?.scope === 'inactive') {
        const inactiveRaw = await firstValueFrom(
          this.http.get<unknown>(
            `${this.config.rootUrl}/v1/admin/hotels/${hotelId}/members/inactive`,
          ),
        );

        this.members.set(normalizeMemberCollection(inactiveRaw));
        return;
      }

      if (options?.scope === 'all') {
        const [activeRaw, inactiveRaw] = await Promise.all([
          activeMembersRequest,
          firstValueFrom(
            this.http.get<unknown>(
              `${this.config.rootUrl}/v1/admin/hotels/${hotelId}/members/inactive`,
            ),
          ),
        ]);

        this.members.set(
          this.mergeMembers(
            normalizeMemberCollection(activeRaw),
            normalizeMemberCollection(inactiveRaw),
          ),
        );
        return;
      }

      const activeRaw = await activeMembersRequest;
      this.members.set(normalizeMemberCollection(activeRaw));
    } catch (error) {
      this.error.set(
        resolveHttpErrorMessage(
          error,
          "Impossible de charger les membres de l'hôtel.",
        ),
      );
      throw error;
    } finally {
      this.loading.set(false);
    }
  }
}
