import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AdminHotelMembersStore,
  normalizeSubRoleStrings,
  type MemberResponse,
} from '@ubax-workspace/ubax-admin-data-access';
import { NOTIFICATION_HANDLER } from '@ubax-workspace/shared-data-access';
import {
  BreadcrumbNavComponent,
  EmptyStateComponent,
  SearchFilterBarComponent,
  SectionCardComponent,
  StatusBadgeComponent,
  SubNavTabsComponent,
  type SubNavTab,
} from '@ubax-workspace/shared-design-system';
import {
  UiDataTableCellDefDirective,
  type UiDataTableColumn,
  UiDataTableComponent,
  UiDataTableEmptyDefDirective,
  UiPaginationComponent,
} from '@ubax-workspace/shared-ui';
import { Tag } from 'primeng/tag';

type MemberScope = 'active' | 'inactive' | 'all';

const MEMBER_SCOPE_TABS: SubNavTab[] = [
  { label: 'Actifs', value: 'active' },
  { label: 'Inactifs', value: 'inactive' },
  { label: 'Tous', value: 'all' },
];
const PAGE_SIZE = 15;

@Component({
  selector: 'ubax-admin-membres-hotel-page',
  standalone: true,
  imports: [
    Tag,
    BreadcrumbNavComponent,
    EmptyStateComponent,
    SearchFilterBarComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    SubNavTabsComponent,
    UiDataTableComponent,
    UiDataTableCellDefDirective,
    UiDataTableEmptyDefDirective,
    UiPaginationComponent,
  ],
  templateUrl: './membres-hotel-page.component.html',
  styleUrl: './membres-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembresHotelPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(AdminHotelMembersStore);
  private readonly notif = inject(NOTIFICATION_HANDLER);

  protected readonly loading = this.store.loading;
  protected readonly members = this.store.members;
  protected readonly searchQuery = signal('');
  protected readonly memberScope = signal<MemberScope>('active');
  protected readonly currentPage = signal(1);

  protected readonly hotelId =
    this.route.snapshot.paramMap.get('hotelId') ?? '';

  protected readonly memberTabs = MEMBER_SCOPE_TABS;
  protected readonly tableColumns: readonly UiDataTableColumn<MemberResponse>[] =
    [
      { key: 'member', header: 'Membre', width: '22%' },
      { key: 'email', header: 'Email', width: '16%' },
      { key: 'phone', header: 'Téléphone', width: '12%' },
      { key: 'status', header: 'Statut', width: '10%' },
      { key: 'deletedAt', header: 'Désactivé le', width: '12%' },
      { key: 'roles', header: 'Rôles', width: '14%' },
      { key: 'subRoles', header: 'Sous-rôles', width: '14%' },
    ];

  protected readonly scopedMembers = computed(() => {
    switch (this.memberScope()) {
      case 'inactive':
        return this.members().filter((member) => this.memberIsInactive(member));
      case 'all':
        return this.members();
      default:
        return this.members().filter(
          (member) => !this.memberIsInactive(member),
        );
    }
  });

  protected readonly filteredMembers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.scopedMembers();
    return this.scopedMembers().filter((m) => {
      const name = `${m.firstName ?? ''} ${m.lastName ?? ''}`.toLowerCase();
      const email = (m.email ?? '').toLowerCase();
      const phone = (m.phone ?? '').toLowerCase();
      return (
        name.includes(query) || email.includes(query) || phone.includes(query)
      );
    });
  });

  protected readonly totalPages = computed(() =>
    Math.ceil(this.filteredMembers().length / PAGE_SIZE),
  );

  protected readonly pagedRows = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredMembers().slice(start, start + PAGE_SIZE);
  });

  protected readonly memberCount = computed(() => this.scopedMembers().length);

  protected readonly pageTitle = computed(() => {
    switch (this.memberScope()) {
      case 'inactive':
        return "Membres inactifs de l'hôtel";
      case 'all':
        return "Tous les membres de l'hôtel";
      default:
        return "Membres de l'hôtel";
    }
  });

  protected readonly pageSubtitle = computed(() => {
    switch (this.memberScope()) {
      case 'inactive':
        return 'Consultez les comptes désactivés avec leur date de retrait et leur historique de rôle.';
      case 'all':
        return "Vision consolidée des équipes actives et inactives de l'hôtel.";
      default:
        return "Vue en lecture seule — la gestion de l'équipe est assurée par le Gérant hôtel.";
    }
  });

  protected readonly emptyDescription = computed(() => {
    if (this.searchQuery()) {
      return 'Aucun membre ne correspond à votre recherche.';
    }

    switch (this.memberScope()) {
      case 'inactive':
        return "Cet hôtel n'a aucun membre inactif.";
      case 'all':
        return "Cet hôtel n'a encore aucun membre.";
      default:
        return "Cet hôtel n'a pas encore de membres actifs.";
    }
  });

  protected readonly breadcrumbs = [
    { label: 'Hôtels', routerLink: '/hotels' },
    { label: "Membres de l'hôtel" },
  ];

  ngOnInit(): void {
    void this.loadMembers();
  }

  private async loadMembers(): Promise<void> {
    if (!this.hotelId) return;
    try {
      await this.store.load(this.hotelId, {
        scope: this.memberScope(),
      });
    } catch {
      this.notif.error(
        this.store.error() ?? "Impossible de charger les membres de l'hôtel.",
      );
    }
  }

  protected initials(m: MemberResponse): string {
    return (
      `${m.firstName?.[0] ?? ''}${m.lastName?.[0] ?? ''}`.toUpperCase() || 'UA'
    );
  }

  protected fullName(m: MemberResponse): string {
    return `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || '—';
  }

  protected subRoleLabels(m: MemberResponse): string {
    return normalizeSubRoleStrings(m.subRoles).join(', ') || '—';
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  protected onScopeChange(value: string): void {
    this.memberScope.set((value as MemberScope) ?? 'active');
    this.currentPage.set(1);
    void this.loadMembers();
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected memberIsInactive(member: MemberResponse): boolean {
    return member.active === false || Boolean(member.deletedAt);
  }

  protected formatDeletedAt(value?: string): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }
}
