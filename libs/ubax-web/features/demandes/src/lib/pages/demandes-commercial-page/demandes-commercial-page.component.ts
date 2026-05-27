import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AgencyStore,
  VisitesStore,
  type VisitRequest,
  type VisitRequestStatus,
} from '@ubax-workspace/ubax-web-data-access';
import type { ConfirmVisitRequestDto, RejectVisitRequestDto } from '@ubax-workspace/shared-api-types';
import type { CommercialRequestDetail } from '../../types/demandes.types';
import { DemandeDetailPanelComponent } from '../../components/demande-detail-panel/demande-detail-panel.component';
import { VisitConfirmDialogComponent } from '../../components/visit-confirm-dialog/visit-confirm-dialog.component';
import { VisitRejectDialogComponent } from '../../components/visit-reject-dialog/visit-reject-dialog.component';
import { VisitAssignAgentDialogComponent } from '../../components/visit-assign-agent-dialog/visit-assign-agent-dialog.component';
import {
  COMMERCIAL_CALENDAR_ICONS,
  COMMERCIAL_CALENDAR_WEEKDAYS,
  COMMERCIAL_METRIC_CARDS,
  COMMERCIAL_NOTIFICATION_BELL_ICON,
  COMMERCIAL_NOTIFICATIONS,
  COMMERCIAL_OVERLAY_CLOSE_ICON,
  COMMERCIAL_REQUEST_ACTION_ICON,
  COMMERCIAL_REQUEST_ROWS,
  COMMERCIAL_VISIT_META_ICONS,
} from '../../constants/demandes-commercial.constants';
import type {
  CalendarDay,
  CommercialNotificationItem,
  CommercialRequestRow,
  SummaryMetric,
} from '../../types/demandes-commercial.types';

type VisitFilter = VisitRequestStatus | 'ALL';

const VISIT_FILTER_TABS: { key: VisitFilter; label: string }[] = [
  { key: 'ALL', label: 'Toutes' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'CONFIRMED', label: 'Confirmées' },
  { key: 'REJECTED', label: 'Rejetées' },
];

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

@Component({
  selector: 'ubax-demandes-commercial-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DemandeDetailPanelComponent,
    VisitConfirmDialogComponent,
    VisitRejectDialogComponent,
    VisitAssignAgentDialogComponent,
  ],
  templateUrl: './demandes-commercial-page.component.html',
  styleUrl: './demandes-commercial-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemandesCommercialPageComponent implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly visitesStore = inject(VisitesStore);
  protected readonly agencyStore = inject(AgencyStore);

  // ── Static display data ──────────────────────────────────────────────────
  readonly requestRows: readonly CommercialRequestRow[] = COMMERCIAL_REQUEST_ROWS;
  readonly notifications: readonly CommercialNotificationItem[] = COMMERCIAL_NOTIFICATIONS;
  readonly calendarWeekdays = COMMERCIAL_CALENDAR_WEEKDAYS;
  readonly calendarIcons = COMMERCIAL_CALENDAR_ICONS;
  readonly requestActionIcon = COMMERCIAL_REQUEST_ACTION_ICON;
  readonly overlayCloseIcon = COMMERCIAL_OVERLAY_CLOSE_ICON;
  readonly notificationBellIcon = COMMERCIAL_NOTIFICATION_BELL_ICON;
  readonly visitMetaIcons = COMMERCIAL_VISIT_META_ICONS;
  readonly visitFilterTabs = VISIT_FILTER_TABS;

  // ── Dynamic metrics ──────────────────────────────────────────────────────
  readonly metricCards = computed<readonly SummaryMetric[]>(() => {
    const counts = this.visitesStore.visitCounts();
    const totalVisits = this.visitesStore.totalElements();
    return [
      {
        ...COMMERCIAL_METRIC_CARDS[0],
        value: totalVisits,
      },
      {
        ...COMMERCIAL_METRIC_CARDS[1],
        value: counts['PENDING'],
      },
    ];
  });

  // ── Demande detail panel ─────────────────────────────────────────────────
  readonly selectedRequest = signal<CommercialRequestDetail | null>(null);

  // ── Visit filter ─────────────────────────────────────────────────────────
  readonly activeFilter = signal<VisitFilter>('ALL');

  readonly filteredVisits = computed(() => {
    const filter = this.activeFilter();
    const visits = this.visitesStore.entities();
    if (filter === 'ALL') return visits;
    return visits.filter((v) => v.status === filter);
  });

  // ── Visit dialogs ────────────────────────────────────────────────────────
  readonly confirmDialogVisit = signal<VisitRequest | null>(null);
  readonly rejectDialogVisit = signal<VisitRequest | null>(null);
  readonly assignAgentDialogVisit = signal<VisitRequest | null>(null);

  // ── Calendar ─────────────────────────────────────────────────────────────
  readonly calendarYear = signal(new Date().getFullYear());
  readonly calendarMonth = signal(new Date().getMonth());

  readonly calendarTitle = computed(
    () => `${MONTHS_FR[this.calendarMonth()]} ${this.calendarYear()}`,
  );

  readonly confirmedDatesThisMonth = computed(() => {
    const year = this.calendarYear();
    const month = this.calendarMonth();
    return new Set(
      this.visitesStore
        .entities()
        .filter((v) => v.status === 'CONFIRMED' && v.confirmedDate)
        .map((v) => {
          const d = new Date(v.confirmedDate as string);
          if (d.getFullYear() === year && d.getMonth() === month) {
            return d.getDate();
          }
          return null;
        })
        .filter((d): d is number => d !== null),
    );
  });

  readonly calendarWeeks = computed<readonly (readonly CalendarDay[])[]>(() => {
    const year = this.calendarYear();
    const month = this.calendarMonth();
    const confirmedDays = this.confirmedDatesThisMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();

    // Offset: Monday=0
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const weeks: CalendarDay[][] = [];
    let week: CalendarDay[] = [];

    // Fill previous month's days
    const prevLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      week.push({ label: String(prevLastDay - i), isMuted: true });
    }

    // Fill current month's days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const isActive =
        d === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();
      const hasConfirmedVisit = confirmedDays.has(d);
      week.push({
        label: String(d),
        isActive,
        hasVisit: hasConfirmedVisit,
      });
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    // Fill next month's days
    let nextDay = 1;
    while (week.length > 0 && week.length < 7) {
      week.push({ label: String(nextDay++), isMuted: true });
    }
    if (week.length > 0) weeks.push(week);

    return weeks;
  });

  // ── Agents list (for assign dialog) ─────────────────────────────────────
  readonly agentOptions = computed(() =>
    this.agencyStore.membresActifs().map((m) => ({
      userId: m.userId,
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email,
    })),
  );

  constructor() {
    effect(() => {
      const hasOverlay =
        this.selectedRequest() !== null ||
        this.confirmDialogVisit() !== null ||
        this.rejectDialogVisit() !== null ||
        this.assignAgentDialogVisit() !== null;
      this.document.body.classList.toggle('ubax-demande-overlay-open', hasOverlay);
    });

    this.destroyRef.onDestroy(() => {
      this.document.body.classList.remove('ubax-demande-overlay-open');
    });
  }

  ngOnInit(): void {
    this.retryLoad();
    this.agencyStore.load({ scope: 'AGENCE' });
  }

  protected retryLoad(): void {
    this.visitesStore.load?.({
      pageable: { page: 0, size: 50, sort: ['createdAt,desc'] },
    });
  }

  // ── Demande info panel ───────────────────────────────────────────────────
  protected openRequest(request: CommercialRequestDetail): void {
    this.selectedRequest.set(request);
  }

  protected closeRequest(): void {
    this.selectedRequest.set(null);
  }

  // ── Visit filter ─────────────────────────────────────────────────────────
  protected setFilter(filter: VisitFilter): void {
    this.activeFilter.set(filter);
  }

  // ── Visit confirm dialog ─────────────────────────────────────────────────
  protected openConfirmDialog(visit: VisitRequest): void {
    this.confirmDialogVisit.set(visit);
  }

  protected onVisitConfirmed(
    visitId: string,
    dto: ConfirmVisitRequestDto,
  ): void {
    this.visitesStore.confirmVisit({ visitRequestId: visitId, body: dto });
    this.confirmDialogVisit.set(null);
  }

  protected closeConfirmDialog(): void {
    this.confirmDialogVisit.set(null);
  }

  // ── Visit reject dialog ──────────────────────────────────────────────────
  protected openRejectDialog(visit: VisitRequest): void {
    this.rejectDialogVisit.set(visit);
  }

  protected onVisitRejected(
    visitId: string,
    dto: RejectVisitRequestDto,
  ): void {
    this.visitesStore.rejectVisit({ visitRequestId: visitId, body: dto });
    this.rejectDialogVisit.set(null);
  }

  protected closeRejectDialog(): void {
    this.rejectDialogVisit.set(null);
  }

  // ── Assign agent dialog ──────────────────────────────────────────────────
  protected openAssignAgentDialog(visit: VisitRequest): void {
    this.assignAgentDialogVisit.set(visit);
  }

  protected onAgentAssigned(
    visitId: string,
    payload: { agentId: string },
  ): void {
    this.visitesStore.assignAgent({
      visitRequestId: visitId,
      agentId: payload.agentId,
    });
    this.assignAgentDialogVisit.set(null);
  }

  protected closeAssignAgentDialog(): void {
    this.assignAgentDialogVisit.set(null);
  }

  // ── Calendar navigation ──────────────────────────────────────────────────
  protected prevMonth(): void {
    let m = this.calendarMonth() - 1;
    let y = this.calendarYear();
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    this.calendarMonth.set(m);
    this.calendarYear.set(y);
  }

  protected nextMonth(): void {
    let m = this.calendarMonth() + 1;
    let y = this.calendarYear();
    if (m > 11) {
      m = 0;
      y += 1;
    }
    this.calendarMonth.set(m);
    this.calendarYear.set(y);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  protected visitStatusLabel(status: VisitRequestStatus): string {
    const labels: Record<VisitRequestStatus, string> = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      REJECTED: 'Rejetée',
      CANCELLED: 'Annulée',
      COMPLETED: 'Terminée',
    };
    return labels[status];
  }

  protected clientInitials(name: string | undefined): string {
    if (!name) return '?';
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
  }

  protected isActionBusy(visitId: string): boolean {
    return (
      this.visitesStore.saving() &&
      this.visitesStore.activeActionId() === visitId
    );
  }
}
