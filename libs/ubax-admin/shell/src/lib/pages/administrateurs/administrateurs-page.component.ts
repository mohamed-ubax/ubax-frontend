import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import type { AdminUserResponse } from '@ubax-workspace/shared-api-types';
import {
  ConfirmDialogComponent,
  StatusBadgeComponent,
} from '@ubax-workspace/shared-design-system';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access/auth-store';
import { NOTIFICATION_HANDLER, resolveHttpErrorMessage } from '@ubax-workspace/shared-data-access';
import {
  UiDataTableCellDefDirective,
  UiDataTableColumn,
  UiDataTableComponent,
  UiDataTableEmptyDefDirective,
  UiPaginationComponent,
} from '@ubax-workspace/shared-ui';
import {
  AdminUsersService,
  getPrimaryAdminRole,
  INTERNAL_SUB_ROLES,
  type AdminRole,
} from '../../services/admin-users.service';

interface AdminMemberForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: AdminRole;
}

type FormMode = 'create' | 'edit';

const PAGE_SIZE = 8;

const ROLE_OPTIONS: { label: string; value: AdminRole }[] = [
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Super Admin', value: 'SUPER_ADMIN' },
];

const EMPTY_FORM: AdminMemberForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'ADMIN',
};

@Component({
  selector: 'ubax-admin-administrateurs-page',
  standalone: true,
  imports: [
    FormsModule,
    UiDataTableComponent,
    UiDataTableCellDefDirective,
    UiDataTableEmptyDefDirective,
    UiPaginationComponent,
    ConfirmDialogComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './administrateurs-page.component.html',
  styleUrl: './administrateurs-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdministrateursPageComponent implements OnInit {
  private readonly svc = inject(AdminUsersService);
  private readonly authStore = inject(AuthStore);
  private readonly notif = inject(NOTIFICATION_HANDLER);

  protected readonly loading = signal(false);
  protected readonly admins = signal<AdminUserResponse[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly filterRole = signal<AdminRole | null>(null);

  protected readonly isSuperAdmin = this.authStore.isSuperAdmin;
  protected readonly currentUserId = computed(
    () => this.authStore.user()?.id ?? null,
  );

  protected readonly formMode = signal<FormMode>('create');
  protected readonly showForm = signal(false);
  protected readonly showDetails = signal(false);
  protected readonly showDeleteConfirm = signal(false);
  protected readonly showRevokeConfirm = signal(false);
  protected readonly formLoading = signal(false);
  protected readonly detailsLoading = signal(false);

  protected readonly selectedAdmin = signal<AdminUserResponse | null>(null);
  protected readonly selectedSubRoles = signal<string[]>([]);
  protected readonly pendingRevokeRole = signal<string | null>(null);

  /** Sous-rôles déjà assignés à l'admin en cours d'édition (chargés depuis l'API). */
  protected readonly editAdminSubRoles = signal<string[]>([]);
  protected readonly editSubRolesLoading = signal(false);
  protected readonly subRolesAssigning = signal(false);
  /** Sous-rôles à ajouter (sélectionnés dans le multiselect — exclus des déjà assignés). */
  protected readonly newSubRolesToAssign = signal<string[]>([]);

  /** Options disponibles = tous les sous-rôles MOINS ceux déjà assignés. */
  protected readonly availableSubRoleOptions = computed(() => {
    const assigned = this.editAdminSubRoles();
    return INTERNAL_SUB_ROLES.filter(
      (role) => !assigned.includes(role.value),
    ).map((role) => ({ label: role.label, value: role.value }));
  });

  /** Options disponibles pour le panneau détails (basé sur selectedSubRoles). */
  protected readonly detailsAvailableSubRoleOptions = computed(() => {
    const assigned = this.selectedSubRoles();
    return INTERNAL_SUB_ROLES.filter(
      (role) => !assigned.includes(role.value),
    ).map((role) => ({ label: role.label, value: role.value }));
  });

  protected readonly detailsNewSubRolesToAssign = signal<string[]>([]);
  protected readonly detailsSubRolesAssigning = signal(false);

  // ── Custom dropdown state ──────────────────────────────────────────────────
  /** Role picker (create/edit form) */
  protected readonly roleMenuOpen = signal(false);
  /** Sub-role picker (edit form) */
  protected readonly subRoleMenuOpen = signal(false);
  /** Sub-role picker (details panel) */
  protected readonly detailsSubRoleMenuOpen = signal(false);

  @ViewChild('roleDropdownRoot')    private roleDropdownRoot?: ElementRef<HTMLElement>;
  @ViewChild('subRoleDropdownRoot') private subRoleDropdownRoot?: ElementRef<HTMLElement>;
  @ViewChild('detailsSubRoleDropdownRoot') private detailsSubRoleDropdownRoot?: ElementRef<HTMLElement>;

  @HostListener('document:click', ['$event.target'])
  onDocumentClick(target: EventTarget | null): void {
    if (!(target instanceof Node)) return;
    if (this.filterMenuOpen()) {
      const root = this.filterMenuRoot?.nativeElement;
      if (!root || !root.contains(target)) this.closeFilterMenu();
    }
    if (this.roleMenuOpen()) {
      const root = this.roleDropdownRoot?.nativeElement;
      if (!root || !root.contains(target)) this.roleMenuOpen.set(false);
    }
    if (this.subRoleMenuOpen()) {
      const root = this.subRoleDropdownRoot?.nativeElement;
      if (!root || !root.contains(target)) this.subRoleMenuOpen.set(false);
    }
    if (this.detailsSubRoleMenuOpen()) {
      const root = this.detailsSubRoleDropdownRoot?.nativeElement;
      if (!root || !root.contains(target)) this.detailsSubRoleMenuOpen.set(false);
    }
  }

  protected toggleRoleMenu(e: Event): void { e.stopPropagation(); this.roleMenuOpen.update(v => !v); }
  protected toggleSubRoleMenu(e: Event): void { e.stopPropagation(); this.subRoleMenuOpen.update(v => !v); }
  protected toggleDetailsSubRoleMenu(e: Event): void { e.stopPropagation(); this.detailsSubRoleMenuOpen.update(v => !v); }

  protected selectRole(value: AdminRole): void {
    this.updateForm({ role: value });
    this.roleMenuOpen.set(false);
  }

  // ── Filter menu (toolbar) ──────────────────────────────────────────────────
  protected toggleFilterMenu(e: Event): void {
    e.stopPropagation();
    if (this.filterMenuOpen()) {
      this.closeFilterMenu();
    } else {
      this.filterMenuOpen.set(true);
      this.filterMenuClosing.set(false);
    }
  }

  protected closeFilterMenu(): void {
    this.filterMenuClosing.set(true);
    setTimeout(() => {
      this.filterMenuOpen.set(false);
      this.filterMenuClosing.set(false);
    }, 140);
  }

  protected selectFilterRole(role: AdminRole | null): void {
    this.filterRole.set(role);
    this.currentPage.set(1);
    this.closeFilterMenu();
  }

  protected get selectedFilterLabel(): string {
    const role = this.filterRole();
    if (role === 'SUPER_ADMIN') return 'Super Admin';
    if (role === 'ADMIN') return 'Admin';
    return 'Tous les rôles';
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }
  protected toggleSubRoleOption(value: string): void {
    this.newSubRolesToAssign.update(current =>
      current.includes(value) ? current.filter(r => r !== value) : [...current, value]
    );
  }

  protected toggleDetailsSubRoleOption(value: string): void {
    this.detailsNewSubRolesToAssign.update(current =>
      current.includes(value) ? current.filter(r => r !== value) : [...current, value]
    );
  }

  protected roleSummary = computed(() => {
    const role = this.memberForm().role;
    return ROLE_OPTIONS.find(r => r.value === role)?.label ?? 'Sélectionner un rôle';
  });

  protected subRoleSummary = computed(() => {
    const selected = this.newSubRolesToAssign();
    if (!selected.length) return 'Sélectionner des sous-rôles à ajouter';
    return selected.map(v => this.subRoleLabel(v)).join(', ');
  });

  protected detailsSubRoleSummary = computed(() => {
    const selected = this.detailsNewSubRolesToAssign();
    if (!selected.length) return 'Sélectionner des sous-rôles à ajouter';
    return selected.map(v => this.subRoleLabel(v)).join(', ');
  });

  protected readonly subRoleOptions = INTERNAL_SUB_ROLES.map((role) => ({
    label: role.label,
    value: role.value,
  }));

  protected readonly memberForm = signal<AdminMemberForm>({ ...EMPTY_FORM });
  protected readonly roleOptions = ROLE_OPTIONS;

  protected readonly visibleAdmins = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const role = this.filterRole();

    return this.admins().filter((admin) => {
      const fullName = this.fullName(admin).toLowerCase();
      const email = (admin.email ?? '').toLowerCase();
      const phone = (admin.phone ?? '').toLowerCase();
      const matchesQuery =
        !query ||
        fullName.includes(query) ||
        email.includes(query) ||
        phone.includes(query);
      const matchesRole = !role || this.primaryRole(admin) === role;

      return matchesQuery && matchesRole;
    });
  });

  protected readonly adminCount = computed(() => this.visibleAdmins().length);

  // ── Table columns ──────────────────────────────────────────────────────────
  protected readonly tableColumns: readonly UiDataTableColumn<AdminUserResponse>[] = [
    { key: 'name',    header: 'Nom complet',  width: '28%' },
    { key: 'email',   header: 'Email',        width: '22%' },
    { key: 'phone',   header: 'Téléphone',    width: '18%' },
    { key: 'role',    header: 'Rôle',         width: '14%' },
    { key: 'actions', header: 'Actions',      width: '18%', align: 'end' },
  ];

  // ── Pagination ─────────────────────────────────────────────────────────────
  protected readonly currentPage = signal(1);

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.visibleAdmins().length / PAGE_SIZE)),
  );

  protected readonly pagedRows = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.visibleAdmins().slice(start, start + PAGE_SIZE);
  });

  // ── Filter menu ────────────────────────────────────────────────────────────
  protected readonly filterMenuOpen = signal(false);
  protected readonly filterMenuClosing = signal(false);

  @ViewChild('filterMenuRoot') private filterMenuRoot?: ElementRef<HTMLElement>;

  ngOnInit(): void {
    void this.loadAdmins();
  }

  protected fullName(admin: AdminUserResponse): string {
    return `${admin.firstName ?? ''} ${admin.lastName ?? ''}`.trim() || '—';
  }

  protected initials(admin: AdminUserResponse): string {
    return (
      `${admin.firstName?.[0] ?? ''}${admin.lastName?.[0] ?? ''}`.toUpperCase() ||
      'UA'
    );
  }

  protected primaryRole(admin: AdminUserResponse): AdminRole | null {
    return getPrimaryAdminRole(admin);
  }

  protected roleLabel(admin: AdminUserResponse): string {
    const role = this.primaryRole(admin);
    if (role === 'SUPER_ADMIN') return 'Super Admin';
    if (role === 'ADMIN') return 'Admin';
    return '—';
  }

  protected roleSeverity(admin: AdminUserResponse): 'danger' | 'info' | 'warn' {
    const role = this.primaryRole(admin);
    if (role === 'SUPER_ADMIN') return 'danger';
    if (role === 'ADMIN') return 'info';
    return 'warn';
  }

  protected isSelf(admin: AdminUserResponse): boolean {
    return Boolean(admin.userId && admin.userId === this.currentUserId());
  }

  protected canMutate(admin: AdminUserResponse): boolean {
    return this.isSuperAdmin() && !this.isSelf(admin);
  }

  protected formTitle = computed(() =>
    this.formMode() === 'create'
      ? 'Ajouter un administrateur'
      : 'Modifier un administrateur',
  );

  protected formSubtitle = computed(() =>
    this.formMode() === 'create'
      ? 'Créer un nouveau compte interne et lui attribuer un rôle de base.'
      : 'Mettre à jour le rôle du compte sélectionné tout en gardant son identité.',
  );

  protected formActionLabel = computed(() =>
    this.formMode() === 'create' ? 'Créer' : 'Modifier',
  );
  protected selectedAdminRoleLabel = computed(() => {
    const admin = this.selectedAdmin();
    return admin ? this.roleLabel(admin) : '—';
  });

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  protected selectedAdminSubRoleTags = computed(() =>
    this.selectedSubRoles().map((role) => ({
      label: this.subRoleLabel(role),
      value: role,
    })),
  );

  protected async loadAdmins(): Promise<void> {
    this.loading.set(true);
    try {
      this.admins.set(await firstValueFrom(this.svc.listAdmins()));
    } catch (err) {
      this.notif.error(resolveHttpErrorMessage(err, 'Impossible de charger la liste des administrateurs.'));
    } finally {
      this.loading.set(false);
    }
  }

  protected openCreate(): void {
    this.formMode.set('create');
    this.memberForm.set({ ...EMPTY_FORM });
    this.selectedAdmin.set(null);
    this.showForm.set(true);
  }

  protected openEdit(admin: AdminUserResponse): void {
    this.formMode.set('edit');
    this.selectedAdmin.set(admin);
    this.memberForm.set({
      firstName: admin.firstName ?? '',
      lastName: admin.lastName ?? '',
      email: admin.email ?? '',
      phone: admin.phone ?? '',
      role: this.primaryRole(admin) ?? 'ADMIN',
    });
    // Only reset sub-roles if not already seeded (e.g. from openEditFromDetails)
    if (this.editAdminSubRoles().length === 0) {
      this.newSubRolesToAssign.set([]);
      this.pendingRevokeRole.set(null);
      void this.loadEditSubRoles(admin);
    }
    this.showForm.set(true);
  }

  private async loadEditSubRoles(admin: AdminUserResponse): Promise<void> {
    if (!admin.userId) return;
    this.editSubRolesLoading.set(true);
    try {
      const subRoles = await firstValueFrom(this.svc.getSubRoles(admin.userId));
      const roles = subRoles.map((sr) => sr.role);
      this.editAdminSubRoles.set(roles);
      // Keep details panel in sync too
      this.selectedSubRoles.set(roles);
    } catch (err) {
      this.notif.error(resolveHttpErrorMessage(err, 'Impossible de charger les sous-rôles.'));
    } finally {
      this.editSubRolesLoading.set(false);
    }
  }

  protected async submitForm(): Promise<void> {
    if (this.formMode() === 'create') {
      await this.submitCreate();
      return;
    }

    const admin = this.selectedAdmin();
    if (!admin?.userId) return;

    this.formLoading.set(true);
    try {
      await firstValueFrom(
        this.svc.updateRole(admin.userId, this.memberForm().role),
      );
      this.notif.success('Rôle principal mis à jour.');
      this.showForm.set(false);
      await this.loadAdmins();
    } catch (err) {
      this.notif.error(resolveHttpErrorMessage(err, 'La mise à jour du rôle a échoué.'));
    } finally {
      this.formLoading.set(false);
    }
  }

  /** Assigne immédiatement les sous-rôles sélectionnés dans le multiselect. */
  protected async assignNewSubRoles(): Promise<void> {
    const admin = this.selectedAdmin();
    const toAdd = this.newSubRolesToAssign();
    if (!admin?.userId || !toAdd.length) return;

    this.subRolesAssigning.set(true);
    // Optimistic update: chips appear immediately without waiting for the reload
    this.editAdminSubRoles.update((current) => [
      ...new Set([...current, ...toAdd]),
    ]);
    this.newSubRolesToAssign.set([]);
    try {
      await firstValueFrom(this.svc.assignSubRoles(admin.userId, toAdd));
      // Reload to sync with real server state (may override optimistic if API returns differently)
      await this.loadEditSubRoles(admin);
      this.notif.success('Sous-rôle(s) assigné(s) avec succès.');
    } catch (err) {
      // Rollback: remove the optimistically added roles
      this.editAdminSubRoles.update((current) =>
        current.filter((r) => !toAdd.includes(r)),
      );
      this.newSubRolesToAssign.set(toAdd);
      this.notif.error(resolveHttpErrorMessage(err, "L'assignation des sous-rôles a échoué."));
    } finally {
      this.subRolesAssigning.set(false);
    }
  }

  /** Assigne des sous-rôles depuis le panneau de détails. */
  protected async assignDetailsSubRoles(): Promise<void> {
    const admin = this.selectedAdmin();
    const toAdd = this.detailsNewSubRolesToAssign();
    if (!admin?.userId || !toAdd.length) return;

    this.detailsSubRolesAssigning.set(true);
    // Optimistic update
    this.selectedSubRoles.update((current) => [...new Set([...current, ...toAdd])]);
    this.editAdminSubRoles.update((current) => [...new Set([...current, ...toAdd])]);
    this.detailsNewSubRolesToAssign.set([]);
    try {
      await firstValueFrom(this.svc.assignSubRoles(admin.userId, toAdd));
      const fresh = await firstValueFrom(this.svc.getSubRoles(admin.userId));
      const freshRoles = fresh.map((sr) => sr.role);
      this.selectedSubRoles.set(freshRoles);
      this.editAdminSubRoles.set(freshRoles);
      this.notif.success('Sous-rôle(s) assigné(s) avec succès.');
    } catch (err) {
      // Rollback
      this.selectedSubRoles.update((current) => current.filter((r) => !toAdd.includes(r)));
      this.editAdminSubRoles.update((current) => current.filter((r) => !toAdd.includes(r)));
      this.detailsNewSubRolesToAssign.set(toAdd);
      this.notif.error(resolveHttpErrorMessage(err, "L'assignation des sous-rôles a échoué."));
    } finally {
      this.detailsSubRolesAssigning.set(false);
    }
  }

  private async submitCreate(): Promise<void> {
    const form = this.memberForm();
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();

    if (!firstName || !lastName || !email) {
      this.notif.error("Le prénom, le nom et l’email sont requis.");
      return;
    }

    this.formLoading.set(true);
    try {
      await firstValueFrom(
        this.svc.createAdmin({
          firstName,
          lastName,
          email,
          phone: form.phone.trim() || undefined,
          role: form.role,
        }),
      );
      this.notif.success('Administrateur créé avec succès.');
      this.showForm.set(false);
      await this.loadAdmins();
    } catch (err) {
      this.notif.error(
        (err as { status?: number })?.status === 409
          ? "Cet email est déjà utilisé."
          : resolveHttpErrorMessage(err, "La création de l’administrateur a échoué."),
      );
    } finally {
      this.formLoading.set(false);
    }
  }

  protected updateForm(patch: Partial<AdminMemberForm>): void {
    this.memberForm.update((form) => ({ ...form, ...patch }));
  }

  protected async openDetails(admin: AdminUserResponse): Promise<void> {
    this.selectedAdmin.set(admin);
    this.selectedSubRoles.set([]);
    this.editAdminSubRoles.set([]);
    this.pendingRevokeRole.set(null);
    this.detailsLoading.set(true);
    this.showDetails.set(true);

    try {
      const subRoles = await firstValueFrom(
        this.svc.getSubRoles(admin.userId ?? ''),
      );
      const roles = subRoles.map((subRole) => subRole.role);
      this.selectedSubRoles.set(roles);
      this.editAdminSubRoles.set(roles);
    } catch (err) {
      this.notif.error(resolveHttpErrorMessage(err, 'Impossible de charger les sous-rôles.'));
    } finally {
      this.detailsLoading.set(false);
    }
  }

  protected async saveSubRoles(): Promise<void> {
    const admin = this.selectedAdmin();
    if (!admin?.userId) return;

    this.formLoading.set(true);
    try {
      const subRoles = await firstValueFrom(
        this.svc.assignSubRoles(admin.userId, this.selectedSubRoles()),
      );
      this.selectedSubRoles.set(subRoles.map((subRole) => subRole.role));
      this.notif.success('Sous-rôles mis à jour.');
    } catch (err) {
      this.notif.error(resolveHttpErrorMessage(err, 'La mise à jour des sous-rôles a échoué.'));
    } finally {
      this.formLoading.set(false);
    }
  }

  protected promptRevokeSubRole(role: string): void {
    this.pendingRevokeRole.set(role);
    this.showRevokeConfirm.set(true);
  }

  protected async confirmRevokeSubRole(): Promise<void> {
    const admin = this.selectedAdmin();
    const role = this.pendingRevokeRole();
    if (!admin?.userId || !role) return;

    this.formLoading.set(true);
    // Optimistic removal from both panels
    this.editAdminSubRoles.update((roles) => roles.filter((r) => r !== role));
    this.selectedSubRoles.update((roles) => roles.filter((r) => r !== role));
    this.newSubRolesToAssign.update((roles) => roles.filter((r) => r !== role));
    try {
      await firstValueFrom(this.svc.revokeSubRole(admin.userId, role));
      // Reload from API to guarantee displayed state matches the server
      const fresh = await firstValueFrom(this.svc.getSubRoles(admin.userId));
      const freshRoles = fresh.map((sr) => sr.role);
      this.editAdminSubRoles.set(freshRoles);
      this.selectedSubRoles.set(freshRoles);
      this.notif.success('Sous-rôle révoqué.');
      this.showRevokeConfirm.set(false);
      this.pendingRevokeRole.set(null);
    } catch (err) {
      // Rollback optimistic removal
      const restored = await firstValueFrom(this.svc.getSubRoles(admin.userId)).catch(() => []);
      const restoredRoles = restored.map((sr) => sr.role);
      this.editAdminSubRoles.set(restoredRoles);
      this.selectedSubRoles.set(restoredRoles);
      this.notif.error(resolveHttpErrorMessage(err, 'La révocation a échoué.'));
    } finally {
      this.formLoading.set(false);
    }
  }

  protected openDelete(admin: AdminUserResponse): void {
    this.selectedAdmin.set(admin);
    this.showDeleteConfirm.set(true);
  }

  protected async confirmDelete(): Promise<void> {
    const admin = this.selectedAdmin();
    if (!admin?.userId) return;

    this.formLoading.set(true);
    try {
      await firstValueFrom(this.svc.deleteAdmin(admin.userId));
      this.notif.success('Administrateur supprimé.');
      this.showDeleteConfirm.set(false);
      await this.loadAdmins();
    } catch (err) {
      this.notif.error(resolveHttpErrorMessage(err, 'La suppression a échoué.'));
    } finally {
      this.formLoading.set(false);
    }
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.editAdminSubRoles.set([]);
    this.newSubRolesToAssign.set([]);
    this.pendingRevokeRole.set(null);
    this.roleMenuOpen.set(false);
    this.subRoleMenuOpen.set(false);
  }

  protected closeDetails(): void {
    this.showDetails.set(false);
    this.detailsNewSubRolesToAssign.set([]);
    this.detailsSubRoleMenuOpen.set(false);
  }

  protected closeDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
  }

  protected closeRevokeConfirm(): void {
    this.showRevokeConfirm.set(false);
    this.pendingRevokeRole.set(null);
  }

  protected subRoleLabel(value: string): string {
    return (
      INTERNAL_SUB_ROLES.find((role) => role.value === value)?.label ?? value
    );
  }

  protected roleBadgeClass(role: string): string {
    return role === 'SUPER_ADMIN'
      ? 'admin-role-badge admin-role-badge--super'
      : 'admin-role-badge admin-role-badge--admin';
  }

  protected displayFormPhone(): string {
    return this.memberForm().phone;
  }

  protected readonly detailsHeaderLabel = computed(() => {
    const admin = this.selectedAdmin();
    if (!admin) return 'Détails administrateur';

    return this.formMode() === 'edit'
      ? 'Modifier un administrateur'
      : `Détails de ${this.fullName(admin)}`;
  });

  protected readonly detailsSubtitle = computed(() => {
    const admin = this.selectedAdmin();
    if (!admin) return 'Consultez la fiche et les sous-rôles du compte.';

    return this.formMode() === 'edit'
      ? 'Seul le rôle peut être modifié depuis ce formulaire.'
      : 'Consultez les informations de compte et la composition des accès.';
  });

  protected openEditFromDetails(): void {
    const admin = this.selectedAdmin();
    if (!admin) return;

    // Seed sub-roles from the details view so openEdit skips the API call
    this.editAdminSubRoles.set([...this.selectedSubRoles()]);
    this.newSubRolesToAssign.set([]);
    this.pendingRevokeRole.set(null);
    this.formMode.set('edit');
    this.memberForm.set({
      firstName: admin.firstName ?? '',
      lastName: admin.lastName ?? '',
      email: admin.email ?? '',
      phone: admin.phone ?? '',
      role: this.primaryRole(admin) ?? 'ADMIN',
    });
    this.showDetails.set(false);
    this.showForm.set(true);
  }

  protected get isEditingForm(): boolean {
    return this.formMode() === 'edit';
  }
}
