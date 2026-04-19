import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  isDevMode,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
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
  private readonly router = inject(Router);
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
    void this.router.navigateByUrl('/tableau-de-bord');
  }

  protected onRoleChange(rawRole: string): void {
    const nextRole = coerceRole(rawRole);

    if (!nextRole || nextRole === this.authStore.role()) {
      return;
    }

    persistDevRole(nextRole);
    this.authStore.setRole(nextRole);
    void this.router.navigateByUrl('/tableau-de-bord');
  }
}
