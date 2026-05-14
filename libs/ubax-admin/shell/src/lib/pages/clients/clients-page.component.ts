import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { ClientUserResponse } from '@ubax-workspace/shared-api-types';
import {
  EmptyStateComponent,
  SearchFilterBarComponent,
  SectionCardComponent,
  StatusBadgeComponent,
  type FilterOption,
} from '@ubax-workspace/shared-design-system';
import { NOTIFICATION_HANDLER } from '@ubax-workspace/shared-data-access';
import { TableModule } from 'primeng/table';
import { AdminClientsService } from '../../services/admin-clients.service';

type StatusFilter = 'all' | 'active' | 'inactive';

const STATUS_FILTER_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Actifs', value: 'active' },
  { label: 'Inactifs', value: 'inactive' },
];

function normalizeText(v: string): string {
  return v
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function initials(c: ClientUserResponse): string {
  const f = c.firstName?.[0]?.toUpperCase() ?? '';
  const l = c.lastName?.[0]?.toUpperCase() ?? '';
  return f + l || '?';
}

@Component({
  selector: 'ubax-admin-clients-page',
  standalone: true,
  imports: [
    TableModule,
    SearchFilterBarComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
  ],
  templateUrl: './clients-page.component.html',
  styleUrl: './clients-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsPageComponent implements OnInit {
  private readonly svc = inject(AdminClientsService);
  private readonly notif = inject(NOTIFICATION_HANDLER);

  protected readonly loading = signal(false);
  protected readonly clients = signal<ClientUserResponse[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');

  protected readonly searchFilters: { label: string; options: FilterOption[] }[] = [
    { label: 'Tous les statuts', options: STATUS_FILTER_OPTIONS },
  ];

  protected readonly filteredClients = computed(() => {
    const query = normalizeText(this.searchQuery());
    const status = this.statusFilter();

    return this.clients().filter((c) => {
      const matchesStatus =
        status === 'all' ||
        (status === 'active' && !!c.active) ||
        (status === 'inactive' && !c.active);
      if (!matchesStatus) return false;

      if (query) {
        const text = normalizeText(
          [c.firstName, c.lastName, c.email, c.phone, c.city].filter(Boolean).join(' '),
        );
        if (!text.includes(query)) return false;
      }
      return true;
    });
  });

  protected readonly clientCount = computed(() => this.clients().length);

  ngOnInit(): void {
    void this.loadClients();
  }

  private async loadClients(): Promise<void> {
    this.loading.set(true);
    try {
      this.clients.set(await firstValueFrom(this.svc.listClients()));
    } catch {
      this.notif.error('Impossible de charger la liste des clients.');
    } finally {
      this.loading.set(false);
    }
  }

  protected getInitials(c: ClientUserResponse): string {
    return initials(c);
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  protected onFilterChange(event: { filter: string; value: unknown }): void {
    this.statusFilter.set((event.value as StatusFilter) ?? 'all');
  }

  protected formatLastLogin(dateStr?: string): string {
    if (!dateStr) return 'Jamais';
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`;
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
      .format(d);
  }
}
