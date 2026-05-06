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
  HOTEL_SUB_ROLES,
  pickPrimarySubRole,
  SUB_ROLE_LABELS,
  UbaxRole,
  UbaxScope,
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
import { deriveViewState, type ViewState } from '@ubax-workspace/shared-ui';
import { EquipeSkeletonPromoComponent } from './equipe-skeleton-promo/equipe-skeleton-promo.component';
import { EquipeSkeletonTableComponent } from './equipe-skeleton-table/equipe-skeleton-table.component';

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
type ConfirmDialogAction = 'revoke-role' | 'deactivate-member' | null;

const MEMBER_PAGE_SIZE = 6;

const MEMBER_AVATAR_FALLBACK = '/equipe/avatar-fallback.svg';

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

function parseE164ToCountryAndNational(e164: string): {
  country: CountryDialCode;
  nationalDigits: string;
} {
  const trimmed = (e164 ?? '').trim();
  if (!trimmed.startsWith('+')) {
    return { country: readDefaultPhoneCountry(), nationalDigits: '' };
  }
  const withoutPlus = trimmed.slice(1).replaceAll(/\D/g, '');
  if (!withoutPlus.length) {
    return { country: readDefaultPhoneCountry(), nationalDigits: '' };
  }
  const sorted = [...COUNTRY_CODES].sort(
    (a, b) => b.dialCode.length - a.dialCode.length,
  );
  for (const country of sorted) {
    if (withoutPlus.startsWith(country.dialCode)) {
      return {
        country,
        nationalDigits: withoutPlus.slice(country.dialCode.length),
      };
    }
  }
  return { country: readDefaultPhoneCountry(), nationalDigits: withoutPlus };
}

function addMemberPhoneValidator(
  control: AbstractControl,
): ValidationErrors | null {
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
    EquipeSkeletonPromoComponent,
    EquipeSkeletonTableComponent,
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
  readonly authStore = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  readonly subRoleLabels = SUB_ROLE_LABELS as Record<string, string>;

  readonly paginationArrowLeftSrc  = '/equipe/pagination-arrow-left.webp';
  readonly paginationArrowRightSrc = '/equipe/pagination-arrow-right.webp';
  readonly promoBackdropSrc        = '/equipe/promo-backdrop.webp';
  readonly promoImageSrc           = '/equipe/promo-image.webp';
  readonly roleSortIconSrc         = '/equipe/role-sort-icon.webp';
  /** Illustration « no records » (frame Liste des membres — Figma node 1217:3865). */
  readonly membersEmptyIllustrationSrc = '/equipe/members-empty.webp';
  /** Calque vitré du bouton fermer drawer (Figma node 1207:4881 — ellipse sous le close). */
  readonly drawerCloseGlassTextureSrc  = '/equipe/drawer-close-texture.webp';

  readonly currentPage = signal(1);
  readonly isRoleMenuOpen = signal(false);
  readonly searchValue = signal('');
  readonly selectedRoleKey = signal<string | null>(null);
  private readonly loadedTeamScope = signal<UbaxScope | null>(null);
  private readonly loadedForUserId = signal<string | null>(null);

  /**
   * Devient true dès que le premier chargement se termine (succès ou erreur).
   * Empêche tout affichage de contenu métier avant que les données soient prêtes.
   */
  private readonly hasLoaded = signal(false);

  /**
   * Pendant la transition skeleton → contenu réel, on garde le skeleton
   * visible (opacity fade-out) le temps de l'animation CSS (300 ms).
   * Cela évite le flash blanc entre la disparition du skeleton et
   * l'apparition du contenu.
   */
  readonly isLeavingSkeleton = signal(false);

  /**
   * État d'affichage canonique — UN SEUL état à la fois.
   * Le template ne doit jamais lire loading/error/isEmpty directement.
   */
  readonly viewState = computed<ViewState>(() =>
    deriveViewState(
      this.agencyStore.loading(),
      this.agencyStore.error(),
      this.agencyStore.isEmpty(),
      this.hasLoaded(),
    ),
  );

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
  /** Sous-rôles édités (puces orange + liste déroulante — Figma modifier membre). */
  readonly editPanelRoles = signal<string[]>([]);
  /** Après chargement API des sous-rôles, évite d'écraser la sélection utilisateur. */
  readonly editMemberRoleSeededFor = signal<string | null>(null);

  // Confirmation dialog for role revocation
  readonly confirmDialogOpen = signal(false);
  readonly confirmDialogTitle = signal('');
  readonly confirmDialogMessage = signal('');
  readonly confirmDialogRoleToRevoke = signal<string | null>(null);
  readonly confirmDialogMemberId = signal<string | null>(null);
  readonly confirmDialogAction = signal<ConfirmDialogAction>(null);

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

  /** Affichage national (ex. 07…) pendant la saisie ; le contrôle `phone` garde l'E.164. */
  readonly addMemberPhoneDraft = signal('');
  readonly selectedPhoneCountry = signal<CountryDialCode>(
    readDefaultPhoneCountry(),
  );
  readonly countryDialOptions = COUNTRY_CODES;

  readonly editMemberForm = this.formBuilder.group({
    firstName: [''],
    lastName: [''],
    email: [''],
    phone: [''],
  });

  /** Indicatif + brouillon national pour l'affichage téléphone (édition — aligné sur l'ajout). */
  readonly editMemberPhoneCountry = signal<CountryDialCode>(
    readDefaultPhoneCountry(),
  );
  readonly editMemberPhoneDraft = signal('');

  readonly tableColumns: readonly UiDataTableColumn<AgencyMemberTableRow>[] = [
    {
      key: 'firstName',
      header: 'Prenom',
      value: (row) => row.firstName,
    },
    {
      key: 'lastName',
      header: 'Nom',
      width: '160px',
      value: (row) => row.lastName,
    },
    {
      key: 'email',
      header: 'Email',
      value: (row) => row.email,
    },
    {
      key: 'phone',
      header: 'Téléphone',
      width: '160px',
      value: (row) => row.phone,
    },
    {
      key: 'roleLabel',
      header: 'Rôle',
      width: '200px',
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

  readonly resolvedTeamScope = computed<UbaxScope | null>(
    // authStore.scope() est la source de vérité — hydraté par loadSubRoles()
    // après le login. agencyStore.teamScope() n'est utilisé qu'en fallback
    // une fois que le store a déjà chargé (scope confirmé par l'API).
    () => this.authStore.scope() ?? (this.agencyStore.entities().length > 0 ? this.agencyStore.teamScope() : null),
  );

  readonly roleOptions = computed<readonly RoleOption[]>(() => {
    const scope = this.resolvedTeamScope();
    const roles = scope === 'HOTEL' ? HOTEL_SUB_ROLES : AGENCE_SUB_ROLES;
    return roles.map((role) => ({
      key: role,
      label: SUB_ROLE_LABELS[role] ?? role,
    }));
  });

  readonly selectedRoleLabel = computed(() => {
    const selectedKey = this.selectedRoleKey();

    if (!selectedKey) {
      return 'Rôle';
    }

    return (
      this.roleOptions().find((option) => option.key === selectedKey)?.label ??
      'Rôle'
    );
  });

  readonly canManageMembers = computed(() =>
    canTeamWrite(this.authStore.user()),
  );

  private readonly members = computed(
    () => this.agencyStore.entities() as AdminUserResponse[],
  );

  // DB userId of the currently logged-in user — resolved via getByKeycloakId or hydrated team entities
  readonly currentUserMemberId = computed(() => {
    const dbId = this.agencyStore.currentUserDbId();
    if (dbId) return dbId;

    const user = this.authStore.user();
    if (!user) return null;

    const keycloakId = user.id;
    const email = user.email;

    const member = this.members().find(
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

  // PARTNER_ADMIN/PARTNER without sub-role can self-assign
  readonly canSelfAssign = computed(() => {
    if (this.hasCurrentUserSelfAssigned()) return false;
    const user = this.authStore.user();
    if (!user) return false;
    if (user.subRole) return false;
    const isPartnerAdmin = user.mainRole === UbaxRole.PARTNER_ADMIN;
    const isPartner = user.mainRole === UbaxRole.PARTNER;
    return isPartnerAdmin || isPartner;
  });

  readonly autoAssignUserInitials = computed(() => {
    const user = this.authStore.user();
    if (!user) {
      return '—';
    }
    return this.getInitials(user.prenom ?? '', user.nom ?? '');
  });

  readonly memberRows = computed(() =>
    (this.agencyStore.membresFiltres() as AdminUserResponse[]).map(
      (member, index) => {
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

        const storedAvatar = memberId
          ? (this.agencyStore.memberAvatars()[memberId] ?? null)
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
          avatarSrc: storedAvatar ?? MEMBER_AVATAR_FALLBACK,
        };
      },
    ),
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
      this.members().find((member) => readMemberId(member) === memberId) ?? null
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

  readonly selectedMemberAvatarSrc = computed(() => {
    const memberId = this.selectedMemberId();
    if (!memberId) return null;
    return this.agencyStore.memberAvatars()[memberId] ?? null;
  });

  constructor() {
    // Marquer hasLoaded dès que le premier chargement se termine.
    // On track la transition loading true→false pour couvrir tous les cas
    // (succès avec données, succès vide, erreur).
    // Edge case : si le store est déjà chargé (navigation retour), on marque
    // immédiatement hasLoaded si des entités ou une erreur sont présentes.
    let wasLoading = false;
    effect(() => {
      const loading = this.agencyStore.loading();
      const hasEntities = this.agencyStore.entities().length > 0;
      const hasError = this.agencyStore.error() !== null;

      if (loading) {
        wasLoading = true;
      } else if (!this.hasLoaded()) {
        // Transition loading→false OU store déjà peuplé (cache hit)
        if (wasLoading || hasEntities || hasError) {
          // 1. Déclencher le fade-out du skeleton (classe CSS is-leaving)
          this.isLeavingSkeleton.set(true);
          // 2. Après la durée de l'animation (320 ms), basculer vers le contenu réel
          setTimeout(() => {
            this.hasLoaded.set(true);
            this.isLeavingSkeleton.set(false);
          }, 320);
        }
      }
    });

    effect(() => {
      const user = this.authStore.user();
      if (!user) return;

      const isPartnerRole =
        user.mainRole === UbaxRole.PARTNER ||
        user.mainRole === UbaxRole.PARTNER_ADMIN;

      // Détecter un changement d'utilisateur → reset complet du store
      if (this.loadedForUserId() !== null && this.loadedForUserId() !== user.id) {
        this.agencyStore.reset();
        this.loadedTeamScope.set(null);
        this.loadedForUserId.set(null);
        this.hasLoaded.set(false);
        this.isLeavingSkeleton.set(false);
      }

      const resolvedScope = this.resolvedTeamScope();

      // Pour PARTNER/PARTNER_ADMIN, attendre que le scope soit résolu
      // (loadSubRoles() est asynchrone — scope arrive après le premier rendu)
      if (isPartnerRole && !resolvedScope) {
        return;
      }

      const scopeToLoad = resolvedScope ?? 'AGENCE';

      // Ne recharger que si le scope a changé ou si c'est le premier chargement
      if (this.loadedTeamScope() === scopeToLoad && this.loadedForUserId() === user.id) {
        return;
      }

      this.loadedTeamScope.set(scopeToLoad);
      this.loadedForUserId.set(user.id);
      this.agencyStore.load({ scope: scopeToLoad });
    });

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

    // Subroles are now loaded directly from the team endpoint, no need for individual loading

    // Sous-rôles édition : synchroniser avec l’API quand le cache se remplit
    effect(() => {
      const memberId = this.selectedMemberId();
      const panelMode = this.activeMemberPanelMode();
      const cachedSubRoles = this.agencyStore.memberSubRoles();

      if (
        !memberId ||
        panelMode !== 'edit' ||
        !Object.hasOwn(cachedSubRoles, memberId) ||
        this.editMemberRoleSeededFor() === memberId
      ) {
        return;
      }

      const roles = cachedSubRoles[memberId] ?? [];
      this.editPanelRoles.set([...roles]);
      this.editMemberRoleSeededFor.set(memberId);
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

  /** Relance le chargement après une erreur. */
  retryLoad(): void {
    this.hasLoaded.set(false);
    const scope = this.resolvedTeamScope() ?? 'AGENCE';
    this.agencyStore.load({ scope });
  }

  updateSearch(event: Event): void {    const target = event.target;

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
    const scope = this.resolvedTeamScope() ?? 'AGENCE';
    this.agencyStore.loadCodelistRoles(
      scope === 'HOTEL' ? 'ROLE_HOTEL' : 'ROLE_AGENCE',
    );

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
    const scope = this.resolvedTeamScope() ?? 'AGENCE';

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
      body: { scope, roles: selectedRoles },
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
    this.addMemberRolesMenuOpen.set(false);
    this.successMessage.set(null);
    this.addMemberError.set(null);
    this.addMemberSubmitted.set(false);
    this.selectedAvatarFile = null;
    this.avatarPreview.set(null);
    this.isAddMemberDrawerOpen.set(true);
  }

  closeAddMemberDrawer(): void {
    this.isAddMemberDrawerOpen.set(false);
    this.addMemberRolesMenuOpen.set(false);
    this.addMemberError.set(null);
    this.successMessage.set(null);
    this.addMemberPhoneDraft.set('');
    this.selectedAvatarFile = null;
    this.avatarPreview.set(null);
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
    const composed = composeE164Phone(
      this.selectedPhoneCountry().dialCode,
      raw,
    );
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
      avatarFile: this.selectedAvatarFile ?? undefined,
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

  toggleEditMemberRolesMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.editMemberRolesMenuOpen.update((open) => !open);
  }

  editMemberRolesSummary(): string {
    const keys = this.editPanelRoles();
    if (!keys.length) {
      return 'Selectionner un rôle (s)';
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

  isEditPanelRoleSelected(roleKey: string): boolean {
    return this.editPanelRoles().includes(roleKey);
  }

  removeEditPanelRole(roleKey: string): void {
    this.editPanelRoles.update((roles) => roles.filter((r) => r !== roleKey));
  }

  // ── Member panel (view details / edit roles) ─────────────────────────────

  openMemberPanel(row: AgencyMemberTableRow, mode: MemberPanelMode): void {
    this.editMemberRolesMenuOpen.set(false);
    this.selectedMemberId.set(row.memberId);
    this.activeMemberPanelMode.set(mode);

    if (mode === 'edit') {
      this.editMemberRoleSeededFor.set(null);

      const member = this.members().find(
        (m) => readMemberId(m) === row.memberId,
      );

      const phoneStr = member?.phone ?? '';
      const parsed = parseE164ToCountryAndNational(phoneStr);
      this.editMemberPhoneCountry.set(parsed.country);
      this.editMemberPhoneDraft.set(parsed.nationalDigits);

      if (
        row.memberId &&
        Object.hasOwn(this.agencyStore.memberSubRoles(), row.memberId)
      ) {
        const fromStore = this.agencyStore.memberSubRoles()[row.memberId] ?? [];
        this.editPanelRoles.set([...fromStore]);
        this.editMemberRoleSeededFor.set(row.memberId);
      } else {
        this.editPanelRoles.set([...row.roleKeys]);
      }

      this.editMemberForm.patchValue({
        firstName: member?.firstName ?? '',
        lastName: member?.lastName ?? '',
        email: member?.email ?? '',
        phone: phoneStr,
      });
    }
  }

  closeMemberPanel(): void {
    this.selectedMemberId.set(null);
    this.activeMemberPanelMode.set(null);
    this.editMemberRoleSeededFor.set(null);
    this.editPanelRoles.set([]);
    this.editMemberRolesMenuOpen.set(false);
    this.editMemberPhoneDraft.set('');
    this.editMemberPhoneCountry.set(readDefaultPhoneCountry());
  }

  toggleEditPanelRole(role: UbaxSubRole): void {
    this.editPanelRoles.update((roles) => toggleArrayValue(roles, role));
  }

  submitEditMember(): void {
    const memberId = this.selectedMemberId();
    if (!memberId) return;
    const scope = this.resolvedTeamScope() ?? 'AGENCE';

    const currentRoles = this.selectedMemberRoles();
    const nextRoles = this.editPanelRoles();
    const rolesToAdd = nextRoles.filter((r) => !currentRoles.includes(r));
    const rolesToRemove = currentRoles.filter((r) => !nextRoles.includes(r));

    if (rolesToAdd.length) {
      this.agencyStore.assignerSousRoles({
        userId: memberId,
        body: { scope, roles: rolesToAdd },
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
    this.confirmDialogAction.set('revoke-role');
    this.confirmDialogRoleToRevoke.set(role);
    this.confirmDialogMemberId.set(memberId);
    this.confirmDialogOpen.set(true);
  }

  canDeactivateRow(row: AgencyMemberTableRow): boolean {
    const currentUserId = this.currentUserMemberId();

    return (
      this.canManageMembers() &&
      row.memberId.length > 0 &&
      row.memberId !== currentUserId
    );
  }

  openDeactivateMemberConfirmation(row: AgencyMemberTableRow): void {
    const fullName = `${row.firstName} ${row.lastName}`.trim();
    const memberDisplay = fullName === '' ? row.email : fullName;

    this.confirmDialogTitle.set('Confirmer la désactivation');
    this.confirmDialogMessage.set(
      `Êtes-vous sûr de vouloir désactiver le membre "${memberDisplay}" ?`,
    );
    this.confirmDialogAction.set('deactivate-member');
    this.confirmDialogRoleToRevoke.set(null);
    this.confirmDialogMemberId.set(row.memberId);
    this.confirmDialogOpen.set(true);
  }

  closeConfirmDialog(): void {
    this.confirmDialogOpen.set(false);
    this.confirmDialogAction.set(null);
    this.confirmDialogRoleToRevoke.set(null);
    this.confirmDialogMemberId.set(null);
  }

  confirmDialogSubmit(): void {
    const action = this.confirmDialogAction();
    const role = this.confirmDialogRoleToRevoke();
    const memberId = this.confirmDialogMemberId();

    if (action === 'revoke-role' && role && memberId) {
      this.agencyStore.revoquerSousRole({ userId: memberId, role });
    }

    if (action === 'deactivate-member' && memberId) {
      this.agencyStore.desactiverMembre(memberId);
    }

    this.closeConfirmDialog();
  }

  formatSubRoleLabels(roles: readonly string[]): string {
    return roles.map((role) => this.subRoleLabels[role] ?? role).join(', ');
  }

  hasSelectedRole(roles: readonly string[], id: string): boolean {
    return roles.includes(id);
  }

  memberDialDisplay(member: AdminUserResponse): {
    country: CountryDialCode;
    nationalDigits: string;
  } {
    return parseE164ToCountryAndNational(member.phone ?? '');
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
      if (!addRoot || !(target instanceof Node) || !addRoot.contains(target)) {
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
