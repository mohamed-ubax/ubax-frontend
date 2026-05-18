import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UbaxPaginatorComponent } from '@ubax-workspace/shared-ui';
import { HotelClientsStore } from '@ubax-workspace/ubax-web-data-access';
import { SelectModule } from 'primeng/select';
import type { StatusFilter, VerifFilter, KpiCard } from '../../types/clients-list.types';
import {
  PAGE_SIZE,
  normalizeText,
  initials,
} from '../../constants/clients-list.constants';

@Component({
  selector: 'ubax-clients-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, UbaxPaginatorComponent],
  templateUrl: './clients-list-page.component.html',
  styleUrl: './clients-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsListPageComponent {
  readonly store = inject(HotelClientsStore);

  readonly searchTerm = signal('');
  readonly filterStatus = signal<StatusFilter>('all');
  readonly filterVerif = signal<VerifFilter>('all');
  readonly currentPage = signal(1);
  private readonly hasLoaded = signal(false);

  readonly statusOptions: { label: string; value: StatusFilter }[] = [
    { label: 'Tous les statuts', value: 'all' },
    { label: 'Actifs', value: 'active' },
    { label: 'Inactifs', value: 'inactive' },
  ];

  readonly verifOptions: { label: string; value: VerifFilter }[] = [
    { label: 'Toutes vérifications', value: 'all' },
    { label: 'Identité vérifiée', value: 'verified' },
    { label: 'Non vérifiés', value: 'unverified' },
  ];

  readonly viewState = computed(() => {
    if (this.store.loading() && !this.hasLoaded()) return 'loading';
    if (this.store.error()) return 'error';
    if (!this.store.loading() && this.store.entities().length === 0 && this.hasLoaded()) return 'empty';
    return 'success';
  });

  readonly kpiCards = computed<KpiCard[]>(() => {
    const all = this.store.entities();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return [
      {
        label: 'Total clients',
        value: all.length,
        accent: 'var(--ubax-info)',
        bg: 'var(--ubax-blue-soft)',
        icon: 'pi pi-users',
      },
      {
        label: 'Comptes actifs',
        value: all.filter((c) => c.active).length,
        accent: 'var(--ubax-success)',
        bg: 'var(--ubax-success-soft)',
        icon: 'pi pi-check-circle',
      },
      {
        label: 'Identité vérifiée',
        value: all.filter((c) => c.identityVerified).length,
        accent: 'var(--ubax-accent)',
        bg: 'var(--ubax-peach-soft)',
        icon: 'pi pi-shield',
      },
      {
        label: 'Nouveaux ce mois',
        value: all.filter((c) => c.createdAt && new Date(c.createdAt) >= startOfMonth).length,
        accent: '#7c3aed',
        bg: 'rgba(124, 58, 237, 0.08)',
        icon: 'pi pi-user-plus',
      },
    ];
  });

  readonly clientsActifs = computed(() => this.store.entities().filter((c) => c.active));
  readonly clientsInactifs = computed(() => this.store.entities().filter((c) => !c.active));
  readonly clientsVerifies = computed(() => this.store.entities().filter((c) => c.identityVerified));

  readonly filteredClients = computed(() => {
    const query = normalizeText(this.searchTerm());
    const status = this.filterStatus();
    const verif = this.filterVerif();

    return this.store.entities().filter((c) => {
      if (status === 'active' && !c.active) return false;
      if (status === 'inactive' && c.active) return false;
      if (verif === 'verified' && !c.identityVerified) return false;
      if (verif === 'unverified' && c.identityVerified) return false;

      if (query) {
        const text = normalizeText(
          [c.firstName, c.lastName, c.email, c.phone, c.city].filter(Boolean).join(' '),
        );
        if (!text.includes(query)) return false;
      }
      return true;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredClients().length / PAGE_SIZE)),
  );

  readonly pagedClients = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredClients().slice(start, start + PAGE_SIZE);
  });

  readonly resultsLabel = computed(() => {
    const total = this.filteredClients().length;
    if (!total) return 'Aucun résultat';
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(start + PAGE_SIZE - 1, total);
    return `${start}–${end} sur ${total} client${total > 1 ? 's' : ''}`;
  });

  constructor() {
    effect(() => {
      this.store.load!({ pageable: { page: 0, size: 200 } });
    });

    effect(() => {
      if (!this.store.loading() && !this.hasLoaded()) {
        this.hasLoaded.set(true);
      }
    });

    effect(() => {
      this.searchTerm();
      this.filterStatus();
      this.filterVerif();
      this.currentPage.set(1);
    });
  }

  getInitials(firstName?: string, lastName?: string): string {
    return initials(firstName, lastName);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  }

  formatLastLogin(dateStr?: string): string {
    if (!dateStr) return 'Jamais';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`;
    return this.formatDate(dateStr);
  }

  onFilterVerifChange(v: unknown): void {
    this.filterVerif.set(v as VerifFilter);
  }

  onFilterStatusChange(v: unknown): void {
    this.filterStatus.set(v as StatusFilter);
  }

  onSearch(term: unknown): void {
    this.searchTerm.set(typeof term === 'string' ? term : '');
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  retryLoad(): void {
    this.hasLoaded.set(false);
    this.store.load!({ pageable: { page: 0, size: 200 } });
  }
}
