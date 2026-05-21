import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AgencyBailleursStore,
  MandatesStore,
} from '@ubax-workspace/ubax-web-data-access';
import {
  EmptyStateComponent,
  SectionCardComponent,
} from '@ubax-workspace/shared-design-system';
import {
  NOTIFICATION_HANDLER,
  type NotificationHandler,
} from '@ubax-workspace/shared-data-access';
import { map } from 'rxjs';

@Component({
  selector: 'ubax-mandats-add-page',
  standalone: true,
  imports: [FormsModule, RouterLink, EmptyStateComponent, SectionCardComponent],
  providers: [AgencyBailleursStore, MandatesStore],
  templateUrl: './mandats-add-page.component.html',
  styleUrl: './mandats-add-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MandatsAddPageComponent {
  protected readonly bailleursStore = inject(AgencyBailleursStore);
  protected readonly mandatesStore = inject(MandatesStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notifications = inject(NOTIFICATION_HANDLER, {
    optional: true,
  }) as NotificationHandler | null;

  private readonly preselectedOwnerId = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('ownerId') ?? '')),
    { initialValue: '' },
  );

  protected readonly ownerId = signal('');
  protected readonly startDate = signal('');
  protected readonly endDate = signal('');
  protected readonly commissionRate = signal('');
  protected readonly specialClauses = signal('');
  protected readonly terminationConditions = signal('');
  protected readonly formError = signal<string | null>(null);

  protected readonly isSubmitting = computed(
    () => this.mandatesStore.creating() || this.mandatesStore.saving(),
  );

  constructor() {
    effect(
      () => {
        this.bailleursStore.load?.({
          page: 0,
          size: 200,
          sort: ['joinedAt,desc'],
        });
      },
      { allowSignalWrites: true },
    );

    effect(() => {
      const ownerId = this.preselectedOwnerId();
      if (ownerId && !this.ownerId()) {
        this.ownerId.set(ownerId);
      }
    });

    effect(() => {
      const createdId = this.mandatesStore.lastCreatedId();
      if (!createdId) {
        return;
      }

      this.notifications?.success('Mandat créé avec succès.');
      this.mandatesStore.clearActionFeedback();
      void this.router.navigate(['/contrats/mandats', createdId]);
    });
  }

  protected submit(): void {
    if (!this.ownerId() || !this.startDate()) {
      this.formError.set('Le bailleur et la date de début sont obligatoires.');
      return;
    }

    this.formError.set(null);

    this.mandatesStore.createMandate({
      ownerId: this.ownerId(),
      startDate: this.startDate(),
      endDate: this.endDate() || undefined,
      commissionRate: this.commissionRate()
        ? Number(this.commissionRate())
        : undefined,
      specialClauses: this.specialClauses().trim() || undefined,
      terminationConditions: this.terminationConditions().trim() || undefined,
    });
  }
}
