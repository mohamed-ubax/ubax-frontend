import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import {
  CLIENT_DETAILS,
  DEFAULT_CLIENT_ID,
  type ClientDetailData,
} from './client-detail.data';

type ReservationHistoryTone = 'active' | 'completed' | 'cancelled';
type ReservationHistorySortKey =
  | 'space'
  | 'bookingDate'
  | 'stayPeriod'
  | 'amount'
  | 'status';
type ReservationHistorySortDirection = 'asc' | 'desc';

interface ReservationHistoryEntry {
  readonly id: string;
  readonly spaceId: string;
  readonly thumbnail: string;
  readonly title: string;
  readonly subtitle: string;
  readonly bookingDate: string;
  readonly stayPeriod: string;
  readonly amount: string;
  readonly amountValue: number;
  readonly createdAt: number;
  readonly status: string;
  readonly tone: ReservationHistoryTone;
}

const DEFAULT_SPACE_ID = '1';

const STATUS_ORDER: Record<ReservationHistoryTone, number> = {
  active: 0,
  completed: 1,
  cancelled: 2,
};

const FRENCH_MONTHS: Record<string, number> = {
  janvier: 0,
  fevrier: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  aout: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  decembre: 11,
};

const SHARED_HISTORY_ROWS: readonly ReservationHistoryEntry[] = [
  {
    id: 'history-01',
    spaceId: '2',
    thumbnail: 'shared/rooms/room-photo-02.webp',
    title: 'Suite panoramic',
    subtitle: 'Hôtel Riviera Golf',
    bookingDate: 'Mardi 12 mai 2026',
    stayPeriod: '12 mai 2026 - 14 mai 2026',
    amount: '120 000 FCFA',
    amountValue: 120000,
    createdAt: 202605120930,
    status: 'Terminée',
    tone: 'completed',
  },
  {
    id: 'history-02',
    spaceId: '3',
    thumbnail: 'shared/rooms/room-photo-04.webp',
    title: 'Chambre business',
    subtitle: 'Résidence Marcory',
    bookingDate: 'Jeudi 08 avril 2026',
    stayPeriod: '08 avril 2026 - 10 avril 2026',
    amount: '95 000 FCFA',
    amountValue: 95000,
    createdAt: 202604081100,
    status: 'Terminée',
    tone: 'completed',
  },
  {
    id: 'history-03',
    spaceId: '1',
    thumbnail: 'shared/rooms/room-photo-03.webp',
    title: 'Studio executive',
    subtitle: 'Abidjan Cocody',
    bookingDate: 'Lundi 15 mars 2026',
    stayPeriod: '15 mars 2026 - 16 mars 2026',
    amount: '65 000 FCFA',
    amountValue: 65000,
    createdAt: 202603150845,
    status: 'Annulée',
    tone: 'cancelled',
  },
];

const CLIENT_DETAIL_KEYS = Object.keys(CLIENT_DETAILS);

function normalizeDateLabel(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .split(/[\u0300-\u036f]/g)
    .join('');
}

function parseFrenchDate(label: string): Date | null {
  const normalizedLabel = normalizeDateLabel(label);
  const match = /(\d{1,2})\s+([a-z]+)\s+(\d{4})/.exec(normalizedLabel);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = FRENCH_MONTHS[match[2] ?? ''];
  const year = Number(match[3]);

  if (!Number.isFinite(day) || month === undefined || !Number.isFinite(year)) {
    return null;
  }

  return new Date(year, month, day, 12, 0, 0, 0);
}

function toDateValue(label: string): number {
  return parseFrenchDate(label)?.getTime() ?? 0;
}

function resolveSpaceId(rawId: string | null | undefined): string {
  if (!rawId) {
    return DEFAULT_SPACE_ID;
  }

  return rawId;
}

function buildCurrentHistoryEntry(
  clientId: string,
  spaceId: string,
  client: ClientDetailData,
): ReservationHistoryEntry {
  const amountDigits = client.summary.total.match(/\d+/g)?.join('') ?? '0';

  return {
    id: clientId + '-current',
    spaceId,
    thumbnail:
      client.summary.thumbnails[0] ?? 'shared/rooms/room-photo-03.webp',
    title: client.stay.roomType,
    subtitle: client.stay.category + ' · ' + client.stay.roomNumber,
    bookingDate: client.stay.arrival,
    stayPeriod: client.stay.arrival + ' - ' + client.stay.departure,
    amount: client.summary.total,
    amountValue: Number(amountDigits) || 0,
    createdAt: 202606150900 + Number(clientId),
    status: 'En cours',
    tone: 'active',
  };
}

function resolveClientId(rawId: string): string {
  if (CLIENT_DETAILS[rawId]) {
    return rawId;
  }

  const numericId = Number(rawId);
  if (
    Number.isFinite(numericId) &&
    numericId > 0 &&
    CLIENT_DETAIL_KEYS.length
  ) {
    const normalizedIndex =
      (((Math.trunc(numericId) - 1) % CLIENT_DETAIL_KEYS.length) +
        CLIENT_DETAIL_KEYS.length) %
      CLIENT_DETAIL_KEYS.length;

    return CLIENT_DETAIL_KEYS[normalizedIndex] ?? DEFAULT_CLIENT_ID;
  }

  return DEFAULT_CLIENT_ID;
}

@Component({
  selector: 'ubax-client-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './client-detail-page.component.html',
  styleUrl: './client-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly historySearch = signal('');
  private readonly historySort = signal<{
    key: ReservationHistorySortKey;
    direction: ReservationHistorySortDirection;
  }>({
    key: 'bookingDate',
    direction: 'desc',
  });
  private readonly selectedHistoryIds = signal<string[]>([]);

  private readonly requestedClientId = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('id') ?? DEFAULT_CLIENT_ID),
    ),
    {
      initialValue: this.route.snapshot.paramMap.get('id') ?? DEFAULT_CLIENT_ID,
    },
  );

  private readonly requestedSpaceId = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => resolveSpaceId(params.get('spaceId'))),
    ),
    {
      initialValue: resolveSpaceId(
        this.route.snapshot.queryParamMap.get('spaceId'),
      ),
    },
  );

  readonly clientId = computed(() => resolveClientId(this.requestedClientId()));
  readonly spaceId = computed(() => this.requestedSpaceId());
  readonly client = computed(
    () => CLIENT_DETAILS[this.clientId()] ?? CLIENT_DETAILS[DEFAULT_CLIENT_ID],
  );
  readonly historySearchValue = computed(() => this.historySearch());
  readonly historySortLabel = computed(() => {
    const activeSort = this.historySort();

    if (activeSort.key !== 'bookingDate') {
      return 'Trier par récent';
    }

    return activeSort.direction === 'desc'
      ? 'Trier par récent'
      : 'Trier par ancien';
  });
  readonly historyRows = computed(() => {
    const clientId = this.clientId();
    const currentClient = this.client();
    const baseRows = SHARED_HISTORY_ROWS.map((row) => ({
      ...row,
      id: clientId + '-' + row.id,
    }));

    const rows = [
      buildCurrentHistoryEntry(clientId, this.spaceId(), currentClient),
      ...baseRows,
    ];
    const search = this.historySearch().trim().toLowerCase();
    const filteredRows = search
      ? rows.filter((row) =>
          [row.title, row.subtitle, row.bookingDate, row.stayPeriod, row.status]
            .join(' ')
            .toLowerCase()
            .includes(search),
        )
      : rows;

    const activeSort = this.historySort();
    const directionFactor = activeSort.direction === 'asc' ? 1 : -1;

    return [...filteredRows].sort((left, right) => {
      if (activeSort.key === 'space') {
        return (
          directionFactor *
          left.title.localeCompare(right.title, 'fr', { sensitivity: 'base' })
        );
      }

      if (activeSort.key === 'stayPeriod') {
        return (
          directionFactor *
          (toDateValue(left.stayPeriod) - toDateValue(right.stayPeriod))
        );
      }

      if (activeSort.key === 'amount') {
        return directionFactor * (left.amountValue - right.amountValue);
      }

      if (activeSort.key === 'status') {
        const toneDifference =
          STATUS_ORDER[left.tone] - STATUS_ORDER[right.tone];
        if (toneDifference !== 0) {
          return directionFactor * toneDifference;
        }

        return (
          directionFactor *
          left.status.localeCompare(right.status, 'fr', { sensitivity: 'base' })
        );
      }

      return directionFactor * (left.createdAt - right.createdAt);
    });
  });
  readonly allHistoryRowsSelected = computed(() => {
    const visibleRows = this.historyRows();
    const selectedIds = new Set(this.selectedHistoryIds());

    return (
      visibleRows.length > 0 &&
      visibleRows.every((row) => selectedIds.has(row.id))
    );
  });
  readonly partiallySelectedHistoryRows = computed(() => {
    const visibleRows = this.historyRows();
    const selectedIds = new Set(this.selectedHistoryIds());
    const selectedVisibleRowsCount = visibleRows.filter((row) =>
      selectedIds.has(row.id),
    ).length;

    return (
      selectedVisibleRowsCount > 0 &&
      selectedVisibleRowsCount < visibleRows.length
    );
  });

  goBack(): void {
    this.location.back();
  }

  updateHistorySearch(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.historySearch.set(target.value);
    }
  }

  isHistorySortedBy(column: ReservationHistorySortKey): boolean {
    return this.historySort().key === column;
  }

  historySortDirectionFor(
    column: ReservationHistorySortKey,
  ): ReservationHistorySortDirection | null {
    return this.isHistorySortedBy(column) ? this.historySort().direction : null;
  }

  historyAriaSort(
    column: ReservationHistorySortKey,
  ): 'ascending' | 'descending' | 'none' {
    const direction = this.historySortDirectionFor(column);

    if (!direction) {
      return 'none';
    }

    return direction === 'asc' ? 'ascending' : 'descending';
  }

  setHistorySort(column: ReservationHistorySortKey): void {
    this.historySort.update((currentSort) => {
      if (currentSort.key === column) {
        return {
          key: column,
          direction: currentSort.direction === 'asc' ? 'desc' : 'asc',
        };
      }

      return {
        key: column,
        direction:
          column === 'amount' || column === 'bookingDate' ? 'desc' : 'asc',
      };
    });
  }

  toggleHistorySort(): void {
    this.historySort.update((currentSort) => {
      if (currentSort.key !== 'bookingDate') {
        return {
          key: 'bookingDate',
          direction: 'desc',
        };
      }

      return {
        key: 'bookingDate',
        direction: currentSort.direction === 'desc' ? 'asc' : 'desc',
      };
    });
  }

  isHistoryRowSelected(rowId: string): boolean {
    return this.selectedHistoryIds().includes(rowId);
  }

  toggleHistorySelection(rowId: string): void {
    this.selectedHistoryIds.update((currentIds) =>
      currentIds.includes(rowId)
        ? currentIds.filter((id) => id !== rowId)
        : [...currentIds, rowId],
    );
  }

  toggleAllHistorySelections(): void {
    this.selectedHistoryIds.update((currentIds) => {
      const visibleRowIds = this.historyRows().map((row) => row.id);
      const allSelected = visibleRowIds.every((id) => currentIds.includes(id));

      if (allSelected) {
        return currentIds.filter((id) => !visibleRowIds.includes(id));
      }

      return [...new Set([...currentIds, ...visibleRowIds])];
    });
  }
}
