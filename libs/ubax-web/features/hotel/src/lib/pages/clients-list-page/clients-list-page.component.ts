import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { UbaxMorphTabsDirective } from '@ubax-workspace/shared-ui';

import {
  CLIENT_DETAILS,
  type ClientDetailData,
} from '../client-detail-page/client-detail.data';

type ClientTabId = 'all' | 'active' | 'upcoming' | 'archived';
type ClientListTone = 'active' | 'upcoming' | 'archived';

type ClientListRow = {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly initials: string;
  readonly email: string;
  readonly phone: string;
  readonly roomLabel: string;
  readonly stayPeriod: string;
  readonly address: string;
  readonly total: string;
  readonly status: string;
  readonly tone: ClientListTone;
  readonly primarySpaceId: string;};

const TAB_LABELS: Record<ClientTabId, string> = {
  all: 'Tous les clients',
  active: 'En séjour',
  upcoming: 'À venir',
  archived: 'Archivés',
};

const STATUS_ORDER: Record<ClientListTone, number> = {
  active: 0,
  upcoming: 1,
  archived: 2,
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

function buildClientStatus(stay: ClientDetailData['stay']): {
  label: string;
  tone: ClientListTone;
} {
  const arrival = parseFrenchDate(stay.arrival);
  const departure = parseFrenchDate(stay.departure);
  const today = new Date();
  const todayAtMidday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    12,
    0,
    0,
    0,
  );

  if (arrival && departure) {
    if (todayAtMidday < arrival) {
      return { label: 'À venir', tone: 'upcoming' };
    }

    if (todayAtMidday > departure) {
      return { label: 'Archivé', tone: 'archived' };
    }
  }

  return { label: 'En séjour', tone: 'active' };
}

function toInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function buildClientCode(id: string): string {
  return '#CL-' + id.padStart(3, '0');
}

function buildPrimarySpaceId(id: string): string {
  const numericId = Number(id);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    return '1';
  }

  return String(((Math.trunc(numericId) - 1) % 3) + 1);
}

@Component({
  selector: 'ubax-clients-list-page',
  standalone: true,
  imports: [RouterLink, UbaxMorphTabsDirective],
  templateUrl: './clients-list-page.component.html',
  styleUrl: './clients-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsListPageComponent {
  readonly activeTab = signal<ClientTabId>('all');
  readonly searchValue = signal('');

  readonly allClients = computed<ClientListRow[]>(() =>
    Object.entries(CLIENT_DETAILS)
      .map(([id, client]) => {
        const status = buildClientStatus(client.stay);

        return {
          id,
          code: buildClientCode(id),
          name: client.identity.name,
          initials: toInitials(client.identity.name),
          email: client.identity.email,
          phone: client.identity.phone,
          roomLabel: client.stay.roomType + ' · ' + client.stay.roomNumber,
          stayPeriod: client.stay.arrival + ' - ' + client.stay.departure,
          address: client.stay.address,
          total: client.summary.total,
          status: status.label,
          tone: status.tone,
          primarySpaceId: buildPrimarySpaceId(id),
        };
      })
      .sort((left, right) => {
        const toneDifference =
          STATUS_ORDER[left.tone] - STATUS_ORDER[right.tone];
        if (toneDifference !== 0) {
          return toneDifference;
        }

        return left.name.localeCompare(right.name, 'fr');
      }),
  );

  readonly tabs = computed(() => {
    const clients = this.allClients();

    return [
      { id: 'all' as const, label: TAB_LABELS.all, count: clients.length },
      {
        id: 'active' as const,
        label: TAB_LABELS.active,
        count: clients.filter((client) => client.tone === 'active').length,
      },
      {
        id: 'upcoming' as const,
        label: TAB_LABELS.upcoming,
        count: clients.filter((client) => client.tone === 'upcoming').length,
      },
      {
        id: 'archived' as const,
        label: TAB_LABELS.archived,
        count: clients.filter((client) => client.tone === 'archived').length,
      },
    ];
  });

  readonly filteredClients = computed(() => {
    const search = normalizeDateLabel(this.searchValue().trim());

    return this.allClients().filter((client) => {
      const matchesTab =
        this.activeTab() === 'all' ||
        (this.activeTab() === 'active' && client.tone === 'active') ||
        (this.activeTab() === 'upcoming' && client.tone === 'upcoming') ||
        (this.activeTab() === 'archived' && client.tone === 'archived');

      if (!matchesTab) {
        return false;
      }

      if (!search) {
        return true;
      }

      return normalizeDateLabel(
        [
          client.name,
          client.code,
          client.email,
          client.phone,
          client.roomLabel,
          client.stayPeriod,
          client.address,
          client.status,
        ].join(' '),
      ).includes(search);
    });
  });

  setTab(tabId: ClientTabId): void {
    this.activeTab.set(tabId);
  }

  updateSearch(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.searchValue.set(target.value);
    }
  }
}
