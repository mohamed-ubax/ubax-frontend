import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { ChartData, ChartOptions } from 'chart.js';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import {
  LazyChartComponent,
  UiFormInputComponent,
  UiFormSelectComponent,
  UbaxPaginatorComponent,
} from '@ubax-workspace/shared-ui';
import {
  AuthStore,
  Technician,
  TechniciansStore,
} from '@ubax-workspace/ubax-web-data-access';
import type {
  DashboardSavCountryCodeOption,
  DashboardSavInterventionPeriod,
  DashboardSavNotificationItem,
  DashboardSavScrollLockState,
  DashboardSavSelectedTechnicianDetail,
  DashboardSavSelectOption,
  DashboardSavStarTone,
  DashboardSavStatusTone,
  DashboardSavSummaryMetric,
  DashboardSavTechIntervention,
  DashboardSavTechnician,
  DashboardSavTechMutationKind,
  DashboardSavTicket,
  DashboardSavTicketFilterState,
  DashboardSavTicketPriorityFilter,
  DashboardSavTicketStatusFilter,
} from '../../types/dashboard-sav-redesign.types';
import {
  ADD_TECH_CLOSE_DURATION_MS,
  ALL_TICKETS,
  BASE_NOTIFICATIONS,
  BASE_TECHNICIANS,
  cloneDate,
  composeSavE164Phone,
  COUNTRY_CODE_OPTIONS,
  createDefaultTicketFilters,
  DATE_FORMATTER,
  DEFAULT_TECHNICIAN_DETAIL,
  DEFAULT_VISIBLE_NOTIFICATIONS,
  DEFAULT_VISIBLE_TECHNICIANS,
  DASHBOARD_SAV_ASSET_ROOT,
  EMAIL_PATTERN,
  getDashboardSavAsset,
  isSameCalendarDay,
  INTERVENTION_SNAPSHOTS,
  KPI_TONES,
  normalizeText,
  PHASE_TRANSITION_DURATION_MS,
  sanitizeSavPhoneDraft,
  SHARED_ASSET_ROOT,
  STAR_ASSET_BY_TONE,
  TICKET_ISSUES,
  TICKETS_PER_PAGE,
} from '../../constants/dashboard-sav-redesign.constants';

@Component({
  selector: 'ubax-dashboard-sav-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePickerModule,
    SelectModule,
    LazyChartComponent,
    UiFormInputComponent,
    UiFormSelectComponent,
    UbaxPaginatorComponent,
  ],
  templateUrl: './dashboard-sav-page-redesign.component.html',
  styleUrl: './dashboard-sav-page-redesign.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSavPageComponent implements OnDestroy {
  readonly authStore = inject(AuthStore);
  readonly techniciansStore = inject(TechniciansStore);
  private readonly document = inject(DOCUMENT);
  private readonly messageService = inject(MessageService);
  private closeAddTechTimeout: ReturnType<typeof setTimeout> | null = null;
  private scrollLockState: DashboardSavScrollLockState | null = null;
  private lastTechnicianError: string | null = null;

  readonly sharedIcons = {
    search: `${SHARED_ASSET_ROOT}/filter-search.webp`,
    date: `${SHARED_ASSET_ROOT}/filter-date.webp`,
    export: `${SHARED_ASSET_ROOT}/filter-export.webp`,
    chevron: `${SHARED_ASSET_ROOT}/select-chevron.webp`,
  };

  readonly heroAddTechnicianIcon = getDashboardSavAsset('hero/add-technician.webp');
  readonly technicianTicketIcon = getDashboardSavAsset('technicians/ticket.webp');
  readonly technicianPhoneIcon = getDashboardSavAsset('technicians/phone.webp');
  readonly detailIcons = {
    back: getDashboardSavAsset('detail/back-arrow.webp'),
    phone: getDashboardSavAsset('detail/phone.webp'),
    identifier: getDashboardSavAsset('detail/id-card.webp'),
    date: getDashboardSavAsset('detail/date.webp'),
    edit: getDashboardSavAsset('detail/edit.webp'),
    historySearch: getDashboardSavAsset('detail/history-search.webp'),
    historyStatus: getDashboardSavAsset('detail/history-status.webp'),
    resolved: getDashboardSavAsset('detail/stat-resolved.webp'),
    paid: getDashboardSavAsset('detail/stat-paid.webp'),
  } as const;

  readonly toolbarSearchTerm = signal('');
  readonly toolbarSelectedDate = signal<Date | null>(null);
  readonly tableSearchTerm = signal('');
  readonly directorySearchTerm = signal('');
  readonly detailHistorySearchTerm = signal('');
  readonly ticketsCurrentPage = signal(1);
  readonly showAllNotifications = signal(false);
  readonly showAllTechnicians = signal(false);
  readonly selectedTechnicianId = signal<string | null>(null);
  readonly editingTechnicianId = signal<string | null>(null);
  readonly transitioningTechnicianId = signal<string | null>(null);
  readonly transitionPhase = signal<
    'idle' | 'to-directory' | 'to-dashboard' | 'to-detail' | 'from-detail'
  >('idle');
  readonly selectedInterventionPeriod =
    signal<DashboardSavInterventionPeriod>('current-month');

  readonly draftStatus = signal<DashboardSavTicketStatusFilter>('all');
  readonly draftPriority = signal<DashboardSavTicketPriorityFilter>('all');
  readonly draftIssue = signal<string>('all');
  readonly draftCreatedAt = signal<Date | null>(null);

  readonly appliedFilters = signal<DashboardSavTicketFilterState>(
    createDefaultTicketFilters(),
  );

  readonly technicians = computed<DashboardSavTechnician[]>(() =>
    this.techniciansStore
      .entities()
      .map((technician, index) =>
        this.toDashboardTechnician(technician, index),
      ),
  );

  readonly selectedTechnician = computed(() => {
    const technicianId = this.selectedTechnicianId();

    if (!technicianId) {
      return null;
    }

    return (
      this.technicians().find((technician) => technician.id === technicianId) ??
      null
    );
  });

  readonly selectedTechnicianDetail =
    computed<DashboardSavSelectedTechnicianDetail | null>(() => {
      const technician = this.selectedTechnician();

      if (!technician) {
        return null;
      }

      return {
        ...technician,
        ...DEFAULT_TECHNICIAN_DETAIL,
        joinedOn: technician.createdAt
          ? DATE_FORMATTER.format(new Date(technician.createdAt))
          : DEFAULT_TECHNICIAN_DETAIL.joinedOn,
        contractStatus: technician.available ? 'Disponible' : 'Indisponible',
        employeeCode: technician.id,
        profileImage: technician.image,
      };
    });

  readonly filteredSelectedTechnicianHistory = computed(() => {
    const technicianDetail = this.selectedTechnicianDetail();

    if (!technicianDetail) {
      return [] as readonly DashboardSavTechIntervention[];
    }

    const query = normalizeText(this.detailHistorySearchTerm());

    if (!query) {
      return technicianDetail.history;
    }

    return technicianDetail.history.filter((intervention) =>
      normalizeText(
        [
          intervention.id,
          intervention.issue,
          intervention.client,
          intervention.property,
          intervention.city,
          intervention.date,
        ].join(' '),
      ).includes(query),
    );
  });

  readonly addTechOpen = signal(false);
  readonly addTechClosing = signal(false);
  readonly newPrenom = signal('');
  readonly newNom = signal('');
  readonly newPhone = signal('');
  readonly newEmail = signal('');
  readonly newAddress = signal('');
  readonly newSpecialty = signal('Plomberie & sanitaires');
  readonly newPhotoUrl = signal<string | null>(null);
  readonly newAvatarFile = signal<File | null>(null);
  readonly pendingTechMutation = signal<DashboardSavTechMutationKind | null>(
    null,
  );
  readonly selectedCountryCode = signal<DashboardSavCountryCodeOption>(
    COUNTRY_CODE_OPTIONS[0],
  );
  private photoObjectUrl: string | null = null;
  private techMutationRequestStarted = false;

  readonly countryCodeOptions = [...COUNTRY_CODE_OPTIONS];

  readonly specialtyOptions = computed(() => {
    const options = this.techniciansStore
      .professionOptions()
      .map((option) => option.label);

    return options.length > 0
      ? options
      : [
          'Plomberie & sanitaires',
          'Électricité bâtiment',
          'Maintenance générale',
          'Peinture',
          'Menuiserie',
          'Climatisation',
        ];
  });

  readonly addTechModalTitle = computed(() =>
    this.editingTechnicianId()
      ? 'Modifier un technicien'
      : 'Ajouter un technicien',
  );

  readonly addTechSaveLabel = computed(() =>
    this.editingTechnicianId() ? 'Mettre à jour' : 'Enregistrer',
  );

  readonly addTechSubmitLabel = computed(() => {
    if (!this.techniciansStore.saving()) {
      return this.addTechSaveLabel();
    }

    return this.editingTechnicianId() ? 'Mise à jour...' : 'Enregistrement...';
  });

  readonly addTechModalVisible = computed(
    () => this.addTechOpen() || this.addTechClosing(),
  );

  readonly addTechInitials = computed(() => {
    const prenomInitial = this.newPrenom().trim().slice(0, 1);
    const nomInitial = this.newNom().trim().slice(0, 1);
    return `${prenomInitial}${nomInitial}`.trim().toUpperCase() || 'T';
  });

  readonly addTechPhotoHint = computed(() => {
    return this.newAvatarFile()
      ? 'Photo prête à être envoyée.'
      : 'Photo facultative.';
  });

  readonly phonePlaceholder = computed(
    () => this.selectedCountryCode().sampleNational,
  );

  readonly phoneError = computed(() => {
    const phoneDraft = this.newPhone().trim();

    if (!phoneDraft) {
      return null;
    }

    return this.formatPhoneValue(phoneDraft)
      ? null
      : `Numéro invalide. Exemple attendu: ${this.selectedCountryCode().sampleE164}`;
  });

  readonly emailError = computed(() => {
    const email = this.newEmail().trim();

    if (!email) {
      return null;
    }

    return EMAIL_PATTERN.test(email)
      ? null
      : 'Renseignez une adresse e-mail valide.';
  });

  readonly canSaveTech = computed(() => {
    return Boolean(
      this.newPrenom().trim() &&
        this.newNom().trim() &&
        this.newPhone().trim() &&
        !this.phoneError() &&
        !this.emailError(),
    );
  });

  constructor() {
    if (
      this.techniciansStore.entities().length === 0 &&
      !this.techniciansStore.loading()
    ) {
      this.techniciansStore.load?.(this.techniciansStore.defaultListParams());
    }

    if (
      this.techniciansStore.professionOptions().length === 0 &&
      !this.techniciansStore.professionCodeListLoading()
    ) {
      this.techniciansStore.loadProfessions();
    }

    effect(() => {
      const selectedTechnicianId = this.selectedTechnicianId();

      if (
        selectedTechnicianId &&
        !this.technicians().some(
          (technician) => technician.id === selectedTechnicianId,
        )
      ) {
        this.selectedTechnicianId.set(null);
      }
    });

    effect(() => {
      const error = this.techniciansStore.error();

      if (error && error !== this.lastTechnicianError) {
        this.showToast('error', error);
        this.lastTechnicianError = error;
        return;
      }

      if (!error) {
        this.lastTechnicianError = null;
      }
    });

    effect(() => {
      const pendingMutation = this.pendingTechMutation();
      const saving = this.techniciansStore.saving();
      const error = this.techniciansStore.error();

      if (!pendingMutation) {
        this.techMutationRequestStarted = false;
        return;
      }

      if (saving) {
        this.techMutationRequestStarted = true;
        return;
      }

      if (!this.techMutationRequestStarted) {
        return;
      }

      this.techMutationRequestStarted = false;
      this.pendingTechMutation.set(null);

      if (error) {
        return;
      }

      this.showToast(
        'success',
        pendingMutation === 'update'
          ? 'Technicien mis à jour.'
          : 'Technicien ajouté.',
      );
      this.closeAddTech();
    });
  }

  readonly userFullName = computed(() => {
    const user = this.authStore.user();
    const fullName = `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim();
    return fullName || 'Ibrahim Konaté';
  });

  readonly pageTitle = computed(() => {
    if (this.selectedTechnicianDetail()) {
      return 'Détails Technicien';
    }

    if (this.showAllTechnicians()) {
      return 'liste des techniciens';
    }

    return 'Tableau de bord';
  });

  readonly statusOptions: DashboardSavSelectOption<DashboardSavTicketStatusFilter>[] =
    [
      { label: 'Statut', value: 'all' },
      { label: 'Tickets ouverts', value: 'open' },
      { label: 'Traitement en cours', value: 'progress' },
      { label: 'Tickets résolus', value: 'success' },
    ];

  readonly priorityOptions: DashboardSavSelectOption<DashboardSavTicketPriorityFilter>[] =
    [
      { label: 'Priorité', value: 'all' },
      { label: 'Urgent', value: 'urgent' },
      { label: 'Normal', value: 'normal' },
    ];

  readonly issueOptions: DashboardSavSelectOption<string>[] = [
    { label: 'Type de problème', value: 'all' },
    ...Array.from(new Set(ALL_TICKETS.map((ticket) => ticket.issueKey))).map(
      (issue) => ({
        label: issue,
        value: issue,
      }),
    ),
  ];

  readonly interventionPeriodOptions: DashboardSavSelectOption<DashboardSavInterventionPeriod>[] =
    [
      { label: 'Mois en cours', value: 'current-month' },
      { label: 'Trimestre', value: 'quarter' },
      { label: 'Année', value: 'year' },
    ];

  readonly scopedTickets = computed(() => {
    const query = normalizeText(this.toolbarSearchTerm());
    const selectedDate = this.toolbarSelectedDate();
    const filters = this.appliedFilters();

    return ALL_TICKETS.filter((ticket) => {
      if (query) {
        const searchableText = normalizeText(
          [
            ticket.id,
            ticket.client,
            ticket.property,
            ticket.issue,
            ticket.priority,
            ticket.status,
          ].join(' '),
        );

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      if (
        selectedDate &&
        !isSameCalendarDay(ticket.createdAtDate, selectedDate)
      ) {
        return false;
      }

      if (filters.status !== 'all' && ticket.statusTone !== filters.status) {
        return false;
      }

      if (
        filters.priority !== 'all' &&
        ticket.priorityTone !== filters.priority
      ) {
        return false;
      }

      if (filters.issue !== 'all' && ticket.issueKey !== filters.issue) {
        return false;
      }

      if (
        filters.createdAt &&
        !isSameCalendarDay(ticket.createdAtDate, filters.createdAt)
      ) {
        return false;
      }

      return true;
    });
  });

  readonly visibleTickets = computed(() => {
    const query = normalizeText(this.tableSearchTerm());

    if (!query) {
      return this.scopedTickets();
    }

    return this.scopedTickets().filter((ticket) =>
      normalizeText(
        [
          ticket.id,
          ticket.client,
          ticket.property,
          ticket.issue,
          ticket.priority,
          ticket.status,
        ].join(' '),
      ).includes(query),
    );
  });

  readonly ticketTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.visibleTickets().length / TICKETS_PER_PAGE)),
  );

  readonly paginatedTickets = computed(() => {
    const currentPage = Math.min(
      this.ticketsCurrentPage(),
      this.ticketTotalPages(),
    );
    const start = (currentPage - 1) * TICKETS_PER_PAGE;

    return this.visibleTickets().slice(start, start + TICKETS_PER_PAGE);
  });

  readonly ticketResultsLabel = computed(() => {
    const total = this.visibleTickets().length;

    if (!total) {
      return 'Affichage de 0 sur 0 résultats';
    }

    const currentPage = Math.min(
      this.ticketsCurrentPage(),
      this.ticketTotalPages(),
    );
    const start = (currentPage - 1) * TICKETS_PER_PAGE + 1;
    const end = Math.min(start + TICKETS_PER_PAGE - 1, total);

    return `Affichage de ${start} à ${end} sur ${total} résultats`;
  });

  readonly statCards = computed<readonly DashboardSavSummaryMetric[]>(() => {
    const tickets = this.scopedTickets();
    const activeUrgentCount = tickets.filter(
      (ticket) =>
        ticket.priorityTone === 'urgent' && ticket.statusTone !== 'success',
    ).length;

    return [
      {
        label: 'Tickets ouverts',
        value: tickets.filter((ticket) => ticket.statusTone === 'open').length,
        ...KPI_TONES.open,
      },
      {
        label: "En cours d'intervention",
        value: tickets.filter((ticket) => ticket.statusTone === 'progress')
          .length,
        ...KPI_TONES.progress,
      },
      {
        label: 'Tickets résolus',
        value: tickets.filter((ticket) => ticket.statusTone === 'success')
          .length,
        ...KPI_TONES.success,
      },
      {
        label: 'Tickets Urgents',
        value: activeUrgentCount,
        ...KPI_TONES.urgent,
      },
    ];
  });

  readonly visibleNotifications = computed(() => {
    const query = normalizeText(this.toolbarSearchTerm());
    const selectedDate = this.toolbarSelectedDate();

    return BASE_NOTIFICATIONS.filter((item) => {
      if (query) {
        const searchableText = normalizeText(
          [item.title, item.property, item.ticketId, item.time].join(' '),
        );

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return !selectedDate || isSameCalendarDay(item.createdAt, selectedDate);
    });
  });

  readonly displayedNotifications = computed(() => {
    const items = this.visibleNotifications();
    return this.showAllNotifications()
      ? items
      : items.slice(0, DEFAULT_VISIBLE_NOTIFICATIONS);
  });

  readonly filteredTechnicians = computed(() => {
    const globalQuery = normalizeText(this.toolbarSearchTerm());
    const directoryQuery = normalizeText(this.directorySearchTerm());

    return this.technicians().filter((technician) => {
      const searchableText = normalizeText(
        [
          technician.name,
          technician.specialty,
          technician.phone,
          technician.id,
        ].join(' '),
      );

      if (globalQuery && !searchableText.includes(globalQuery)) {
        return false;
      }

      if (directoryQuery && !searchableText.includes(directoryQuery)) {
        return false;
      }

      return true;
    });
  });

  readonly displayedTechnicians = computed(() => {
    const technicians = this.filteredTechnicians();
    return this.showAllTechnicians()
      ? technicians
      : technicians.slice(0, DEFAULT_VISIBLE_TECHNICIANS);
  });

  readonly selectedInterventionSnapshot = computed(
    () => INTERVENTION_SNAPSHOTS[this.selectedInterventionPeriod()],
  );

  readonly interventionsChartData = computed<ChartData<'doughnut'>>(() => {
    const snapshot = this.selectedInterventionSnapshot();

    return {
      labels: ['En attente', 'En cours', 'Terminés'],
      datasets: [
        {
          data: [snapshot.pending, snapshot.progress, snapshot.completed],
          backgroundColor: ['#008bff', '#e87d1e', '#16b55b'],
          borderWidth: 0,
          hoverOffset: 0,
          spacing: 2,
          borderRadius: 14,
        },
      ],
    };
  });

  readonly interventionsChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    rotation: -90,
    circumference: 180,
    cutout: '75%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
    },
  };

  readonly interventionLegend = computed(() => {
    const snapshot = this.selectedInterventionSnapshot();

    return [
      {
        label: 'En attente',
        count: snapshot.pending,
        color: '#008bff',
      },
      {
        label: 'En cours',
        count: snapshot.progress,
        color: '#e87d1e',
      },
      {
        label: 'Terminés',
        count: snapshot.completed,
        color: '#16b55b',
      },
    ];
  });

  readonly interventionsTotal = computed(() => {
    const snapshot = this.selectedInterventionSnapshot();
    return snapshot.pending + snapshot.progress + snapshot.completed;
  });

  readonly notificationToggleLabel = computed(() =>
    this.showAllNotifications() ? 'Réduire' : 'Voir plus',
  );

  readonly technicianToggleLabel = computed(() =>
    this.showAllTechnicians() ? 'Réduire' : 'Voir plus',
  );

  readonly canToggleNotifications = computed(
    () => this.visibleNotifications().length > DEFAULT_VISIBLE_NOTIFICATIONS,
  );

  readonly canToggleTechnicians = computed(
    () => this.filteredTechnicians().length > DEFAULT_VISIBLE_TECHNICIANS,
  );

  readonly starIcons = computed(() => STAR_ASSET_BY_TONE);

  openAddTech(): void {
    this.editingTechnicianId.set(null);
    this.resetAddTechDraft();
    this.clearAddTechCloseTimeout();

    if (this.addTechOpen() && !this.addTechClosing()) {
      return;
    }

    const startViewTransition = this.document.startViewTransition?.bind(
      this.document,
    );

    if (startViewTransition) {
      const transition = startViewTransition(() => {
        this.addTechClosing.set(false);
        this.addTechOpen.set(true);
        this.lockPageScroll();
      });

      void transition.finished.catch(() => undefined);
      return;
    }

    this.lockPageScroll();
    this.addTechClosing.set(false);
    this.addTechOpen.set(true);
  }

  closeAddTech(): void {
    if (!this.addTechOpen() || this.techniciansStore.saving()) {
      return;
    }

    this.clearAddTechCloseTimeout();

    const startViewTransition = this.document.startViewTransition?.bind(
      this.document,
    );

    if (startViewTransition) {
      const transition = startViewTransition(() => {
        this.addTechClosing.set(false);
        this.addTechOpen.set(false);
      });

      void transition.finished.finally(() => {
        this.finalizeAddTechClose();
      });
      return;
    }

    this.addTechClosing.set(true);
    this.closeAddTechTimeout = setTimeout(() => {
      this.addTechOpen.set(false);
      this.addTechClosing.set(false);
      this.closeAddTechTimeout = null;
      this.finalizeAddTechClose();
    }, ADD_TECH_CLOSE_DURATION_MS);
  }

  handlePhotoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const defaultView = this.document.defaultView;

    if (!defaultView) {
      return;
    }

    if (this.photoObjectUrl) {
      defaultView.URL.revokeObjectURL(this.photoObjectUrl);
    }

    this.photoObjectUrl = defaultView.URL.createObjectURL(file);
    this.newAvatarFile.set(file);
    this.newPhotoUrl.set(this.photoObjectUrl);
  }

  onPhoneDraftChange(value: string): void {
    this.newPhone.set(
      sanitizeSavPhoneDraft(value, this.selectedCountryCode().dialCode),
    );
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const nextValue = input?.value ?? '';

    this.onPhoneDraftChange(nextValue);

    if (input && input.value !== this.newPhone()) {
      input.value = this.newPhone();
    }
  }

  onPhoneBeforeInput(event: InputEvent): void {
    if (event.isComposing) {
      return;
    }

    const inputType = event.inputType ?? '';

    if (
      inputType.startsWith('delete') ||
      inputType === 'insertFromPaste' ||
      inputType === 'insertReplacementText'
    ) {
      return;
    }

    if (event.data && /\D/.test(event.data)) {
      event.preventDefault();
    }
  }

  onPhoneKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const allowedKeys = new Set([
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Tab',
      'Home',
      'End',
      'Enter',
    ]);

    if (allowedKeys.has(event.key)) {
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onPhonePaste(event: ClipboardEvent): void {
    event.preventDefault();

    const pastedText = event.clipboardData?.getData('text') ?? '';
    const input = event.target as HTMLInputElement | null;
    const currentValue = this.newPhone();
    const selectionStart = input?.selectionStart ?? currentValue.length;
    const selectionEnd = input?.selectionEnd ?? selectionStart;
    const mergedValue = `${currentValue.slice(0, selectionStart)}${pastedText}${currentValue.slice(selectionEnd)}`;
    const sanitizedValue = sanitizeSavPhoneDraft(
      mergedValue,
      this.selectedCountryCode().dialCode,
    );

    this.newPhone.set(sanitizedValue);

    if (!input) {
      return;
    }

    input.value = sanitizedValue;

    const pastedDigitsLength = pastedText.replaceAll(/\D/g, '').length;
    const nextCursor = Math.min(
      selectionStart + pastedDigitsLength,
      sanitizedValue.length,
    );

    queueMicrotask(() => {
      input.setSelectionRange(nextCursor, nextCursor);
    });
  }

  onCountryCodeChange(country: DashboardSavCountryCodeOption): void {
    this.selectedCountryCode.set(country);
    this.newPhone.set(sanitizeSavPhoneDraft(this.newPhone(), country.dialCode));
  }

  saveTech(): void {
    const prenom = this.newPrenom().trim();
    const nom = this.newNom().trim();
    const phone = this.formatPhoneValue(this.newPhone());
    const email = this.newEmail().trim();
    const address = this.newAddress().trim();
    const profession = this.resolveProfessionCode(this.newSpecialty());
    const photoUrl = this.newPhotoUrl();
    const avatarUrl =
      photoUrl && !photoUrl.startsWith('blob:') ? photoUrl : undefined;

    if (!prenom || !nom || !phone || this.phoneError() || this.emailError()) {
      return;
    }

    const body = {
      firstName: prenom,
      lastName: nom,
      phone,
      email: email || undefined,
      address: address || undefined,
      profession: profession || undefined,
      avatarUrl,
      avatarFile: this.newAvatarFile() ?? undefined,
    };

    const editingTechnicianId = this.editingTechnicianId();

    if (editingTechnicianId) {
      this.pendingTechMutation.set('update');
      this.techniciansStore.updateTechnician({
        id: editingTechnicianId,
        body,
      });
    } else {
      this.pendingTechMutation.set('create');
      this.techniciansStore.createTechnician(body);
    }
  }

  openEditTech(technician: DashboardSavTechnician): void {
    this.editingTechnicianId.set(technician.id);
    const [firstName = '', ...rest] = technician.name.split(' ');

    this.newPrenom.set(firstName);
    this.newNom.set(rest.join(' ').trim());
    this.newEmail.set(technician.email ?? '');
    this.newAddress.set(technician.address ?? '');
    this.newSpecialty.set(technician.specialty);
    this.newAvatarFile.set(null);
    this.newPhotoUrl.set(technician.image);
    this.populatePhoneDraft(technician.phone);
    this.clearAddTechCloseTimeout();

    if (this.addTechOpen() && !this.addTechClosing()) {
      return;
    }

    this.lockPageScroll();
    this.addTechClosing.set(false);
    this.addTechOpen.set(true);
  }

  toggleSelectedTechnicianAvailability(): void {
    const technician = this.selectedTechnician();

    if (!technician) {
      return;
    }

    this.techniciansStore.toggleTechnicianAvailability(technician.id);
    this.showToast(
      'success',
      technician.available
        ? 'Technicien marqué indisponible.'
        : 'Technicien marqué disponible.',
    );
  }

  archiveSelectedTechnician(): void {
    const technician = this.selectedTechnician();

    if (!technician) {
      return;
    }

    const confirmed =
      this.document.defaultView?.confirm(
        `Archiver ${technician.name} ? Cette action retirera le technicien de la liste active.`,
      ) ?? false;

    if (!confirmed) {
      return;
    }

    this.techniciansStore.archiveTechnician(technician.id);
    this.selectedTechnicianId.set(null);
    this.showToast('success', 'Technicien archivé.');
  }

  private resetPhotoState(): void {
    const defaultView = this.document.defaultView;

    if (this.photoObjectUrl && defaultView) {
      defaultView.URL.revokeObjectURL(this.photoObjectUrl);
    }

    this.photoObjectUrl = null;
    this.newAvatarFile.set(null);
    this.newPhotoUrl.set(null);
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }

  addTechLauncherSurfaceTransitionName(): string | null {
    return this.addTechModalVisible()
      ? null
      : this.toViewTransitionToken('dashboard-sav-add-tech-surface');
  }

  addTechLauncherMediaTransitionName(): string | null {
    return this.addTechModalVisible()
      ? null
      : this.toViewTransitionToken('dashboard-sav-add-tech-media');
  }

  addTechModalSurfaceTransitionName(): string | null {
    return this.addTechModalVisible()
      ? this.toViewTransitionToken('dashboard-sav-add-tech-surface')
      : null;
  }

  addTechModalMediaTransitionName(): string | null {
    return this.addTechModalVisible()
      ? this.toViewTransitionToken('dashboard-sav-add-tech-media')
      : null;
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.addTechModalVisible()) {
      this.closeAddTech();
    }
  }

  ngOnDestroy(): void {
    this.clearAddTechCloseTimeout();
    this.unlockPageScroll();
    this.resetAddTechDraft();
  }

  applyTicketFilters(): void {
    this.appliedFilters.set({
      status: this.draftStatus(),
      priority: this.draftPriority(),
      issue: this.draftIssue(),
      createdAt: cloneDate(this.draftCreatedAt()),
    });
    this.resetTicketsPage();
  }

  clearTicketFilters(): void {
    const defaultFilters = createDefaultTicketFilters();

    this.draftStatus.set(defaultFilters.status);
    this.draftPriority.set(defaultFilters.priority);
    this.draftIssue.set(defaultFilters.issue);
    this.draftCreatedAt.set(defaultFilters.createdAt);
    this.appliedFilters.set(defaultFilters);
    this.toolbarSearchTerm.set('');
    this.toolbarSelectedDate.set(null);
    this.tableSearchTerm.set('');
    this.directorySearchTerm.set('');
    this.showAllNotifications.set(false);
    this.showAllTechnicians.set(false);
    this.resetTicketsPage();
  }

  updateToolbarSearchTerm(term: string): void {
    this.toolbarSearchTerm.set(term);
    this.showAllNotifications.set(false);
    this.resetTicketsPage();
  }

  updateToolbarSelectedDate(date: Date | null): void {
    this.toolbarSelectedDate.set(date);
    this.showAllNotifications.set(false);
    this.resetTicketsPage();
  }

  updateTableSearchTerm(term: string): void {
    this.tableSearchTerm.set(term);
    this.resetTicketsPage();
  }

  updateDirectorySearchTerm(term: string): void {
    this.directorySearchTerm.set(term);
  }

  updateDetailHistorySearchTerm(term: string): void {
    this.detailHistorySearchTerm.set(term);
  }

  technicianShellTransitionName(technicianId: string): string | null {
    return this.transitioningTechnicianId() === technicianId
      ? this.toViewTransitionToken(`technician-shell-${technicianId}`)
      : null;
  }

  technicianAvatarTransitionName(technicianId: string): string | null {
    return this.transitioningTechnicianId() === technicianId
      ? this.toViewTransitionToken(`technician-avatar-${technicianId}`)
      : null;
  }

  technicianNameTransitionName(technicianId: string): string | null {
    return this.transitioningTechnicianId() === technicianId
      ? this.toViewTransitionToken(`technician-name-${technicianId}`)
      : null;
  }

  technicianSpecialtyTransitionName(technicianId: string): string | null {
    return this.transitioningTechnicianId() === technicianId
      ? this.toViewTransitionToken(`technician-specialty-${technicianId}`)
      : null;
  }

  toggleNotifications(): void {
    this.showAllNotifications.update((value) => !value);
  }

  openTechnicianDetail(technician: DashboardSavTechnician): void {
    if (this.transitionPhase() !== 'idle') {
      return;
    }

    this.transitioningTechnicianId.set(technician.id);

    const startViewTransition = this.document.startViewTransition?.bind(
      this.document,
    );

    if (startViewTransition) {
      const transition = startViewTransition(() => {
        this.selectedTechnicianId.set(technician.id);
        this.detailHistorySearchTerm.set('');
      });

      this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
      void transition.finished.finally(() => {
        this.transitioningTechnicianId.set(null);
      });
      return;
    }

    this.transitionPhase.set('to-detail');

    setTimeout(() => {
      this.selectedTechnicianId.set(technician.id);
      this.detailHistorySearchTerm.set('');
      this.transitionPhase.set('idle');
      this.transitioningTechnicianId.set(null);
      this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
    }, PHASE_TRANSITION_DURATION_MS);
  }

  closeTechnicianDetail(): void {
    if (this.transitionPhase() !== 'idle') {
      return;
    }

    const technicianId = this.selectedTechnicianId();

    if (!technicianId) {
      return;
    }

    this.transitioningTechnicianId.set(technicianId);

    const startViewTransition = this.document.startViewTransition?.bind(
      this.document,
    );

    if (startViewTransition) {
      const transition = startViewTransition(() => {
        this.selectedTechnicianId.set(null);
        this.detailHistorySearchTerm.set('');
      });

      this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
      void transition.finished.finally(() => {
        this.transitioningTechnicianId.set(null);
      });
      return;
    }

    this.transitionPhase.set('from-detail');

    setTimeout(() => {
      this.selectedTechnicianId.set(null);
      this.detailHistorySearchTerm.set('');
      this.transitionPhase.set('idle');
      this.transitioningTechnicianId.set(null);
      this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
    }, PHASE_TRANSITION_DURATION_MS);
  }

  toggleTechnicians(): void {
    if (this.transitionPhase() !== 'idle') {
      return;
    }

    const nextValue = !this.showAllTechnicians();

    if (nextValue) {
      this.transitionPhase.set('to-directory');
      setTimeout(() => {
        this.showAllTechnicians.set(true);
        this.transitionPhase.set('idle');
        this.scrollToTechnicianDirectory();
      }, PHASE_TRANSITION_DURATION_MS);
    } else {
      this.transitionPhase.set('to-dashboard');
      setTimeout(() => {
        this.showAllTechnicians.set(false);
        this.directorySearchTerm.set('');
        this.transitionPhase.set('idle');
      }, PHASE_TRANSITION_DURATION_MS);
    }
  }

  selectInterventionPeriod(period: DashboardSavInterventionPeriod): void {
    this.selectedInterventionPeriod.set(period);
  }

  exportDashboardData(): void {
    if (this.showAllTechnicians()) {
      const technicians = this.filteredTechnicians();

      if (!technicians.length) {
        return;
      }

      this.downloadCsv('dashboard-sav-techniciens.csv', [
        [
          'ID Technicien',
          'Nom',
          'Spécialité',
          'Note',
          'Tickets en cours',
          'Téléphone',
        ],
        ...technicians.map((technician) => [
          technician.id,
          technician.name,
          technician.specialty,
          technician.rating,
          technician.tickets,
          technician.phone,
        ]),
      ]);

      return;
    }

    this.exportVisibleTickets();
  }

  exportVisibleTickets(): void {
    const tickets = this.visibleTickets();

    if (!tickets.length) {
      return;
    }

    this.downloadCsv('dashboard-sav-tickets.csv', [
      [
        'ID Ticket',
        'Client',
        'Bien',
        'Problème',
        'Priorité',
        'Créé le',
        'Statut',
      ],
      ...tickets.map((ticket) => [
        ticket.id,
        ticket.client,
        ticket.property,
        ticket.issue,
        ticket.priority,
        ticket.createdAtLabel,
        ticket.status,
      ]),
    ]);
  }

  trackByTicketId(_: number, ticket: DashboardSavTicket): string {
    return ticket.id;
  }

  trackByNotificationId(
    _: number,
    notification: DashboardSavNotificationItem,
  ): string {
    return notification.id;
  }

  trackByTechnicianId(_: number, technician: DashboardSavTechnician): string {
    return technician.id;
  }

  ratingStars(rating: number): readonly DashboardSavStarTone[] {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const stars: DashboardSavStarTone[] = [];

    for (let index = 0; index < fullStars; index += 1) {
      stars.push('full');
    }

    if (hasHalfStar) {
      stars.push('half');
    }

    return stars;
  }

  private resetTicketsPage(): void {
    this.ticketsCurrentPage.set(1);
  }

  private scrollToTechnicianDirectory(): void {
    const defaultView = this.document.defaultView;

    if (!defaultView) {
      return;
    }

    defaultView.requestAnimationFrame(() => {
      this.document
        .getElementById('dashboard-sav-technician-directory')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  private toViewTransitionToken(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }

  private finalizeAddTechClose(): void {
    this.unlockPageScroll();
    this.resetAddTechDraft();
  }

  private clearAddTechCloseTimeout(): void {
    if (!this.closeAddTechTimeout) {
      return;
    }

    clearTimeout(this.closeAddTechTimeout);
    this.closeAddTechTimeout = null;
  }

  private resetAddTechDraft(): void {
    this.editingTechnicianId.set(null);
    this.pendingTechMutation.set(null);
    this.newPrenom.set('');
    this.newNom.set('');
    this.newPhone.set('');
    this.newEmail.set('');
    this.newAddress.set('');
    this.newSpecialty.set(
      this.specialtyOptions()[0] ?? 'Plomberie & sanitaires',
    );
    this.selectedCountryCode.set(COUNTRY_CODE_OPTIONS[0]);
    this.resetPhotoState();
  }

  private populatePhoneDraft(phone: string | undefined): void {
    if (!phone) {
      this.selectedCountryCode.set(COUNTRY_CODE_OPTIONS[0]);
      this.newPhone.set('');
      return;
    }

    const normalizedPhone = phone.replaceAll(/\s+/g, '').trim();
    const matchingCountry = COUNTRY_CODE_OPTIONS.find((country) =>
      normalizedPhone.startsWith(`+${country.dialCode}`),
    );

    if (!matchingCountry) {
      this.selectedCountryCode.set(COUNTRY_CODE_OPTIONS[0]);
      this.newPhone.set(normalizedPhone.replaceAll(/\D/g, ''));
      return;
    }

    this.selectedCountryCode.set(matchingCountry);
    this.newPhone.set(
      normalizedPhone.replace(
        new RegExp(String.raw`^\+${matchingCountry.dialCode}`),
        '',
      ),
    );
  }

  private resolveProfessionCode(label: string): string | null {
    const match = this.techniciansStore
      .professionOptions()
      .find((option) => option.label === label || option.value === label);

    return match?.value ?? null;
  }

  private resolveProfessionLabel(profession: string | undefined): string {
    if (!profession) {
      return 'Technicien polyvalent';
    }

    return (
      this.techniciansStore
        .professionOptions()
        .find((option) => option.value === profession)?.label ?? profession
    );
  }

  private toDashboardTechnician(
    technician: Technician,
    index: number,
  ): DashboardSavTechnician {
    const fallback = BASE_TECHNICIANS[index % BASE_TECHNICIANS.length];
    const firstName = technician.firstName?.trim() ?? '';
    const lastName = technician.lastName?.trim() ?? '';
    const name = `${firstName} ${lastName}`.trim() || technician.id;
    const initials =
      `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase() ||
      name.slice(0, 2).toUpperCase();

    return {
      id: technician.id,
      name,
      initials,
      specialty: this.resolveProfessionLabel(technician.profession),
      professionCode: technician.profession,
      rating: fallback?.rating ?? 4.5,
      tickets: 0,
      phone: technician.phone ?? 'Non renseigné',
      email: technician.email,
      address: technician.address,
      available: technician.available,
      createdAt: technician.createdAt,
      color: technician.available
        ? (fallback?.color ?? 'var(--ubax-navy)')
        : 'var(--ubax-text-muted)',
      image:
        technician.avatarUrl ||
        fallback?.image ||
        getDashboardSavAsset('detail/profile-avatar.webp'),
    };
  }

  private showToast(
    severity: 'success' | 'error' | 'info',
    detail: string,
  ): void {
    let summary = 'Information';

    if (severity === 'success') {
      summary = 'Operation reussie';
    } else if (severity === 'error') {
      summary = 'Action impossible';
    }

    this.messageService.add({
      severity,
      summary,
      detail,
      life: severity === 'error' ? 6200 : 4200,
      closable: true,
      styleClass: `ubax-toast-message ubax-toast-message--${severity}`,
      contentStyleClass: 'ubax-toast-content',
      closeIcon: 'pi-times',
    });
  }

  private formatPhoneValue(value: string): string {
    return composeSavE164Phone(this.selectedCountryCode().dialCode, value);
  }

  private lockPageScroll(): void {
    if (this.scrollLockState) {
      return;
    }

    const { body, documentElement, defaultView } = this.document;

    if (!body || !documentElement) {
      return;
    }

    this.scrollLockState = {
      htmlOverflow: documentElement.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyTouchAction: body.style.touchAction,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyHadOverlayClass: body.classList.contains(
        'ubax-dashboard-overlay-open',
      ),
      scrollY: defaultView?.scrollY ?? documentElement.scrollTop ?? 0,
    };

    body.classList.add('ubax-dashboard-overlay-open');
    documentElement.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';
    body.style.position = 'fixed';
    body.style.top = `-${this.scrollLockState.scrollY}px`;
    body.style.width = '100%';
  }

  private unlockPageScroll(): void {
    if (!this.scrollLockState) {
      return;
    }

    const { body, documentElement, defaultView } = this.document;

    documentElement.style.overflow = this.scrollLockState.htmlOverflow;
    body.style.overflow = this.scrollLockState.bodyOverflow;
    body.style.touchAction = this.scrollLockState.bodyTouchAction;
    body.style.position = this.scrollLockState.bodyPosition;
    body.style.top = this.scrollLockState.bodyTop;
    body.style.width = this.scrollLockState.bodyWidth;

    if (!this.scrollLockState.bodyHadOverlayClass) {
      body.classList.remove('ubax-dashboard-overlay-open');
    }

    defaultView?.scrollTo({
      top: this.scrollLockState.scrollY,
      left: 0,
      behavior: 'auto',
    });

    this.scrollLockState = null;
  }

  private downloadCsv(
    fileName: string,
    rows: readonly (readonly (string | number)[])[],
  ): void {
    const defaultView = this.document.defaultView;

    if (!defaultView || typeof Blob === 'undefined') {
      return;
    }

    const csvRows = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');

    const blob = new Blob([`\uFEFF${csvRows}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = defaultView.URL.createObjectURL(blob);
    const link = this.document.createElement('a');

    link.href = url;
    link.download = fileName;
    this.document.body.append(link);
    link.click();
    link.remove();
    defaultView.URL.revokeObjectURL(url);
  }
}
