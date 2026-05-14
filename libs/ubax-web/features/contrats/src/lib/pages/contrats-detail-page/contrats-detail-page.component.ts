import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ContratsStore, ContractStatus } from '@ubax-workspace/ubax-web-data-access';
import {
  BreadcrumbNavComponent,
  DetailInfoBlockComponent,
  EmptyStateComponent,
  SectionCardComponent,
  StatusBadgeComponent,
  type InfoItem,
  type StatusVariant,
} from '@ubax-workspace/shared-design-system';
import { deriveViewState, type ViewState } from '@ubax-workspace/shared-ui';
import { ContratsSkeletonComponent } from '../../components/contrats-skeleton/contrats-skeleton.component';
import { ContratSubmitDialogComponent } from '../../components/contrat-submit-dialog/contrat-submit-dialog.component';
import { ContratTerminateDialogComponent } from '../../components/contrat-terminate-dialog/contrat-terminate-dialog.component';
import { ContratCancelDialogComponent } from '../../components/contrat-cancel-dialog/contrat-cancel-dialog.component';

@Component({
  selector: 'ubax-contrats-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    BreadcrumbNavComponent,
    SectionCardComponent,
    DetailInfoBlockComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    ContratsSkeletonComponent,
    ContratSubmitDialogComponent,
    ContratTerminateDialogComponent,
    ContratCancelDialogComponent,
  ],
  templateUrl: './contrats-detail-page.component.html',
  styleUrl: './contrats-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratsDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly store = inject(ContratsStore);

  private readonly contractId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' },
  );

  private readonly hasLoaded = signal(false);

  readonly showSubmitDialog = signal(false);
  readonly showTerminateDialog = signal(false);
  readonly showCancelDialog = signal(false);

  readonly viewState = computed<ViewState>(() =>
    deriveViewState(
      this.store.loading(),
      this.store.error(),
      !this.store.selectedItem(),
      this.hasLoaded(),
    ),
  );

  readonly contrat = computed(() => this.store.selectedItem());

  readonly STATUS_LABELS: Record<ContractStatus, string> = {
    DRAFT: 'Brouillon',
    PENDING_SIGNATURE: 'En attente de signature',
    ACTIVE: 'Actif',
    TERMINATED: 'Résilié',
    EXPIRED: 'Expiré',
    CANCELLED: 'Annulé',
  };

  readonly STATUS_VARIANTS: Record<ContractStatus, StatusVariant> = {
    DRAFT: 'neutral',
    PENDING_SIGNATURE: 'pending',
    ACTIVE: 'active',
    TERMINATED: 'cancelled',
    EXPIRED: 'cancelled',
    CANCELLED: 'cancelled',
  };

  readonly partiesItems = computed<InfoItem[]>(() => {
    const c = this.contrat();
    if (!c) return [];
    return [
      { label: 'Locataire', value: c.tenantName ?? c.tenantId ?? '—' },
      { label: 'Email', value: c.tenantEmail ?? '—' },
      { label: 'Téléphone', value: c.tenantPhone ?? '—' },
      { label: 'Bien', value: c.propertyAddress ?? c.propertyId ?? '—' },
      { label: 'Type de bien', value: c.propertyType ?? '—' },
      { label: 'Agence', value: c.agencyName ?? c.agencyId ?? '—' },
    ];
  });

  readonly financialItems = computed<InfoItem[]>(() => {
    const c = this.contrat();
    if (!c) return [];
    return [
      { label: 'Loyer mensuel', value: this.formatAmount(c.monthlyRent) },
      { label: 'Caution', value: this.formatAmount(c.depositAmount) },
      { label: 'Date de début', value: this.formatDate(c.startDate) },
      { label: 'Date de fin', value: this.formatDate(c.endDate) },
    ];
  });

  constructor() {
    effect(() => {
      const id = this.contractId();
      if (id) this.store.loadOne!(id);
    });

    effect(() => {
      if (!this.store.loading() && !this.hasLoaded()) {
        this.hasLoaded.set(true);
      }
    });

    // After submit — close dialog, show success feedback
    effect(() => {
      if (this.store.lastSubmittedId()) {
        this.showSubmitDialog.set(false);
        this.store.clearActionFeedback();
      }
    });

    // After terminate — close dialog
    effect(() => {
      if (this.store.lastTerminatedId()) {
        this.showTerminateDialog.set(false);
        this.store.clearActionFeedback();
      }
    });

    // After cancel — redirect to list
    effect(() => {
      if (this.store.lastCancelledId()) {
        this.showCancelDialog.set(false);
        this.store.clearActionFeedback();
        this.router.navigate(['/contrats']);
      }
    });
  }

  onSubmitConfirm(): void {
    const id = this.contractId();
    if (id) this.store.soumettre(id);
  }

  onTerminateConfirm(reason: string): void {
    const id = this.contractId();
    if (id) this.store.resilier({ id, reason });
  }

  onCancelConfirm(): void {
    const id = this.contractId();
    if (id) this.store.annuler(id);
  }

  formatAmount(amount: number | undefined): string {
    if (!amount) return '—';
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return 'Durée indéterminée';
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  getStatusLabel(status: ContractStatus | undefined): string {
    return status ? this.STATUS_LABELS[status] : '—';
  }

  getStatusVariant(status: ContractStatus | undefined): StatusVariant {
    return status ? this.STATUS_VARIANTS[status] : 'neutral';
  }

  shortId(id: string | undefined): string {
    if (!id) return '—';
    return id.substring(0, 8).toUpperCase();
  }
}
