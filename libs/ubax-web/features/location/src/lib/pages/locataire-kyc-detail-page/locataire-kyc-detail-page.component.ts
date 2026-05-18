import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  AbstractControl,
  type ValidationErrors,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom, map } from 'rxjs';
import {
  ApiConfiguration,
  generateReadUrl,
} from '@ubax-workspace/shared-api-types';
import {
  NOTIFICATION_HANDLER,
  type NotificationHandler,
} from '@ubax-workspace/shared-data-access';
import { LocationStore } from '@ubax-workspace/ubax-web-data-access';
import { STATUS_META } from '../../constants/locataires-kyc-list.constants';
import type { DialogMode } from '../../types/locataire-kyc-detail.types';

type PendingDecisionAction =
  | { type: 'qualify' }
  | { type: 'reject'; reason: string }
  | null;

const rejectReasonValidator = (
  control: AbstractControl,
): ValidationErrors | null => {
  const trimmedValue = `${control.value ?? ''}`.trim();

  if (!trimmedValue) {
    return { required: true };
  }

  if (trimmedValue.length < 10) {
    return {
      minlength: {
        requiredLength: 10,
        actualLength: trimmedValue.length,
      },
    };
  }

  if (trimmedValue.length > 500) {
    return {
      maxlength: {
        requiredLength: 500,
        actualLength: trimmedValue.length,
      },
    };
  }

  return null;
};

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
  private readonly document = inject(DOCUMENT);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly notifications = inject(NOTIFICATION_HANDLER, {
    optional: true,
  }) as NotificationHandler | null;
  readonly store = inject(LocationStore);

  private readonly tenantId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' },
  );

  readonly dialogMode = signal<DialogMode>(null);
  readonly hasLoaded = signal(false);
  readonly documentOpeningId = signal<string | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly previewName = signal('Document');
  readonly previewFullscreen = signal(false);
  readonly previewIsImage = signal(false);
  readonly pendingDecisionAction = signal<PendingDecisionAction>(null);

  readonly rejectForm = this.fb.group({
    reason: ['', [rejectReasonValidator]],
  });

  readonly previewSafeUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.previewUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
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

  readonly isPending = computed(
    () => this.tenant()?.status === 'PENDING_REVIEW',
  );
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
        label: 'Numéro de pièce',
        value: t.idDocumentNumber ?? '—',
      },
      {
        icon: 'pi pi-calendar',
        label: 'Expiration pièce',
        value: t.idDocumentExpiry ? this.formatDate(t.idDocumentExpiry) : '—',
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
          typeof t.monthlyIncome === 'number'
            ? new Intl.NumberFormat('fr-FR').format(t.monthlyIncome) + ' FCFA'
            : '—',
      },
    ];
  });

  readonly guarantorBlocks = computed(() => {
    const t = this.tenant();
    if (!t?.hasGuarantor) return [];
    return [
      {
        icon: 'pi pi-user',
        label: 'Nom du garant',
        value: t.guarantorName ?? '—',
      },
      {
        icon: 'pi pi-envelope',
        label: 'Email du garant',
        value: t.guarantorEmail ?? '—',
      },
      {
        icon: 'pi pi-phone',
        label: 'Téléphone du garant',
        value: t.guarantorPhone ?? '—',
      },
    ];
  });

  readonly documents = computed(() => {
    const t = this.tenant();
    if (!t) return [];
    return [
      {
        id: 'id-document',
        label: "Pièce d'identité",
        icon: 'pi pi-id-card',
        fileUrl: t.idDocumentUrl,
        available: !!t.idDocumentUrl,
      },
      {
        id: 'address-proof',
        label: 'Justificatif de domicile',
        icon: 'pi pi-home',
        fileUrl: t.addressProofUrl,
        available: !!t.addressProofUrl,
      },
      {
        id: 'income-proof',
        label: 'Justificatif de revenus',
        icon: 'pi pi-chart-line',
        fileUrl: t.incomeProofUrl,
        available: !!t.incomeProofUrl,
      },
    ];
  });

  constructor() {
    effect(() => {
      const id = this.tenantId();
      if (id) this.store.loadOne?.(id);
    });

    effect(() => {
      if (!this.store.loading() && !this.hasLoaded()) {
        this.hasLoaded.set(true);
      }
    });

    effect(() => {
      const action = this.pendingDecisionAction();
      const saving = this.isSaving();
      const error = this.store.error();
      const tenant = this.tenant();

      if (!action || saving) {
        return;
      }

      if (error) {
        this.notifications?.error(error);
        this.pendingDecisionAction.set(null);
        return;
      }

      if (action.type === 'qualify' && tenant?.status === 'QUALIFIED') {
        this.notifications?.success('Dossier qualifié avec succès');
        this.pendingDecisionAction.set(null);
      }

      if (action.type === 'reject' && tenant?.status === 'REJECTED') {
        this.notifications?.success(
          `Dossier rejeté avec succès : ${action.reason}`,
        );
        this.pendingDecisionAction.set(null);
      }
    });

    effect((onCleanup) => {
      const hasOverlay = !!this.dialogMode() || !!this.previewUrl();
      this.document.body.classList.toggle('ubax-overlay-open', hasOverlay);

      onCleanup(() => {
        if (hasOverlay) {
          this.document.body.classList.remove('ubax-overlay-open');
        }
      });
    });
  }

  // ── Qualify ─────────────────────────────────────────────────────────────────
  openQualifyDialog(): void {
    this.dialogMode.set('qualify');
  }

  confirmQualify(): void {
    const id = this.tenantId();
    if (!id) return;
    this.pendingDecisionAction.set({ type: 'qualify' });
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

    const reason = this.rejectForm.getRawValue().reason.trim();
    this.pendingDecisionAction.set({ type: 'reject', reason });
    this.store.rejeter({ id, reason });
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
    if (id) this.store.loadOne?.(id);
  }

  async openDocument(
    fileUrl: string | undefined,
    fileName: string,
    docId: string,
  ): Promise<void> {
    if (!fileUrl) {
      return;
    }

    this.documentOpeningId.set(docId);

    try {
      const response = await firstValueFrom(
        generateReadUrl(this.http, this.apiConfig.rootUrl, { fileUrl }),
      );
      const resolvedUrl = this.extractReadUrlFromResponse(response.body);

      if (!resolvedUrl) {
        throw new Error('Missing read url');
      }

      this.previewName.set(fileName.trim() || 'Document');
      this.previewIsImage.set(this.isPreviewImage(resolvedUrl, fileName));
      this.previewUrl.set(resolvedUrl);
      this.previewFullscreen.set(false);
    } catch {
      this.notifications?.error(
        'Impossible d’ouvrir ce document pour le moment.',
      );
    } finally {
      this.documentOpeningId.set(null);
    }
  }

  closePreview(): void {
    this.previewUrl.set(null);
    this.previewName.set('Document');
    this.previewIsImage.set(false);
    this.previewFullscreen.set(false);
  }

  togglePreviewFullscreen(): void {
    this.previewFullscreen.update((value) => !value);
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

  private isPreviewImage(url: string, fileName?: string): boolean {
    const target = `${fileName ?? ''} ${url}`.toLowerCase();
    return /(\.png|\.jpe?g|\.webp|\.gif|\.bmp|\.svg)(\?|$|\s)/.test(target);
  }
}
