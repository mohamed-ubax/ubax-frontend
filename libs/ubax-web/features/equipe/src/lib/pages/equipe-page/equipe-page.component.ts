import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
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
import { AdminUserResponse } from '@ubax-workspace/shared-api-types';
import {
  AGENCE_SUB_ROLES,
  AgencyStore,
  AuthStore,
  canTeamWrite,
  pickPrimarySubRole,
  SUB_ROLE_LABELS,
  UbaxSubRole,
} from '@ubax-workspace/ubax-web-data-access';
import {
  UiDataTableCellDefDirective,
  UiDataTableColumn,
  UiDataTableComponent,
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

type MemberPanelMode = 'view' | 'assign' | 'revoke';

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

@Component({
  selector: 'ubax-equipe-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    UiDataTableComponent,
    UiDataTableCellDefDirective,
    UiPaginationComponent,
  ],
  templateUrl: './equipe-page.component.html',
  styleUrl: './equipe-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipePageComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  readonly agencyStore = inject(AgencyStore);
  private readonly authStore = inject(AuthStore);
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

  readonly currentPage = signal(1);
  readonly isRoleMenuOpen = signal(false);
  readonly searchValue = signal('');
  readonly selectedRoleKey = signal<string | null>(null);

  // Auto-assign drawer (current user assigns roles to themselves)
  readonly isAutoAssignDrawerOpen = signal(false);
  readonly autoAssignRoles = signal<string[]>([]);

  // Add member drawer (Figma design)
  readonly isAddMemberDrawerOpen = signal(false);

  // Member panel (view / assign / revoke for other members)
  readonly activeMemberPanelMode = signal<MemberPanelMode | null>(null);
  readonly selectedMemberId = signal<string | null>(null);
  readonly assignPanelRoles = signal<string[]>([]);
  readonly assignPanelSeededFor = signal<string | null>(null);

  readonly addMemberForm = this.formBuilder.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    role: ['', [Validators.required]],
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

  // DB userId of the currently logged-in user (resolved from team members list)
  readonly currentUserMemberId = computed(() => {
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

    return member ? readMemberId(member) : null;
  });

  // True when the current user already has at least one sub-role assigned
  readonly hasCurrentUserSelfAssigned = computed(() => {
    const memberId = this.currentUserMemberId();
    if (!memberId) return false;
    const rolesInStore = this.agencyStore.memberSubRoles()[memberId];
    // Sub-roles loaded in agencyStore are authoritative; fall back to JWT sub-role
    if (rolesInStore !== undefined) return rolesInStore.length > 0;
    return this.authStore.subRole() !== null;
  });

  // PARTNER sans sous-rôle : peut s'auto-assigner mais pas encore gérer l'équipe
  readonly canSelfAssign = computed(
    () => this.authStore.isPartner() && !this.hasCurrentUserSelfAssigned(),
  );

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

  readonly memberPanelTitle = computed(() => {
    switch (this.activeMemberPanelMode()) {
      case 'assign':
        return 'Assigner des sous-rôles';
      case 'revoke':
        return 'Révoquer des sous-rôles';
      default:
        return 'Consulter les sous-rôles';
    }
  });

  constructor() {
    this.agencyStore.load?.({});

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

        if (
          Object.prototype.hasOwnProperty.call(cachedSubRoles, memberId) ||
          loadingMap[memberId]
        ) {
          return;
        }

        this.agencyStore.loadMemberSubRoles(memberId);
      });
    });

    effect(() => {
      const memberId = this.selectedMemberId();
      const panelMode = this.activeMemberPanelMode();
      const cachedSubRoles = this.agencyStore.memberSubRoles();

      if (
        !memberId ||
        panelMode !== 'assign' ||
        !Object.prototype.hasOwnProperty.call(cachedSubRoles, memberId) ||
        this.assignPanelSeededFor() === memberId
      ) {
        return;
      }

      this.assignPanelRoles.set([...(cachedSubRoles[memberId] ?? [])]);
      this.assignPanelSeededFor.set(memberId);
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

  // ── Auto-assign (current user self-assigns sub-roles) ────────────────────

  openAutoAssignDrawer(): void {
    this.autoAssignRoles.set([]);
    this.agencyStore.loadCodelistRoles('ROLE_AGENCE');
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
    if (!userId) return;

    this.agencyStore.assignerSousRoles({
      userId,
      body: { scope: 'AGENCE', roles: selectedRoles },
    });

    this.closeAutoAssignDrawer();
  }

  // ── Add member drawer ────────────────────────────────────────────────────

  openAddMemberDrawer(): void {
    this.addMemberForm.reset();
    this.isAddMemberDrawerOpen.set(true);
  }

  closeAddMemberDrawer(): void {
    this.isAddMemberDrawerOpen.set(false);
  }

  submitAddMember(): void {
    if (this.addMemberForm.invalid) {
      this.addMemberForm.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, phone, role } =
      this.addMemberForm.getRawValue();

    this.agencyStore.inviterMembre({
      firstName,
      lastName,
      email,
      phone: phone || undefined,
      subRoles: role ? [role] : [],
    });

    this.closeAddMemberDrawer();
  }

  // ── Member panel (view / assign / revoke for any member) ─────────────────

  openMemberPanel(row: AgencyMemberTableRow, mode: MemberPanelMode): void {
    this.selectedMemberId.set(row.memberId);
    this.activeMemberPanelMode.set(mode);

    if (
      row.memberId &&
      !Object.prototype.hasOwnProperty.call(
        this.agencyStore.memberSubRoles(),
        row.memberId,
      )
    ) {
      this.agencyStore.loadMemberSubRoles(row.memberId);
    }

    if (mode === 'assign') {
      this.assignPanelSeededFor.set(null);
      this.assignPanelRoles.set([...row.roleKeys]);
    }
  }

  closeMemberPanel(): void {
    this.selectedMemberId.set(null);
    this.activeMemberPanelMode.set(null);
    this.assignPanelRoles.set([]);
    this.assignPanelSeededFor.set(null);
  }

  submitMemberRoleAssignments(): void {
    const memberId = this.selectedMemberId();

    if (!memberId) {
      return;
    }

    const currentRoles = this.selectedMemberRoles();
    const nextRoles = this.assignPanelRoles();
    const rolesToAdd = nextRoles.filter((role) => !currentRoles.includes(role));
    const rolesToRemove = currentRoles.filter(
      (role) => !nextRoles.includes(role),
    );

    if (rolesToAdd.length) {
      this.agencyStore.assignerSousRoles({
        userId: memberId,
        body: {
          scope: 'AGENCE',
          roles: rolesToAdd,
        },
      });
    }

    rolesToRemove.forEach((role) => {
      this.agencyStore.revoquerSousRole({ userId: memberId, role });
    });

    this.closeMemberPanel();
  }

  revokeRole(role: string): void {
    const memberId = this.selectedMemberId();

    if (!memberId) {
      return;
    }

    this.agencyStore.revoquerSousRole({ userId: memberId, role });
  }

  toggleAssignPanelRole(role: UbaxSubRole): void {
    this.assignPanelRoles.update((roles) => toggleArrayValue(roles, role));
  }

  hasSelectedRole(roles: readonly string[], id: string): boolean {
    return roles.includes(id);
  }

  @HostListener('document:click', ['$event.target'])
  closeRoleMenu(target: EventTarget | null): void {
    if (
      !(target instanceof Node) ||
      !this.elementRef.nativeElement.contains(target)
    ) {
      this.isRoleMenuOpen.set(false);
    }
  }
}
