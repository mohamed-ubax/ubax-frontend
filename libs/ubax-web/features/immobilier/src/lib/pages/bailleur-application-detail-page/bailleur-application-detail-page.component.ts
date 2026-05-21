import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  BailleurApplicationsStore,
  type BailleurApplication,
} from '@ubax-workspace/ubax-web-data-access';
import {
  ConfirmDialogComponent,
  SectionCardComponent,
  StatusBadgeComponent,
  type StatusVariant,
} from '@ubax-workspace/shared-design-system';
import {
  NOTIFICATION_HANDLER,
  type NotificationHandler,
} from '@ubax-workspace/shared-data-access';
import { map } from 'rxjs';

@Component({
  selector: 'ubax-bailleur-application-detail-page',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    ConfirmDialogComponent,
    SectionCardComponent,
    StatusBadgeComponent,
  ],
  providers: [BailleurApplicationsStore],
  templateUrl: './bailleur-application-detail-page.component.html',
  styleUrl: './bailleur-application-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BailleurApplicationDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(BailleurApplicationsStore);
  private readonly notifications = inject(NOTIFICATION_HANDLER, {
    optional: true,
  }) as NotificationHandler | null;

  private readonly applicationId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: '' },
  );

  protected readonly application = computed(() => this.store.selectedItem());
  protected readonly canDecide = computed(
    () => this.application()?.status === 'PENDING',
  );
  protected readonly isBusy = computed(
    () => this.store.saving() || !!this.store.decidingId(),
  );
  protected readonly approveDialogVisible = signal(false);
  protected readonly rejectDialogVisible = signal(false);
  protected readonly rejectComment = signal('');
  protected readonly rejectCommentError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.applicationId();
      if (id) {
        this.store.loadOne?.(id);
      }
    });

    effect(() => {
      const decidedId = this.store.lastDecidedId();
      if (!decidedId) {
        return;
      }

      this.approveDialogVisible.set(false);
      this.rejectDialogVisible.set(false);
      this.rejectComment.set('');
      this.rejectCommentError.set(null);
      this.notifications?.success('Décision enregistrée avec succès.');
      this.store.clearDecisionFeedback();
    });

    effect(() => {
      const error = this.store.decisionError();
      if (!error) {
        return;
      }

      this.notifications?.error(error);
      this.store.clearDecisionFeedback();
    });
  }

  protected fullName(application: BailleurApplication | null): string {
    if (!application) {
      return '—';
    }

    return [application.firstName, application.lastName]
      .filter((value): value is string => Boolean(value))
      .join(' ');
  }

  protected statusLabel(status: BailleurApplication['status']): string {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'APPROVED':
        return 'Approuvée';
      case 'REJECTED':
        return 'Rejetée';
      case 'CANCELLED':
        return 'Annulée';
      default:
        return '—';
    }
  }

  protected statusVariant(
    status: BailleurApplication['status'],
  ): StatusVariant {
    switch (status) {
      case 'PENDING':
        return 'pending';
      case 'APPROVED':
        return 'active';
      case 'REJECTED':
        return 'danger';
      case 'CANCELLED':
        return 'neutral';
      default:
        return 'neutral';
    }
  }

  protected confirmApprove(): void {
    const id = this.applicationId();
    if (!id || !this.canDecide()) {
      return;
    }

    this.store.decide({
      id,
      body: { decision: 'APPROVE' },
    });
  }

  protected confirmReject(): void {
    const id = this.applicationId();
    const comment = this.rejectComment().trim();

    if (!comment) {
      this.rejectCommentError.set('Le motif de rejet est obligatoire.');
      return;
    }

    this.rejectCommentError.set(null);

    if (!id || !this.canDecide()) {
      return;
    }

    this.store.decide({
      id,
      body: {
        decision: 'REJECT',
        comment,
      },
    });
  }
}
