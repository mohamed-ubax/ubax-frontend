import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
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
  imports: [CommonModule, ReactiveFormsModule, DatePickerModule, SelectModule],
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
  readonly techniciansStore = inject(TechniciansStore);
  readonly store = inject(TicketingStore);
  private lastNotifiedError: string | null = null;

  private readonly ticketId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' },
  );

  readonly drawerOpen = signal<DrawerMode>(null);
  readonly showCloseConfirm = signal(false);
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

  readonly technicianSelectOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'Saisie manuelle' },
    ...this.availableTechnicianOptions(),
  ]);

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
  }

  advanceStatus(nextStatus: AllowedNextStatus): void {
    if (nextStatus === 'CLOSED') {
      this.showCloseConfirm.set(true);
      return;
    }
    this.doStatusChange(nextStatus);
  }

  confirmClose(): void {
    this.showCloseConfirm.set(false);
    this.doStatusChange('CLOSED');
  }

  cancelClose(): void {
    this.showCloseConfirm.set(false);
  }

  private doStatusChange(status: AllowedNextStatus): void {
    const id = this.ticketId();
    if (!id) return;
    this.store.changerStatut({ ticketId: id, body: { status } });
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
    }
    this.drawerOpen.set('intervention');
    this.document.body.classList.add('ubax-overlay-open');
  }

  closeDrawer(): void {
    this.drawerOpen.set(null);
    this.document.body.classList.remove('ubax-overlay-open');
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
    const normalizedAssignedToId = assignedToId.trim();
    const normalizedTechnicienId = technicienId.trim();
    const normalizedTechnicianName = technicianName.trim();
    const normalizedTechnicianPhone = technicianPhone.trim();
    const wantsSchedule = Boolean(
      interventionDate ||
        normalizedTechnicienId ||
        normalizedTechnicianName ||
        normalizedTechnicianPhone ||
        interventionPrice != null,
    );

    if (normalizedAssignedToId) {
      this.store.assignerAgent({
        ticketId: id,
        body: { assignedToId: normalizedAssignedToId },
      });
      this.showToast('success', 'Assignation de l agent SAV enregistree.');
    }

    if (wantsSchedule && !interventionDate) {
      this.showToast(
        'error',
        'La date et l heure d intervention sont obligatoires pour planifier.',
      );
      return;
    }

    if (
      wantsSchedule &&
      !normalizedTechnicienId &&
      (!normalizedTechnicianName || !normalizedTechnicianPhone)
    ) {
      this.showToast(
        'error',
        'Choisissez un technicien enregistre ou renseignez un nom et un telephone.',
      );
      return;
    }

    if (interventionPrice != null && interventionPrice < 0) {
      this.showToast('error', 'Le prix d intervention doit etre positif.');
      return;
    }

    if (wantsSchedule && interventionDate) {
      this.store.planifierIntervention({
        ticketId: id,
        body: {
          interventionScheduledAt: interventionDate.toISOString(),
          technicienId: normalizedTechnicienId || undefined,
          technicianName:
            normalizedTechnicienId.length > 0
              ? undefined
              : normalizedTechnicianName || undefined,
          technicianPhone:
            normalizedTechnicienId.length > 0
              ? undefined
              : normalizedTechnicianPhone || undefined,
          interventionPrice: interventionPrice ?? undefined,
        },
      });
      this.showToast('success', 'Planification de l intervention enregistree.');
    }

    if (repairCost != null && repairCost <= 0) {
      this.showToast('error', 'Le cout de reparation doit etre superieur a 0.');
      return;
    }

    if (repairCost != null && repairCost > 0) {
      this.store.mettreAJourCout({
        ticketId: id,
        body: {
          repairCost,
          costImputedTo: costImputedTo || undefined,
          resolutionNote: resolutionNote || undefined,
        },
      });
      this.showToast('success', 'Cout de reparation enregistre.');
    }

    if (
      !normalizedAssignedToId &&
      !wantsSchedule &&
      !(repairCost != null && repairCost > 0)
    ) {
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
