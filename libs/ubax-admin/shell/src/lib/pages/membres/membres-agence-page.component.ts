import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { NOTIFICATION_HANDLER, resolveHttpErrorMessage } from '@ubax-workspace/shared-data-access';
import {
  BreadcrumbNavComponent,
  EmptyStateComponent,
  SearchFilterBarComponent,
  SectionCardComponent,
} from '@ubax-workspace/shared-design-system';
import { AvatarModule } from 'primeng/avatar';
import { Tag } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import {
  AdminUsersService,
  normalizeSubRoleStrings,
  type MemberResponse,
} from '../../services/admin-users.service';

@Component({
  selector: 'ubax-admin-membres-agence-page',
  standalone: true,
  imports: [
    TableModule,
    AvatarModule,
    Tag,
    BreadcrumbNavComponent,
    EmptyStateComponent,
    SearchFilterBarComponent,
    SectionCardComponent,
  ],
  templateUrl: './membres-agence-page.component.html',
  styleUrl: './membres-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembresAgencePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly svc = inject(AdminUsersService);
  private readonly notif = inject(NOTIFICATION_HANDLER);

  protected readonly loading = signal(false);
  protected readonly members = signal<MemberResponse[]>([]);
  protected readonly searchQuery = signal('');

  protected readonly agencyId =
    this.route.snapshot.paramMap.get('agencyId') ?? '';

  protected readonly filteredMembers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.members();
    return this.members().filter((m) => {
      const name = `${m.firstName ?? ''} ${m.lastName ?? ''}`.toLowerCase();
      const email = (m.email ?? '').toLowerCase();
      const phone = (m.phone ?? '').toLowerCase();
      return (
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query)
      );
    });
  });

  protected readonly memberCount = computed(() => this.members().length);

  protected readonly breadcrumbs = [
    { label: 'Agences', routerLink: '/agences' },
    { label: "Membres de l'agence" },
  ];

  ngOnInit(): void {
    void this.loadMembers();
  }

  private async loadMembers(): Promise<void> {
    if (!this.agencyId) return;
    this.loading.set(true);
    try {
      this.members.set(
        await firstValueFrom(this.svc.getAgencyMembers(this.agencyId)),
      );
    } catch (err) {
      this.notif.error(resolveHttpErrorMessage(err, "Impossible de charger les membres de l'agence."));
    } finally {
      this.loading.set(false);
    }
  }

  protected initials(m: MemberResponse): string {
    return `${m.firstName?.[0] ?? ''}${m.lastName?.[0] ?? ''}`.toUpperCase() || 'UA';
  }

  protected fullName(m: MemberResponse): string {
    return `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || '—';
  }

  protected subRoleLabels(m: MemberResponse): string {
    return normalizeSubRoleStrings(m.subRoles).join(', ') || '—';
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }
}
