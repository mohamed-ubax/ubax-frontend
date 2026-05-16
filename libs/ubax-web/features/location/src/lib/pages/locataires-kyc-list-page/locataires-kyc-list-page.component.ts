import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UbaxPaginatorComponent } from '@ubax-workspace/shared-ui';
import { LocationStore } from '@ubax-workspace/ubax-web-data-access';
import { SelectModule } from 'primeng/select';
import type {
  TenantStatus,
  SelectOption,
  KycKpiCard,
} from '../../types/locataires-kyc-list.types';
import {
  STATUS_META,
  KYC_PAGE_SIZE,
  normalizeKycText,
} from '../../constants/locataires-kyc-list.constants';

@Component({
  selector: 'ubax-locataires-kyc-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, UbaxPaginatorComponent],
  templateUrl: './locataires-kyc-list-page.component.html',
  styleUrl: './locataires-kyc-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocatairesKycListPageComponent {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  readonly store = inject(LocationStore);

  readonly searchTerm = signal('');
  readonly filterStatus = signal<TenantStatus | 'all'>('all');
  readonly currentPage = signal(1);
  private readonly hasLoaded = signal(false);

  readonly statusOptions: SelectOption<TenantStatus | 'all'>[] = [
    { label: 'Tous les statuts', value: 'all' },
    { label: 'Incomplet', value: 'INCOMPLETE' },
    { label: 'En attente', value: 'PENDING_REVIEW' },
    { label: 'Qualifié', value: 'QUALIFIED' },
    { label: 'Rejeté', value: 'REJECTED' },
    { label: 'Blacklisté', value: 'BLACKLISTED' },
  ];

  readonly viewState = computed(() => {
    if (this.store.loading() && !this.hasLoaded()) return 'loading';
    if (this.store.error()) return 'error';
    if (
      !this.store.loading() &&
      this.store.entities().length === 0 &&
      this.hasLoaded()
    )
      return 'empty';
    return 'success';
  });

  readonly kpiCards = computed<KycKpiCard[]>(() => {
    const all = this.store.entities();
    return [
      {
        label: 'Total dossiers',
        value: all.length,
        accent: 'var(--ubax-info)',
        bg: 'var(--ubax-blue-soft)',
        icon: 'pi pi-folder',
      },
      {
        label: 'En attente',
        value: all.filter((t) => t.status === 'PENDING_REVIEW').length,
        accent: 'var(--ubax-accent)',
        bg: 'var(--ubax-peach-soft)',
        icon: 'pi pi-clock',
      },
      {
        label: 'Qualifiés',
        value: all.filter((t) => t.status === 'QUALIFIED').length,
        accent: 'var(--ubax-success)',
        bg: 'var(--ubax-success-soft)',
        icon: 'pi pi-check-circle',
      },
      {
        label: 'Rejetés',
        value: all.filter((t) => t.status === 'REJECTED').length,
        accent: 'var(--ubax-danger)',
        bg: 'var(--ubax-danger-soft)',
        icon: 'pi pi-times-circle',
      },
    ];
  });

  readonly filteredTenants = computed(() => {
    const query = normalizeKycText(this.searchTerm());
    const status = this.filterStatus();

    return this.store.entities().filter((t) => {
      if (status !== 'all' && t.status !== status) return false;
      if (query) {
        const text = normalizeKycText(
          [t.fullName, t.email, t.employerName, t.id].join(' '),
        );
        if (!text.includes(query)) return false;
      }
      return true;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredTenants().length / KYC_PAGE_SIZE)),
  );

  readonly pagedTenants = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * KYC_PAGE_SIZE;
    return this.filteredTenants().slice(start, start + KYC_PAGE_SIZE);
  });

  readonly resultsLabel = computed(() => {
    const total = this.filteredTenants().length;
    if (!total) return 'Aucun résultat';
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * KYC_PAGE_SIZE + 1;
    const end = Math.min(start + KYC_PAGE_SIZE - 1, total);
    return `${start}–${end} sur ${total} dossiers`;
  });

  readonly statusMeta = STATUS_META;

  constructor() {
    effect(() => {
      this.store.load!({ pageable: {} });
    });

    effect(() => {
      if (!this.store.loading() && !this.hasLoaded()) {
        this.hasLoaded.set(true);
      }
    });

    effect(() => {
      this.searchTerm();
      this.filterStatus();
      this.currentPage.set(1);
    });
  }

  getStatusMeta(status: string | undefined) {
    return (
      STATUS_META[(status as TenantStatus) ?? 'INCOMPLETE'] ??
      STATUS_META['INCOMPLETE']
    );
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  }

  formatIncome(income: number | undefined): string {
    if (income == null) return '—';
    return new Intl.NumberFormat('fr-FR').format(income) + ' FCFA';
  }

  getInitials(name: string | undefined): string {
    if (!name) return '?';
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToDetail(id: string | undefined): void {
    if (id) this.router.navigate(['/locataires', id]);
  }

  retryLoad(): void {
    this.hasLoaded.set(false);
    this.store.load!({ pageable: {} });
  }
}
