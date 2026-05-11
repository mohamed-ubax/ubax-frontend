import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, firstValueFrom } from 'rxjs';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ApiConfiguration,
  generateReadUrl,
  type PartnerApplicationResponse,
  type ApplicationStatusLogResponse,
  type PresignedReadUrlResponse,
} from '@ubax-workspace/shared-api-types';
import {
  DocumentListComponent,
  type DocumentItem,
  EmptyStateComponent,
  SectionCardComponent,
  StatusBadgeComponent,
} from '@ubax-workspace/shared-design-system';
import { NOTIFICATION_HANDLER } from '@ubax-workspace/shared-data-access';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import {
  AdminCandidaturesService,
  type DecisionStatus,
} from '../../services/admin-candidatures.service';

type ModalType = 'reject' | 'incomplete' | 'approve' | null;

const STATUS_BADGE_MAP: Record<
  string,
  'pending' | 'active' | 'warning' | 'danger' | 'neutral' | 'info'
> = {
  PENDING: 'pending',
  UNDER_REVIEW: 'info',
  INCOMPLETE: 'warning',
  APPROVED: 'active',
  REJECTED: 'danger',
};

const STATUS_LABEL_MAP: Record<string, string> = {
  PENDING: 'En attente',
  UNDER_REVIEW: "En cours d'examen",
  INCOMPLETE: 'Incomplet',
  APPROVED: 'Approuvé',
  REJECTED: 'Rejeté',
};

@Component({
  selector: 'ubax-admin-candidatures-detail-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    ReactiveFormsModule,
    SectionCardComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    DocumentListComponent,
    DialogModule,
    TextareaModule,
  ],
  templateUrl: './candidatures-detail-page.component.html',
  styleUrl: './candidatures-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CandidaturesDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc = inject(AdminCandidaturesService);
  private readonly notif = inject(NOTIFICATION_HANDLER);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);

  private readonly applicationId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' },
  );

  private readonly sanitizer = inject(DomSanitizer);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly application = signal<PartnerApplicationResponse | null>(
    null,
  );
  protected readonly activeModal = signal<ModalType>(null);
  /** Tracks which document key is currently generating its presigned URL. */
  protected readonly documentOpeningId = signal<string | null>(null);
  protected readonly previewItem = signal<DocumentItem | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly previewFullscreen = signal(false);
  protected readonly previewSafeUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.previewUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  protected readonly commentForm = this.fb.group({
    comment: ['', Validators.required],
  });

  // Computed: actions disponibles selon le statut
  protected readonly availableActions = computed(() => {
    const status = this.application()?.status;
    switch (status) {
      case 'PENDING':
        return {
          canTakeCharge: true,
          canApprove: false,
          canReject: true,
          canIncomplete: false,
        };
      case 'UNDER_REVIEW':
        return {
          canTakeCharge: false,
          canApprove: true,
          canReject: true,
          canIncomplete: true,
        };
      case 'INCOMPLETE':
        return {
          canTakeCharge: true,
          canApprove: false,
          canReject: true,
          canIncomplete: false,
        };
      default:
        return {
          canTakeCharge: false,
          canApprove: false,
          canReject: false,
          canIncomplete: false,
        };
    }
  });

  protected readonly isActionable = computed(() => {
    const status = this.application()?.status;
    return (
      status === 'PENDING' ||
      status === 'UNDER_REVIEW' ||
      status === 'INCOMPLETE'
    );
  });

  protected readonly isTerminal = computed(() => {
    const status = this.application()?.status;
    return status === 'APPROVED' || status === 'REJECTED';
  });

  protected readonly legalRepName = computed(() => {
    const app = this.application();
    if (!app) return '—';
    const parts = [app.legalRepFirstName, app.legalRepLastName].filter(Boolean);
    return parts.length ? parts.join(' ') : '—';
  });

  protected readonly sortedHistory = computed(() => {
    const history = this.application()?.statusHistory ?? [];
    return [...history].sort(
      (a, b) =>
        new Date(b.changedAt ?? '').getTime() -
        new Date(a.changedAt ?? '').getTime(),
    );
  });

  /** Builds the DocumentItem list from the application's stored MinIO URLs. */
  protected readonly documents = computed<DocumentItem[]>(() => {
    const app = this.application();
    if (!app) return [];
    const items: DocumentItem[] = [];
    if (app.rccmUrl)
      items.push({ id: 'rccm', name: 'RCCM', url: app.rccmUrl, type: 'PDF' });
    if (app.dfeUrl)
      items.push({ id: 'dfe', name: 'DFE', url: app.dfeUrl, type: 'PDF' });
    if (app.bailUrl)
      items.push({
        id: 'bail',
        name: 'Contrat de bail',
        url: app.bailUrl,
        type: 'PDF',
      });
    if (app.logoUrl)
      items.push({ id: 'logo', name: 'Logo', url: app.logoUrl, type: 'Image' });
    return items;
  });

  constructor() {
    effect(() => {
      const id = this.applicationId();
      if (id) void this.loadApplication(id);
    });
  }

  private async loadApplication(id: string): Promise<void> {
    this.loading.set(true);
    try {
      this.application.set(await firstValueFrom(this.svc.getApplication(id)));
    } catch {
      this.notif.error('Impossible de charger la candidature.');
    } finally {
      this.loading.set(false);
    }
  }

  protected openModal(type: ModalType): void {
    this.commentForm.reset();
    this.activeModal.set(type);
  }

  protected closeModal(): void {
    this.activeModal.set(null);
  }

  protected async takeCharge(): Promise<void> {
    await this.submitDecision('UNDER_REVIEW');
  }

  protected async submitReject(): Promise<void> {
    if (this.commentForm.invalid) {
      this.commentForm.markAllAsTouched();
      return;
    }
    await this.submitDecision('REJECTED', this.commentForm.value.comment);
    this.closeModal();
  }

  protected async submitIncomplete(): Promise<void> {
    if (this.commentForm.invalid) {
      this.commentForm.markAllAsTouched();
      return;
    }
    await this.submitDecision('INCOMPLETE', this.commentForm.value.comment);
    this.closeModal();
  }

  protected async submitApprove(): Promise<void> {
    await this.submitDecision('APPROVED');
    this.closeModal();
  }

  private async submitDecision(
    newStatus: DecisionStatus,
    comment?: string,
  ): Promise<void> {
    const id = this.applicationId();
    if (!id) return;

    this.saving.set(true);
    try {
      const updated = await firstValueFrom(
        this.svc.decide(id, { newStatus, comment }),
      );
      this.application.set(updated);

      const messages: Record<DecisionStatus, string> = {
        UNDER_REVIEW: 'Candidature prise en charge.',
        APPROVED:
          'Candidature approuvée. Un compte partenaire a été créé automatiquement.',
        REJECTED: 'Candidature rejetée.',
        INCOMPLETE: 'Demande de compléments envoyée.',
      };
      this.notif.success(messages[newStatus]);
    } catch {
      this.notif.error("L'opération a échoué. Veuillez réessayer.");
    } finally {
      this.saving.set(false);
    }
  }

  protected getStatusBadge(
    status: string | undefined,
  ): 'pending' | 'active' | 'warning' | 'danger' | 'neutral' | 'info' {
    return STATUS_BADGE_MAP[status ?? ''] ?? 'neutral';
  }

  protected getStatusLabel(status: string | undefined): string {
    return STATUS_LABEL_MAP[status ?? ''] ?? status ?? '—';
  }

  protected getPartnerTypeLabel(type: string | undefined): string {
    if (!type) return '—';
    if (type.includes('AGENCE') || type.includes('IMMOB'))
      return 'Agence Immobilière';
    if (type.includes('HOTEL')) return 'Hôtel';
    return type;
  }

  /**
   * Opens a private partner document via a presigned GET URL.
   * Called on `viewClick` from `<ubax-document-list>`.
   *
   * Flow:
   *  1. Take `item.url` (the raw MinIO URL stored in the application, e.g. dfeUrl)
   *  2. Call GET /v1/storage/presign/read?fileUrl=<item.url>
   *  3. Open the returned `readUrl` (pre-signed, valid 300 s) in a new tab
   *
   * Never cached — regenerated on every click because the URL expires quickly.
   */
  protected async openDocument(item: DocumentItem): Promise<void> {
    const fileUrl = item.url;
    if (!fileUrl) return;

    this.documentOpeningId.set(String(item.id));
    try {
      const response = await firstValueFrom(
        generateReadUrl(this.http, this.apiConfig.rootUrl, { fileUrl }),
      );
      const readUrl = (response.body as { data: PresignedReadUrlResponse })?.data?.readUrl;
      this.previewItem.set(item);
      this.previewUrl.set(readUrl ?? fileUrl);
    } catch {
      // Fallback: preview with the raw URL if presigning fails
      this.previewItem.set(item);
      this.previewUrl.set(fileUrl);
    } finally {
      this.documentOpeningId.set(null);
    }
  }

  protected closePreview(): void {
    this.previewItem.set(null);
    this.previewUrl.set(null);
    this.previewFullscreen.set(false);
  }

  protected togglePreviewFullscreen(): void {
    this.previewFullscreen.update((v) => !v);
  }

  protected getHistoryStatusLabel(entry: ApplicationStatusLogResponse): string {
    return STATUS_LABEL_MAP[entry.newStatus ?? ''] ?? entry.newStatus ?? '—';
  }

  protected getHistoryStatusBadge(
    entry: ApplicationStatusLogResponse,
  ): 'pending' | 'active' | 'warning' | 'danger' | 'neutral' | 'info' {
    return STATUS_BADGE_MAP[entry.newStatus ?? ''] ?? 'neutral';
  }
}
