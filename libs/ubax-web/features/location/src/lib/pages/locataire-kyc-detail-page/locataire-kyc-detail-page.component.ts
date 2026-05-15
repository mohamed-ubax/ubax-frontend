import { CommonModule } from '@angular/common';
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
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { LocationStore } from '@ubax-workspace/ubax-web-data-access';
import { STATUS_META } from '../locataires-kyc-list-page/locataires-kyc-list-page.component';

type DialogMode = 'qualify' | 'reject' | null;

@Component({
  selector: 'ubax-locataire-kyc-detail-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './locataire-kyc-detail-page.component.html',
  styleUrl: './locataire-kyc-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocataireKycDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  readonly store = inject(LocationStore);

  private readonly tenantId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' },
  );

  readonly dialogMode = signal<DialogMode>(null);
  readonly hasLoaded = signal(false);

  readonly rejectForm = this.fb.group({
    reason: [
      '',
      [Validators.required, Validators.minLength(10), Validators.maxLength(500)],
    ],
  });

  readonly tenant = computed(() =>
    this.store.entities().find((t) => t.id === this.tenantId()),
  );

  readonly viewState = computed(() => {
    if (this.store.loading() && !this.hasLoaded()) return 'loading';
    if (this.store.error()) return 'error';
    if (!this.tenant() && this.hasLoaded()) return 'not-found';
    if (this.tenant()) return 'success';
    return 'loading';
  });

  readonly isPending = computed(() => this.tenant()?.status === 'PENDING_REVIEW');
  readonly isSaving = computed(() => this.store.saving());
  readonly statusMeta = STATUS_META;

  readonly infoBlocks = computed(() => {
    const t = this.tenant();
    if (!t) return [];
    return [
      { icon: 'pi pi-user', label: 'Nom complet', value: t.fullName ?? '—' },
      { icon: 'pi pi-envelope', label: 'Email', value: t.email ?? '—' },
      {
        icon: 'pi pi-id-card',
        label: "Type de pièce d'identité",
        value: t.idDocumentType ?? '—',
      },
      {
        icon: 'pi pi-hashtag',
        label: "Numéro de pièce",
        value: t.idDocumentNumber ?? '—',
      },
      {
        icon: 'pi pi-calendar',
        label: "Expiration pièce",
        value: t.idDocumentExpiry
          ? this.formatDate(t.idDocumentExpiry)
          : '—',
      },
    ];
  });

  readonly employmentBlocks = computed(() => {
    const t = this.tenant();
    if (!t) return [];
    return [
      {
        icon: 'pi pi-briefcase',
        label: 'Statut professionnel',
        value: t.employmentStatus ?? '—',
      },
      {
        icon: 'pi pi-building',
        label: 'Employeur',
        value: t.employerName ?? '—',
      },
      {
        icon: 'pi pi-wallet',
        label: 'Revenu mensuel',
        value:
          t.monthlyIncome != null
            ? new Intl.NumberFormat('fr-FR').format(t.monthlyIncome) + ' FCFA'
            : '—',
      },
    ];
  });

  readonly guarantorBlocks = computed(() => {
    const t = this.tenant();
    if (!t?.hasGuarantor) return [];
    return [
      { icon: 'pi pi-user', label: 'Nom du garant', value: t.guarantorName ?? '—' },
      { icon: 'pi pi-envelope', label: 'Email du garant', value: t.guarantorEmail ?? '—' },
      { icon: 'pi pi-phone', label: 'Téléphone du garant', value: t.guarantorPhone ?? '—' },
    ];
  });

  readonly documents = computed(() => {
    const t = this.tenant();
    if (!t) return [];
    return [
      {
        label: "Pièce d'identité",
        icon: 'pi pi-id-card',
        url: t.idDocumentUrl,
        available: !!t.idDocumentUrl,
      },
      {
        label: 'Justificatif de domicile',
        icon: 'pi pi-home',
        url: t.addressProofUrl,
        available: !!t.addressProofUrl,
      },
      {
        label: 'Justificatif de revenus',
        icon: 'pi pi-chart-line',
        url: t.incomeProofUrl,
        available: !!t.incomeProofUrl,
      },
    ];
  });

  constructor() {
    effect(() => {
      const id = this.tenantId();
      if (id) this.store.loadOne!(id);
    });

    effect(() => {
      if (!this.store.loading() && !this.hasLoaded()) {
        this.hasLoaded.set(true);
      }
    });
  }

  // ── Qualify ─────────────────────────────────────────────────────────────────
  openQualifyDialog(): void {
    this.dialogMode.set('qualify');
  }

  confirmQualify(): void {
    const id = this.tenantId();
    if (!id) return;
    this.store.qualifier(id);
    this.dialogMode.set(null);
  }

  // ── Reject ──────────────────────────────────────────────────────────────────
  openRejectDialog(): void {
    this.rejectForm.reset();
    this.dialogMode.set('reject');
  }

  confirmReject(): void {
    if (this.rejectForm.invalid) {
      this.rejectForm.markAllAsTouched();
      return;
    }
    const id = this.tenantId();
    if (!id) return;
    this.store.rejeter({ id, reason: this.rejectForm.getRawValue().reason });
    this.dialogMode.set(null);
  }

  closeDialog(): void {
    this.dialogMode.set(null);
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  goBack(): void {
    this.router.navigate(['/locataires']);
  }

  retryLoad(): void {
    this.hasLoaded.set(false);
    const id = this.tenantId();
    if (id) this.store.loadOne!(id);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  getStatusMeta(status: string | undefined) {
    return (
      STATUS_META[(status as keyof typeof STATUS_META) ?? 'INCOMPLETE'] ??
      STATUS_META['INCOMPLETE']
    );
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateStr));
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

  get reasonControl() {
    return this.rejectForm.controls.reason;
  }
}
