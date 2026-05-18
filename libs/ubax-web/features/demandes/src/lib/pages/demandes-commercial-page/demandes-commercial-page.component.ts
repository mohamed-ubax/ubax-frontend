import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import type { CommercialRequestDetail } from '../../types/demandes.types';
import { DemandeDetailPanelComponent } from '../../components/demande-detail-panel/demande-detail-panel.component';
import type {
  CalendarDay,
  CommercialNotificationItem,
  CommercialRequestRow,
  CommercialVisitCard,
  SummaryMetric,
} from '../../types/demandes-commercial.types';
import {
  COMMERCIAL_CALENDAR_ICONS,
  COMMERCIAL_CALENDAR_WEEKDAYS,
  COMMERCIAL_CALENDAR_WEEKS,
  COMMERCIAL_METRIC_CARDS,
  COMMERCIAL_NOTIFICATION_BELL_ICON,
  COMMERCIAL_NOTIFICATIONS,
  COMMERCIAL_OVERLAY_CLOSE_ICON,
  COMMERCIAL_REQUEST_ACTION_ICON,
  COMMERCIAL_REQUEST_ROWS,
  COMMERCIAL_VISIT_CARDS,
  COMMERCIAL_VISIT_META_ICONS,
} from '../../constants/demandes-commercial.constants';

@Component({
  selector: 'ubax-demandes-commercial-page',
  standalone: true,
  imports: [CommonModule, DemandeDetailPanelComponent],
  templateUrl: './demandes-commercial-page.component.html',
  styleUrl: './demandes-commercial-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemandesCommercialPageComponent {
  readonly metricCards: readonly SummaryMetric[] = COMMERCIAL_METRIC_CARDS;

  readonly calendarWeekdays = COMMERCIAL_CALENDAR_WEEKDAYS;
  readonly calendarWeeks: readonly (readonly CalendarDay[])[] =
    COMMERCIAL_CALENDAR_WEEKS;

  readonly calendarIcons = COMMERCIAL_CALENDAR_ICONS;

  readonly requestActionIcon = COMMERCIAL_REQUEST_ACTION_ICON;
  readonly overlayCloseIcon = COMMERCIAL_OVERLAY_CLOSE_ICON;
  readonly notificationBellIcon = COMMERCIAL_NOTIFICATION_BELL_ICON;
  readonly visitMetaIcons = COMMERCIAL_VISIT_META_ICONS;

  readonly requestRows: readonly CommercialRequestRow[] =
    COMMERCIAL_REQUEST_ROWS;

  readonly visitCards: readonly CommercialVisitCard[] = COMMERCIAL_VISIT_CARDS;

  readonly notifications: readonly CommercialNotificationItem[] =
    COMMERCIAL_NOTIFICATIONS;

  readonly selectedRequest = signal<CommercialRequestDetail | null>(null);

  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      this.document.body.classList.toggle(
        'ubax-demande-overlay-open',
        this.selectedRequest() !== null,
      );
    });

    this.destroyRef.onDestroy(() => {
      this.document.body.classList.remove('ubax-demande-overlay-open');
    });
  }

  protected openRequest(request: CommercialRequestDetail): void {
    this.selectedRequest.set(request);
  }

  protected closeRequest(): void {
    this.selectedRequest.set(null);
  }
}
