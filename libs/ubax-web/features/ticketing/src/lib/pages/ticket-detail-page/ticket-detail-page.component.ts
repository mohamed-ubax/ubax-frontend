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
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import {
  TicketingStore,
  TicketMessage,
} from '@ubax-workspace/ubax-web-data-access';
import {
  CATEGORY_LABELS,
  PRIORITY_META,
  STATUS_META,
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../tickets-list-page/tickets-list-page.component';

// UpdateTicketStatusRequest does not include 'OPEN'
type AllowedNextStatus = 'IN_ANALYSIS' | 'TECHNICIAN_SENT' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';

const ALLOWED_TRANSITIONS: Partial<Record<TicketStatus, AllowedNextStatus[]>> = {
  OPEN: ['IN_ANALYSIS'],
  IN_ANALYSIS: ['TECHNICIAN_SENT', 'RESOLVED'],
  TECHNICIAN_SENT: ['RESOLVED'],
  RESOLVED: ['CLOSED'],
};

const STATUS_FLOW: TicketStatus[] = [
  'OPEN',
  'IN_ANALYSIS',
  'TECHNICIAN_SENT',
  'RESOLVED',
  'CLOSED',
];

type DrawerMode = 'intervention' | null;

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
  readonly store = inject(TicketingStore);

  // ── Route param ─────────────────────────────────────────────────────────────
  private readonly ticketId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' },
  );

  // ── UI state ────────────────────────────────────────────────────────────────
  readonly drawerOpen = signal<DrawerMode>(null);
  readonly showCloseConfirm = signal(false);
  readonly messageInput = signal('');
  readonly messageType = signal<'PUBLIC' | 'INTERNAL'>('PUBLIC');
  readonly sendingMessage = signal(false);
  readonly hasLoaded = signal(false);

  // ── Intervention form ───────────────────────────────────────────────────────
  readonly interventionForm = this.fb.group({
    assignedToId: ['', Validators.required],
    technicianName: [''],
    technicianPhone: [''],
    interventionDate: [null as Date | null, Validators.required],
    repairCost: [null as number | null],
    costImputedTo: ['OWNER' as 'OWNER' | 'TENANT' | 'SHARED'],
    resolutionNote: [''],
  });

  // ── Ticket courant ──────────────────────────────────────────────────────────
  readonly ticket = computed<Ticket | undefined>(() =>
    this.store.entities().find((t) => t.id === this.ticketId()),
  );

  // ── ViewState ───────────────────────────────────────────────────────────────
  readonly viewState = computed(() => {
    if (this.store.loading() && !this.hasLoaded()) return 'loading';
    if (this.store.error()) return 'error';
    if (!this.ticket() && this.hasLoaded()) return 'not-found';
    if (this.ticket()) return 'success';
    return 'loading';
  });

  // ── Statut helpers ──────────────────────────────────────────────────────────
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

  // ── Messages ────────────────────────────────────────────────────────────────
  readonly messages = computed(() => this.store.messages());

  // ── Info blocks ─────────────────────────────────────────────────────────────
  readonly infoBlocks = computed(() => {
    const t = this.ticket();
    if (!t) return [];
    return [
      { label: 'Catégorie', value: CATEGORY_LABELS[(t.category ?? 'OTHER') as TicketCategory] ?? '—' },
      { label: 'Priorité', value: PRIORITY_META[(t.priority ?? 'NORMAL') as TicketPriority]?.label ?? '—' },
      { label: 'Statut', value: STATUS_META[(t.status ?? 'OPEN') as TicketStatus]?.label ?? '—' },
      { label: 'Contrat', value: t.contractId ?? '—' },
      { label: 'Créé le', value: this.formatDate(t.createdAt) },
      { label: 'Mis à jour', value: this.formatDate(t.updatedAt) },
    ];
  });

  readonly interventionBlocks = computed(() => {
    const t = this.ticket();
    if (!t) return [];
    return [
      { label: 'Agent assigné', value: t.assignedToName ?? t.assignedToId ?? 'Non assigné' },
      { label: 'Technicien', value: t.technicianName ?? '—' },
      { label: 'Tél. technicien', value: t.technicianPhone ?? '—' },
      {
        label: 'Intervention planifiée',
        value: t.interventionScheduledAt
          ? this.formatDateTime(t.interventionScheduledAt)
          : '—',
      },
      {
        label: 'Coût de réparation',
        value: t.repairCost != null
          ? new Intl.NumberFormat('fr-FR').format(t.repairCost) + ' FCFA'
          : 'Non défini',
      },
      { label: 'Imputation', value: t.costImputedTo ?? '—' },
    ];
  });

  constructor() {
    // Charger le ticket quand l'id change
    effect(() => {
      const id = this.ticketId();
      if (id) {
        this.store.loadOne!(id);
        this.store.chargerMessages(id);
      }
    });

    // Marquer hasLoaded
    effect(() => {
      if (!this.store.loading() && !this.hasLoaded()) {
        this.hasLoaded.set(true);
      }
    });
  }

  // ── Actions statut ──────────────────────────────────────────────────────────
  advanceStatus(nextStatus: TicketStatus): void {
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

  private doStatusChange(status: TicketStatus): void {
    const id = this.ticketId();
    if (!id) return;
    this.store.changerStatut({ ticketId: id, body: { status: status as AllowedNextStatus } });
  }

  // ── Drawer intervention ─────────────────────────────────────────────────────
  openInterventionDrawer(): void {
    const t = this.ticket();
    if (t) {
      this.interventionForm.patchValue({
        assignedToId: t.assignedToId ?? '',
        technicianName: t.technicianName ?? '',
        technicianPhone: t.technicianPhone ?? '',
        interventionDate: t.interventionScheduledAt
          ? new Date(t.interventionScheduledAt)
          : null,
        repairCost: t.repairCost ?? null,
        costImputedTo: (t.costImputedTo as 'OWNER' | 'TENANT' | 'SHARED') ?? 'OWNER',
        resolutionNote: t.resolutionNote ?? '',
      });
    }
    this.drawerOpen.set('intervention');
  }

  closeDrawer(): void {
    this.drawerOpen.set(null);
  }

  saveIntervention(): void {
    if (this.interventionForm.invalid) {
      this.interventionForm.markAllAsTouched();
      return;
    }
    const id = this.ticketId();
    if (!id) return;

    const {
      assignedToId,
      technicianName,
      technicianPhone,
      interventionDate,
      repairCost,
      costImputedTo,
      resolutionNote,
    } = this.interventionForm.getRawValue();

    // Assigner l'agent
    if (assignedToId) {
      this.store.assignerAgent({ ticketId: id, body: { assignedToId } });
    }

    // Planifier l'intervention
    if (interventionDate) {
      this.store.planifierIntervention({
        ticketId: id,
        body: {
          interventionScheduledAt: interventionDate.toISOString(),
          technicianName: technicianName || undefined,
          technicianPhone: technicianPhone || undefined,
        },
      });
    }

    // Coût de réparation
    if (repairCost != null && repairCost > 0) {
      this.store.mettreAJourCout({
        ticketId: id,
        body: {
          repairCost,
          costImputedTo: costImputedTo || undefined,
          resolutionNote: resolutionNote || undefined,
        },
      });
    }

    this.closeDrawer();
  }

  // ── Messagerie ──────────────────────────────────────────────────────────────
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

  // ── Helpers ─────────────────────────────────────────────────────────────────
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
    return STATUS_META[(status as TicketStatus) ?? 'OPEN'] ?? STATUS_META['OPEN'];
  }

  getPriorityMeta(priority: string | undefined) {
    return PRIORITY_META[(priority as keyof typeof PRIORITY_META) ?? 'NORMAL'] ?? PRIORITY_META['NORMAL'];
  }

  getCategoryLabel(category: string | undefined): string {
    return CATEGORY_LABELS[(category as keyof typeof CATEGORY_LABELS) ?? 'OTHER'] ?? 'Autre';
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
    if (id) this.store.loadOne!(id);
  }

  getMessageInitials(msg: TicketMessage): string {
    const name = msg.senderName ?? msg.senderId ?? '?';
    return name.slice(0, 2).toUpperCase();
  }
}
