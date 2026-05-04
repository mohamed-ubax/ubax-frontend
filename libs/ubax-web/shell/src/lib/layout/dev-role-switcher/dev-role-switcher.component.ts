import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  isDevMode,
  OnInit,
} from '@angular/core';
import {
  AuthStore,
  DEV_PROFILES,
  type DevProfile,
  persistDevProfile,
  readStoredDevProfile,
} from '@ubax-workspace/ubax-web-data-access';

@Component({
  selector: 'ubax-dev-role-switcher',
  standalone: true,
  templateUrl: './dev-role-switcher.component.html',
  styleUrl: './dev-role-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevRoleSwitcherComponent implements OnInit {
  readonly authStore = inject(AuthStore);
  private readonly document = inject(DOCUMENT);

  protected readonly enabled = computed(
    () => isDevMode() && this.authStore.token() === 'dev-mock-token',
  );
  protected readonly devProfiles = DEV_PROFILES;
  protected readonly selectedLabel = computed(() => {
    const user = this.authStore.user();
    if (!user) return null;
    return (
      DEV_PROFILES.find(
        (p) => p.mainRole === user.mainRole && p.subRole === user.subRole,
      )?.label ?? null
    );
  });

  ngOnInit(): void {
    if (!this.enabled()) return;

    const stored = readStoredDevProfile();
    if (!stored) return;

    const current = this.authStore.user();
    if (
      current?.mainRole === stored.mainRole &&
      current?.subRole === stored.subRole
    ) {
      return;
    }

    this.applyProfile(stored);
    this.reloadDashboard();
  }

  protected onProfileChange(event: Event): void {
    if (!this.enabled()) return;

    const label = (event.target as HTMLSelectElement).value;
    const profile = DEV_PROFILES.find((p) => p.label === label);
    if (!profile || profile.label === this.selectedLabel()) return;

    persistDevProfile(label);
    this.applyProfile(profile);
    this.reloadDashboard();
  }

  private applyProfile(profile: DevProfile): void {
    const current = this.authStore.user();
    if (!current) return;

    this.authStore.setUser({
      ...current,
      mainRole: profile.mainRole,
      subRole: profile.subRole,
      scope: profile.scope,
    });
  }

  private reloadDashboard(): void {
    this.document.defaultView?.location.replace('/tableau-de-bord');
  }
}
