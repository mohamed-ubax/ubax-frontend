import { CommonModule, DecimalPipe, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map } from 'rxjs';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { ApiConfiguration, generateReadUrl } from '@ubax-workspace/shared-api-types';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import {
  AgencyStore,
  AuthStore,
  TicketingStore,
  TicketMessage,
  TechniciansStore,
  UbaxSubRole,
  readResolvedTeamMemberRoles,
  TicketSav as Ticket,
  TicketPriority,
  TicketStatus,
} from '@ubax-workspace/ubax-web-data-access';
import type {
  AllowedNextStatus,
  DrawerMode,
  SelectOption,
  TechnicianMode,
} from '../../types/ticket-detail-page.types';
import {
  ALLOWED_TRANSITIONS,
  STATUS_FLOW,
} from '../../constants/ticket-detail-page.constants';
import {
  CATEGORY_LABELS,
  PRIORITY_META,
  STATUS_META,
} from '../../constants/tickets-list-page.constants';

@Component({
  selector: 'ubax-ticket-detail-page',
  standalone: true,
  imports: [CommonModule, DecimalPipe, ReactiveFormsModule, DatePickerModule, SelectModule],
  templateUrl: './ticket-detail-page.component.html',
  styleUrl: './ticket-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly authStore = inject(AuthStore);
  private readonly agencyStore = inject(AgencyStore);
  private readonly document = inject(DOCUMENT);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);
  private readonly sanitizer = inject(DomSanitizer);
  readonly techniciansStore = inject(TechniciansStore);
  readonly store = inject(TicketingStore);
  private lastNotifiedError: string | null = null;

  private readonly ticketId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' },
  );

  readonly drawerOpen = signal<DrawerMode>(null);
  readonly drawerClosing = signal(false);
  /** Statut en attente de confirmation (RESOLVED ou CLOSED nécessitent une note) */
  readonly pendingStatus = signal<AllowedNextStatus | null>(null);
  readonly pendingResolutionNote = signal('');
  readonly resolvedAttachmentUrls = signal<string[]>([]);
  readonly technicianMode = signal<TechnicianMode>('platform');

  readonly showStatusNoteDialog = computed(
    () => this.pendingStatus() === 'RESOLVED' || this.pendingStatus() === 'CLOSED',
  );

  readonly previewUrl = signal<string | null>(null);
  readonly previewIsImage = signal(false);
  readonly previewFullscreen = signal(false);
  readonly previewName = signal('Pièce jointe');

  readonly previewSafeUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.previewUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });
  readonly messageInput = signal('');
  readonly messageType = signal<'PUBLIC' | 'INTERNAL'>('PUBLIC');
  readonly hasLoaded = signal(false);

  readonly interventionForm = this.fb.group({
    assignedToId: [''],
    technicienId: [''],
    technicianName: [''],
    technicianPhone: [''],
    interventionDate: [null as Date | null],
    interventionPrice: [null as number | null],
    repairCost: [null as number | null],
    costImputedTo: ['OWNER' as 'OWNER' | 'TENANT' | 'SHARED'],
    resolutionNote: [''],
  });

  readonly ticket = computed<Ticket | undefined>(() =>
    this.store.entities().find((t) => t.id === this.ticketId()),
  );

  readonly viewState = computed(() => {
    if (this.store.loading() && !this.hasLoaded()) return 'loading';
    if (this.store.error()) return 'error';
    if (!this.ticket() && this.hasLoaded()) return 'not-found';
    if (this.ticket()) return 'success';
    return 'loading';
  });

  readonly statusMeta = STATUS_META;
  readonly priorityMeta = PRIORITY_META;
  readonly categoryLabels = CATEGORY_LABELS;
  readonly statusFlow = STATUS_FLOW;

  readonly currentStatusIndex = computed(() =>
    STATUS_FLOW.indexOf((this.ticket()?.status ?? 'OPEN') as TicketStatus),
  );

  readonly allowedNextStatuses = computed<AllowedNextStatus[]>(() => {
    const status = (this.ticket()?.status ?? 'OPEN') as TicketStatus;
    return ALLOWED_TRANSITIONS[status] ?? [];
  });

  readonly isClosed = computed(
    () =>
      this.ticket()?.status === 'CLOSED' ||
      this.ticket()?.status === 'CANCELLED',
  );

  /** L'endpoint /schedule auto-transite vers TECHNICIAN_SENT — interdit si déjà à ce statut ou plus loin */
  readonly canSchedule = computed(() => {
    const status = this.ticket()?.status;
    return !status || ['OPEN', 'IN_ANALYSIS'].includes(status);
  });

  readonly messages = computed(() => this.store.messages());

  readonly savAgentOptions = computed<SelectOption[]>(() => {
    const cachedSubRoles = this.agencyStore.memberSubRoles();

    return this.agencyStore
      .entities()
      .filter((member) =>
        readResolvedTeamMemberRoles(member, cachedSubRoles).includes(
          UbaxSubRole.AGENT_SAV,
        ),
      )
      .map((member) => {
        const id = member.userId ?? member.keycloakId ?? member.email ?? '';
        const label =
          `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim();

        return {
          value: id,
          label: label || member.email || id,
        };
      })
      .filter((option) => option.value.length > 0);
  });

  readonly imputationOptions: SelectOption[] = [
    { value: 'OWNER', label: 'Propriétaire' },
    { value: 'TENANT', label: 'Locataire' },
    { value: 'SHARED', label: 'Partagé' },
  ];

  readonly availableTechnicianOptions = computed<SelectOption[]>(() =>
    this.techniciansStore.availableTechnicians().map((technician) => {
      const fullName = [technician.firstName, technician.lastName]
        .filter((part): part is string => Boolean(part))
        .join(' ')
        .trim();
      const professionLabel =
        this.techniciansStore
          .professionOptions()
          .find((option) => option.value === technician.profession)?.label ??
        technician.profession ??
        'Technicien';

      return {
        value: technician.id,
        label: `${fullName || technician.id} - ${professionLabel}`,
      };
    }),
  );

  readonly infoBlocks = computed(() => {
    const t = this.ticket();
    if (!t) return [];
    return [
      { label: 'Catégorie', value: this.getCategoryLabel(t.category) },
      {
        label: 'Priorité',
        value:
          PRIORITY_META[(t.priority ?? 'NORMAL') as TicketPriority]?.label ??
          '—',
      },
      {
        label: 'Statut',
        value: STATUS_META[(t.status ?? 'OPEN') as TicketStatus]?.label ?? '—',
      },
      { label: 'Contrat', value: t.contractId ?? '—' },
      { label: 'Créé le', value: this.formatDate(t.createdAt) },
      { label: 'Mis à jour', value: this.formatDate(t.updatedAt) },
    ];
  });

  readonly interventionBlocks = computed(() => {
    const t = this.ticket();
    if (!t) return [];
    return [
      {
        label: 'Agent assigné',
        value: t.assignedToName ?? t.assignedToId ?? 'Non assigné',
      },
      { label: 'Technicien', value: t.technicianName ?? '—' },
      { label: 'Tél. technicien', value: t.technicianPhone ?? '—' },
      {
        label: 'Intervention planifiée',
        value: t.interventionScheduledAt
          ? this.formatDateTime(t.interventionScheduledAt)
          : '—',
      },
      {
        label: 'Prix intervention',
        value:
          t.interventionPrice != null
            ? new Intl.NumberFormat('fr-FR').format(t.interventionPrice) +
              ' FCFA'
            : 'Non défini',
      },
      {
        label: 'Coût de réparation',
        value:
          t.repairCost != null
            ? new Intl.NumberFormat('fr-FR').format(t.repairCost) + ' FCFA'
            : 'Non défini',
      },
      { label: 'Imputation', value: t.costImputedTo ?? '—' },
    ];
  });

  constructor() {
    if (
      this.store.ticketCategoryOptions().length === 0 &&
      !this.store.categoryCodeListLoading()
    ) {
      this.store.loadTicketCategories();
    }

    if (
      this.techniciansStore.entities().length === 0 &&
      !this.techniciansStore.loading()
    ) {
      this.techniciansStore.load?.(
        this.techniciansStore.defaultListParams(true),
      );
    }

    if (
      this.techniciansStore.professionOptions().length === 0 &&
      !this.techniciansStore.professionCodeListLoading()
    ) {
      this.techniciansStore.loadProfessions();
    }

    effect(() => {
      const id = this.ticketId();
      if (id) {
        this.store.loadOne?.(id);
        this.store.chargerMessages(id);
      }
    });

    effect(() => {
      if (!this.store.loading() && !this.hasLoaded()) {
        this.hasLoaded.set(true);
      }
    });

    effect(() => {
      const scope = this.authStore.user()?.scope;

      if (!scope) {
        return;
      }

      this.agencyStore.load({ scope });
    });

    effect(() => {
      const error = this.store.error();

      if (error && error !== this.lastNotifiedError) {
        this.showToast('error', error);
        this.lastNotifiedError = error;
        return;
      }

      if (!error) {
        this.lastNotifiedError = null;
      }
    });

    effect(() => {
      const urlsFromTicket = this.ticket()?.attachmentUrls;
      // undefined = réponse partielle (assign/schedule/status) sans la liste d'attachments
      // On ne touche pas les URLs résolues dans ce cas pour éviter le clignotement
      if (urlsFromTicket === undefined) return;
      if (urlsFromTicket.length === 0) {
        this.resolvedAttachmentUrls.set([]);
        return;
      }
      void this.resolveAttachmentUrls(urlsFromTicket);
    });
  }

  private async resolveAttachmentUrls(urls: string[]): Promise<void> {
    const resolved = await Promise.all(
      urls.map(async (fileUrl) => {
        try {
          const response = await firstValueFrom(
            generateReadUrl(this.http, this.apiConfig.rootUrl, { fileUrl }),
          );
          return this.extractReadUrl(response.body) ?? fileUrl;
        } catch {
          return fileUrl;
        }
      }),
    );
    this.resolvedAttachmentUrls.set(resolved);
  }

  private extractReadUrl(body: unknown): string | null {
    if (!body || typeof body !== 'object') return null;
    const direct = body as { readUrl?: unknown };
    if (typeof direct.readUrl === 'string' && direct.readUrl.length > 0) return direct.readUrl;
    const wrapped = body as { data?: unknown };
    if (wrapped.data && typeof wrapped.data === 'object') {
      const nested = wrapped.data as { readUrl?: unknown };
      if (typeof nested.readUrl === 'string' && nested.readUrl.length > 0) return nested.readUrl;
    }
    return null;
  }

  openAttachmentPreview(url: string, index: number): void {
    this.previewName.set(`Pièce jointe ${index + 1}`);
    this.previewIsImage.set(this.isImageUrl(url));
    this.previewUrl.set(url);
    this.previewFullscreen.set(false);
    this.document.body.classList.add('ubax-overlay-open');
  }

  closePreview(): void {
    this.previewUrl.set(null);
    this.previewIsImage.set(false);
    this.previewFullscreen.set(false);
    this.previewName.set('Pièce jointe');
    this.document.body.classList.remove('ubax-overlay-open');
  }

  togglePreviewFullscreen(): void {
    this.previewFullscreen.update((v) => !v);
  }

  isImageUrl(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);
  }

  advanceStatus(nextStatus: AllowedNextStatus): void {
    if (nextStatus === 'RESOLVED' || nextStatus === 'CLOSED') {
      this.pendingStatus.set(nextStatus);
      this.pendingResolutionNote.set(this.ticket()?.resolutionNote ?? '');
      this.document.body.classList.add('ubax-overlay-open');
      return;
    }
    this.doStatusChange(nextStatus);
  }

  confirmStatusChange(): void {
    const status = this.pendingStatus();
    if (!status) return;
    const note = this.pendingResolutionNote().trim();
    if (!note) {
      this.showToast('error', 'La note de résolution est obligatoire.');
      return;
    }
    this.document.body.classList.remove('ubax-overlay-open');
    this.doStatusChange(status, note);
    this.pendingStatus.set(null);
    this.pendingResolutionNote.set('');
  }

  cancelStatusChange(): void {
    this.document.body.classList.remove('ubax-overlay-open');
    this.pendingStatus.set(null);
    this.pendingResolutionNote.set('');
  }

  private doStatusChange(status: AllowedNextStatus, resolutionNote?: string): void {
    const id = this.ticketId();
    if (!id) return;
    this.store.changerStatut({
      ticketId: id,
      body: { status, resolutionNote: resolutionNote || undefined },
    });
  }

  openInterventionDrawer(): void {
    const t = this.ticket();
    if (t) {
      this.interventionForm.patchValue({
        assignedToId: t.assignedToId ?? '',
        technicienId: t.technicienId ?? '',
        technicianName: t.technicianName ?? '',
        technicianPhone: t.technicianPhone ?? '',
        interventionDate: t.interventionScheduledAt
          ? new Date(t.interventionScheduledAt)
          : null,
        interventionPrice: t.interventionPrice ?? null,
        repairCost: t.repairCost ?? null,
        costImputedTo:
          (t.costImputedTo as 'OWNER' | 'TENANT' | 'SHARED') ?? 'OWNER',
        resolutionNote: t.resolutionNote ?? '',
      });
      // Infer mode from existing ticket data
      this.technicianMode.set(t.technicienId ? 'platform' : 'manual');
    } else {
      this.technicianMode.set('platform');
    }
    this.drawerOpen.set('intervention');
    this.document.body.classList.add('ubax-overlay-open');
  }

  setTechnicianMode(mode: TechnicianMode): void {
    this.technicianMode.set(mode);
    if (mode === 'platform') {
      this.interventionForm.patchValue({ technicianName: '', technicianPhone: '' });
    } else {
      this.interventionForm.patchValue({ technicienId: '' });
    }
  }

  closeDrawer(): void {
    this.drawerClosing.set(true);
    this.document.body.classList.remove('ubax-overlay-open');
    setTimeout(() => {
      this.drawerOpen.set(null);
      this.drawerClosing.set(false);
    }, 280);
  }

  saveIntervention(): void {
    const id = this.ticketId();
    if (!id) return;

    const {
      assignedToId,
      technicienId,
      technicianName,
      technicianPhone,
      interventionDate,
      interventionPrice,
      repairCost,
      costImputedTo,
      resolutionNote,
    } = this.interventionForm.getRawValue();

    const mode = this.technicianMode();
    const normalizedAssignedToId = assignedToId.trim();
    const normalizedTechnicienId = mode === 'platform' ? technicienId.trim() : '';
    const normalizedTechnicianName = mode === 'manual' ? technicianName.trim() : '';
    const normalizedTechnicianPhone = mode === 'manual' ? technicianPhone.trim() : '';

    // Scheduling is only attempted when the ticket allows it and scheduling fields are filled
    const wantsSchedule =
      this.canSchedule() &&
      Boolean(
        interventionDate ||
          normalizedTechnicienId ||
          normalizedTechnicianName ||
          normalizedTechnicianPhone,
      );

    let hasPendingAction = false;

    // — Assign agent —
    if (normalizedAssignedToId) {
      this.store.assignerAgent({
        ticketId: id,
        body: { assignedToId: normalizedAssignedToId },
      });
      hasPendingAction = true;
    }

    // — Schedule intervention —
    if (wantsSchedule) {
      if (!interventionDate) {
        this.showToast(
          'error',
          'La date et l heure d intervention sont obligatoires.',
        );
        return;
      }

      if (mode === 'platform' && !normalizedTechnicienId) {
        this.showToast('error', 'Sélectionnez un technicien enregistré.');
        return;
      }

      if (
        mode === 'manual' &&
        (!normalizedTechnicianName || !normalizedTechnicianPhone)
      ) {
        this.showToast(
          'error',
          'Le nom et le téléphone du technicien sont obligatoires en saisie libre.',
        );
        return;
      }

      if (interventionPrice != null && interventionPrice < 0) {
        this.showToast('error', 'Le prix d intervention doit etre positif.');
        return;
      }

      this.store.planifierIntervention({
        ticketId: id,
        body: {
          interventionScheduledAt: interventionDate.toISOString(),
          technicienId: normalizedTechnicienId || undefined,
          technicianName: normalizedTechnicianName || undefined,
          technicianPhone: normalizedTechnicianPhone || undefined,
          interventionPrice: interventionPrice ?? undefined,
        },
      });
      hasPendingAction = true;
    }

    // — Repair cost —
    if (repairCost != null) {
      if (repairCost < 0) {
        this.showToast('error', 'Le cout de reparation doit etre positif ou nul.');
        return;
      }
      this.store.mettreAJourCout({
        ticketId: id,
        body: {
          repairCost,
          costImputedTo: costImputedTo || undefined,
          resolutionNote: resolutionNote || undefined,
        },
      });
      hasPendingAction = true;
    }

    if (!hasPendingAction) {
      this.showToast('info', 'Aucune modification a enregistrer.');
      return;
    }

    this.closeDrawer();
  }

  sendMessage(): void {
    const content = this.messageInput().trim();
    if (!content) return;
    const id = this.ticketId();
    if (!id) return;

    this.store.envoyerMessage({
      ticketId: id,
      body: { message: content, messageType: this.messageType() },
    });
    this.messageInput.set('');
  }

  onMessageKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr));
  }

  formatDateTime(dateStr: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  }

  formatMessageTime(dateStr: string | undefined): string {
    if (!dateStr) return '';
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    }).format(new Date(dateStr));
  }

  getStatusMeta(status: string | undefined) {
    return (
      STATUS_META[(status as TicketStatus) ?? 'OPEN'] ?? STATUS_META['OPEN']
    );
  }

  getPriorityMeta(priority: string | undefined) {
    return (
      PRIORITY_META[(priority as TicketPriority) ?? 'NORMAL'] ??
      PRIORITY_META['NORMAL']
    );
  }

  getCategoryLabel(category = 'OTHER'): string {
    return (
      this.store
        .ticketCategoryOptions()
        .find((option) => option.value === category)?.label ??
      CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ??
      'Autre'
    );
  }

  isStepCompleted(index: number): boolean {
    return index < this.currentStatusIndex();
  }

  isStepActive(index: number): boolean {
    return index === this.currentStatusIndex();
  }

  goBack(): void {
    this.router.navigate(['/tickets']);
  }

  retryLoad(): void {
    this.hasLoaded.set(false);
    const id = this.ticketId();
    if (id) {
      this.store.loadOne?.(id);
    }
  }

  getMessageInitials(msg: TicketMessage): string {
    const name = msg.senderName ?? msg.senderId ?? '?';
    return name.slice(0, 2).toUpperCase();
  }

  asTicketStatus(s: AllowedNextStatus): TicketStatus {
    return s as TicketStatus;
  }

  private showToast(
    severity: 'success' | 'error' | 'info',
    detail: string,
  ): void {
    this.messageService.add({
      severity,
      summary:
        severity === 'success'
          ? 'Operation reussie'
          : severity === 'error'
            ? 'Action impossible'
            : 'Information',
      detail,
      life: severity === 'error' ? 6200 : 4200,
      closable: true,
      styleClass: `ubax-toast-message ubax-toast-message--${severity}`,
      contentStyleClass: 'ubax-toast-content',
      closeIcon: 'pi-times',
    });
  }
}
