import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ContratsStore } from '@ubax-workspace/ubax-web-data-access';
import {
  BreadcrumbNavComponent,
  StatusBadgeComponent,
} from '@ubax-workspace/shared-design-system';
import { deriveViewState, type ViewState } from '@ubax-workspace/shared-ui';
import { ContratsSkeletonComponent } from '../../components/contrats-skeleton/contrats-skeleton.component';

@Component({
  selector: 'ubax-contrats-edit-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    BreadcrumbNavComponent,
    StatusBadgeComponent,
    ContratsSkeletonComponent,
  ],
  templateUrl: './contrats-edit-page.component.html',
  styleUrl: './contrats-edit-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratsEditPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  readonly store = inject(ContratsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly contractId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' },
  );

  private readonly hasLoaded = signal(false);
  readonly openEnded = signal(false);

  readonly editForm = this.fb.group({
    propertyId: ['', Validators.required],
    ownerId: ['', Validators.required],
    tenantId: [''],
    monthlyRent: [0, [Validators.required, Validators.min(1)]],
    depositAmount: [0, [Validators.required, Validators.min(0)]],
    startDate: ['', Validators.required],
    endDate: [''],
  });

  readonly viewState = computed<ViewState>(() => {
    const c = this.store.selectedItem();
    // Guard: only DRAFT can be edited
    if (this.hasLoaded() && c && c.status !== 'DRAFT') return 'error';
    return deriveViewState(
      this.store.loading(),
      this.store.error(),
      !c,
      this.hasLoaded(),
    );
  });

  constructor() {
    effect(() => {
      const id = this.contractId();
      if (id) this.store.loadOne!(id);
    });

    // Pre-fill form when contract loads
    effect(() => {
      const c = this.store.selectedItem();
      if (c && !this.store.loading()) {
        this.hasLoaded.set(true);
        this.editForm.patchValue({
          propertyId: c.propertyId ?? '',
          ownerId: c.ownerId ?? '',
          tenantId: c.tenantId ?? '',
          monthlyRent: c.monthlyRent ?? 0,
          depositAmount: c.depositAmount ?? 0,
          startDate: c.startDate ?? '',
          endDate: c.endDate ?? '',
        });
        if (!c.endDate) this.openEnded.set(true);
      }
    });

    // Redirect after successful update
    effect(() => {
      if (!this.store.saving() && this.store.selectedItem()?.status === 'DRAFT' && this.hasLoaded()) {
        // Only redirect if we just saved (saving went from true to false)
      }
    });
  }

  save(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const id = this.contractId();
    const v = this.editForm.getRawValue();

    this.store.update!({
      id,
      body: {
        propertyId: v.propertyId,
        ownerId: v.ownerId,
        tenantId: v.tenantId || undefined,
        contractType: 'LEASE',
        monthlyRent: v.monthlyRent,
        depositAmount: v.depositAmount,
        startDate: v.startDate,
        endDate: this.openEnded() ? undefined : (v.endDate || undefined),
      },
    });

    // Navigate back to detail after save
    this.router.navigate(['/contrats', id]);
  }
}
