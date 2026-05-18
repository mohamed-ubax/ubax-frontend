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
  DEFAULT_SPACE_ID,
  STATUS_ORDER,
  SHARED_HISTORY_ROWS,
  toDateValue,
  resolveSpaceId,
  buildCurrentHistoryEntry,
  resolveClientId,
} from '../../constants/client-detail.constants';
import type {
  ClientDetailData,
  ReservationHistoryTone,
  ReservationHistorySortKey,
  ReservationHistorySortDirection,
  ReservationHistoryEntry,
} from '../../types/client-detail.types';

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
