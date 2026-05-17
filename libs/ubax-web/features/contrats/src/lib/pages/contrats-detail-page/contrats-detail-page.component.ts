import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
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
import { firstValueFrom, map } from 'rxjs';
import {
  ApiConfiguration,
  generateReadUrl,
} from '@ubax-workspace/shared-api-types';
import {
  ContratsStore,
  type ContractResponse,
  ContractStatus,
} from '@ubax-workspace/ubax-web-data-access';
import {
  StatusBadgeComponent,
  type StatusVariant,
} from '@ubax-workspace/shared-design-system';
import {
  NOTIFICATION_HANDLER,
  type NotificationHandler,
} from '@ubax-workspace/shared-data-access';
import { deriveViewState, type ViewState } from '@ubax-workspace/shared-ui';
import { ContratsSkeletonComponent } from '../../components/contrats-skeleton/contrats-skeleton.component';
import { ContratSubmitDialogComponent } from '../../components/contrat-submit-dialog/contrat-submit-dialog.component';
import { ContratTerminateDialogComponent } from '../../components/contrat-terminate-dialog/contrat-terminate-dialog.component';
import { ContratCancelDialogComponent } from '../../components/contrat-cancel-dialog/contrat-cancel-dialog.component';

type DetailTone = 'neutral' | 'accent' | 'success' | 'warning';

type DetailTile = {
  label: string;
  value: string;
  hint?: string;
  icon: string;
  tone?: DetailTone;
  featured?: boolean;
};

type SummaryRow = {
  label: string;
  value: string;
  hint?: string;
};

@Component({
  selector: 'ubax-contrats-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    StatusBadgeComponent,
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
  private static readonly DOCUMENT_READ_URL_TTL_MS = 240_000;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly notifications = inject(NOTIFICATION_HANDLER, {
    optional: true,
  }) as NotificationHandler | null;
  readonly store = inject(ContratsStore);

  private readonly contractId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' },
  );

  private readonly hasLoaded = signal(false);

  readonly showSubmitDialog = signal(false);
  readonly showTerminateDialog = signal(false);
  readonly showCancelDialog = signal(false);
  readonly documentOpening = signal(false);
  readonly previewUrl = signal<string | null>(null);
  readonly previewName = signal('Contrat signé');
  readonly previewFullscreen = signal(false);
  readonly previewIsImage = signal(false);

  readonly viewState = computed<ViewState>(() =>
    deriveViewState(
      this.store.loading(),
      this.store.error(),
      !this.store.selectedItem(),
      this.hasLoaded(),
    ),
  );

  backToContracts(): void {
    void this.router.navigate(['/contrats']);
  }

  readonly contrat = computed(() => this.store.selectedItem());

  readonly previewSafeUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.previewUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  private prefetchedDocumentSource: string | null = null;
  private prefetchedDocumentUrl: string | null = null;
  private prefetchedDocumentAt: number | null = null;
  private prefetchedDocumentPromise: Promise<string | null> | null = null;

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

  readonly CONTRACT_TYPE_LABELS: Record<
    NonNullable<ContractResponse['contractType']>,
    string
  > = {
    LEASE: 'Contrat de bail',
    SALE: 'Contrat de vente',
    RENT_TO_OWN: 'Location-vente',
    RESERVATION: 'Réservation',
    MANDATE: 'Mandat',
  };

  readonly propertyHeadline = computed(() => {
    const c = this.contrat();
    if (!c) return 'Bien non renseigné';

    return (
      [c.propertyTitle ?? c.propertyAddress, c.propertyCity]
        .filter((value): value is string => Boolean(value))
        .join(', ') || 'Bien non renseigné'
    );
  });

  readonly heroSummary = computed(() => {
    const c = this.contrat();
    if (!c) return '';

    return [
      this.getStatusContext(c.status),
      c.ownerName ? `Propriétaire : ${c.ownerName}` : undefined,
      (c.agencyName ?? c.createdByFullName)
        ? `Agence : ${c.agencyName ?? c.createdByFullName}`
        : undefined,
    ]
      .filter((value): value is string => Boolean(value))
      .join(' · ');
  });

  readonly heroMetrics = computed<DetailTile[]>(() => {
    const c = this.contrat();
    if (!c) return [];

    return [
      {
        label: 'Montant mensuel total',
        value: this.formatAmount(this.resolveTotalMonthlyAmount(c)),
        hint: this.buildMonthlyAmountHint(c),
        icon: 'pi-credit-card',
        tone: 'accent',
        featured: true,
      },
      {
        label: 'Caution',
        value: this.formatAmount(c.depositAmount),
        hint: c.depositReturned
          ? 'Déjà restituée au locataire'
          : 'Toujours conservée en garantie',
        icon: 'pi-shield',
        tone: c.depositReturned ? 'success' : 'warning',
      },
      {
        label: 'Durée du bail',
        value: this.getContractDurationLabel(c.startDate, c.endDate),
        hint: c.startDate
          ? `À partir du ${this.formatDate(c.startDate)}`
          : undefined,
        icon: 'pi-calendar',
      },
      {
        label: 'Paiement attendu',
        value: this.formatPaymentDay(c.paymentDay),
        hint: c.endDate
          ? `Échéance le ${this.formatDate(c.endDate)}`
          : 'Sans fin définie',
        icon: 'pi-clock',
      },
    ];
  });

  readonly partiesItems = computed<DetailTile[]>(() => {
    const c = this.contrat();
    if (!c) return [];

    return [
      {
        label: 'Locataire principal',
        value: c.tenantName ?? c.tenantId ?? '—',
        hint:
          this.joinText([c.tenantEmail, c.tenantPhone], ' · ') ??
          'Coordonnées non transmises',
        icon: 'pi-user',
        tone: 'accent',
      },
      {
        label: 'Propriétaire',
        value: c.ownerName ?? c.ownerId ?? '—',
        hint: c.referenceNumber
          ? `Référence ${c.referenceNumber}`
          : 'Titulaire du bien',
        icon: 'pi-briefcase',
      },
      {
        label: 'Bien concerné',
        value: c.propertyTitle ?? c.propertyAddress ?? c.propertyId ?? '—',
        hint: c.propertyCity ?? 'Ville non renseignée',
        icon: 'pi-home',
      },
      {
        label: 'Ville / zone',
        value: c.propertyCity ?? '—',
        hint: c.propertyType ?? this.getContractTypeLabel(c.contractType),
        icon: 'pi-map-marker',
      },
      {
        label: 'Agence gestionnaire',
        value: c.agencyName ?? c.createdByFullName ?? c.agencyId ?? '—',
        hint: c.createdById
          ? `Création ${this.shortId(c.createdById)}`
          : 'Pilotage du dossier',
        icon: 'pi-building',
      },
      {
        label: 'Nature du contrat',
        value: this.getContractTypeLabel(c.contractType),
        hint: c.status
          ? `Statut ${this.getStatusLabel(c.status).toLowerCase()}`
          : 'Type contractuel',
        icon: 'pi-bookmark',
      },
    ];
  });

  readonly financialItems = computed<DetailTile[]>(() => {
    const c = this.contrat();
    if (!c) return [];

    return [
      {
        label: 'Loyer mensuel',
        value: this.formatAmount(c.monthlyRent),
        hint: 'Base locative hors charges',
        icon: 'pi-home',
      },
      {
        label: 'Charges mensuelles',
        value: this.formatAmount(c.monthlyCharges),
        hint: 'Charges récupérables du bail',
        icon: 'pi-bolt',
      },
      {
        label: 'Mensualité globale',
        value: this.formatAmount(this.resolveTotalMonthlyAmount(c)),
        hint: 'Montant facturé chaque mois',
        icon: 'pi-credit-card',
        tone: 'accent',
        featured: true,
      },
      {
        label: 'Dépôt de garantie',
        value: this.formatAmount(c.depositAmount),
        hint: c.depositReturned ? 'Restitué' : 'Toujours immobilisé',
        icon: 'pi-shield',
        tone: c.depositReturned ? 'success' : 'warning',
      },
      {
        label: 'Commission agence',
        value: this.formatPercentage(c.agencyCommissionRate),
        hint: 'Taux prévu au contrat',
        icon: 'pi-percentage',
      },
      {
        label: 'Jour de paiement',
        value: this.formatPaymentDay(c.paymentDay),
        hint: 'Cadence de recouvrement locatif',
        icon: 'pi-calendar',
      },
    ];
  });

  readonly clauseItems = computed<DetailTile[]>(() => {
    const c = this.contrat();
    if (!c) return [];

    return [
      {
        label: 'Clauses spéciales',
        value:
          c.specialClauses ??
          'Aucune clause spéciale n’a encore été renseignée pour ce bail.',
        hint: 'Éléments particuliers négociés entre les parties',
        icon: 'pi-file',
        tone: 'accent',
      },
      {
        label: 'Conditions de résiliation',
        value:
          c.terminationConditions ??
          'Aucune condition de résiliation n’a encore été renseignée.',
        hint: 'Préavis, modalités de sortie et garde-fous',
        icon: 'pi-times-circle',
        tone: c.terminationConditions ? 'warning' : 'neutral',
      },
    ];
  });

  readonly summaryRows = computed<SummaryRow[]>(() => {
    const c = this.contrat();
    if (!c) return [];

    return [
      {
        label: 'Référence',
        value: c.referenceNumber ?? `CTR-${this.shortId(c.id)}`,
        hint: `Identifiant interne ${this.shortId(c.id)}`,
      },
      {
        label: 'Début du bail',
        value: this.formatDate(c.startDate),
        hint: c.createdAt
          ? `Créé le ${this.formatDateTime(c.createdAt)}`
          : undefined,
      },
      {
        label: 'Fin du bail',
        value: this.formatDate(c.endDate),
        hint: c.updatedAt
          ? `Mis à jour le ${this.formatDateTime(c.updatedAt)}`
          : undefined,
      },
      {
        label: 'Durée estimée',
        value: this.getContractDurationLabel(c.startDate, c.endDate),
      },
      {
        label: 'Commission agence',
        value: this.formatPercentage(c.agencyCommissionRate),
      },
      {
        label: 'Restitution caution',
        value: c.depositReturned ? 'Effectuée' : 'Non restituée',
        hint: this.formatAmount(c.depositAmount),
      },
    ];
  });

  readonly dossierItems = computed<DetailTile[]>(() => {
    const c = this.contrat();
    if (!c) return [];

    return [
      {
        label: 'Document contractuel',
        value: c.signedFileUrl ? 'PDF disponible' : 'Génération en cours',
        hint: c.signedFileUrl
          ? 'Version prête au téléchargement'
          : 'Le document sera attaché automatiquement',
        icon: 'pi-file-pdf',
        tone: c.signedFileUrl ? 'success' : 'warning',
      },
      {
        label: 'Flux de paiements',
        value: c.status === 'ACTIVE' ? 'Suivi ouvert' : 'Non démarré',
        hint:
          c.status === 'ACTIVE'
            ? 'Historique et règlements disponibles'
            : 'Disponible dès activation du bail',
        icon: 'pi-history',
        tone: c.status === 'ACTIVE' ? 'accent' : 'neutral',
      },
      {
        label: 'Gestion locative',
        value: c.agencyName ?? c.createdByFullName ?? 'Agence non renseignée',
        hint: 'Structure qui opère le contrat',
        icon: 'pi-building',
      },
    ];
  });

  constructor() {
    effect(() => {
      const id = this.contractId();
      if (id) this.store.loadOne?.(id);
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
        this.notifications?.success('Contrat soumis a signature avec succes');
        this.store.clearActionFeedback();
      }
    });

    // After terminate — close dialog
    effect(() => {
      if (this.store.lastTerminatedId()) {
        this.showTerminateDialog.set(false);
        this.notifications?.success('Contrat resilie avec succes');
        this.store.clearActionFeedback();
      }
    });

    // After cancel — redirect to list
    effect(() => {
      if (this.store.lastCancelledId()) {
        this.showCancelDialog.set(false);
        this.notifications?.success('Contrat annule avec succes');
        this.store.clearActionFeedback();
        this.router.navigate(['/contrats']);
      }
    });

    effect(() => {
      if (this.store.lastActivatedId()) {
        this.notifications?.success('Contrat activé avec succès');
        this.store.clearActionFeedback();
      }
    });

    effect((onCleanup) => {
      const hasOverlay = !!this.previewUrl();
      this.document.body.classList.toggle('ubax-overlay-open', hasOverlay);

      onCleanup(() => {
        if (hasOverlay) {
          this.document.body.classList.remove('ubax-overlay-open');
        }
      });
    });

    effect(() => {
      const fileUrl = this.contrat()?.signedFileUrl ?? null;

      if (!fileUrl) {
        this.clearPrefetchedDocumentUrl();
        return;
      }

      if (
        this.getFreshPrefetchedDocumentUrl(fileUrl) ||
        this.prefetchedDocumentPromise
      ) {
        return;
      }

      void this.prefetchDocumentUrl(fileUrl);
    });
  }

  onSubmitConfirm(): void {
    const id = this.contractId();
    if (id) this.store.soumettre(id);
  }

  onActivateRequest(): void {
    const id = this.contractId();
    const confirmed =
      this.document.defaultView?.confirm(
        'Activer le contrat créera automatiquement le premier paiement de loyer. Continuer ? ',
      ) ?? false;

    if (id && confirmed) {
      this.store.activer(id);
    }
  }

  onTerminateConfirm(reason: string): void {
    const id = this.contractId();
    if (id) this.store.resilier({ id, reason });
  }

  onCancelConfirm(): void {
    const id = this.contractId();
    if (id) this.store.annuler(id);
  }

  async openDocument(fileUrl: string | null | undefined): Promise<void> {
    if (!fileUrl || this.documentOpening()) {
      return;
    }

    const prefetchedUrl = this.getFreshPrefetchedDocumentUrl(fileUrl);
    if (prefetchedUrl) {
      this.openPreview(prefetchedUrl);
      return;
    }

    this.documentOpening.set(true);

    try {
      const resolvedUrl = this.prefetchedDocumentPromise
        ? await this.prefetchedDocumentPromise
        : await this.resolveDocumentReadUrl(fileUrl);

      if (!resolvedUrl) {
        throw new Error('Missing read url');
      }

      this.cachePrefetchedDocumentUrl(fileUrl, resolvedUrl);
      this.openPreview(resolvedUrl);
    } catch {
      this.notifications?.error(
        'Impossible d’ouvrir le document contractuel pour le moment.',
      );
    } finally {
      this.documentOpening.set(false);
    }
  }

  closePreview(): void {
    this.previewUrl.set(null);
    this.previewName.set('Contrat signé');
    this.previewIsImage.set(false);
    this.previewFullscreen.set(false);
  }

  togglePreviewFullscreen(): void {
    this.previewFullscreen.update((value) => !value);
  }

  formatAmount(amount: number | undefined): string {
    if (amount == null) return '—';
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }

  formatPercentage(value: number | undefined): string {
    if (value == null) return '—';
    return (
      new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(
        value,
      ) + ' %'
    );
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return 'Durée indéterminée';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  formatDateTime(date: string | null | undefined): string {
    if (!date) return '—';

    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatPaymentDay(day: number | undefined): string {
    if (day == null) return '—';
    return `Le ${day} de chaque mois`;
  }

  getStatusLabel(status: ContractStatus | undefined): string {
    return status ? this.STATUS_LABELS[status] : '—';
  }

  getStatusVariant(status: ContractStatus | undefined): StatusVariant {
    return status ? this.STATUS_VARIANTS[status] : 'neutral';
  }

  getContractTypeLabel(
    type: ContractResponse['contractType'] | undefined,
  ): string {
    return type ? this.CONTRACT_TYPE_LABELS[type] : 'Contrat';
  }

  getStatusContext(status: ContractStatus | undefined): string {
    switch (status) {
      case 'DRAFT':
        return 'Bail en préparation, encore modifiable avant envoi.';
      case 'PENDING_SIGNATURE':
        return 'Bail prêt et en attente de validation finale.';
      case 'ACTIVE':
        return 'Bail actif avec échéances et loyers en cours.';
      case 'TERMINATED':
        return 'Bail clôturé par résiliation.';
      case 'EXPIRED':
        return 'Bail arrivé à son terme contractuel.';
      case 'CANCELLED':
        return 'Bail annulé avant mise en application.';
      default:
        return 'Dossier contractuel en cours de suivi.';
    }
  }

  getContractDurationLabel(
    startDate: string | null | undefined,
    endDate: string | null | undefined,
  ): string {
    if (!startDate || !endDate) return 'Durée indéterminée';

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return '—';
    }

    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth()) +
      (end.getDate() >= start.getDate() ? 1 : 0);

    const normalized = Math.max(months, 1);
    return `${normalized} mois`;
  }

  private resolveTotalMonthlyAmount(
    contract: ContractResponse | null | undefined,
  ): number | undefined {
    if (!contract) return undefined;
    if (contract.totalMonthlyAmount != null) return contract.totalMonthlyAmount;
    if (contract.monthlyRent == null && contract.monthlyCharges == null) {
      return undefined;
    }

    return (contract.monthlyRent ?? 0) + (contract.monthlyCharges ?? 0);
  }

  private buildMonthlyAmountHint(
    contract: ContractResponse | null | undefined,
  ): string | undefined {
    if (!contract) return undefined;

    return this.joinText(
      [
        Number.isFinite(contract.monthlyRent)
          ? `Loyer ${this.formatAmount(contract.monthlyRent)}`
          : undefined,
        Number.isFinite(contract.monthlyCharges)
          ? `Charges ${this.formatAmount(contract.monthlyCharges)}`
          : undefined,
      ],
      ' + ',
    );
  }

  private joinText(
    values: Array<string | null | undefined>,
    separator = ', ',
  ): string | undefined {
    const normalized = values.filter((value): value is string =>
      Boolean(value),
    );
    if (!normalized.length) return undefined;

    return normalized.join(separator);
  }

  shortId(id: string | undefined): string {
    if (!id) return '—';
    return id.substring(0, 8).toUpperCase();
  }

  private extractReadUrlFromResponse(body: unknown): string | null {
    if (!body || typeof body !== 'object') {
      return null;
    }

    const direct = body as { readUrl?: unknown };
    if (typeof direct.readUrl === 'string' && direct.readUrl.length > 0) {
      return direct.readUrl;
    }

    const wrapped = body as { data?: unknown };
    if (wrapped.data && typeof wrapped.data === 'object') {
      const nested = wrapped.data as { readUrl?: unknown };
      if (typeof nested.readUrl === 'string' && nested.readUrl.length > 0) {
        return nested.readUrl;
      }
    }

    return null;
  }

  private async prefetchDocumentUrl(fileUrl: string): Promise<string | null> {
    if (this.prefetchedDocumentPromise) {
      return this.prefetchedDocumentPromise;
    }

    this.prefetchedDocumentPromise = this.resolveDocumentReadUrl(fileUrl)
      .then((resolvedUrl) => {
        if (resolvedUrl) {
          this.cachePrefetchedDocumentUrl(fileUrl, resolvedUrl);
        }

        return resolvedUrl;
      })
      .catch(() => null)
      .finally(() => {
        this.prefetchedDocumentPromise = null;
      });

    return this.prefetchedDocumentPromise;
  }

  private async resolveDocumentReadUrl(
    fileUrl: string,
  ): Promise<string | null> {
    const response = await firstValueFrom(
      generateReadUrl(this.http, this.apiConfig.rootUrl, { fileUrl }),
    );

    return this.extractReadUrlFromResponse(response.body);
  }

  private openPreview(resolvedUrl: string): void {
    this.previewName.set('Contrat signé');
    this.previewIsImage.set(this.isPreviewImage(resolvedUrl));
    this.previewUrl.set(resolvedUrl);
    this.previewFullscreen.set(false);
  }

  private cachePrefetchedDocumentUrl(
    fileUrl: string,
    resolvedUrl: string,
  ): void {
    this.prefetchedDocumentSource = fileUrl;
    this.prefetchedDocumentUrl = resolvedUrl;
    this.prefetchedDocumentAt = Date.now();
  }

  private clearPrefetchedDocumentUrl(): void {
    this.prefetchedDocumentSource = null;
    this.prefetchedDocumentUrl = null;
    this.prefetchedDocumentAt = null;
    this.prefetchedDocumentPromise = null;
  }

  private getFreshPrefetchedDocumentUrl(fileUrl: string): string | null {
    if (
      this.prefetchedDocumentSource !== fileUrl ||
      !this.prefetchedDocumentUrl ||
      this.prefetchedDocumentAt == null
    ) {
      return null;
    }

    if (
      Date.now() - this.prefetchedDocumentAt >
      ContratsDetailPageComponent.DOCUMENT_READ_URL_TTL_MS
    ) {
      this.clearPrefetchedDocumentUrl();
      return null;
    }

    return this.prefetchedDocumentUrl;
  }

  private isPreviewImage(url: string): boolean {
    return /(\.png|\.jpe?g|\.webp|\.gif|\.bmp|\.svg)(\?|$|\s)/i.test(url);
  }
}
