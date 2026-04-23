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
  DEV_ROLE_OPTIONS,
  coerceRole,
  persistDevRole,
  readStoredDevRole,
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
  protected readonly enabled = isDevMode();
  protected readonly roleOptions = DEV_ROLE_OPTIONS;
  protected readonly selectedRole = computed(() => this.authStore.role());

  ngOnInit(): void {
    if (!this.enabled || this.authStore.token() !== 'dev-mock-token') {
      return;
    }

    const storedRole = readStoredDevRole();
    const currentRole = this.authStore.role();

    if (!storedRole || storedRole === currentRole) {
      return;
    }

    this.authStore.setRole(storedRole);
    this.reloadDashboard();
  }

  protected onRoleChange(rawRole: string): void {
    const nextRole = coerceRole(rawRole);

    if (!nextRole || nextRole === this.authStore.role()) {
      return;
    }

    persistDevRole(nextRole);
    this.authStore.setRole(nextRole);
    this.reloadDashboard();
  }

  private reloadDashboard(): void {
    this.document.defaultView?.location.replace('/tableau-de-bord');
  }
}
