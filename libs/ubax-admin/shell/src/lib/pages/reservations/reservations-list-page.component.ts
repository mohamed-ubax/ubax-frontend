import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { UbaxPaginatorComponent } from '@ubax-workspace/shared-ui';
import {
  ADMIN_RESERVATION_STATUSES,
  AdminReservation,
  AdminReservationStatus,
  AdminReservationsStore,
} from '@ubax-workspace/ubax-admin-data-access';

const PAGE_SIZE = 20;

type ReservationFilter = AdminReservationStatus | 'ALL';

const STATUS_LABELS: Record<AdminReservationStatus, string> = {
  PENDING: 'A venir',
  CONFIRMED: 'En cours',
  CANCELLED: 'Annulée',
  COMPLETED: 'Terminée',
  NO_SHOW: 'No-show',
};

const STATUS_TONES: Record<AdminReservationStatus, string> = {
  PENDING: 'upcoming',
  CONFIRMED: 'ongoing',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'noshow',
};

interface KpiCard {
  key: string;
  label: string;
  count: number;
  tone: string;
  icon: string;
}

@Component({
  selector: 'ubax-admin-reservations-list-page',
  standalone: true,
  imports: [UbaxPaginatorComponent, FormsModule, DatePickerModule],
  templateUrl: './reservations-list-page.component.html',
  styleUrl: './reservations-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationsListPageComponent implements OnInit {
  protected readonly store = inject(AdminReservationsStore);
  private readonly doc = inject(DOCUMENT);
  private readonly router = inject(Router);

  protected readonly searchTerm = signal('');
  protected readonly currentPage = signal(1);
  protected readonly selectedFilter = signal<ReservationFilter>('ALL');
  protected readonly selectedType = signal<string | null>(null);
  protected readonly selectedProperty = signal<string | null>(null);
  protected readonly dateRange = signal<Date[] | null>(null);

  // Overlay states (fixed-position overlay pattern)
  protected readonly typeDropdownOpen = signal(false);
  protected readonly typeDropdownTop = signal(0);
  protected readonly typeDropdownLeft = signal(0);

  protected readonly propertyDropdownOpen = signal(false);
  protected readonly propertyDropdownTop = signal(0);
  protected readonly propertyDropdownLeft = signal(0);

  protected readonly dateOverlayOpen = signal(false);
  protected readonly dateOverlayTop = signal(0);
  protected readonly dateOverlayLeft = signal(0);

  protected datePickerModel: Date[] | null = null;

  protected readonly TYPE_OPTIONS: { label: string; value: string | null }[] = [
    { label: 'Tous les types', value: null },
    { label: 'Location', value: 'Location' },
    { label: 'Hôtel', value: 'Hôtel' },
    { label: 'Immobilier', value: 'Immobilier' },
  ];

  protected readonly propertyOptions = computed(() => {
    const seen = new Set<string>();
    const opts: { label: string; value: string | null }[] = [
      { label: 'Toutes les propriétés', value: null },
    ];
    for (const r of this.store.reservations()) {
      if (r.propertyTitle && !seen.has(r.propertyTitle)) {
        seen.add(r.propertyTitle);
        opts.push({ label: r.propertyTitle, value: r.propertyTitle });
      }
    }
    return opts;
  });

  protected readonly statusTabs = computed(() => {
    const counts = this.store.statusCounts();
    const total = ADMIN_RESERVATION_STATUSES.reduce(
      (sum, status) => sum + counts[status],
      0,
    );

    return [
      { label: 'Toutes', value: 'ALL' as const, count: total },
      {
        label: 'A venir',
        value: 'PENDING' as const,
        count: counts['PENDING'],
      },
      {
        label: 'En cours',
        value: 'CONFIRMED' as const,
        count: counts['CONFIRMED'],
      },
      {
        label: 'Terminées',
        value: 'COMPLETED' as const,
        count: counts['COMPLETED'],
      },
      {
        label: 'Annulées',
        value: 'CANCELLED' as const,
        count: counts['CANCELLED'] + counts['NO_SHOW'],
      },
    ];
  });

  protected readonly kpiCards = computed<KpiCard[]>(() => {
    const counts = this.store.statusCounts();
    const total = ADMIN_RESERVATION_STATUSES.reduce(
      (sum, status) => sum + counts[status],
      0,
    );

    return [
      {
        key: 'total',
        label: 'Toutes',
        count: total,
        tone: 'orange',
        icon: 'pi pi-calendar',
      },
      {
        key: 'pending',
        label: 'A venir',
        count: counts['PENDING'],
        tone: 'blue',
        icon: 'pi pi-calendar',
      },
      {
        key: 'confirmed',
        label: 'En cours',
        count: counts['CONFIRMED'],
        tone: 'purple',
        icon: 'pi pi-building',
      },
      {
        key: 'completed',
        label: 'Terminées',
        count: counts['COMPLETED'],
        tone: 'green',
        icon: 'pi pi-check-circle',
      },
      {
        key: 'cancelled',
        label: 'Annulées',
        count: counts['CANCELLED'] + counts['NO_SHOW'],
        tone: 'red',
        icon: 'pi pi-times-circle',
      },
    ];
  });

  protected readonly filteredReservations = computed(() => {
    const query = this.normalizeText(this.searchTerm());
    const property = this.selectedProperty();
    const range = this.dateRange();

    return this.store.reservations().filter((reservation) => {
      if (query) {
        const haystack = this.normalizeText(
          [
            reservation.propertyTitle,
            reservation.propertyCity,
            reservation.clientFullName,
            reservation.clientEmail,
            reservation.status,
          ]
            .filter(Boolean)
            .join(' '),
        );
        if (!haystack.includes(query)) return false;
      }

      if (property && reservation.propertyTitle !== property) return false;

      if (range && range.length === 2 && range[0] && range[1]) {
        const checkIn = reservation.checkInDate
          ? new Date(reservation.checkInDate)
          : null;
        if (!checkIn) return false;
        const start = new Date(range[0]);
        start.setHours(0, 0, 0, 0);
        const end = new Date(range[1]);
        end.setHours(23, 59, 59, 999);
        if (checkIn < start || checkIn > end) return false;
      }

      return true;
    });
  });

  protected readonly viewState = computed(() => {
    if (this.store.loading() && this.store.reservations().length === 0) {
      return 'loading';
    }

    if (this.store.error() && this.store.reservations().length === 0) {
      return 'error';
    }

    if (!this.store.loading() && this.filteredReservations().length === 0) {
      return 'empty';
    }

    return 'success';
  });

  ngOnInit(): void {
    this.loadReservations();
    this.loadStatusCounts();
  }

  protected selectFilter(filter: ReservationFilter): void {
    this.selectedFilter.set(filter);
    this.currentPage.set(1);
    this.loadReservations();
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadReservations();
  }

  protected retry(): void {
    this.loadReservations();
    this.loadStatusCounts();
  }

  // ── Dropdowns ────────────────────────────────────────────────────────────────

  protected typeLabel(): string {
    return this.selectedType() ?? 'Tous les types';
  }

  protected propertyLabel(): string {
    return this.selectedProperty() ?? 'Toutes les propriétés';
  }

  protected toggleTypeDropdown(event: MouseEvent): void {
    const btn = event.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    if (this.typeDropdownOpen()) {
      this.typeDropdownOpen.set(false);
      return;
    }
    this.propertyDropdownOpen.set(false);
    this.dateOverlayOpen.set(false);
    this.typeDropdownTop.set(rect.bottom + 6);
    this.typeDropdownLeft.set(rect.left);
    this.typeDropdownOpen.set(true);
  }

  protected togglePropertyDropdown(event: MouseEvent): void {
    const btn = event.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    if (this.propertyDropdownOpen()) {
      this.propertyDropdownOpen.set(false);
      return;
    }
    this.typeDropdownOpen.set(false);
    this.dateOverlayOpen.set(false);
    this.propertyDropdownTop.set(rect.bottom + 6);
    this.propertyDropdownLeft.set(rect.left);
    this.propertyDropdownOpen.set(true);
  }

  protected selectType(value: string | null): void {
    this.selectedType.set(value);
    this.typeDropdownOpen.set(false);
  }

  protected selectProperty(value: string | null): void {
    this.selectedProperty.set(value);
    this.propertyDropdownOpen.set(false);
  }

  // ── Date overlay ─────────────────────────────────────────────────────────────

  protected toggleDateOverlay(event: MouseEvent): void {
    const btn = event.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    if (this.dateOverlayOpen()) {
      this.dateOverlayOpen.set(false);
      return;
    }
    this.typeDropdownOpen.set(false);
    this.propertyDropdownOpen.set(false);
    this.dateOverlayTop.set(rect.bottom + 6);
    this.dateOverlayLeft.set(rect.left);
    this.dateOverlayOpen.set(true);
  }

  protected applyDateRange(): void {
    const model = this.datePickerModel;
    if (Array.isArray(model) && model.length === 2 && model[0] && model[1]) {
      this.dateRange.set([model[0], model[1]]);
    }
    this.dateOverlayOpen.set(false);
  }

  protected clearDateRange(): void {
    this.dateRange.set(null);
    this.datePickerModel = null;
    this.dateOverlayOpen.set(false);
  }

  protected closeAllOverlays(): void {
    this.typeDropdownOpen.set(false);
    this.propertyDropdownOpen.set(false);
    this.dateOverlayOpen.set(false);
  }

  // ── Export ───────────────────────────────────────────────────────────────────

  protected exportToCsv(): void {
    const headers = [
      'Code',
      'Client',
      'Email',
      'Propriété',
      'Ville',
      'Type',
      'Check-in',
      'Check-out',
      'Nuits',
      'Montant (FCFA)',
      'Statut',
    ];
    const rows = this.filteredReservations().map((r) => [
      this.reservationCode(r.id),
      r.clientFullName ?? '',
      r.clientEmail ?? '',
      r.propertyTitle ?? '',
      r.propertyCity ?? '',
      'Location',
      this.formatDate(r.checkInDate),
      this.formatDate(r.checkOutDate),
      r.numberOfNights ?? 0,
      r.totalAmount ?? 0,
      this.statusLabel(r.status),
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = this.doc.createElement('a');
    a.href = url;
    a.download = `reservations-${new Date().toISOString().split('T')[0]}.csv`;
    this.doc.body.appendChild(a);
    a.click();
    this.doc.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Display helpers ──────────────────────────────────────────────────────────

  protected statusLabel(status: AdminReservationStatus): string {
    return STATUS_LABELS[status];
  }

  protected statusTone(status: AdminReservationStatus): string {
    return STATUS_TONES[status] ?? 'default';
  }

  protected reservationCode(id?: string): string {
    if (!id) return 'RES-0000000';
    const clean = id.replace(/-/g, '').toUpperCase();
    return `RES-${clean.slice(-7).padStart(7, '0')}`;
  }

  protected clientInitials(fullName?: string): string {
    if (!fullName?.trim()) return '?';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  protected currentDateLabel(): string {
    const range = this.dateRange();
    if (range && range.length === 2 && range[0] && range[1]) {
      const fmt = (d: Date) =>
        new Intl.DateTimeFormat('fr-FR', {
          day: '2-digit',
          month: 'short',
        }).format(d);
      return `${fmt(range[0])} — ${fmt(range[1])}`;
    }
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }

  protected paginationLabel(): string {
    const page = this.currentPage();
    const total = this.store.totalElements();
    if (total === 0) return '';
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, total);
    return `Affichage ${start} à ${end} sur ${total} reservations`;
  }

  protected formatDate(value?: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  protected formatCurrency(value?: number): string {
    if (typeof value !== 'number') return '—';
    return `${new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0,
    }).format(value)} FCFA`;
  }

  protected formatDateRange(reservation: AdminReservation): string {
    return `${this.formatDate(reservation.checkInDate)} - ${this.formatDate(reservation.checkOutDate)}`;
  }

  protected openReservationDetail(id?: string): void {
    if (!id) {
      return;
    }

    void this.router.navigate(['/reservations', id]);
  }

  private loadReservations(): void {
    this.store
      .load({
        page: this.currentPage() - 1,
        size: PAGE_SIZE,
        status: this.selectedFilterValue(),
      })
      .catch(() => {
        // store exposes the error for the UI
      });
  }

  private loadStatusCounts(): void {
    this.store.loadStatusCounts().catch(() => {
      // store exposes the error for the UI
    });
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private selectedFilterValue(): AdminReservationStatus | undefined {
    const filter = this.selectedFilter();
    return filter === 'ALL' ? undefined : filter;
  }
}
