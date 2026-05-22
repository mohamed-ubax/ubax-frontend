import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AgencyBailleursStore,
  MandatesStore,
} from '@ubax-workspace/ubax-web-data-access';
import {
  EmptyStateComponent,
} from '@ubax-workspace/shared-design-system';
import {
  NOTIFICATION_HANDLER,
  type NotificationHandler,
} from '@ubax-workspace/shared-data-access';
import {
  UiFormInputComponent,
  UiFormSelectComponent,
  UiFormDatePickerComponent,
  type UiFormSelectOption,
} from '@ubax-workspace/shared-ui';
import { map } from 'rxjs';

@Component({
  selector: 'ubax-mandats-add-page',
  standalone: true,
  imports: [
    RouterLink,
    EmptyStateComponent,
    UiFormInputComponent,
    UiFormSelectComponent,
    UiFormDatePickerComponent,
  ],
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

  // ── Form signals ────────────────────────────────────────────────────────────
  protected readonly ownerId = signal('');
  protected readonly startDateObj = signal<Date>(new Date());
  protected readonly endDateObj = signal<Date>(
    new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
  );
  protected readonly noEndDate = signal(false);
  protected readonly commissionRate = signal('');
  protected readonly specialClauses = signal('');
  protected readonly terminationConditions = signal('');
  protected readonly formError = signal<string | null>(null);

  // ── Derived ─────────────────────────────────────────────────────────────────
  protected readonly bailleursOptions = computed<UiFormSelectOption[]>(() => [
    { label: 'Sélectionner un bailleur', value: '' },
    ...this.bailleursStore.entities().map((owner) => ({
      label: [owner.firstName, owner.lastName].filter(Boolean).join(' ') +
        (owner.phone ? ` · ${owner.phone}` : ''),
      value: owner.id ?? '',
    })),
  ]);

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
      if (!createdId) return;
      this.notifications?.success('Mandat créé avec succès.');
      this.mandatesStore.clearActionFeedback();
      void this.router.navigate(['/contrats/mandats', createdId]);
    });
  }

  protected submit(): void {
    if (!this.ownerId() || !this.startDateObj()) {
      this.formError.set('Le bailleur et la date de début sont obligatoires.');
      return;
    }

    this.formError.set(null);

    const toIso = (d: Date): string =>
      d.toISOString().split('T')[0];

    this.mandatesStore.createMandate({
      ownerId: this.ownerId(),
      startDate: toIso(this.startDateObj()),
      endDate: this.noEndDate() ? undefined : toIso(this.endDateObj()),
      commissionRate: this.commissionRate()
        ? Number(this.commissionRate())
        : undefined,
      specialClauses: this.specialClauses().trim() || undefined,
      terminationConditions: this.terminationConditions().trim() || undefined,
    });
  }
}
