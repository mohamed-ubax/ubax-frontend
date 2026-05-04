import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  AbstractControl,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { AdminUserResponse } from '@ubax-workspace/shared-api-types';
import {
  COUNTRY_CODES,
  type CountryDialCode,
} from '@ubax-workspace/shared-data-access';
import {
  AGENCE_SUB_ROLES,
  AgencyStore,
  AuthStore,
  canTeamWrite,
  pickPrimarySubRole,
  SUB_ROLE_LABELS,
  UbaxRole,
  UbaxSubRole,
} from '@ubax-workspace/ubax-web-data-access';
import {
  UiDataTableCellDefDirective,
  UiDataTableColumn,
  UiDataTableComponent,
  UiDataTableEmptyDefDirective,
  UiFormInputComponent,
  UiPaginationComponent,
} from '@ubax-workspace/shared-ui';

type AgencyMemberTableRow = {
  readonly id: string;
  readonly memberId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string;
  readonly roleLabel: string;
  readonly roleKeys: readonly string[];
  readonly rolesLoading: boolean;
  readonly rolesError: string | null;
  readonly avatarSrc: string;
};

type RoleOption = {
  readonly key: UbaxSubRole;
  readonly label: string;
};

type MemberPanelMode = 'view' | 'edit';

const MEMBER_PAGE_SIZE = 6;

const MEMBER_AVATAR_FALLBACKS = [
  'https://www.figma.com/api/mcp/asset/304694cc-527f-42fb-88d3-be306d234913',
  'https://www.figma.com/api/mcp/asset/2c53b55b-32b0-42ea-be86-1c95d73b26db',
  'https://www.figma.com/api/mcp/asset/94ebfff1-2363-4fb7-8b75-2d8dfa9da864',
  'https://www.figma.com/api/mcp/asset/97b99361-cfcd-4e46-b8db-98bfd1d64af5',
  'https://www.figma.com/api/mcp/asset/a1913cfd-247f-45ee-88ce-03de08f1fa99',
  'https://www.figma.com/api/mcp/asset/4112729c-48f0-41fa-91d8-16adbc668f3c',
] as const;

function normalizeSearchText(value: string): string {
  return value.toLowerCase().normalize('NFD').replaceAll(/[̀-ͯ]/g, '');
}

function readMemberId(member: AdminUserResponse): string {
  return member.userId ?? member.keycloakId ?? member.email ?? '';
}

function formatRoleLabel(
  roleKeys: readonly string[],
  loading: boolean,
  error: string | null,
): string {
  if (loading) {
    return 'Chargement...';
  }

  if (error) {
    return 'Sous-rôles indisponibles';
  }

  if (!roleKeys.length) {
    return 'Aucun sous-rôle';
  }

  const primaryRole = pickPrimarySubRole(roleKeys);

  if (primaryRole) {
    return SUB_ROLE_LABELS[primaryRole] ?? primaryRole;
  }

  return roleKeys.join(', ');
}

function toggleArrayValue(values: readonly string[], role: string): string[] {
  return values.includes(role)
    ? values.filter((item) => item !== role)
    : [...values, role];
}

function composeE164Phone(dialCode: string, nationalDigits: string): string {
  const digits = nationalDigits.replaceAll(/\D/g, '');
  if (!digits.length) {
    return '';
  }
  if (dialCode === '225') {
    const body = digits.startsWith('0') ? digits.slice(1) : digits;
    if (body.length !== 9 || !/^[1-9]\d{8}$/.test(body)) {
      return '';
    }
    return `+225${body}`;
  }
  const body = digits.startsWith('0') ? digits.slice(1) : digits;
  if (body.length < 6 || body.length > 14 || !/^\d+$/.test(body)) {
    return '';
  }
  return `+${dialCode}${body}`;
}

function addMemberPhoneValidator(control: AbstractControl): ValidationErrors | null {
  const raw = (control.value as string) ?? '';
  if (!raw.trim()) {
    return null;
  }
  return /^\+[1-9]\d{6,14}$/.test(raw) ? null : { phoneFormat: true };
}

function readDefaultPhoneCountry(): CountryDialCode {
  const ci = COUNTRY_CODES.find((c) => c.iso2 === 'CI');
  if (ci) {
    return ci;
  }
  const first = COUNTRY_CODES[0];
  if (first) {
    return first;
  }
  return {
    name: "Cote d'Ivoire",
    iso2: 'CI',
    dialCode: '225',
    flagUrl: 'https://flagcdn.com/w80/ci.png',
  };
}

function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} o`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} Ko`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

@Component({
  selector: 'ubax-equipe-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    SelectModule,
    UiDataTableComponent,
    UiDataTableCellDefDirective,
    UiDataTableEmptyDefDirective,
    UiFormInputComponent,
    UiPaginationComponent,
  ],
  templateUrl: './equipe-page.component.html',
  styleUrl: './equipe-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipePageComponent {
  @ViewChild('addMemberRolesRoot', { read: ElementRef })
  private readonly addMemberRolesRoot?: ElementRef<HTMLElement>;

  @ViewChild('editMemberRolesRoot', { read: ElementRef })
  private readonly editMemberRolesRoot?: ElementRef<HTMLElement>;

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  readonly agencyStore = inject(AgencyStore);
  private readonly authStore = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  readonly subRoleLabels = SUB_ROLE_LABELS as Record<string, string>;

  readonly paginationArrowLeftSrc =
    'https://www.figma.com/api/mcp/asset/934d8cf3-8a97-4ced-a530-7c8eef886fc2';
  readonly paginationArrowRightSrc =
    'https://www.figma.com/api/mcp/asset/30d686d3-8a8e-4a47-a42a-0036ce831eb6';
  readonly promoBackdropSrc =
    'https://www.figma.com/api/mcp/asset/b8eef614-f125-41d4-be91-c08a21e31aeb';
  readonly promoImageSrc =
    'https://www.figma.com/api/mcp/asset/8333bdb6-b124-4abb-af6c-2763f66389b0';
  readonly roleSortIconSrc =
    'https://www.figma.com/api/mcp/asset/7759e876-c630-4d2f-8ad7-2eeebb07e59d';
  /** Illustration « no records » (frame Liste des membres — Figma node 1217:3865). */
  readonly membersEmptyIllustrationSrc =
    'https://www.figma.com/api/mcp/asset/f1a345aa-0603-4b2e-872f-0d9edc18c22e';
  /** Icône « flat-color-icons:file » — zone Documents (Figma Gestion immobilier Ubax). */
  readonly addMemberDocumentsIconSrc =
    'https://www.figma.com/api/mcp/asset/da1bd0ea-f910-42d7-9183-6f9a5ec1990f';

  readonly currentPage = signal(1);
  readonly isRoleMenuOpen = signal(false);
  readonly searchValue = signal('');
  readonly selectedRoleKey = signal<string | null>(null);

  // Auto-assign drawer — PARTNER_ADMIN auto-assigns sub-roles to themselves
  readonly isAutoAssignDrawerOpen = signal(false);
  readonly autoAssignRoles = signal<string[]>([]);

  // Add member drawer
  readonly isAddMemberDrawerOpen = signal(false);
  readonly addMemberRolesMenuOpen = signal(false);
  readonly editMemberRolesMenuOpen = signal(false);

  // Member panel (view details / edit roles)
  readonly activeMemberPanelMode = signal<MemberPanelMode | null>(null);
  readonly selectedMemberId = signal<string | null>(null);
  readonly editPanelRoles = signal<string[]>([]);
  readonly editPanelSeededFor = signal<string | null>(null);

  // Confirmation dialog for role revocation
  readonly confirmDialogOpen = signal(false);
  readonly confirmDialogTitle = signal('');
  readonly confirmDialogMessage = signal('');
  readonly confirmDialogRoleToRevoke = signal<string | null>(null);
  readonly confirmDialogMemberId = signal<string | null>(null);

  readonly addMemberForm = this.formBuilder.group({
    firstName: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    lastName: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, addMemberPhoneValidator]],
  });

  // Signal pour gérer les rôles sélectionnés (multiselect)
  readonly selectedSubRoles = signal<string[]>([]);

  // Messages de feedback
  readonly successMessage = signal<string | null>(null);
  readonly addMemberError = signal<string | null>(null);

  // Flag pour savoir si le formulaire a été soumis (évite les faux positifs)
  private addMemberSubmitted = signal(false);

  // Photo upload
  readonly avatarPreview = signal<string | null>(null);
  private selectedAvatarFile: File | null = null;

  /** Fichiers joints dans le formulaire d'ajout (préparation UI ; l'API n'expose pas encore l'upload). */
  readonly addMemberAttachments = signal<
    readonly { readonly name: string; readonly sizeLabel: string; readonly file: File }[]
  >([]);

  /** Affichage national (ex. 07…) pendant la saisie ; le contrôle `phone` garde l'E.164. */
  readonly addMemberPhoneDraft = signal('');
  readonly selectedPhoneCountry = signal<CountryDialCode>(readDefaultPhoneCountry());
  readonly countryDialOptions = COUNTRY_CODES;

  readonly editMemberForm = this.formBuilder.group({
    firstName: [{ value: '', disabled: true }],
    lastName: [{ value: '', disabled: true }],
    email: [{ value: '', disabled: true }],
    phone: [{ value: '', disabled: true }],
    role: [''],
  });

  readonly tableColumns: readonly UiDataTableColumn<AgencyMemberTableRow>[] = [
    {
      key: 'firstName',
      header: 'Prenom',
      width: '221px',
      value: (row) => row.firstName,
    },
    {
      key: 'lastName',
      header: 'Nom',
      width: '171px',
      value: (row) => row.lastName,
    },
    {
      key: 'email',
      header: 'Email',
      width: '194px',
      value: (row) => row.email,
    },
    {
      key: 'phone',
      header: 'Téléphone',
      width: '241px',
      value: (row) => row.phone,
    },
    {
      key: 'roleLabel',
      header: 'Rôle',
      width: '172px',
      value: (row) => row.roleLabel,
      headerIconSrc: this.roleSortIconSrc,
      rotateHeaderIcon: true,
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '123px',
      align: 'center',
    },
  ];

  readonly roleOptions: readonly RoleOption[] = AGENCE_SUB_ROLES.map(
    (role) => ({
      key: role,
      label: SUB_ROLE_LABELS[role] ?? role,
    }),
  );

  readonly selectedRoleLabel = computed(() => {
    const selectedKey = this.selectedRoleKey();

    if (!selectedKey) {
      return 'Rôle';
    }

    return (
      this.roleOptions.find((option) => option.key === selectedKey)?.label ??
      'Rôle'
    );
  });

  readonly canManageMembers = computed(() =>
    canTeamWrite(this.authStore.user()),
  );

  // DB userId of the currently logged-in user — resolved via getByKeycloakId or hydrated team entities
  readonly currentUserMemberId = computed(() => {
    const dbId = this.agencyStore.currentUserDbId();
    if (dbId) return dbId;

    const user = this.authStore.user();
    if (!user) return null;

    const keycloakId = user.id;
    const email = user.email;

    const member = this.agencyStore
      .entities()
      .find(
        (m) =>
          (keycloakId &&
            (m.keycloakId === keycloakId || m.userId === keycloakId)) ||
          (email && m.email === email),
      );

    if (member) return readMemberId(member);

    return null;
  });

  // True when the current user already has at least one sub-role assigned
  readonly hasCurrentUserSelfAssigned = computed(() => {
    // If subRole is already loaded in the auth token, auto-assign is done
    if (this.authStore.subRole() !== null) return true;

    const memberId = this.currentUserMemberId();
    if (!memberId) return false;

    const rolesInStore = this.agencyStore.memberSubRoles()[memberId];
    return rolesInStore !== undefined ? rolesInStore.length > 0 : false;
  });

  // PARTNER_ADMIN or PARTNER with no scope yet can self-assign
  readonly canSelfAssign = computed(() => {
    if (this.hasCurrentUserSelfAssigned()) return false;
    const user = this.authStore.user();
    if (!user) return false;
    if (user.subRole) return false;
    const isPartnerAdmin = user.mainRole === UbaxRole.PARTNER_ADMIN;
    const isPartnerWithoutScope =
      user.mainRole === UbaxRole.PARTNER && user.scope === null;
    return isPartnerAdmin || isPartnerWithoutScope;
  });

  readonly memberRows = computed(() =>
    this.agencyStore.membresFiltres().map((member, index) => {
      const memberId = readMemberId(member);
      const roleKeys = memberId
        ? [...(this.agencyStore.memberSubRoles()[memberId] ?? [])]
        : [];
      const rolesLoading = memberId
        ? (this.agencyStore.memberSubRolesLoading()[memberId] ?? false)
        : false;
      const rolesError = memberId
        ? (this.agencyStore.memberSubRolesError()[memberId] ?? null)
        : null;

      return {
        id: memberId || `${index}`,
        memberId,
        firstName: member.firstName ?? '—',
        lastName: member.lastName ?? '—',
        email: member.email ?? '—',
        phone: member.phone ?? '—',
        roleLabel: formatRoleLabel(roleKeys, rolesLoading, rolesError),
        roleKeys,
        rolesLoading,
        rolesError,
        avatarSrc:
          MEMBER_AVATAR_FALLBACKS[index % MEMBER_AVATAR_FALLBACKS.length],
      };
    }),
  );

  readonly filteredRows = computed(() => {
    const search = normalizeSearchText(this.searchValue().trim());
    const rows = this.memberRows();

    if (!search) {
      return rows;
    }

    return rows.filter((row) =>
      normalizeSearchText(
        [row.firstName, row.lastName, row.email, row.phone, row.roleLabel].join(
          ' ',
        ),
      ).includes(search),
    );
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredRows().length / MEMBER_PAGE_SIZE)),
  );

  readonly pagedRows = computed(() => {
    const start = (this.currentPage() - 1) * MEMBER_PAGE_SIZE;
    return this.filteredRows().slice(start, start + MEMBER_PAGE_SIZE);
  });

  readonly selectedMember = computed(() => {
    const memberId = this.selectedMemberId();

    if (!memberId) {
      return null;
    }

    return (
      this.agencyStore
        .entities()
        .find((member) => readMemberId(member) === memberId) ?? null
    );
  });

  readonly selectedMemberRoles = computed(() => {
    const memberId = this.selectedMemberId();

    if (!memberId) {
      return [];
    }

    return [...(this.agencyStore.memberSubRoles()[memberId] ?? [])];
  });

  readonly selectedMemberRolesLoading = computed(() => {
    const memberId = this.selectedMemberId();

    return memberId
      ? (this.agencyStore.memberSubRolesLoading()[memberId] ?? false)
      : false;
  });

  readonly selectedMemberRolesError = computed(() => {
    const memberId = this.selectedMemberId();

    return memberId
      ? (this.agencyStore.memberSubRolesError()[memberId] ?? null)
      : null;
  });

  readonly selectedMemberPrimaryRole = computed(() => {
    const roles = this.selectedMemberRoles();
    return pickPrimarySubRole(roles) ?? null;
  });

  constructor() {
    this.agencyStore.load?.({});

    // Toggle body class when any drawer/overlay is open (reduces topbar z-index)
    effect(() => {
      const isAnyOverlayOpen =
        this.isAutoAssignDrawerOpen() ||
        this.isAddMemberDrawerOpen() ||
        this.activeMemberPanelMode() !== null ||
        this.confirmDialogOpen();

      this.document.body.classList.toggle(
        'ubax-equipe-overlay-open',
        isAnyOverlayOpen,
      );
    });

    this.destroyRef.onDestroy(() => {
      this.document.body.classList.remove('ubax-equipe-overlay-open');
    });

    // Load the DB userId for PARTNER_ADMIN or PARTNER without scope via Keycloak ID
    effect(() => {
      const user = this.authStore.user();
      if (!user?.id || this.agencyStore.currentUserDbId()) return;
      const isPartnerAdmin = user.mainRole === UbaxRole.PARTNER_ADMIN;
      const isPartnerWithoutScope =
        user.mainRole === UbaxRole.PARTNER && user.scope === null;
      if (isPartnerAdmin || isPartnerWithoutScope) {
        this.agencyStore.loadCurrentUserDbId(user.id);
      }
    });

    effect(() => {
      const totalPages = this.totalPages();

      if (this.currentPage() > totalPages) {
        this.currentPage.set(totalPages);
      }
    });

    effect(() => {
      const members = this.agencyStore.entities();
      const cachedSubRoles = this.agencyStore.memberSubRoles();
      const loadingMap = this.agencyStore.memberSubRolesLoading();

      members.forEach((member) => {
        const memberId = readMemberId(member);

        if (!memberId) {
          return;
        }

        if (Object.hasOwn(cachedSubRoles, memberId) || loadingMap[memberId]) {
          return;
        }

        this.agencyStore.loadMemberSubRoles(memberId);
      });
    });

    // Seed edit panel roles when the selected member's sub-roles are loaded
    effect(() => {
      const memberId = this.selectedMemberId();
      const panelMode = this.activeMemberPanelMode();
      const cachedSubRoles = this.agencyStore.memberSubRoles();

      if (
        !memberId ||
        panelMode !== 'edit' ||
        !Object.hasOwn(cachedSubRoles, memberId) ||
        this.editPanelSeededFor() === memberId
      ) {
        return;
      }

      this.editPanelRoles.set([...(cachedSubRoles[memberId] ?? [])]);
      this.editPanelSeededFor.set(memberId);
    });

    // Handle add member success/error feedback
    effect(() => {
      const isSaving = this.agencyStore.isSaving();
      const error = this.agencyStore.error();

      // Only handle feedback when drawer is open
      if (!this.isAddMemberDrawerOpen()) {
        return;
      }

      // If just finished saving and no error, show success
      // Note: we check addMemberSubmitted to avoid triggering on initial drawer open
      if (
        !isSaving &&
        !error &&
        this.addMemberSubmitted() &&
        !this.successMessage()
      ) {
        this.successMessage.set('Membre ajouté avec succès !');
        this.selectedSubRoles.set([]);
        this.addMemberSubmitted.set(false);
        // Auto-close after 2 seconds
        setTimeout(() => {
          this.closeAddMemberDrawer();
        }, 2000);
      }

      // If there's an error, display it
      if (error && !this.addMemberError()) {
        // Check for 409 Conflict (email already exists)
        if (
          error.toLowerCase().includes('409') ||
          error.toLowerCase().includes('conflict') ||
          error.toLowerCase().includes('already')
        ) {
          this.addMemberError.set('Cet email est déjà utilisé.');
        } else {
          this.addMemberError.set(
            "Une erreur est survenue lors de l'ajout du membre.",
          );
        }
      }
    });
  }

  updateSearch(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.searchValue.set(target.value);
      this.currentPage.set(1);
    }
  }

  toggleRoleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isRoleMenuOpen.update((isOpen) => !isOpen);
  }

  selectRole(option: RoleOption | null): void {
    this.selectedRoleKey.set(option?.key ?? null);
    this.agencyStore.setFilterRole(option?.key ?? null);
    this.isRoleMenuOpen.set(false);
    this.currentPage.set(1);
  }

  updatePage(page: number): void {
    this.currentPage.set(page);
  }

  // ── Auto-assign (PARTNER_ADMIN self-assigns sub-roles) ───────────────────

  openAutoAssignDrawer(): void {
    this.autoAssignRoles.set([]);
    this.agencyStore.loadCodelistRoles('ROLE_AGENCE');

    // Ensure DB userId is loaded — retry if the initial effect hasn't resolved yet
    const user = this.authStore.user();

    if (user?.id && !this.agencyStore.currentUserDbId()) {
      this.agencyStore.loadCurrentUserDbId(user.id);
    }

    this.isAutoAssignDrawerOpen.set(true);
  }

  closeAutoAssignDrawer(): void {
    this.isAutoAssignDrawerOpen.set(false);
  }

  toggleAutoAssignRole(id: string): void {
    this.autoAssignRoles.update((roles) => toggleArrayValue(roles, id));
  }

  submitAutoAssign(): void {
    const selectedRoles = this.autoAssignRoles();
    if (!selectedRoles.length) return;

    const userId = this.currentUserMemberId();
    if (!userId) {
      const user = this.authStore.user();

      if (user?.id) {
        this.agencyStore.loadCurrentUserDbId(user.id);
      }

      return;
    }

    this.agencyStore.assignerSousRoles({
      userId,
      body: { scope: 'AGENCE', roles: selectedRoles },
    });

    // Refresh auth store so canManageMembers and canSelfAssign update reactively
    this.authStore.loadSubRoles();
    this.closeAutoAssignDrawer();
  }

  // ── Add member drawer ────────────────────────────────────────────────────

  openAddMemberDrawer(): void {
    this.addMemberForm.reset();
    this.addMemberPhoneDraft.set('');
    this.selectedPhoneCountry.set(readDefaultPhoneCountry());
    this.selectedSubRoles.set([]);
    this.addMemberAttachments.set([]);
    this.addMemberRolesMenuOpen.set(false);
    this.successMessage.set(null);
    this.addMemberError.set(null);
    this.addMemberSubmitted.set(false);
    this.isAddMemberDrawerOpen.set(true);
  }

  closeAddMemberDrawer(): void {
    this.isAddMemberDrawerOpen.set(false);
    this.addMemberRolesMenuOpen.set(false);
    this.addMemberError.set(null);
    this.successMessage.set(null);
    this.addMemberAttachments.set([]);
    this.addMemberPhoneDraft.set('');
  }

  patchAddMemberField(
    field: 'firstName' | 'lastName' | 'email',
    value: string,
  ): void {
    const control = this.addMemberForm.get(field);
    control?.setValue(value);
    control?.markAsTouched();
  }

  onAddMemberPhoneNationalInput(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    const raw = target.value;
    this.addMemberPhoneDraft.set(raw);
    const composed = composeE164Phone(this.selectedPhoneCountry().dialCode, raw);
    this.addMemberForm.get('phone')?.setValue(composed);
    this.addMemberForm.get('phone')?.markAsTouched();
  }

  onAddMemberPhoneCountryIsoChange(iso2: string): void {
    const country =
      COUNTRY_CODES.find((c) => c.iso2 === iso2) ?? readDefaultPhoneCountry();
    this.selectedPhoneCountry.set(country);
    const composed = composeE164Phone(
      country.dialCode,
      this.addMemberPhoneDraft(),
    );
    this.addMemberForm.get('phone')?.setValue(composed);
    this.addMemberForm.get('phone')?.markAsTouched();
  }

  toggleAddMemberRolesMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.addMemberRolesMenuOpen.update((open) => !open);
  }

  addMemberRolesSummary(): string {
    const keys = this.selectedSubRoles();
    if (!keys.length) {
      return 'Sélectionner un ou plusieurs rôles';
    }
    return keys
      .map((k) => this.subRoleLabels[k] ?? k)
      .sort()
      .join(', ');
  }

  toggleEditMemberRolesMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.editMemberRolesMenuOpen.update((open) => !open);
  }

  editMemberRolesSummary(): string {
    const keys = this.editPanelRoles();
    if (!keys.length) {
      return 'Sélectionner un ou plusieurs rôles';
    }
    return keys
      .map((k) => this.subRoleLabels[k] ?? k)
      .sort()
      .join(', ');
  }

  onEditMemberRoleOptionClick(
    roleKey: UbaxSubRole,
    event: MouseEvent | KeyboardEvent,
  ): void {
    event.preventDefault();
    event.stopPropagation();
    this.toggleEditPanelRole(roleKey);
  }

  onAddMemberDocumentsChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.files?.length) {
      return;
    }
    const next = Array.from(target.files).map((file) => ({
      name: file.name,
      sizeLabel: formatAttachmentSize(file.size),
      file,
    }));
    this.addMemberAttachments.update((current) => [...current, ...next]);
    target.value = '';
  }

  removeAddMemberAttachment(index: number): void {
    this.addMemberAttachments.update((items) =>
      items.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  submitAddMember(): void {
    if (this.addMemberForm.invalid || this.selectedSubRoles().length === 0) {
      this.addMemberForm.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, phone } =
      this.addMemberForm.getRawValue();

    this.addMemberSubmitted.set(true);
    this.addMemberError.set(null);

    this.agencyStore.inviterMembre({
      firstName,
      lastName,
      email,
      phone: phone || undefined,
      subRoles: this.selectedSubRoles(),
    });
  }

  // Gérer la sélection/désélection d'un rôle
  toggleSubRole(roleKey: string): void {
    const current = this.selectedSubRoles();
    if (current.includes(roleKey)) {
      this.selectedSubRoles.set(current.filter((r) => r !== roleKey));
    } else {
      this.selectedSubRoles.set([...current, roleKey]);
    }
  }

  onAddMemberRoleOptionClick(
    roleKey: string,
    event: MouseEvent | KeyboardEvent,
  ): void {
    event.preventDefault();
    event.stopPropagation();
    this.toggleSubRole(roleKey);
  }

  isSubRoleSelected(roleKey: string): boolean {
    return this.selectedSubRoles().includes(roleKey);
  }

  // ── Member panel (view details / edit roles) ─────────────────────────────

  openMemberPanel(row: AgencyMemberTableRow, mode: MemberPanelMode): void {
    this.editMemberRolesMenuOpen.set(false);
    this.selectedMemberId.set(row.memberId);
    this.activeMemberPanelMode.set(mode);

    if (
      row.memberId &&
      !Object.hasOwn(this.agencyStore.memberSubRoles(), row.memberId)
    ) {
      this.agencyStore.loadMemberSubRoles(row.memberId);
    }

    if (mode === 'edit') {
      this.editPanelSeededFor.set(null);
      this.editPanelRoles.set([...row.roleKeys]);

      const member = this.agencyStore
        .entities()
        .find((m) => readMemberId(m) === row.memberId);

      this.editMemberForm.patchValue({
        firstName: member?.firstName ?? '',
        lastName: member?.lastName ?? '',
        email: member?.email ?? '',
        phone: member?.phone ?? '',
        role: pickPrimarySubRole(row.roleKeys) ?? '',
      });
    }
  }

  closeMemberPanel(): void {
    this.selectedMemberId.set(null);
    this.activeMemberPanelMode.set(null);
    this.editPanelRoles.set([]);
    this.editPanelSeededFor.set(null);
    this.editMemberRolesMenuOpen.set(false);
  }

  toggleEditPanelRole(role: UbaxSubRole): void {
    this.editPanelRoles.update((roles) => toggleArrayValue(roles, role));
  }

  submitEditMember(): void {
    const memberId = this.selectedMemberId();
    if (!memberId) return;

    const currentRoles = this.selectedMemberRoles();
    const nextRoles = this.editPanelRoles();
    const rolesToAdd = nextRoles.filter((r) => !currentRoles.includes(r));
    const rolesToRemove = currentRoles.filter((r) => !nextRoles.includes(r));

    if (rolesToAdd.length) {
      this.agencyStore.assignerSousRoles({
        userId: memberId,
        body: { scope: 'AGENCE', roles: rolesToAdd },
      });
    }

    rolesToRemove.forEach((role) => {
      this.agencyStore.revoquerSousRole({ userId: memberId, role });
    });

    this.closeMemberPanel();
  }

  // ── Role revocation with confirmation ────────────────────────────────────

  openRevokeConfirmation(
    role: string,
    memberId: string,
    memberName: string,
  ): void {
    const roleLabel = this.subRoleLabels[role] ?? role;
    this.confirmDialogTitle.set('Confirmer la révocation');
    this.confirmDialogMessage.set(
      `Êtes-vous sûr de vouloir révoquer le rôle "${roleLabel}" de ${memberName} ?`,
    );
    this.confirmDialogRoleToRevoke.set(role);
    this.confirmDialogMemberId.set(memberId);
    this.confirmDialogOpen.set(true);
  }

  closeConfirmDialog(): void {
    this.confirmDialogOpen.set(false);
    this.confirmDialogRoleToRevoke.set(null);
    this.confirmDialogMemberId.set(null);
  }

  confirmRevokeRole(): void {
    const role = this.confirmDialogRoleToRevoke();
    const memberId = this.confirmDialogMemberId();

    if (role && memberId) {
      this.agencyStore.revoquerSousRole({ userId: memberId, role });
    }

    this.closeConfirmDialog();
  }

  hasSelectedRole(roles: readonly string[], id: string): boolean {
    return roles.includes(id);
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  // ── Photo upload ───────────────────────────────────────────────────────────

  onAvatarClick(): void {
    document.getElementById('avatarInput')?.click();
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.selectedAvatarFile = file;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.avatarPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeAvatar(event: Event): void {
    event.stopPropagation();
    this.selectedAvatarFile = null;
    this.avatarPreview.set(null);
    // Reset file input
    const input = document.getElementById('avatarInput') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  @HostListener('document:click', ['$event.target'])
  closeRoleMenu(target: EventTarget | null): void {
    if (
      !(target instanceof Node) ||
      !this.elementRef.nativeElement.contains(target)
    ) {
      this.isRoleMenuOpen.set(false);
    }

    if (this.addMemberRolesMenuOpen()) {
      const addRoot = this.addMemberRolesRoot?.nativeElement;
      if (
        !addRoot ||
        !(target instanceof Node) ||
        !addRoot.contains(target)
      ) {
        this.addMemberRolesMenuOpen.set(false);
      }
    }

    if (this.editMemberRolesMenuOpen()) {
      const editRoot = this.editMemberRolesRoot?.nativeElement;
      if (
        !editRoot ||
        !(target instanceof Node) ||
        !editRoot.contains(target)
      ) {
        this.editMemberRolesMenuOpen.set(false);
      }
    }
  }
}
