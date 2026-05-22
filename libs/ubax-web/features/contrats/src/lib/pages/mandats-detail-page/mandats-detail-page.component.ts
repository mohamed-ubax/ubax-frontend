import { DatePipe, DOCUMENT } from '@angular/common';
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
  MandatesStore,
  type Mandate,
} from '@ubax-workspace/ubax-web-data-access';
import {
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
  selector: 'ubax-mandats-detail-page',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    SectionCardComponent,
    StatusBadgeComponent,
  ],
  providers: [MandatesStore],
  templateUrl: './mandats-detail-page.component.html',
  styleUrl: './mandats-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MandatsDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  protected readonly store = inject(MandatesStore);
  private readonly notifications = inject(NOTIFICATION_HANDLER, {
    optional: true,
  }) as NotificationHandler | null;

  private readonly mandateId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: '' },
  );

  protected readonly mandate = computed(() => this.store.selectedItem());
  protected readonly showSubmitDialog = signal(false);
  protected readonly showCancelDialog = signal(false);
  protected readonly showTerminateDialog = signal(false);
  protected readonly terminateReason = signal('');
  protected readonly terminateReasonError = signal<string | null>(null);

  protected readonly canSubmit = computed(
    () => this.mandate()?.status === 'DRAFT',
  );
  protected readonly canCancel = computed(() => {
    const status = this.mandate()?.status;
    return status === 'DRAFT' || status === 'PENDING_SIGNATURE';
  });
  protected readonly canTerminate = computed(
    () => this.mandate()?.status === 'ACTIVE',
  );

  constructor() {
    effect(() => {
      const id = this.mandateId();
      if (id) {
        this.store.loadOne?.(id);
      }
    });

    // Manage body class so overlays cover the topbar
    effect(() => {
      const hasOverlay =
        this.showSubmitDialog() ||
        this.showCancelDialog() ||
        this.showTerminateDialog();
      this.document.body.classList.toggle('ubax-overlay-open', hasOverlay);
    });

    effect(() => {
      const submittedId = this.store.lastSubmittedId();
      if (!submittedId) return;
      this.showSubmitDialog.set(false);
      this.document.body.classList.remove('ubax-overlay-open');
      this.notifications?.success('Mandat soumis pour signature.');
      this.store.clearActionFeedback();
    });

    effect(() => {
      const cancelledId = this.store.lastCancelledId();
      if (!cancelledId) return;
      this.showCancelDialog.set(false);
      this.document.body.classList.remove('ubax-overlay-open');
      this.notifications?.success('Mandat annulé.');
      this.store.clearActionFeedback();
    });

    effect(() => {
      const terminatedId = this.store.lastTerminatedId();
      if (!terminatedId) return;
      this.showTerminateDialog.set(false);
      this.terminateReason.set('');
      this.terminateReasonError.set(null);
      this.document.body.classList.remove('ubax-overlay-open');
      this.notifications?.success('Mandat résilié.');
      this.store.clearActionFeedback();
    });
  }

  protected submitMandate(): void {
    const id = this.mandateId();
    if (id && this.canSubmit()) {
      this.store.submitMandate(id);
    }
  }

  protected cancelMandate(): void {
    const id = this.mandateId();
    if (id && this.canCancel()) {
      this.store.cancelMandate(id);
    }
  }

  protected terminateMandate(): void {
    const id = this.mandateId();
    const reason = this.terminateReason().trim();

    if (!reason) {
      this.terminateReasonError.set('Le motif de résiliation est obligatoire.');
      return;
    }

    this.terminateReasonError.set(null);

    if (id && this.canTerminate()) {
      this.store.terminateMandate({
        id,
        body: { terminationReason: reason },
      });
    }
  }

  protected statusLabel(status: Mandate['status']): string {
    switch (status) {
      case 'DRAFT':
        return 'Brouillon';
      case 'PENDING_SIGNATURE':
        return 'En attente de signature';
      case 'ACTIVE':
        return 'Actif';
      case 'TERMINATED':
        return 'Résilié';
      case 'CANCELLED':
        return 'Annulé';
      default:
        return '—';
    }
  }

  protected statusVariant(status: Mandate['status']): StatusVariant {
    switch (status) {
      case 'DRAFT':
        return 'neutral';
      case 'PENDING_SIGNATURE':
        return 'pending';
      case 'ACTIVE':
        return 'active';
      case 'TERMINATED':
        return 'danger';
      case 'CANCELLED':
        return 'neutral';
      default:
        return 'neutral';
    }
  }
}
