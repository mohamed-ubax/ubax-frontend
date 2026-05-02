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
  AgencyStore,
  pickPrimarySubRole,
  ROLE_BADGE_CONFIG,
  SUB_ROLE_LABELS,
} from '@ubax-workspace/ubax-web-data-access';
import { AdminUserResponse } from '@ubax-workspace/shared-api-types';
import { UbaxRole } from '@ubax-workspace/shared-data-access';
import {
  UiDataTableCellDefDirective,
  UiDataTableColumn,
  UiDataTableComponent,
  UiPaginationComponent,
} from '@ubax-workspace/shared-ui';

type AgencyMemberTableRow = {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string;
  readonly roleLabel: string;
  readonly avatarSrc: string;
};

type RoleOption = {
  readonly key: string;
  readonly label: string;
};

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
  return value
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '');
}

function readMemberRoleKeys(member: AdminUserResponse): string[] {
  const roles = (member as { roles?: unknown }).roles;

  if (!Array.isArray(roles)) {
    return [];
  }

  return roles.filter((role): role is string => typeof role === 'string');
}

function resolveRoleLabel(member: AdminUserResponse): string {
  const roles = readMemberRoleKeys(member);
  const primarySubRole = pickPrimarySubRole(roles);

  if (primarySubRole) {
    return SUB_ROLE_LABELS[primarySubRole] ?? primarySubRole;
  }

  const primaryRole = roles.find((role) =>
    Object.prototype.hasOwnProperty.call(ROLE_BADGE_CONFIG, role),
  ) as UbaxRole | undefined;

  if (primaryRole) {
    return ROLE_BADGE_CONFIG[primaryRole].label;
  }

  return 'Membre';
}

function toRoleOption(member: AdminUserResponse): RoleOption | null {
  const roles = readMemberRoleKeys(member);
  const primarySubRole = pickPrimarySubRole(roles);

  if (primarySubRole) {
    return {
      key: primarySubRole,
      label: SUB_ROLE_LABELS[primarySubRole] ?? primarySubRole,
    };
  }

  const primaryRole = roles.find((role) =>
    Object.prototype.hasOwnProperty.call(ROLE_BADGE_CONFIG, role),
  ) as UbaxRole | undefined;

  if (!primaryRole) {
    return null;
  }

  return {
    key: primaryRole,
    label: ROLE_BADGE_CONFIG[primaryRole].label,
  };
}

@Component({
  selector: 'ubax-equipe-page',
  standalone: true,
  imports: [
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
  private readonly agencyStore = inject(AgencyStore);

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

  readonly roleOptions = computed(() => {
    const options = new Map<string, RoleOption>();

    this.agencyStore.entities().forEach((member) => {
      const option = toRoleOption(member);

      if (option) {
        options.set(option.key, option);
      }
    });

    return Array.from(options.values());
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

  readonly memberRows = computed(() =>
    this.agencyStore.membresFiltres().map((member, index) => ({
      id: member.userId ?? member.keycloakId ?? member.email ?? `${index}`,
      firstName: member.firstName ?? '—',
      lastName: member.lastName ?? '—',
      email: member.email ?? '—',
      phone: member.phone ?? '—',
      roleLabel: resolveRoleLabel(member),
      avatarSrc: MEMBER_AVATAR_FALLBACKS[index % MEMBER_AVATAR_FALLBACKS.length],
    })),
  );

  readonly filteredRows = computed(() => {
    const search = normalizeSearchText(this.searchValue().trim());
    const rows = this.memberRows();

    if (!search) {
      return rows;
    }

    return rows.filter((row) =>
      normalizeSearchText(
        [
          row.firstName,
          row.lastName,
          row.email,
          row.phone,
          row.roleLabel,
        ].join(' '),
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

  constructor() {
    this.agencyStore.load?.({});

    effect(() => {
      const totalPages = this.totalPages();

      if (this.currentPage() > totalPages) {
        this.currentPage.set(totalPages);
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

  @HostListener('document:click', ['$event.target'])
  closeRoleMenu(target: EventTarget | null): void {
    if (!(target instanceof Node) || !this.elementRef.nativeElement.contains(target)) {
      this.isRoleMenuOpen.set(false);
    }
  }
}
